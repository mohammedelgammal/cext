import { CreatePassword } from './';
import { LoadingSpinner } from '@extension/ui';
import checkBlack from '@src/assets/check-black.png';
import checkCircle from '@src/assets/check.svg';
import solidEye from '@src/assets/eye-solid.svg';
import { URLS } from '@src/routes';
import { appendToStorage, convertForChromeStorage, CryptoKeyManager } from '@src/utils';
import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateSeed = ({ acquire }: { acquire: boolean }) => {
  const [isVisible, setVisible] = useState<boolean>(false);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [validMnemonic, setValidMnemonic] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleWalletCreate = async (password: string) => {
    const manager = new CryptoKeyManager();
    chrome.storage.local.get('wallet', async () => {
      const { salt, encryptedMnemonic, iv, DEK_KEK_P } = await manager.initialize(mnemonic, password);
      const chromeData = convertForChromeStorage({ salt, encryptedMnemonic, iv, DEK_KEK_P });
      appendToStorage('wallet', { ...chromeData, latestAccount: 0 });
      navigate(URLS.WALLET);
    });
  };

  useEffect(() => {
    if (!showPassword) {
      chrome.storage.local.get('wallet', () => {
        const mnemonicPhrase = bip39.generateMnemonic();
        setMnemonic(mnemonicPhrase);
        setVerifying(false);
      });
    }
  }, [navigate, showPassword]);

  if (verifying) return <LoadingSpinner />;
  if (showPassword)
    return (
      <div className="flex h-screen items-center justify-center bg-amber-100">
        <CreatePassword rotate={false} submitCallback={handleWalletCreate} />
      </div>
    );

  return (
    <>
      {acquire ? (
        <div className="flex h-screen flex-col items-center justify-center gap-5 bg-amber-50 text-base">
          <form
            className="flex items-center justify-center gap-3"
            onSubmit={e => {
              e.preventDefault();
            }}>
            <input
              type="text"
              className="w-[500px] rounded-md bg-gray-100 p-4"
              placeholder="Enter you mnemonics - separated by space"
              onChange={e => {
                console.log('lib valid', ethers.Mnemonic.isValidMnemonic(e.target.value));
                setMnemonic(e.target.value);
                setValidMnemonic(ethers.Mnemonic.isValidMnemonic(e.target.value));
              }}
            />
            <button
              className={`flex h-[50px] w-[50px] items-center justify-center rounded-full p-2 ${!validMnemonic ? 'bg-[#ff3b30]' : 'bg-[#4cd964]'}`}
              onClick={() => {
                if (!!mnemonic && !validMnemonic) return;
                setShowPassword(validMnemonic);
              }}>
              <img
                className="h-5 w-5 cursor-pointer transition hover:scale-110 active:scale-100"
                src={checkBlack}
                alt="Check Circle"
              />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex h-screen flex-col items-center justify-center gap-5 bg-amber-50 text-base">
          <button onClick={() => setVisible(prev => !prev)}>
            <img
              className="h-10 w-10 cursor-pointer transition hover:scale-110 active:scale-100"
              src={solidEye}
              alt="Eye Icon"
            />
          </button>
          <div className="relative grid grid-cols-4 grid-rows-3 gap-3 overflow-hidden">
            {!isVisible ? (
              <div className="absolute inset-0 z-10 m-auto h-full w-full rounded-lg border bg-green-400/20 backdrop-blur-md" />
            ) : null}
            {mnemonic?.split(' ').map(word => (
              <div className="flex items-center justify-center rounded-md bg-red-50 p-8">
                <span>{word}</span>
              </div>
            ))}
          </div>
          <div className="flex w-full items-center justify-center">
            <button onClick={() => setShowPassword(true)}>
              <img
                className="h-10 w-10 cursor-pointer transition hover:scale-110 active:scale-100"
                src={checkCircle}
                alt="Check Circle"
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateSeed;
