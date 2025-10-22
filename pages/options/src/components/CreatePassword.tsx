import { useState } from 'react';

const CreatePassword = ({ submitCallback, rotate, create, setPassword }: CreatePasswordPropsType) => {
  const [password1, setPassword1] = useState<string>('');
  const [password2, setPassword2] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password1 !== password2 && !rotate && !create) {
      setError('Passwords do not match!');
      return;
    }
    submitCallback(password1);
    setPassword?.(password1);
  };

  return (
    <div className={`flex flex-col items-center justify-center bg-amber-100 text-base`}>
      {create ?? <h2 className="mb-5 text-3xl">{rotate ? 'Rotate Keys' : 'Set new Password'}</h2>}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center gap-5 rounded-md bg-white px-8 py-12">
        <div className="flex w-full flex-col items-start justify-center gap-2">
          <label htmlFor="password1" className="w-full text-left">
            {!rotate && !create ? 'Create new Password' : 'Enter Password'}
          </label>
          <input
            id="password1"
            value={password1}
            onChange={e => setPassword1(e.target.value)}
            className="w-full rounded-md bg-gray-50 p-2"
            type="password"
          />
        </div>
        {!rotate && !create ? (
          <div className="flex w-full flex-col items-start justify-center gap-2">
            <label htmlFor="password2" className="w-full text-left">
              Confirm Password
            </label>
            <input
              id="password2"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              className="w-full rounded-md bg-gray-50 p-2"
              type="password"
            />
          </div>
        ) : null}
        <span className="text-red-400">{error}</span>
        <button
          type="submit"
          className="flex min-w-60 items-center justify-center rounded-full bg-blue-100 p-5 active:bg-blue-200">
          {(() => {
            if (create) return 'Submit';
            if (!rotate) {
              return 'Create Password';
            } else {
              return 'Rotate';
            }
          })()}
        </button>
      </form>
    </div>
  );
};

type CreatePasswordPropsType = {
  submitCallback: (password: string) => void;
  rotate: boolean;
  create?: boolean;
  setPassword?: React.Dispatch<React.SetStateAction<string>>;
};

export default CreatePassword;
