import { appendToStorage } from '@src/utils';
import { useState } from 'react';
import type { ethers } from 'ethers';

const Accounts = ({ password = '', wallet }: AccountsProps) => {
  const [accountsCount, setAccountsCount] = useState<number>(0);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [accounts, setAccounts] = useState<
    {
      address?: string;
      balance?: string;
      path?: string;
    }[]
  >([]);
  const [creating, setCreating] = useState<boolean>(false);
  const [getting, setGetting] = useState<boolean>(false);

  const getAccounts = (count: number) => {
    if (password) {
      setGetting(true);
      chrome.storage.local.get('wallet', async data => {
        const accounts: {
          address?: string;
          balance?: string;
          path?: string;
        }[] = [];

        console.log('entered', data?.wallet.latestAccount);
        for (let i = 0; i < data?.wallet.latestAccount + count; i++) {
          const accountWallet = wallet?.deriveChild(i);
          accounts.push({
            address: accountWallet?.address,
            balance: (await accountWallet?.provider?.getBalance(accountWallet?.address))?.toString(),
            path: `m/44'/60'/${i}'/0/0`,
          });
        }
        setAccounts(accounts);
        setGetting(false);
      });
    }
  };

  const createAccounts = () => {
    if (password) {
      setCreating(true);
      chrome.storage.local.get('wallet', data => {
        appendToStorage('wallet', {
          latestAccount: data?.wallet.latestAccount + accountsCount,
        });
        setCurrentCount(data?.wallet.latestAccount);
        setCreating(false);
      });
      setAccountsCount(0);
    }
  };

  return (
    <div>
      <h2 className="font-bold">Create Acccounts</h2>
      <form
        className="flex flex-col items-center justify-center gap-2 text-lg"
        onSubmit={e => {
          e.preventDefault();
        }}>
        <label htmlFor="count">No. of Accounts: </label>
        <input
          value={accountsCount}
          onChange={e => setAccountsCount(Number(e.target.value))}
          placeholder="5"
          id="count"
          type="number"
        />
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={createAccounts}
            className="rounded bg-red-100 px-2 py-1 text-blue-500 active:bg-red-200"
            type="button"
            disabled={creating}>
            {creating ? 'Creating...' : 'Create Account/s'}
          </button>
          <button
            onClick={() => getAccounts(currentCount)}
            className="rounded bg-red-100 px-2 py-1 text-blue-500 active:bg-red-200"
            type="button">
            {getting ? 'Getting accounts...' : 'Get Account/s'}
          </button>
        </div>
      </form>
      <div className="mt-5 flex max-h-[200px] w-full flex-col items-center justify-start gap-4 overflow-auto">
        {accounts.map(account => (
          <div className="grid grid-cols-[1fr,1fr,1fr] gap-2 bg-red-200 p-5">
            <p className="max-w-[100px] overflow-auto">address: {account.address}</p>
            <p>path: {account.path}</p>
            <p>balance: {account.balance}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

type AccountsProps = {
  password: string;
  wallet: ethers.HDNodeWallet | null;
};

export default Accounts;
