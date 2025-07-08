// pages/auth/error.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    if (error) {
      switch (error) {
        case 'Signin':
          setErrorMessage('Try signing in with a different account.');
          break;
        case 'OAuthSignin':
          setErrorMessage('Try signing in with a different account.');
          break;
        case 'OAuthCallback':
          setErrorMessage('Try signing in with a different account.');
          break;
        case 'OAuthCreateAccount':
          setErrorMessage('Try signing in with a different account.');
          break;
        case 'EmailCreateAccount':
          setErrorMessage('Try signing in with a different account.');
          break;
        case 'Callback':
          setErrorMessage('Try signing in with a different account.');
          break;
        case 'OAuthAccountNotLinked':
          setErrorMessage('To confirm your identity, sign in with the same account you used originally.');
          break;
        case 'EmailSignin':
          setErrorMessage('Check your email address.');
          break;
        case 'CredentialsSignin':
          setErrorMessage('Sign in failed. Check the details you provided are correct.');
          break;
        case 'SessionRequired':
          setErrorMessage('Please sign in to access this page.');
          break;
        default:
          setErrorMessage('Unable to sign in.');
          break;
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white">
      <div className="text-center max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/20 mb-6">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Authentication Error</h2>
        <p className="text-gray-300 mb-6">{errorMessage || 'An error occurred during authentication. Please try again.'}</p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => router.push('/auth/signin')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded"
          >
            Try Again
          </button>
          <button 
            onClick={() => router.push('/')}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
