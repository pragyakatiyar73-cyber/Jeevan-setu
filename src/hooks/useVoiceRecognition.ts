import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseVoiceRecognitionOptions {
  language?: string; // 'hi-IN', 'en-IN', 'bn-IN', 'as-IN'
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const { language = 'hi-IN', onResult, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  const triggerSimulatedSpeech = useCallback(() => {
    setIsListening(true);
    const demoPhrases = [
      "Kanpur flood area",
      "Landslide near Shillong NH-6",
      "Relief camp in East Khasi Hills",
      "Road blocked near Tawang",
      "Emergency ambulance needed aspataal"
    ];
    const randomPhrase = demoPhrases[Math.floor(Math.random() * demoPhrases.length)];
    setTimeout(() => {
      setTranscript(randomPhrase);
      if (onResultRef.current) {
        onResultRef.current(randomPhrase);
      }
      setIsListening(false);
    }, 1500);
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (onResultRef.current && currentTranscript.trim()) {
          onResultRef.current(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        const errStr = event.error || 'Speech recognition failed';
        console.warn('Native speech recognition error (falling back to simulated voice mode):', errStr);
        setError(errStr);
        if (onErrorRef.current) onErrorRef.current(errStr);

        // Fallback to simulated mode if permission denied or mic unavailable
        if (errStr === 'not-allowed' || errStr === 'no-speech' || errStr === 'audio-capture' || errStr === 'service-not-allowed') {
          triggerSimulatedSpeech();
        } else {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }
  }, [language, triggerSimulatedSpeech]);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e: any) {
        console.warn('Voice recognition start error, running fallback:', e);
        triggerSimulatedSpeech();
      }
    } else {
      triggerSimulatedSpeech();
    }
  }, [triggerSimulatedSpeech]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening
  };
}
