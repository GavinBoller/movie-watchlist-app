// pages/auth/signin.js
import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function SignIn() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('Please wait while we sign you in...');
  
  // Handle redirects based on authentication state
  useEffect(() => {
    console.log('SignIn page - Auth status:', status, 'Session:', session ? 'Present' : 'None');
    
    // Already signed in - redirect to callback URL or search page
    if (status === 'authenticated' && session) {
      setMessage('Successfully signed in! Redirecting...');
      console.log('Authenticated, redirecting to callback URL');
      
      // Get the callback URL from query params, or use search as default
      const callbackUrl = router.query.callbackUrl || '/search';
      
      // Use replace to avoid adding to history stack
      setTimeout(() => {
        router.replace(callbackUrl);
      }, 500);
    } 
    // Not signed in - trigger Google sign-in immediately
    else if (status === 'unauthenticated') {
      setMessage('Initiating sign-in with Google...');
      console.log('Initiating Google sign-in');
      
      // Extract the callback URL from query params
      const callbackUrl = router.query.callbackUrl || '/search';
      
      // Trigger the sign-in process with explicit callback
      signIn('google', { 
        callbackUrl,
        redirect: true // Force redirect to happen
      });
    }
    // Loading - wait for status to resolve
    else if (status === 'loading') {
      setMessage('Checking authentication status...');
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-[#E50914]">Signing In</h2>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#E50914] mx-auto"></div>
        <p className="mt-6 text-gray-300">{message}</p>
        <p className="mt-4 text-sm text-gray-500">Status: {status}</p>
      </div>
    </div>
  );
}
