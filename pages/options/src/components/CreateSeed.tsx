import { CreatePassword } from './';
import { AESEncryption, appendToStorage, base64ArrayBuffer } from '@src/utils';
import { LoadingSpinner } from '@extension/ui';
import checkCircle from '@src/assets/check.svg';
import solidEye from '@src/assets/eye-solid.svg';
import { URLS } from '@src/routes';
import * as bip39 from 'bip39';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateSeed = () => {
  const [isVisible, setVisible] = useState<boolean>(false);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleWalletCreate = (password: string) => {
    const encryption = new AESEncryption();
    encryption.encryptAES(password, mnemonic).then(({ seed, iv, salt }) => {
      chrome.storage.local.remove('wallet');
      appendToStorage('wallet', {
        seed: base64ArrayBuffer(seed),
        iv: base64ArrayBuffer(iv),
        salt: base64ArrayBuffer(salt),
      });
      navigate(URLS.WALLET);
    });
  };

  useEffect(() => {
    if (!showPassword) {
      chrome.storage.local.get('wallet', storageData => {
        const seed = storageData?.['wallet']?.seed;
        const plainSeed = storageData?.['wallet']?.plainSeed;
        if (seed) navigate(URLS.WALLET);
        if (!plainSeed) {
          const mnemonicPhrase = bip39.generateMnemonic();
          setMnemonic(mnemonicPhrase);
          appendToStorage('wallet', { plainSeed: mnemonicPhrase });
        } else {
          setMnemonic(plainSeed);
        }
        setVerifying(false);
      });
    }
    chrome.storage.local.get('wallet', storageData => {
      console.log(storageData);
    });
  }, []);

  if (verifying) return <LoadingSpinner />;
  if (showPassword) return <CreatePassword submitCallback={handleWalletCreate} />;

  return (
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
  );
};

export default CreateSeed;
