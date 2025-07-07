// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Keyboard, X } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
}

export default function KeyboardShortcutsHelp(): React.ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  // Close the shortcuts panel with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      } else if (e.key === '?' && !isOpen) {
        // Open the shortcuts panel with "?" key
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  // Get the current page to show relevant shortcuts
  const isSearchPage = typeof window !== 'undefined' && window.location.pathname === '/search';
  
  // Shortcuts list - common shortcuts
  const commonShortcuts: Shortcut[] = [
    { key: '/', description: 'Focus search box' },
    { key: 'Escape', description: 'Clear search / Close dialogs' },
    { key: '←/→', description: 'Navigate between pages' },
    { key: 'm', description: 'Toggle movie filter' },
    { key: 't', description: 'Toggle TV show filter' },
    { key: '?', description: 'Show/hide keyboard shortcuts' },
  ];
  
  // Watchlist page specific shortcuts
  const watchlistShortcuts: Shortcut[] = [
    { key: '1', description: 'Filter "To Watch" status' },
    { key: '2', description: 'Filter "Watching" status' },
    { key: '3', description: 'Filter "Watched" status' },
  ];
  
  // Search page specific shortcuts
  const searchShortcuts: Shortcut[] = [
    { key: 'p', description: 'Toggle popular content' },
    { key: 'r', description: 'Toggle top-rated content' },
  ];
  
  // Use the appropriate shortcuts based on the current page
  const shortcuts: Shortcut[] = [
    ...commonShortcuts,
    ...(isSearchPage ? searchShortcuts : watchlistShortcuts)
  ];
  
  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-20 bg-gray-800 hover:bg-gray-700 rounded-full p-3 shadow-lg"
        aria-label="Keyboard Shortcuts"
        title="Keyboard Shortcuts (Press ? key)"
      >
        <Keyboard className="h-5 w-5" />
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-900 rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Keyboard className="mr-2 h-5 w-5" /> Keyboard Shortcuts
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-300">{shortcut.description}</span>
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-sm font-mono">{shortcut.key}</kbd>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-4">
              <Button onClick={() => setIsOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
