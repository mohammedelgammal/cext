import Accounts from './Accounts';
import CreatePassword from './CreatePassword';
import WalletInfo from './WalletInfo';
import { createKeyPairSignerFromPrivateKeyBytes, createSolanaRpc, devnet } from '@solana/kit';
import {
  appendToStorage,
  convertForChromeStorage,
  convertFromChromeStorage,
  CryptoKeyManager,
  fetchStorage,
} from '@src/utils';
import * as bip39 from 'bip39';
import { JsonRpcProvider, ethers } from 'ethers';
import { useRef, useState } from 'react';
import type { HDNodeWallet, TransactionRequest, TransactionReceipt } from 'ethers';

const Wallet = () => {
  const [publicAddress, setPublicAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [transactionValue, setTransactionValue] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [gas, setGas] = useState<bigint>(0n);
  const [wallet, setWallet] = useState<HDNodeWallet | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt>();
  const [transactionSuccess, setTransactionSuccess] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [speed, setSpeed] = useState<string>();
  const [maxAmount, setMaxAmount] = useState<bigint>(0n);
  const [isSending, setSending] = useState<boolean>(false);
  const [transactionError, setTransactionError] = useState<string>('');
  const [mnemonicsPassword, setMnemonicsPassword] = useState<string>('');
  const [rotated, setRotated] = useState<boolean>(false);
  const [rotating, setRotating] = useState<boolean>(false);
  const [chain, setChain] = useState<'eth' | 'sol'>('eth');
  const [password, setPassword] = useState<string>('');

  const mnemonicRef = useRef<HTMLDivElement>(null);

  const handleRotateKeys = async (password: string) => {
    setRotating(true);
    const manager = new CryptoKeyManager();
    const originalData = await handleStorageWalletData(password);
    const rotated = await manager.rotate(
      password,
      originalData.salt as Uint8Array<ArrayBuffer>,
      originalData.encryptedMnemonic,
      originalData.iv as Uint8Array<ArrayBuffer>,
      originalData.DEK_KEK_P,
    );
    const rotatedChromeData = convertForChromeStorage({
      salt: rotated.salt,
      encryptedMnemonic: rotated.encryptedMnemonic,
      iv: rotated.iv,
      DEK_KEK_P: rotated.DEK_KEK_P,
    });
    appendToStorage('walletRotated', rotatedChromeData);
    setRotated(true);
    setRotating(false);
  };

  const handleCreateWallet = async (password: string) => {
    handleStorageWalletData(password).then(async ({ mnemonics }) => {
      if (chain === 'eth') {
        const sepoliaPublicUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
        const sepoliaProvider = new JsonRpcProvider(sepoliaPublicUrl);
        let wallet = ethers.Wallet.fromPhrase(mnemonics);
        wallet = wallet.connect(sepoliaProvider);
        setWallet(wallet);
        sepoliaProvider.getBalance(wallet.address).then(async balance => {
          setBalance(ethers.formatEther(balance));
          if (sepoliaProvider) {
            const feeData = await sepoliaProvider.getFeeData();
            const gasPrice = feeData?.maxFeePerGas || feeData?.gasPrice || 0n;
            const maxSendable = balance - gasPrice * 21000n;
            setMaxAmount(maxSendable);
          }
        });
        setPublicAddress(wallet.address);
      } else {
        const seedBytes = bip39.mnemonicToSeedSync(mnemonics);
        const signer = await createKeyPairSignerFromPrivateKeyBytes(seedBytes.subarray(0, 32));
        const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));
        const { value: balanceInLamports } = await rpc.getBalance(signer.address).send();
        setBalance(balanceInLamports.toString());
        setPublicAddress(signer.address);
      }
    });
  };
  const handleSendETH = async () => {
    setSending(true);
    try {
      const tx: TransactionRequest = {
        from: publicAddress,
        to: recipient,
        value: ethers.parseEther(transactionValue),
      };
      if (wallet) {
        const transaction = await wallet.sendTransaction(tx);
        const receipt = await transaction.wait();
        if (receipt && receipt!.status === 1) {
          setTransactionSuccess(true);
          setReceipt(receipt);
        }
        console.log('Gas used:', receipt!.gasUsed.toString());
        console.log('Block number:', receipt!.blockNumber);
        console.log('Transaction status:', receipt!.status === 1 ? '✅ Success' : '❌ Failed');
        setSending(false);
      }
    } catch (err) {
      const getErrorMessage = (code: string): string => {
        switch (code) {
          case 'INSUFFICIENT_FUNDS':
            return 'Not enough ETH for gas + amount';
          case 'NETWORK_ERROR':
            return 'Network connection failed';
          case 'NONCE_EXPIRED':
            return 'Transaction replaced or expired';
          case 'UNCONFIGURED_NAME':
            return 'Wrong Wallet Address';
          default:
            return 'Transaction failed';
        }
      };

      setTransactionSuccess(false);
      setSending(false);
      console.log((err as { code: string; reason: string }).code);
      setTransactionError(getErrorMessage((err as { code: string; reason: string }).code));
    }
  };

  const mnemonics = bip39.generateMnemonic();
  console.log(mnemonics);
  const masterNode = ethers.HDNodeWallet.fromPhrase(mnemonics);
  console.log(masterNode);
  const derivedNodeEth = masterNode.derivePath("44'");
  console.log(derivedNodeEth);
 
  return (
    <div className="flex">
      <div className="flex w-1/2 flex-col">
        <div className="flex flex-col items-center justify-start gap-5 bg-zinc-300 text-xl">
          <h2>Switch Network</h2>
          <form
            onSubmit={e => {
              e.preventDefault();
            }}
            className="pb-3">
            <label className="mr-2" htmlFor="chains">
              Choose chain
            </label>
            <select
              id="chains"
              onChange={e => {
                setChain(e.target.value as 'eth' | 'sol');
              }}>
              <option value="eth">Ethereum</option>
              <option value="sol">Solana</option>
            </select>
          </form>
          {chain === 'eth' ? <Accounts wallet={wallet} password={password} /> : null}
        </div>
        <WalletInfo chain={chain} publicAddress={publicAddress} balance={balance} />
        <div className="flex flex-col items-start justify-center gap-5 px-5 py-5">
          <h2 className="text-3xl">Make a Transaction</h2>
          {!confirmed ? (
            <form
              className="w-full"
              onSubmit={async e => {
                e.preventDefault();
                setConfirmed(true);
                const feeData = await wallet?.provider?.getFeeData();
                const getSpeed = async () => {
                  const priorityFee = feeData?.maxPriorityFeePerGas;
                  let speed;
                  if (priorityFee && priorityFee > ethers.parseUnits('2', 'gwei')) speed = 'Fast (15-30s)';
                  else if (priorityFee && priorityFee > ethers.parseUnits('1', 'gwei')) speed = 'Normal (30-60s)';
                  else speed = 'Slow (1-2min)';
                  return speed;
                };
                const estimateSpeed = await getSpeed();
                setGas(feeData?.gasPrice || 0n);
                setSpeed(estimateSpeed);
              }}>
              <div className="flex w-full flex-col items-start justify-center gap-2">
                <label htmlFor="from" className="w-full text-left">
                  Sender - [From]
                </label>
                <input
                  id="from"
                  value={publicAddress}
                  disabled
                  className="w-full cursor-not-allowed rounded-md bg-gray-100 p-2"
                  type="text"
                />
              </div>
              <div className="mt-5 flex w-full flex-col items-start justify-center gap-2">
                <label htmlFor="to" className="w-full text-left">
                  Recipient - [To]
                </label>
                <input
                  id="to"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  className="w-full rounded-md bg-gray-100 p-2"
                  type="text"
                />
              </div>
              <div className="mt-5 flex w-full flex-col items-start justify-center gap-2">
                <label htmlFor="value" className="w-full text-left">
                  Value - [ETH]
                </label>
                <input
                  id="value"
                  value={transactionValue}
                  onChange={async e => {
                    setTransactionValue(e.target.value);
                  }}
                  className="w-full rounded-md bg-gray-100 p-2"
                  type="text"
                />
                <button
                  type="button"
                  onClick={() => {
                    setTransactionValue(ethers.formatEther(maxAmount));
                  }}
                  className="rounded bg-red-100 px-2 py-1 text-blue-500 active:bg-red-200">
                  Set max
                </button>
              </div>
              <button
                type="submit"
                className="mt-5 flex w-full items-center justify-center rounded-full bg-green-200 p-2 text-lg active:bg-green-300">
                Create Transaction
              </button>
            </form>
          ) : null}
          {confirmed ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendETH();
              }}
              className="mt-10 flex w-full flex-col items-start justify-start gap-8 bg-amber-100 p-2 text-left">
              <span className="text-2xl">
                <strong>From: </strong> <br />
                <span className="flex max-w-full overflow-auto text-xl">{publicAddress || '*'}</span>
              </span>
              <span className="text-2xl">
                <strong>To: </strong> <br />
                <span className="flex max-w-full overflow-auto text-xl">{recipient || '*'}</span>
              </span>
              <span className="text-2xl">
                <strong>Value: </strong>
                {transactionValue || '*'} ETH
              </span>
              <span className="text-2xl">
                <strong>Estimated Gas: </strong> {ethers.formatUnits(gas, 'gwei')} Gwei
              </span>
              <span className="text-2xl">
                <strong>Estimated Speed: </strong> {speed || '*'}
              </span>
              {!transactionSuccess ? (
                <div className="flex w-full items-center justify-center gap-2 text-nowrap">
                  <button
                    type="button"
                    onClick={() => setConfirmed(false)}
                    className="mt-5 flex items-center justify-center rounded-full bg-red-200 p-2 px-5 text-lg active:bg-green-300">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="mt-5 flex w-full items-center justify-center rounded-full bg-blue-100 p-2 px-5 text-lg active:bg-green-300">
                    Confirm Transaction
                  </button>
                </div>
              ) : (
                <span className="w-full text-center text-lg">Transaction Confirmed </span>
              )}
            </form>
          ) : null}
          {(() => {
            if (isSending) return <div className="text-2xl">sending...</div>;
            if (transactionError) return <div className="text-2xl">Error: {transactionError}</div>;
            if (transactionSuccess && receipt) {
              return (
                <div className="flex flex-col items-start justify-start gap-4">
                  <h2 className="text-2xl">Transaction was successful!</h2>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Status:</div>
                    <div>{receipt.status === 1 ? '✅ Success' : '❌ Failed'}</div>

                    <div className="font-medium">Block:</div>
                    <div>{receipt.blockNumber}</div>

                    <div className="font-medium">Gas Used:</div>
                    <div>{receipt.gasUsed?.toString()}</div>

                    <div className="font-medium">Total Cost:</div>
                    <div>{ethers.formatEther(receipt.gasUsed * receipt.gasPrice)} ETH</div>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>
      <div className="flex w-screen flex-col justify-center overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-10 overflow-hidden bg-orange-300 py-10">
          <h2 className="w-full text-3xl">Wallet Dashboard</h2>
          <CreatePassword
            rotate={false}
            create
            submitCallback={password => {
              handleCreateWallet(password);
            }}
            setPassword={setPassword}
          />
        </div>
        <div className="flex flex-col items-center justify-center gap-10 bg-red-200 py-16">
          <h2 className="text-2xl">Reveal mnemonics</h2>
          <form
            onSubmit={async () => {
              const { mnemonics } = await handleStorageWalletData(mnemonicsPassword);
              if (mnemonicRef.current) {
                mnemonicRef.current.textContent = mnemonics;
              }
            }}>
            <div className="flex w-full flex-col items-center justify-center gap-3">
              <input
                placeholder="Enter password"
                id="mnemonicspass"
                value={mnemonicsPassword}
                onChange={e => setMnemonicsPassword(e.target.value)}
                className="w-[500px] rounded-md bg-gray-100 p-2"
                type="password"
              />
              <button
                className="flex w-full items-center justify-center rounded-full bg-blue-100 p-2 px-5 text-lg active:bg-blue-300"
                type="submit">
                Reveal
              </button>
            </div>
          </form>
          <p className="w-[400px] text-4xl text-white" ref={mnemonicRef}></p>
        </div>
        <div className="bg-amber-100 py-10">
          <CreatePassword
            rotate
            submitCallback={password => {
              handleRotateKeys(password);
            }}
            setPassword={setPassword}
          />
          <div className="mt-5">
            {rotating ? (
              <span className="mt-5 text-xl text-red-700">Rotating keys...</span>
            ) : rotated && !rotating ? (
              <span className="mt-5 text-xl text-red-700">
                DEK, KEK_P, and DEK_KEK_P Keys were rotated successfully! <br /> Check chrome.storage.local for rotated
                keys
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export const handleStorageWalletData: (password: string) => Promise<{
  encryptedMnemonic: ArrayBuffer;
  mnemonics: string;
  salt: Uint8Array<ArrayBufferLike | ArrayBuffer>;
  iv: Uint8Array<ArrayBufferLike | ArrayBuffer>;
  DEK_KEK_P: ArrayBuffer;
}> = async (password: string) => {
  const manager = new CryptoKeyManager();
  const wallet = await fetchStorage<{ [key: string]: string }>('wallet');
  if (!wallet) throw Error('Wallet data was not found!');
  const { salt, encryptedMnemonic, iv, DEK_KEK_P } = convertFromChromeStorage({
    salt: wallet.salt,
    encryptedMnemonic: wallet?.encryptedMnemonic,
    iv: wallet?.iv,
    DEK_KEK_P: wallet?.DEK_KEK_P,
  });
  const encodedMnemonics = await manager.reveal(
    password,
    salt as Uint8Array<ArrayBuffer>,
    encryptedMnemonic,
    iv as Uint8Array<ArrayBuffer>,
    DEK_KEK_P,
  );
  const decoder = new TextDecoder();
  const mnemonics = decoder.decode(encodedMnemonics);
  return { encryptedMnemonic, mnemonics, salt, iv, DEK_KEK_P };
};

export default Wallet;
