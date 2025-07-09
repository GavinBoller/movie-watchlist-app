// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, Bug, ClipboardCopy } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';
import VoiceSearchDebugger from './VoiceSearchDebugger';  // Add iOS timer declaration to avoid TypeScript errors
declare global {
  interface Window { 
    iosResultTimer: any;
    isSafari: boolean;
    webkitSpeechRecognition: any;
    isStandalone: boolean; // PWA detection
    matchMedia: (query: string) => { matches: boolean };
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
  const [isPWA, setIsPWA] = useState(false); // Track if running as home screen app
  const [recognitionAttempts, setRecognitionAttempts] = useState(0);
  const [lastRecognitionStatus, setLastRecognitionStatus] = useState<string>('none');
  const micStreamRef = useRef<MediaStream | null>(null); // Store mic stream for PWA cleanup
  const { addToast } = useToast();
  
  // Debug logger function with timestamps and category - enhanced iOS logging for microphone debugging
  const debug = (message: string, category = 'general') => {
    // Log errors, iOS-specific messages, and events for debugging microphone issues
    if (category === 'error' || category === 'ios' || category === 'event' || category === 'audio') {
      console.log(`[VoiceSearch ${category}] ${message}`);
    }
    
    // All other debug logging and toast notifications are disabled
    // If you need to re-enable full debugging, remove this return statement
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
  
  // Enhanced cleanup function for iOS microphone issues - immediate synchronous cleanup
  const forceStopRecognition = useCallback(() => {
    debug('Force stopping recognition for iOS microphone cleanup', 'ios');
    
    if (recognitionRef.current) {
      try {
        if (iosDetected) {
          debug('iOS: Immediate synchronous microphone cleanup', 'ios');
          
          // iOS needs immediate synchronous cleanup - no delays
          try {
            recognitionRef.current.stop();
            debug('iOS: Called stop() immediately', 'ios');
          } catch (e) {
            debug(`iOS: Error calling stop: ${e}`, 'ios');
          }
          
          try {
            recognitionRef.current.abort();
            debug('iOS: Called abort() immediately', 'ios');
          } catch (e) {
            debug(`iOS: Error calling abort: ${e}`, 'ios');
          }
          
          // For PWA mode, we need to be extra aggressive
          if (isPWA) {
            debug('iOS PWA: Extra aggressive microphone cleanup', 'ios');
            
            // Additional PWA-specific cleanup: directly stop any active mic tracks
            if (micStreamRef.current) {
              try {
                const tracks = micStreamRef.current.getTracks();
                debug(`iOS PWA: Stopping ${tracks.length} mic tracks directly`, 'ios');
                
                tracks.forEach(track => {
                  try {
                    track.stop();
                    debug(`iOS PWA: Stopped track ${track.id}`, 'ios');
                  } catch (e) {
                    debug(`iOS PWA: Error stopping track: ${e}`, 'ios');
                  }
                });
                
                // Clear the reference
                micStreamRef.current = null;
              } catch (e) {
                debug(`iOS PWA: Error stopping mic tracks: ${e}`, 'ios');
              }
            }
            
            // Create and immediately abort a new recognition instance
            try {
              const SpeechRecognition = 
                (window as any).SpeechRecognition || 
                (window as any).webkitSpeechRecognition;
              
              if (SpeechRecognition) {
                const tempRecognition = new SpeechRecognition();
                tempRecognition.abort();
                debug('iOS PWA: Created and aborted temp recognition', 'ios');
                
                // Extra cleanup steps for PWA
                setTimeout(() => {
                  try {
                    const finalRecognition = new SpeechRecognition();
                    finalRecognition.abort();
                    debug('iOS PWA: Created and aborted final temp recognition', 'ios');
                  } catch (e) {
                    debug(`iOS PWA: Error in final cleanup: ${e}`, 'ios');
                  }
                }, 300); // Longer timeout for PWA
              }
            } catch (e) {
              debug(`iOS PWA: Error creating temp recognition: ${e}`, 'ios');
            }
          }
          
          // Don't nullify the reference immediately - let iOS clean up naturally
          debug('iOS: Cleanup calls completed', 'ios');
        } else {
          // Non-iOS devices - standard cleanup
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        }
      } catch (e) {
        debug(`Error in forceStopRecognition: ${e}`, 'error');
      }
    }
    
    setIsListening(false);
  }, [iosDetected, isPWA, debug]);
  
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
    
    // Check if this is running as a PWA (added to home screen)
    const isPWAMode = (() => {
      // Method 1: navigator.standalone (iOS Safari specific)
      if ((navigator as any).standalone === true) {
        return true;
      }
      
      // Method 2: display-mode media query (more standard)
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      
      // Method 3: window.navigator.standalone (older iOS)
      if (window.navigator && (window.navigator as any).standalone === true) {
        return true;
      }
      
      // Default - not PWA
      return false;
    })();
    
    setIsPWA(isPWAMode);
    
    debug(`Device detected as ${isMobile ? 'mobile' : 'desktop'}`, 'device');
    debug(`iOS device detected: ${isIOS}`, 'ios');
    debug(`Running as PWA (home screen app): ${isPWAMode}`, 'ios');
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
            // On iOS Safari, these settings work better
            recognition.continuous = false; // Use non-continuous for iOS reliability
            recognition.interimResults = true;
            recognition.maxAlternatives = 1; // Reduce alternatives for iOS stability
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
                
                // iOS-specific aggressive microphone cleanup for final results
                if (iosDetected && recognitionRef.current) {
                  debug('iOS: Aggressive cleanup for final transcript', 'ios');
                  try {
                    // iOS Safari workaround: set continuous to false and stop immediately
                    recognitionRef.current.continuous = false;
                    recognitionRef.current.stop();
                    recognitionRef.current.abort();
                    
                    // Additional iOS fix: nullify the reference immediately
                    const oldRecognition = recognitionRef.current;
                    recognitionRef.current = null;
                    
                    // For PWA mode on iOS, we need extra cleanup
                    if (isPWA) {
                      debug('iOS PWA: Extra cleanup for final transcript', 'ios');
                      
                      // Directly release any active media tracks
                      if (micStreamRef.current) {
                        try {
                          const tracks = micStreamRef.current.getTracks();
                          tracks.forEach(track => track.stop());
                          debug(`iOS PWA: Stopped ${tracks.length} media tracks`, 'ios');
                          micStreamRef.current = null;
                        } catch (e) {
                          debug(`iOS PWA: Error stopping media tracks: ${e}`, 'ios');
                        }
                      }
                      
                      // For PWA, create multiple temp instances to force iOS to release the mic
                      for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                          try {
                            const SpeechRecognition = 
                              (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
                            if (SpeechRecognition) {
                              const tempRecognition = new SpeechRecognition();
                              tempRecognition.abort();
                              debug(`iOS PWA: Created and aborted temp recognition ${i+1}`, 'ios');
                            }
                          } catch (e) {
                            debug(`iOS PWA: Error creating temp recognition ${i+1}: ${e}`, 'ios');
                          }
                        }, i * 100); // Stagger cleanup attempts
                      }
                    } else {
                      // Standard iOS (not PWA) cleanup
                      setTimeout(() => {
                        try {
                          const SpeechRecognition = 
                            (window as any).SpeechRecognition || 
                            (window as any).webkitSpeechRecognition;
                          if (SpeechRecognition) {
                            const tempRecognition = new SpeechRecognition();
                            tempRecognition.abort(); // Immediately abort to force cleanup
                            debug('iOS: Created and aborted temp recognition for cleanup', 'ios');
                          }
                        } catch (e) {
                          debug(`iOS: Error creating temp recognition: ${e}`, 'ios');
                        }
                      }, 50);
                    }
                    
                    debug('iOS: Immediate cleanup completed', 'ios');
                  } catch (e) {
                    debug(`iOS: Error in aggressive cleanup: ${e}`, 'ios');
                  }
                }
                
                // Set listening to false and use cleanup - but don't double cleanup
                setIsListening(false);
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
                      
                      // iOS-specific aggressive microphone cleanup for interim results
                      if (recognitionRef.current) {
                        debug('iOS: Aggressive cleanup for interim transcript', 'ios');
                        try {
                          // iOS Safari workaround: set continuous to false and stop
                          recognitionRef.current.continuous = false;
                          recognitionRef.current.stop();
                          recognitionRef.current.abort();
                          
                          // Additional iOS fix: nullify the reference immediately
                          const oldRecognition = recognitionRef.current;
                          recognitionRef.current = null;
                          
                          // For PWA mode on iOS, we need extra cleanup
                          if (isPWA) {
                            debug('iOS PWA: Extra cleanup for interim transcript', 'ios');
                            
                            // Directly release any active media tracks
                            if (micStreamRef.current) {
                              try {
                                const tracks = micStreamRef.current.getTracks();
                                tracks.forEach(track => track.stop());
                                debug(`iOS PWA: Stopped ${tracks.length} media tracks for interim`, 'ios');
                                micStreamRef.current = null;
                              } catch (e) {
                                debug(`iOS PWA: Error stopping media tracks for interim: ${e}`, 'ios');
                              }
                            }
                            
                            // For PWA, create multiple temp instances to force iOS to release the mic
                            for (let i = 0; i < 3; i++) {
                              setTimeout(() => {
                                try {
                                  const SpeechRecognition = 
                                    (window as any).SpeechRecognition || 
                                    (window as any).webkitSpeechRecognition;
                                  if (SpeechRecognition) {
                                    const tempRecognition = new SpeechRecognition();
                                    tempRecognition.abort();
                                    debug(`iOS PWA: Created and aborted temp recognition ${i+1} for interim`, 'ios');
                                  }
                                } catch (e) {
                                  debug(`iOS PWA: Error creating temp recognition ${i+1} for interim: ${e}`, 'ios');
                                }
                              }, i * 100); // Stagger cleanup attempts
                            }
                          } else {
                            // Standard iOS (not PWA) cleanup
                            setTimeout(() => {
                              try {
                                const SpeechRecognition = 
                                  (window as any).SpeechRecognition || 
                                  (window as any).webkitSpeechRecognition;
                                if (SpeechRecognition) {
                                  const tempRecognition = new SpeechRecognition();
                                  tempRecognition.abort();
                                  debug('iOS: Created and aborted temp recognition for interim cleanup', 'ios');
                                }
                              } catch (e) {
                                debug(`iOS: Error creating interim temp recognition: ${e}`, 'ios');
                              }
                            }, 50);
                          }
                          
                          debug('iOS: Interim cleanup completed', 'ios');
                        } catch (e) {
                          debug(`iOS: Error in interim aggressive cleanup: ${e}`, 'ios');
                        }
                      }
                      
                      // Set listening to false - don't double cleanup
                      setIsListening(false);
                    }
                  }
                }, 1500); // Increased delay for iOS - 1.5 seconds to allow more speech
              }
            } catch (err) {
              debug(`Error processing speech results: ${err}`, 'error');
              
              // Fallback for any errors in result processing
              if (interimTranscript || bestAlternative) {
                const fallbackText = interimTranscript || bestAlternative;
                debug(`Using fallback text due to error: ${fallbackText}`, 'recovery');
                onResult(fallbackText.trim());
                // Use enhanced cleanup for fallback scenario
                forceStopRecognition();
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
            
            // iOS-specific microphone cleanup on end event
            if (iosDetected) {
              debug('iOS: Recognition ended - forcing microphone cleanup', 'ios');
              setIsListening(false);
              
              // Additional aggressive cleanup for iOS
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.continuous = false;
                  recognitionRef.current.abort();
                  debug('iOS: Final abort call on end event', 'ios');
                } catch (e) {
                  debug(`iOS: Error in end event cleanup: ${e}`, 'ios');
                }
              }
              
              // PWA-specific extra cleanup on end event
              if (isPWA) {
                debug('iOS PWA: Extra cleanup on recognition end event', 'ios');
                
                // Direct cleanup of any media tracks
                if (micStreamRef.current) {
                  try {
                    const tracks = micStreamRef.current.getTracks();
                    tracks.forEach(track => track.stop());
                    debug(`iOS PWA: Stopped ${tracks.length} media tracks on end event`, 'ios');
                    micStreamRef.current = null;
                  } catch (e) {
                    debug(`iOS PWA: Error stopping media tracks on end: ${e}`, 'ios');
                  }
                }
                
                // Create multiple cleanup instances with a delay between them
                for (let i = 0; i < 3; i++) {
                  setTimeout(() => {
                    try {
                      const SpeechRecognition = 
                        (window as any).SpeechRecognition || 
                        (window as any).webkitSpeechRecognition;
                      if (SpeechRecognition) {
                        const tempRecognition = new SpeechRecognition();
                        tempRecognition.abort();
                        debug(`iOS PWA: End event - created and aborted temp recognition ${i+1}`, 'ios');
                      }
                    } catch (e) {
                      debug(`iOS PWA: End event - error creating temp recognition ${i+1}: ${e}`, 'ios');
                    }
                  }, i * 150); // Longer staggered delay for end event
                }
                
                // Final forced cleanup attempt after all other attempts
                setTimeout(() => {
                  // Try to get and immediately release a new stream as a final cleanup step
                  navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                      debug('iOS PWA: Final cleanup - got new audio stream', 'ios');
                      stream.getTracks().forEach(track => {
                        track.stop();
                        debug(`iOS PWA: Final cleanup - stopped track ${track.id}`, 'ios');
                      });
                    })
                    .catch(e => {
                      debug(`iOS PWA: Final cleanup - error getting audio stream: ${e}`, 'ios');
                    });
                }, 500);
              }
            }
            
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
          // Use enhanced cleanup on unmount
          if (isListening) {
            forceStopRecognition();
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
      // iOS-specific aggressive stop when user taps to cancel
      if (iosDetected && recognitionRef.current) {
        debug('iOS: User manually stopping - aggressive cleanup', 'ios');
        try {
          // iOS Safari workaround: set continuous to false and stop
          recognitionRef.current.continuous = false;
          recognitionRef.current.stop();
          recognitionRef.current.abort();
          
          // Additional iOS fix: nullify the reference immediately
          const oldRecognition = recognitionRef.current;
          recognitionRef.current = null;
          
          // PWA-specific extra cleanup
          if (isPWA) {
            debug('iOS PWA: Extra aggressive cleanup for manual stop', 'ios');
            
            // Directly stop any active media tracks
            if (micStreamRef.current) {
              try {
                const tracks = micStreamRef.current.getTracks();
                tracks.forEach(track => track.stop());
                debug(`iOS PWA: Manually stopped ${tracks.length} media tracks`, 'ios');
                micStreamRef.current = null;
              } catch (e) {
                debug(`iOS PWA: Error stopping media tracks on manual stop: ${e}`, 'ios');
              }
            }
            
            // Create multiple instances to force iOS to release the microphone
            for (let i = 0; i < 3; i++) {
              setTimeout(() => {
                try {
                  const SpeechRecognition = 
                    (window as any).SpeechRecognition || 
                    (window as any).webkitSpeechRecognition;
                  if (SpeechRecognition) {
                    const tempRecognition = new SpeechRecognition();
                    tempRecognition.abort();
                    debug(`iOS PWA: Manual stop - created and aborted temp recognition ${i+1}`, 'ios');
                  }
                } catch (e) {
                  debug(`iOS PWA: Manual stop - error creating temp recognition ${i+1}: ${e}`, 'ios');
                }
              }, i * 100); // Stagger cleanup attempts
            }
          } else {
            // Standard iOS (not PWA) cleanup
            setTimeout(() => {
              try {
                const SpeechRecognition = 
                  (window as any).SpeechRecognition || 
                  (window as any).webkitSpeechRecognition;
                if (SpeechRecognition) {
                  const tempRecognition = new SpeechRecognition();
                  tempRecognition.abort();
                  debug('iOS: Created and aborted temp recognition for manual stop', 'ios');
                }
              } catch (e) {
                debug(`iOS: Error creating manual temp recognition: ${e}`, 'ios');
              }
            }, 50);
          }
          
          debug('iOS: Manual stop cleanup completed', 'ios');
        } catch (e) {
          debug(`iOS: Error in manual stop aggressive cleanup: ${e}`, 'ios');
        }
      }
      
      // Set listening to false and return - don't call forceStopRecognition again
      setIsListening(false);
      return;
    }
    
    // Show immediate feedback when user taps microphone
    addToast({
      title: 'Preparing microphone...',
      description: 'Setting up voice search',
      variant: 'default',
      duration: 2000
    });
    
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
          // Store the stream for PWA mode to help with cleanup
          if (iosDetected && isPWA) {
            debug('iOS PWA: Getting and storing microphone stream for better cleanup', 'ios');
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              } 
            });
            
            // Store the stream for later cleanup
            micStreamRef.current = stream;
            debug(`iOS PWA: Got microphone stream with ${stream.getTracks().length} tracks`, 'ios');
            
            // Don't stop the stream - we'll use it for recognition and stop it when done
          } else {
            // For non-PWA mode, get and immediately release the stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            debug('Microphone permission granted via getUserMedia', 'permission');
          }
        } catch (permError) {
          debug(`getUserMedia permission error: ${permError}`, 'error');
          // Continue anyway, the speech recognition API will handle its own permissions
        }
      }
      
      // Start speech recognition with iOS-specific handling
      debug('Starting speech recognition...', 'event');
      
      if (isIOS) {
        debug('iOS: Starting speech recognition with special handling', 'ios');
        
        // iOS Safari needs simpler approach - don't over-complicate
        try {
          // Simple start for iOS
          recognitionRef.current?.start();
          debug('iOS: Recognition start called successfully', 'ios');
        } catch (iosStartError) {
          debug(`iOS start error: ${iosStartError}`, 'error');
          addToast({
            title: 'Speech Recognition Failed',
            description: 'Could not start speech recognition. Please try again.',
            variant: 'destructive'
          });
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
