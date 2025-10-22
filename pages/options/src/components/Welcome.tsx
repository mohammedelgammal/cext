import { URLS } from '@src/routes';
import { Link } from 'react-router-dom';

const Welcome = () => (
  <div className="flex h-screen flex-col items-center justify-center gap-5 bg-amber-200 text-base">
    <Link to={URLS.REVIEW_SEED_PHRASE} className="flex min-w-60 items-center justify-center rounded-full bg-white p-5">
      Create a new Wallet
    </Link>
    <Link to={URLS.ACQUIRE_SEED} className="flex min-w-60 items-center justify-center rounded-full bg-blue-100 p-5">
      I have a wallet
    </Link>
  </div>
);

export default Welcome;
