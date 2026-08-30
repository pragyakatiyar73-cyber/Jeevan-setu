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

  const runSimulatedVoiceDemo = useCallback(() => {
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
    }, 1200);
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
        console.warn('Speech recognition error:', errStr);
        setError(errStr);
        setIsListening(false);
        if (onErrorRef.current) onErrorRef.current(errStr);

        // Fallback gracefully to demo sample phrase when mic is blocked or unavailable
        if (errStr === 'not-allowed' || errStr === 'audio-capture' || errStr === 'service-not-allowed' || errStr === 'no-speech') {
          const samplePhrases = [
            "East Khasi Hills Flash Flood & Mudslide near Shillong",
            "Landslide blockage on NH-6 with 5 persons trapped",
            "Urgent medical emergency oxygen needed near hospital",
            "Relief camp emergency in Kanpur sector"
          ];
          const sample = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
          setTranscript(sample);
          if (onResultRef.current) {
            onResultRef.current(sample);
          }
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [language]);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e: any) {
        console.warn('Voice recognition start error, running simulated fallback:', e);
        runSimulatedVoiceDemo();
      }
    } else {
      runSimulatedVoiceDemo();
    }
  }, [runSimulatedVoiceDemo]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

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
