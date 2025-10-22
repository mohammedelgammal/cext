import { ReviewSeedPhrase, Wallet, Welcome } from './components/';
import { URLS } from './routes';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';
import { HashRouter, Route, Routes } from 'react-router-dom';
import '@src/Options.css';

const Options = () => (
  <HashRouter>
    <Routes>
      <Route path={URLS.WELCOME} element={<Welcome />} />
      <Route path={URLS.REVIEW_SEED_PHRASE} element={<ReviewSeedPhrase acquire={false} />} />
      <Route path={URLS.WALLET} element={<Wallet />} />
      <Route path={URLS.ACQUIRE_SEED} element={<ReviewSeedPhrase acquire />} />
    </Routes>
  </HashRouter>
);

export default withErrorBoundary(withSuspense(Options, <LoadingSpinner />), ErrorDisplay);
