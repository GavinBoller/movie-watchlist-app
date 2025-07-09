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
            errorMessage = 'Microphone access denied. Please enable microphone permissions.';
            break;
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

  const startListening = () => {
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
    } else {
      try {
        recognitionRef.current?.start();
        addToast({
          title: 'Listening...',
          description: 'Speak now to search for movies or TV shows',
          variant: 'default'
        });
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
        addToast({
          title: 'Voice Search Error',
          description: 'Failed to start voice recognition. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={startListening}
        disabled={disabled}
        className={`
          flex items-center gap-2 transition-all duration-200
          ${isListening 
            ? 'bg-red-600 hover:bg-red-700 text-white border-red-600 animate-pulse' 
            : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={isListening ? "Click to stop listening" : "Click to start voice search"}
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            <span className="hidden sm:inline">Stop</span>
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Voice</span>
          </>
        )}
      </Button>
      
      {isListening && transcript && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Volume2 className="h-3 w-3 animate-pulse" />
          <span className="italic">"{transcript}"</span>
        </div>
      )}
    </div>
  );
}
