import { useState } from 'react';

const CreatePassword = ({ submitCallback }: CreatePasswordPropsType) => {
  const [password1, setPassword1] = useState<string>('');
  const [password2, setPassword2] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password1 !== password2) {
      setError('Passwords do not match!');
      return;
    }
    submitCallback(password1);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-amber-100 text-base">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center gap-5 rounded-md bg-white px-8 py-12">
        <div className="flex w-full flex-col items-start justify-center gap-2">
          <label htmlFor="password1" className="w-full text-left">
            Create new Password
          </label>
          <input
            id="password1"
            value={password1}
            onChange={e => setPassword1(e.target.value)}
            className="w-full rounded-md bg-gray-50 p-2"
            type="password"
          />
        </div>
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
        <span className="text-red-400">{error}</span>
        <button
          type="submit"
          className="flex min-w-60 items-center justify-center rounded-full bg-blue-100 p-5 active:bg-blue-200">
          Create Password
        </button>
      </form>
    </div>
  );
};

type CreatePasswordPropsType = {
  submitCallback: (password: string) => void;
};

export default CreatePassword;
