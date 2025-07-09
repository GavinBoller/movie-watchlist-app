// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';

interface VoiceSearchProps {
  onResult: (transcript: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function VoiceSearch({ 
  onResult, 
  placeholder = "Click to start voice search", 
  className = "",
  disabled = false 
}: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const { addToast } = useToast();

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        // Show listening toast only when speech recognition actually starts
        addToast({
          title: 'Listening...',
          description: 'Speak now to search for movies or TV shows',
          variant: 'default',
          duration: 3000
        });
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          onResult(finalTranscript.trim());
          setIsListening(false);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        let errorMessage = 'Voice search failed. Please try again.';
        
        switch (event.error) {
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'not-allowed':
            // Speech recognition permission denied - provide helpful instructions
            console.log('Speech recognition permission denied');
            addToast({
              title: 'Microphone Permission Required',
              description: 'Please allow microphone access. In Edge: Click the 🎤 icon in the address bar → Allow, or go to edge://settings/content/microphone and add localhost:3000 to allowed sites.',
              variant: 'destructive',
              action: {
                label: 'Try Again',
                onClick: () => startListening()
              },
              duration: 10000 // Show longer for more complex instructions
            });
            return; // Don't show the default error toast
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found. Please check your audio settings.';
            break;
        }
        
        addToast({
          title: 'Voice Search Error',
          description: errorMessage,
          variant: 'destructive'
        });
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('Speech Recognition not supported in this browser');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onResult, addToast]);

  const startListening = async () => {
    if (!isSupported) {
      addToast({
        title: 'Voice Search Not Supported',
        description: 'Your browser does not support voice search. Please use Chrome, Edge, or Safari.',
        variant: 'destructive'
      });
      return;
    }

    if (disabled) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    // Check if we're on localhost (development)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHTTPS = window.location.protocol === 'https:';

    if (isLocalhost && !isHTTPS) {
      // In development on HTTP localhost, show immediate guidance
      addToast({
        title: 'HTTPS Required for Microphone',
        description: 'Voice search requires HTTPS. For development: 1) In Edge, type edge://flags/ 2) Search "Insecure origins" 3) Add localhost:3000 to the list 4) Restart browser',
        variant: 'destructive',
        action: {
          label: 'Try Anyway',
          onClick: async () => {
            // Still try to start speech recognition directly
            try {
              recognitionRef.current?.start();
            } catch (error) {
              console.log('Direct speech recognition failed:', error);
            }
          }
        },
        duration: 20000 // Show longer for complex instructions
      });
      return;
    }

    try {
      // First, try to request microphone permission explicitly
      console.log('Requesting microphone permission...');
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted via getUserMedia');
      } catch (permissionError) {
        console.log('getUserMedia failed, trying direct speech recognition approach:', permissionError);
        
        // If getUserMedia fails due to permissions policy, try direct speech recognition
        // which might have its own permission handling
        if (permissionError.name === 'NotAllowedError') {
          console.log('Falling back to direct speech recognition start...');
          // Fall through to try speech recognition directly
        } else {
          throw permissionError; // Re-throw other errors
        }
      }
      
      // Start speech recognition (either after getUserMedia success or as fallback)
      console.log('Starting speech recognition...');
      recognitionRef.current?.start();
      
      // Don't show listening toast here - it will be shown in onstart if successful
      
    } catch (error) {
      console.log('All permission attempts failed:', error);
      
      // Show permission denied toast with instructions
      addToast({
        title: 'Microphone Access Required',
        description: 'Development mode requires manual permission setup. In Edge: Type edge://settings/content/microphone in address bar, then add localhost:3000 to "Allow" list.',
        variant: 'destructive',
        action: {
          label: 'Try Again',
          onClick: async () => {
            startListening();
          }
        },
        duration: 15000 // Show longer for detailed instructions
      });
    }
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={startListening}
        disabled={disabled}
        className={`
          flex items-center justify-center transition-all duration-200 h-8 w-8 p-1 rounded-full
          ${isListening 
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={isListening ? "Click to stop voice search" : "Click the microphone to search by voice"}
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {isListening && transcript && (
        <div className="absolute top-full left-0 mt-1 flex items-center gap-1 text-sm text-gray-400 max-w-[200px] truncate bg-gray-800 px-2 py-1 rounded shadow-lg z-10">
          <Volume2 className="h-3 w-3 animate-pulse flex-shrink-0" />
          <span className="italic truncate">"{transcript}"</span>
        </div>
      )}
    </div>
  );
}
