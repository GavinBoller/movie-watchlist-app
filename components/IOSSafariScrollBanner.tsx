import React, { useEffect, useState } from 'react';

function isIOS() {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
}

const IOSSafariScrollBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isIOS() && !isStandalone()) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div style={{
      background: '#222',
      color: '#fff',
      padding: '10px',
      textAlign: 'center',
      zIndex: 9999,
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      fontSize: '15px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      For the best experience, scroll down to hide Safari’s toolbar.
      <button onClick={() => setShow(false)} style={{ marginLeft: 16, color: '#fff', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Dismiss</button>
    </div>
  );
};

export default IOSSafariScrollBanner;
