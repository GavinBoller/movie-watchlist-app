// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Bug, ClipboardCopy, X, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';

interface VoiceSearchDebuggerProps {
  logs: string[];
  isVisible: boolean;
  onClose: () => void;
  onClear: () => void;
}

export default function VoiceSearchDebugger({ 
  logs = [], 
  isVisible = false,
  onClose,
  onClear
}: VoiceSearchDebuggerProps) {
  const { addToast } = useToast();
  const [systemInfo, setSystemInfo] = useState<string>('');
  
  useEffect(() => {
    if (isVisible) {
      // Collect system information when the debugger becomes visible
      const info = [
        `User Agent: ${navigator.userAgent}`,
        `Platform: ${navigator.platform}`,
        `Vendor: ${navigator.vendor}`,
        `Screen Size: ${window.innerWidth}x${window.innerHeight}`,
        `Pixel Ratio: ${window.devicePixelRatio}`,
        `Touch Points: ${navigator.maxTouchPoints}`,
        `Online: ${navigator.onLine}`,
        `Date: ${new Date().toISOString()}`
      ].join('\n');
      
      setSystemInfo(info);
    }
  }, [isVisible]);

  const copyToClipboard = () => {
    // Combine system info and logs
    const fullDebugInfo = `
========= SYSTEM INFO =========
${systemInfo}

========= VOICE SEARCH LOGS =========
${logs.join('\n')}
`;
    
    // Use clipboard API to copy
    navigator.clipboard.writeText(fullDebugInfo)
      .then(() => {
        addToast({
          title: 'Debug Logs Copied',
          description: 'All logs have been copied to clipboard. Please paste them in your response to get help.',
          variant: 'default',
          duration: 3000
        });
      })
      .catch(err => {
        console.error('Failed to copy logs:', err);
        addToast({
          title: 'Copy Failed',
          description: 'Could not copy logs to clipboard. Please try again or manually select and copy the logs.',
          variant: 'destructive',
          duration: 3000
        });
      });
  };

  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-[#1a1a1a] rounded-lg shadow-lg max-w-3xl w-full p-4 text-white max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bug className="h-5 w-5 text-yellow-400" />
            Voice Search Debugger
          </h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClear}
              title="Clear logs"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard}
              title="Copy to clipboard"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <ClipboardCopy className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
              title="Close debugger"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 overflow-y-auto">
          <div className="p-2 bg-gray-800 rounded text-xs font-mono">
            <h3 className="text-xs font-semibold mb-1 text-yellow-400">SYSTEM INFO</h3>
            <pre className="whitespace-pre-wrap text-gray-300 max-h-[100px] overflow-y-auto">
              {systemInfo}
            </pre>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-xs font-semibold mb-1 text-yellow-400">LOGS ({logs.length})</h3>
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center p-4">No logs yet. Try using voice search.</div>
            ) : (
              <pre className="bg-gray-800 p-2 rounded text-gray-300 text-xs font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {logs.join('\n')}
              </pre>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between">
          <p className="text-xs text-gray-400">These logs help diagnose voice recognition issues on iPhone.</p>
          <Button
            variant="default"
            size="sm"
            onClick={copyToClipboard}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ClipboardCopy className="h-4 w-4 mr-1" /> Copy All Logs
          </Button>
        </div>
      </div>
    </div>
  );
}
