import React, { useState, useEffect } from 'react';
import { X, Download, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { isPWAMode } from '../utils/pwa';

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  
  useEffect(() => {
    // Don't show banner if already in PWA mode
    if (isPWAMode()) return;
    
    // Check if iOS
    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iosCheck);
    
    // Check if we've already dismissed or installed
    const hasDismissed = localStorage.getItem('pwaInstallDismissed');
    const hasInstalled = localStorage.getItem('pwaInstalled');
    
    if (hasDismissed || hasInstalled) return;
    
    // Show banner after 3 seconds
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 3000);
    
    // For non-iOS, capture install prompt
    if (!iosCheck) {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setInstallPrompt(e);
      });
    }
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwaInstalled', 'true');
      setShowBanner(false);
    });
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((result) => {
        if (result.outcome === 'accepted') {
          localStorage.setItem('pwaInstalled', 'true');
        }
        setInstallPrompt(null);
      });
    }
  };
  
  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('pwaInstallDismissed', 'true');
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg z-50 flex items-center justify-between">
      <div className="flex items-center">
        <div className="mr-3">
          <Download className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-semibold">Add to Home Screen</h3>
          <p className="text-sm text-gray-300">
            {isIOS 
              ? 'Tap the share button then "Add to Home Screen"' 
              : 'Install this app for a better experience'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center">
        {!isIOS && (
          <Button 
            id="pwa-install-button"
            onClick={handleInstall} 
            variant="default" 
            size="sm" 
            className="mr-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Install
          </Button>
        )}
        
        <Button
          onClick={dismissBanner}
          variant="ghost" 
          size="sm"
          className="text-gray-300 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
