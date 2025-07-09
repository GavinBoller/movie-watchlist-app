// @ts-nocheck
import React from 'react';
import { AlertCircle, Mic, Settings, Chrome, Edge } from 'lucide-react';
import { Button } from './ui/button';

interface MicrophoneHelpProps {
  onClose: () => void;
}

export default function MicrophoneHelp({ onClose }: MicrophoneHelpProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Enable Microphone Access</h2>
            <p className="text-sm text-gray-400">Allow voice search to work</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-200 mb-1">Microphone Permission Required</h3>
                <p className="text-sm text-yellow-300">
                  Voice search needs access to your microphone to convert speech to text.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Chrome className="h-4 w-4" />
              Chrome/Edge Instructions
            </h3>
            <ol className="text-sm text-gray-300 space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                <span>Look for the microphone icon in the address bar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                <span>Click the microphone icon and select "Allow"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                <span>Refresh the page if needed</span>
              </li>
            </ol>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Alternative Method
            </h4>
            <p className="text-sm text-gray-300 mb-2">
              If you don't see the microphone icon:
            </p>
            <ol className="text-sm text-gray-300 space-y-1 pl-4">
              <li>• Go to browser Settings</li>
              <li>• Search for "Microphone"</li>
              <li>• Add this site to allowed sites</li>
            </ol>
          </div>

          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-200 mb-1">Privacy Note</h4>
            <p className="text-sm text-blue-300">
              Voice recognition happens in your browser. No audio is sent to external servers.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button 
            onClick={() => window.open('https://support.google.com/chrome/answer/2693767', '_blank')}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Browser Help
          </Button>
          <Button 
            onClick={onClose}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
