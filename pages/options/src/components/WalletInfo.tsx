const WalletInfo = ({ publicAddress, balance, chain }: WalletInfoProps) => (
  <div className="flex w-full flex-col items-start justify-start gap-8 bg-red-400 p-5 text-start">
    <h3 className="flex max-w-full overflow-auto text-3xl text-white">
      Your Wallet Address: <br /> {!publicAddress ? '#' : publicAddress}
    </h3>
    <h3 className="flex max-w-full overflow-auto text-3xl text-white">
      Your Balance: <br /> {!balance ? '-' : (chain === 'eth' ? 'ETH' : 'Lamports') + ' ' + balance}
    </h3>
  </div>
);

type WalletInfoProps = {
  publicAddress: string;
  balance: string;
  chain: 'eth' | 'sol';
};

export default WalletInfo;
