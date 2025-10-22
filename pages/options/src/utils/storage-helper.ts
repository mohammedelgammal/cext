export const appendToStorage = (key: string, value: object, callback?: () => void): void => {
  chrome.storage.local.get([key], result => {
    const existing = result[key] || {};
    const updated = { ...existing, ...value };

    chrome.storage.local.set({ [key]: updated }, () => {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
      }
      callback?.();
    });
  });
};

export const fetchStorage = async <T>(key: string): Promise<T | null> =>
  new Promise(resolve => {
    chrome.storage.local.get([key], (result: { [key: string]: T }) => {
      resolve(result[key] || null);
    });
  });
