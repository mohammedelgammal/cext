import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';
import { useEffect, useState } from 'react';
import '@src/Popup.css';

const Popup = () => {
  const optionsUrl = chrome.runtime.getURL('options/index.html#welcome');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => {
      window.open(optionsUrl);
      setLoading(false);
    }, 3000);
  }, [optionsUrl]);

  return <>{loading ? <LoadingSpinner /> : <span>redirected already!</span>}</>;
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
