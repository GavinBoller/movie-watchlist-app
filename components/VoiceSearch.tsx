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
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const [listeningStartTime, setListeningStartTime] = useState(0);
  const ignoreErrorsTimerRef = useRef<any>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    
    // Check if device is mobile/tablet
    const checkMobileDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 1024; // Standard tablet breakpoint
      
      // Consider it mobile if it's a mobile user agent OR a touch device with small screen
      return isMobile || (isTouchDevice && isSmallScreen);
    };
    
    const isMobile = checkMobileDevice();
    setIsMobileDevice(isMobile);
    
    // Also listen for resize events to handle orientation changes
    const handleResize = () => {
      setIsMobileDevice(checkMobileDevice());
    };
    
    window.addEventListener('resize', handleResize);
    
    // Only initialize speech recognition on mobile devices
    if (isMobile) {
      // Check if browser supports Speech Recognition
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // iOS Safari often ignores this anyway
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Adding explicit iOS Safari handling
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS) {
          console.log('iOS device detected, applying special handling');
          // For iOS, we need to be more aggressive with our handling
          recognition.maxAlternatives = 5; // Try to get more alternatives
        }
        
        recognition.onstart = () => {
          setIsListening(true);
          setListeningStartTime(Date.now());
          setTranscript('');
          
          // Set a flag to ignore errors for the first 2 seconds
          // This helps with iPhones that often report errors immediately after starting
          if (ignoreErrorsTimerRef.current) {
            clearTimeout(ignoreErrorsTimerRef.current);
          }
          
          // Show listening toast only when speech recognition actually starts
          addToast({
            title: 'Listening...',
            description: 'Speak now to search for movies or TV shows',
            variant: 'default',
            duration: 3000
          });
          
          // Mobile browsers, especially Safari on iOS, often fire error events immediately
          // We'll ignore all error events for 2 seconds after starting
          ignoreErrorsTimerRef.current = setTimeout(() => {
            ignoreErrorsTimerRef.current = null;
          }, 2000);
        };
        
        recognition.onresult = (event: any) => {
          console.log('Speech recognition result received:', event);
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              console.log('Final transcript:', transcript);
              finalTranscript += transcript;
            } else {
              console.log('Interim transcript:', transcript);
              interimTranscript += transcript;
            }
          }
          
          // On iOS Safari, sometimes we never get isFinal=true
          // So we'll use what we have after a short delay
          if (interimTranscript && !finalTranscript) {
            console.log('Got interim transcript, waiting briefly for final version');
            setTimeout(() => {
              // If we still don't have a final transcript, use the interim one
              if (isListening && !finalTranscript) {
                console.log('No final transcript received, using interim');
                onResult(interimTranscript.trim());
                // On iOS, we need to manually stop since onend might not fire
                try {
                  recognitionRef.current?.stop();
                } catch (e) {
                  console.log('Error stopping recognition:', e);
                }
                setIsListening(false);
              }
            }, 1500); // Wait 1.5s for final transcript before using interim
          }
          
          setTranscript(finalTranscript || interimTranscript);
          
          if (finalTranscript) {
            console.log('Using final transcript:', finalTranscript);
            onResult(finalTranscript.trim());
            setIsListening(false);
            
            // On iOS, explicitly stop recognition
            try {
              recognitionRef.current?.stop();
            } catch (e) {
              console.log('Error stopping recognition after final result:', e);
            }
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          
          // Completely ignore all errors during the initial grace period
          // This is especially important for iPhones which often report errors right after starting
          if (ignoreErrorsTimerRef.current !== null) {
            console.log('Ignoring speech recognition error during grace period:', event.error);
            return;
          }
          
          // Special handling for mobile browsers - some trigger no-speech immediately
          if (event.error === 'no-speech') {
            console.log('No speech detected yet, continuing to listen');
            // Don't show error for no-speech on initial startup - it's too common on mobile
            // Only set isListening to false if we've been listening for more than 1 second
            if (isListening) {
              const listeningDuration = Date.now() - listeningStartTime;
              if (listeningDuration > 2000) {
                setIsListening(false);
                addToast({
                  title: 'No Speech Detected',
                  description: 'Please try speaking again or tap the microphone to cancel.',
                  variant: 'default',
                  duration: 3000
                });
              }
            }
            return;
          }
          
          // For other errors, proceed with error handling
          setIsListening(false);
          
          let errorMessage = 'Voice search failed. Please try again.';
          
          switch (event.error) {
            case 'network':
              errorMessage = 'Network error. Please check your connection.';
              break;
            case 'not-allowed':
              // Speech recognition permission denied - provide helpful instructions
              console.log('Speech recognition permission denied');
              
              // Check if we're showing localhost error to avoid wrong message on production
              const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
              
              if (isLocalhost) {
                addToast({
                  title: 'Microphone Permission Required',
                  description: 'Development setup needed. In Edge: Go to edge://settings/content/microphone and add localhost:3000 to allowed sites, or try edge://flags/ to add localhost to insecure origins.',
                  variant: 'destructive',
                  action: {
                    label: 'Try Again',
                    onClick: () => startListening()
                  },
                  duration: 15000
                });
              } else {
                // Production site
                addToast({
                  title: 'Microphone Permission Required',
                  description: 'Please allow microphone access when your browser asks, or check browser settings to enable microphone for this site.',
                  variant: 'destructive',
                  action: {
                    label: 'Try Again',
                    onClick: () => startListening()
                  }
                });
              }
              return; // Don't show the default error toast
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
          console.log('Speech recognition ended');
          
          // If we haven't processed any transcript but we were listening,
          // this might be an iOS Safari issue where onresult never fired
          if (isListening && !transcript) {
            console.log('Recognition ended without results - possible iOS issue');
            
            // Only show an error if we've been listening for a while
            const listeningDuration = Date.now() - listeningStartTime;
            if (listeningDuration > 2000) {
              addToast({
                title: 'No Speech Detected',
                description: 'Try speaking louder or check microphone permissions',
                variant: 'default',
                duration: 3000
              });
            }
          }
          
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      } else {
        console.warn('Speech Recognition not supported in this browser');
      }
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (ignoreErrorsTimerRef.current) {
        clearTimeout(ignoreErrorsTimerRef.current);
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
      // For production/HTTPS sites, try getUserMedia first to get proper permission
      if (isHTTPS) {
        console.log('Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted via getUserMedia');
      }
      
      // Start speech recognition
      console.log('Starting speech recognition...');
      
      // iOS Safari workaround - on iOS, sometimes we need to restart recognition
      // if it seems stuck or not receiving results
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        // iOS sometimes needs an extra stop/start cycle to work properly
        try {
          recognitionRef.current?.stop();
        } catch (e) {
          console.log('iOS pre-stop error (can be ignored):', e);
        }
        
        // Short delay before starting on iOS
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
            console.log('iOS: Started recognition after stop/start cycle');
          } catch (iosError) {
            console.log('iOS start error:', iosError);
          }
        }, 100);
      } else {
        // Non-iOS devices can just start normally
        recognitionRef.current?.start();
      }
      
    } catch (error) {
      console.log('Permission or recognition failed:', error);
      
      // Show error based on context
      if (isLocalhost) {
        addToast({
          title: 'Development Setup Required',
          description: 'Microphone access blocked in development. In Edge: Go to edge://settings/content/microphone and add localhost:3000 to allowed sites.',
          variant: 'destructive',
          action: {
            label: 'Try Again',
            onClick: () => startListening()
          },
          duration: 15000
        });
      } else {
        addToast({
          title: 'Microphone Permission Required',
          description: 'Please allow microphone access when prompted by your browser.',
          variant: 'destructive',
          action: {
            label: 'Try Again',
            onClick: () => startListening()
          }
        });
      }
    }
  };

  if (!isSupported || !isMobileDevice || !isMounted) {
    return null; // Don't render if not supported or not on a mobile device
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
