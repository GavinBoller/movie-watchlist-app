// components/SessionDebugger.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function SessionDebugger() {
  const { data: session, status } = useSession();
  const [apiSession, setApiSession] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const checkApiSession = async () => {
      try {
        const res = await fetch('/api/auth/session-debug');
        const data = await res.json();
        setApiSession(data);
      } catch (error) {
        console.error('Error fetching API session:', error);
      }
    };
    
    // Check immediately
    checkApiSession();
    
    // Set up interval to periodically check
    const intervalId = setInterval(checkApiSession, 5000);
    return () => clearInterval(intervalId);
  }, []);
  
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-2 right-2 bg-gray-800 text-white p-2 rounded-md text-xs z-50"
      >
        Debug Session
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-0 right-0 bg-gray-800 text-white p-4 rounded-tl-md max-w-md max-h-96 overflow-auto z-50">
      <div className="flex justify-between mb-2">
        <h3 className="text-lg font-bold">Session Debugger</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-red-500"
        >
          ✕
        </button>
      </div>
      
      <div className="text-sm">
        <div className="mb-4">
          <h4 className="font-bold text-blue-400">useSession() Hook</h4>
          <div className="ml-2">
            <p>Status: {status}</p>
            <p>Authenticated: {session ? 'Yes' : 'No'}</p>
            {session && (
              <div>
                <p>User: {session.user?.name} ({session.user?.email})</p>
                <p>Expires: {session.expires}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-bold text-green-400">API Session</h4>
          <div className="ml-2">
            <p>Authenticated: {apiSession?.authenticated ? 'Yes' : 'No'}</p>
            {apiSession?.session && (
              <div>
                <p>User: {apiSession.session.user?.name} ({apiSession.session.user?.email})</p>
                <p>Expires: {apiSession.session.expires}</p>
              </div>
            )}
            <div className="mt-2">
              <p className="font-bold">Cookies:</p>
              <p>Session Token: {apiSession?.cookies?.hasNextAuthSession ? 'Present' : 'Missing'}</p>
              <p>JWT: {apiSession?.cookies?.hasJWT ? 'Present' : 'Missing'}</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm mt-2"
        >
          Force Reload
        </button>
      </div>
    </div>
  );
}
