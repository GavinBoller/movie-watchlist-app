// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Bug, ClipboardCopy } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';
import VoiceSearchDebugger from './VoiceSearchDebugger';

// Add iOS timer declaration to avoid TypeScript errors
declare global {
  interface Window { 
    iosResultTimer: any;
    isSafari: boolean;
    webkitSpeechRecognition: any;
  }
}

interface VoiceSearchProps {
  onResult: (transcript: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  initialDebugMode?: boolean;
}

export default function VoiceSearch({ 
  onResult, 
  placeholder = "Click to start voice search", 
  className = "",
  disabled = false,
  initialDebugMode = false
}: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const [listeningStartTime, setListeningStartTime] = useState(0);
  const ignoreErrorsTimerRef = useRef<any>(null);
  // Debug mode disabled for production
  const [debugMode, setDebugMode] = useState(false); // Force debug mode off regardless of initialDebugMode
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [iosDetected, setIosDetected] = useState(false);
  const [recognitionAttempts, setRecognitionAttempts] = useState(0);
  const [lastRecognitionStatus, setLastRecognitionStatus] = useState<string>('none');
  const { addToast } = useToast();
  
  // Debug logger function with timestamps and category - disabled for production
  const debug = (message: string, category = 'general') => {
    // Only log errors in production to help with diagnostics
    if (category === 'error') {
      console.log(`[VoiceSearch] ${message}`);
    }
    
    // All debug logging and toast notifications are disabled
    // If you need to re-enable debugging, remove this return statement
    return;
    
    const timestamp = new Date().toISOString();
    const formattedMsg = `[${category.toUpperCase()}] ${message}`;
    
    console.log(`[VoiceSearch Debug] ${formattedMsg}`);
    
    // In debug mode, collect logs with timestamps
    if (debugMode) {
      const logWithTime = `${timestamp.substring(11, 23)}: ${formattedMsg}`;
      setDebugLogs(prev => [...prev, logWithTime]);
      
      // If this is an error or important event, show toast in debug mode
      if (category === 'error' || category === 'critical') {
        addToast({
          title: 'Debug: ' + category.toUpperCase(),
          description: message,
          variant: category === 'error' ? 'destructive' : 'default',
          duration: 3000
        });
      }
    }
  };
  
  useEffect(() => {
    setIsMounted(true);
    debug('Component mounted', 'lifecycle');
    
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
    
    // Check if this is an iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIosDetected(isIOS);
    
    debug(`Device detected as ${isMobile ? 'mobile' : 'desktop'}`, 'device');
    debug(`iOS device detected: ${isIOS}`, 'device');
    debug(`User agent: ${navigator.userAgent}`, 'device');
    debug(`Screen size: ${window.innerWidth}x${window.innerHeight}`, 'device');
    debug(`Touch points: ${navigator.maxTouchPoints}`, 'device');
    debug(`Platform: ${navigator.platform}`, 'device');
    
    // Check for Safari specifically
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    window.isSafari = isSafari;
    debug(`Safari browser detected: ${isSafari}`, 'device');
    
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
      
      debug(`Speech Recognition API available: ${!!SpeechRecognition}`, 'api');
      
      if (SpeechRecognition) {
        setIsSupported(true);
        
        try {
          const recognition = new SpeechRecognition();
          debug(`Recognition instance created successfully`, 'api');
          
          // iOS specific configuration
          if (isIOS) {
            debug('Configuring recognition for iOS', 'ios');
            // On iOS, these settings seem to work better
            recognition.continuous = true; // Try continuous mode for iOS
            recognition.interimResults = true;
            recognition.maxAlternatives = 3;
          } else {
            // For other browsers
            recognition.continuous = false;
            recognition.interimResults = true; 
          }
          
          recognition.lang = 'en-US';
          debug(`Recognition configured with: continuous=${recognition.continuous}, interimResults=${recognition.interimResults}, maxAlternatives=${recognition.maxAlternatives}`, 'api');
          
          recognition.onstart = () => {
            debug('Recognition started', 'event');
            setIsListening(true);
            setListeningStartTime(Date.now());
            setTranscript('');
            setLastRecognitionStatus('started');
            
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
              debug('Error grace period ended', 'event');
              ignoreErrorsTimerRef.current = null;
            }, 2000);
          };
          
          recognition.onaudiostart = () => {
            debug('Audio capturing started', 'audio');
            setLastRecognitionStatus('audio_started');
          };
          
          recognition.onsoundstart = () => {
            debug('Sound detected', 'audio');
            setLastRecognitionStatus('sound_detected');
          };
          
          recognition.onspeechstart = () => {
            debug('Speech detected', 'audio');
            setLastRecognitionStatus('speech_detected');
          };
          
          recognition.onspeechend = () => {
            debug('Speech ended', 'audio');
            setLastRecognitionStatus('speech_ended');
          };
          
          recognition.onsoundend = () => {
            debug('Sound ended', 'audio');
            setLastRecognitionStatus('sound_ended');
          };
          
          recognition.onaudioend = () => {
            debug('Audio capturing ended', 'audio');
            setLastRecognitionStatus('audio_ended');
          };
          
          recognition.onresult = (event: any) => {
            debug('Speech recognition result received', 'result');
            
            // Always immediately note that we got some results
            const resultTimestamp = Date.now();
            debug(`Result received at: ${resultTimestamp}, ms since start: ${resultTimestamp - listeningStartTime}`, 'timing');
            
            let finalTranscript = '';
            let interimTranscript = '';
            let bestAlternative = '';
            
            try {
              // Enhanced logging to debug iOS issues
              debug(`Results length: ${event.results.length}`, 'result');
              debug(`Result index: ${event.resultIndex}`, 'result');
              
              for (let i = event.resultIndex; i < event.results.length; i++) {
                debug(`Result ${i}: ${JSON.stringify({
                  isFinal: event.results[i].isFinal,
                  transcript: event.results[i][0].transcript,
                  confidence: event.results[i][0].confidence
                })}`, 'result');
                
                // Get main transcript
                const transcript = event.results[i][0].transcript;
                debug(`Result ${i} transcript: ${transcript}`, 'result');
                
                // Check for alternatives on iOS
                if (event.results[i].length > 1) {
                  debug(`Result ${i} has alternatives: ${event.results[i].length}`, 'result');
                  // Find the alternative with highest confidence as backup
                  let bestConfidence = event.results[i][0].confidence;
                  bestAlternative = transcript;
                  
                  for (let j = 1; j < event.results[i].length; j++) {
                    debug(`Alternative ${j}: ${event.results[i][j].transcript}, confidence: ${event.results[i][j].confidence}`, 'result');
                    if (event.results[i][j].confidence > bestConfidence) {
                      bestConfidence = event.results[i][j].confidence;
                      bestAlternative = event.results[i][j].transcript;
                    }
                  }
                  
                  if (bestAlternative !== transcript) {
                    debug(`Using better alternative: ${bestAlternative}`, 'result');
                  }
                }
                
                if (event.results[i].isFinal) {
                  finalTranscript += transcript;
                  debug(`Final transcript part: ${transcript}`, 'result');
                } else {
                  interimTranscript += transcript;
                  debug(`Interim transcript part: ${transcript}`, 'result');
                }
              }
              
              // Set the transcript for UI display
              setTranscript(finalTranscript || interimTranscript || bestAlternative);
              
              // Use any final transcript immediately
              if (finalTranscript) {
                debug(`Using final transcript: ${finalTranscript}`, 'result');
                onResult(finalTranscript.trim());
                setIsListening(false);
                recognitionRef.current?.stop();
                return;
              }
              
              // Special handling for iOS where we might not get a "final" result
              if (iosDetected && interimTranscript) {
                // On iOS, use interim results after a short delay, as we might never get final
                debug('iOS: Got interim result, setting up delayed processing', 'ios');
                
                // Clear any previous timers to avoid multiple submissions
                if (window.iosResultTimer) {
                  clearTimeout(window.iosResultTimer);
                }
                
                // Use timeout to wait briefly for final result, then use interim
                window.iosResultTimer = setTimeout(() => {
                  debug('iOS: Using interim result after delay', 'ios');
                  // Only process if we're still listening and haven't processed a final transcript
                  if (isListening) {
                    const textToUse = interimTranscript || bestAlternative;
                    if (textToUse) {
                      debug(`iOS: Using text: ${textToUse}`, 'ios');
                      onResult(textToUse.trim());
                      setIsListening(false);
                      try {
                        recognitionRef.current?.stop();
                      } catch (e) {
                        debug(`Error stopping recognition: ${e}`, 'error');
                      }
                    }
                  }
                }, 1500); // 1.5 second delay for iOS
              }
            } catch (err) {
              debug(`Error processing speech results: ${err}`, 'error');
              
              // Fallback for any errors in result processing
              if (interimTranscript || bestAlternative) {
                const fallbackText = interimTranscript || bestAlternative;
                debug(`Using fallback text due to error: ${fallbackText}`, 'recovery');
                onResult(fallbackText.trim());
                setIsListening(false);
                try {
                  recognitionRef.current?.stop();
                } catch (e) {
                  debug(`Error stopping recognition after error: ${e}`, 'error');
                }
              }
            }
          };
          
          recognition.onerror = (event: any) => {
            // For aborted errors, we'll handle specially
            if (event.error === 'aborted') {
              debug(`Speech recognition aborted`, 'info');
              setIsListening(false);
              return; // Don't log or show toasts for aborted - it's a normal operation
            }
            
            debug(`Speech recognition error: ${event.error}`, 'error');
            
            // Completely ignore all errors during the initial grace period
            // This is especially important for iPhones which often report errors right after starting
            if (ignoreErrorsTimerRef.current !== null) {
              debug(`Ignoring speech recognition error during grace period: ${event.error}`, 'warning');
              return;
            }
            
            // Special handling for mobile browsers - some trigger no-speech immediately
            if (event.error === 'no-speech') {
              debug('No speech detected yet, continuing to listen', 'error');
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
                debug('Speech recognition permission denied', 'error');
                
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
              case 'aborted':
                debug('Recognition aborted by user or system', 'info');
                setIsListening(false);
                return; // Don't show error for aborted recognition
              case 'no-speech':
                errorMessage = 'No speech detected. Please try speaking again.';
                break;
              case 'service-not-allowed':
                errorMessage = 'Speech recognition service not allowed. Please try again later.';
                break;
              case 'bad-grammar':
                errorMessage = 'Speech grammar issue. Please try a different phrase.';
                break;
              case 'language-not-supported':
                errorMessage = 'Speech language not supported. Please try again in English.';
                break;
              default:
                errorMessage = `Voice search error: ${event.error}. Please try again.`;
            }
            
            addToast({
              title: 'Voice Search Error',
              description: errorMessage,
              variant: 'destructive'
            });
          };
          
          recognition.onend = () => {
            debug('Speech recognition ended', 'event');
            setLastRecognitionStatus('ended');
            
            // If we haven't processed any transcript but we were listening,
            // this might be an iOS Safari issue where onresult never fired
            if (isListening && !transcript) {
              debug('Recognition ended without results - possible iOS issue', 'ios');
              
              // Only show an error if we've been listening for a while
              const listeningDuration = Date.now() - listeningStartTime;
              if (listeningDuration > 2000) {
                // iOS-specific retry logic
                if (iosDetected && recognitionAttempts < 3) {
                  debug(`iOS: No results after ${listeningDuration}ms, attempting restart (attempt ${recognitionAttempts + 1})`, 'ios');
                  setRecognitionAttempts(prev => prev + 1);
                  
                  // Wait a moment and try restarting
                  setTimeout(() => {
                    try {
                      debug('iOS: Attempting to restart recognition', 'ios');
                      recognitionRef.current?.start();
                    } catch (e) {
                      debug(`iOS restart error: ${e}`, 'error');
                      setIsListening(false);
                      
                      addToast({
                        title: 'Voice Recognition Failed',
                        description: 'Could not restart speech recognition. Please try again.',
                        variant: 'destructive',
                        duration: 3000
                      });
                    }
                  }, 300);
                } else {
                  // Give up after 3 attempts or for non-iOS
                  debug('No results after multiple attempts, giving up', 'error');
                  setIsListening(false);
                  
                  addToast({
                    title: 'No Speech Detected',
                    description: iosDetected ? 
                      'Try speaking louder or enable debug mode to diagnose iPhone issues' : 
                      'Try speaking louder or check microphone permissions',
                    variant: 'default',
                    action: {
                      label: 'Enable Debug',
                      onClick: () => {
                        setDebugMode(true);
                        setShowDebugPanel(true);
                      }
                    },
                    duration: 5000
                  });
                }
              } else {
                setIsListening(false);
              }
            } else {
              setIsListening(false);
            }
            
            // Reset attempts counter if we're no longer listening
            if (!isListening) {
              setRecognitionAttempts(0);
            }
          };
          
          recognitionRef.current = recognition;
        } catch (initError) {
          debug(`Error initializing speech recognition: ${initError}`, 'error');
          setIsSupported(false);
        }
      } else {
        debug('Speech Recognition not supported in this browser', 'error');
      }
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (recognitionRef.current) {
        try {
          // Use stop instead of abort on cleanup to prevent errors
          if (isListening) {
            recognitionRef.current.stop();
          }
        } catch (e) {
          debug(`Error stopping recognition on unmount: ${e}`, 'error');
        }
      }
      if (ignoreErrorsTimerRef.current) {
        clearTimeout(ignoreErrorsTimerRef.current);
      }
      if (window.iosResultTimer) {
        clearTimeout(window.iosResultTimer);
      }
    };
  }, [onResult, addToast, debugMode]);

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
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        debug(`Error stopping recognition: ${e}`, 'error');
      }
      setIsListening(false);
      return;
    }
    
    // Track window.iosResultTimer for iOS
    if (window.iosResultTimer) {
      clearTimeout(window.iosResultTimer);
      window.iosResultTimer = null;
    }

    // Reset attempts counter
    setRecognitionAttempts(0);
    
    // Reset transcript
    setTranscript('');

    // Check if this is an iOS device
    const isIOS = iosDetected;
    
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
              debug(`Direct speech recognition failed: ${error}`, 'error');
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
        debug('Requesting microphone permission...', 'permission');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          debug('Microphone permission granted via getUserMedia', 'permission');
        } catch (permError) {
          debug(`getUserMedia permission error: ${permError}`, 'error');
          // Continue anyway, the speech recognition API will handle its own permissions
        }
      }
      
      // Start speech recognition with iOS-specific handling
      debug('Starting speech recognition...', 'event');
      
      if (isIOS) {
        debug('iOS: Special handling for speech recognition', 'ios');
        
        // iOS needs extra care
        try {
          // Always make sure we're stopped first (helps with iOS Safari)
          try {
            if (recognitionRef.current) {
              debug('iOS: Stopping any existing recognition first', 'ios');
              recognitionRef.current.stop();
              
              // Add a small delay to allow the previous instance to clean up
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (e) {
            // Ignore errors here - it might not be started
            debug('iOS: Ignoring potential error when stopping before start', 'ios');
          }
          
          // Wait a moment before starting on iOS (helps avoid race conditions)
          setTimeout(() => {
            try {
              debug('iOS: Starting recognition after delay', 'ios');
              recognitionRef.current?.start();
            } catch (iosStartError) {
              debug(`iOS start error after delay: ${iosStartError}`, 'error');
              
              // One more attempt with different timing if needed
              setTimeout(() => {
                try {
                  debug('iOS: Last attempt to start recognition', 'ios');
                  recognitionRef.current?.start();
                } catch (finalError) {
                  debug(`iOS final start error: ${finalError}`, 'error');
                  addToast({
                    title: 'Speech Recognition Failed',
                    description: 'Could not start speech recognition on your device.',
                    variant: 'destructive',
                    action: {
                      label: 'Show Debug',
                      onClick: () => {
                        setDebugMode(true);
                        setShowDebugPanel(true);
                      }
                    }
                  });
                }
              }, 300);
            }
          }, 100);
        } catch (iosError) {
          debug(`iOS recognition error: ${iosError}`, 'error');
        }
      } else {
        // Non-iOS devices
        recognitionRef.current?.start();
      }
      
    } catch (error) {
      debug(`Permission or recognition failed: ${error}`, 'error');
      
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

  // Function to clear logs
  const clearLogs = () => {
    setDebugLogs([]);
    debug('Debug logs cleared', 'debug');
  }

  // Toggle debug mode
  const toggleDebugMode = () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    debug(`Debug mode ${newMode ? 'enabled' : 'disabled'}`, 'debug');
    
    if (newMode && !showDebugPanel) {
      setShowDebugPanel(true);
    }
  };

  if (!isSupported || !isMobileDevice || !isMounted) {
    return null; // Don't render if not supported or not on a mobile device
  }

  return (
    <>
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
        {/* Debug toggle button - commented out for production 
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleDebugMode}
          className={`
            ml-1 flex items-center justify-center transition-all duration-200 h-6 w-6 p-0 rounded-full
            ${debugMode 
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }
          `}
          title={debugMode ? "Disable debug mode" : "Enable debug mode for troubleshooting"}
        >
          <Bug className="h-3 w-3" />
        </Button>
        */}
        
        {isListening && transcript && (
          <div className="absolute top-full left-0 mt-1 flex items-center gap-1 text-sm text-gray-400 max-w-[200px] truncate bg-gray-800 px-2 py-1 rounded shadow-lg z-10">
            <Volume2 className="h-3 w-3 animate-pulse flex-shrink-0" />
            <span className="italic truncate">"{transcript}"</span>
          </div>
        )}
      </div>
      
      {/* Debug panel - commented out for production 
      <VoiceSearchDebugger 
        logs={debugLogs}
        isVisible={debugMode && showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
        onClear={clearLogs}
      />
      */}

      {/* Floating debug button - commented out for production 
      {debugMode && !showDebugPanel && (
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => setShowDebugPanel(true)}
          className="fixed bottom-4 right-4 z-50 rounded-full h-10 w-10 p-0 bg-yellow-600 hover:bg-yellow-700 shadow-lg flex items-center justify-center"
        >
          <Bug className="h-5 w-5" />
        </Button>
      )}
      */}
    </>
  );
}
