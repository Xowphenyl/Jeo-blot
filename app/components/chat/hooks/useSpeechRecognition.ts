import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAudioLevel } from './useAudioLevel';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface Language {
  code: string;
  name: string;
  local: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English (US)', local: 'English' },
  { code: 'en-GB', name: 'English (UK)', local: 'English' },
  { code: 'es-ES', name: 'Spanish', local: 'Español' },
  { code: 'fr-FR', name: 'French', local: 'Français' },
  { code: 'de-DE', name: 'German', local: 'Deutsch' },
  { code: 'it-IT', name: 'Italian', local: 'Italiano' },
  { code: 'pt-BR', name: 'Portuguese', local: 'Português' },
  { code: 'ru-RU', name: 'Russian', local: 'Русский' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', local: '简体中文' },
  { code: 'ja-JP', name: 'Japanese', local: '日本語' },
  { code: 'ko-KR', name: 'Korean', local: '한국어' },
  { code: 'hi-IN', name: 'Hindi', local: 'हिन्दी' },
];

interface UseSpeechRecognitionProps {
  onTranscriptChange: (transcript: string) => void;
  language?: string;
  onLanguageNotSupported?: (language: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export const useSpeechRecognition = ({
  onTranscriptChange,
  language = 'en-US',
  onLanguageNotSupported,
  continuous = true,
  interimResults = true,
  maxAlternatives = 1,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Try to get saved language from localStorage, fallback to prop
    const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('speechRecognitionLanguage') : null;
    return savedLanguage || language;
  });
  const { audioLevel, startMonitoring, stopMonitoring } = useAudioLevel();

  // Save language to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('speechRecognitionLanguage', currentLanguage);
    }
  }, [currentLanguage]);

  const checkPermission = useCallback(async () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setPermissionState('unsupported');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionState(result.state as PermissionState);

      result.addEventListener('change', () => {
        setPermissionState(result.state as PermissionState);
      });
    } catch (error) {
      console.error('Failed to query microphone permission:', error);
      setPermissionState('prompt');
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (speechRecognition) {
      const recognition = new speechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = maxAlternatives;
      recognition.lang = currentLanguage;

      recognition.onstart = async () => {
        setIsListening(true);

        // Start audio monitoring immediately when recognition starts
        await startMonitoring();
        toast.success('Voice recognition started');
      };

      recognition.onend = () => {
        setIsListening(false);

        // Stop audio monitoring when recognition ends
        stopMonitoring();
        toast.info('Voice recognition ended');
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);

        // Make sure to stop monitoring on error
        stopMonitoring();

        switch (event.error) {
          case 'network':
            toast.error('Network error occurred. Please check your connection.');
            break;
          case 'not-allowed':
            setPermissionState('denied');
            toast.error('Microphone access denied. Please enable microphone access in your browser settings.');
            break;
          case 'no-speech':
            toast.error('No speech detected. Please try again.');
            break;
          case 'language-not-supported':
            onLanguageNotSupported?.(currentLanguage);
            toast.error(`Language ${currentLanguage} is not supported.`);
            break;
          default:
            toast.error(`Error: ${event.error}`);
        }
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');

        onTranscriptChange(transcript);
      };

      setRecognition(recognition);
    }
  }, [
    currentLanguage,
    continuous,
    interimResults,
    maxAlternatives,
    onTranscriptChange,
    onLanguageNotSupported,
    startMonitoring,
    stopMonitoring,
  ]);

  const startListening = useCallback(async () => {
    if (recognition && !isListening) {
      if (permissionState === 'denied') {
        toast.error('Microphone access is denied. Please enable it in your browser settings.');
        return;
      }

      try {
        await recognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast.error('Failed to start speech recognition');
        setIsListening(false);
        stopMonitoring();
      }
    }
  }, [recognition, isListening, permissionState, stopMonitoring]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      try {
        recognition.stop();
        setIsListening(false);
        stopMonitoring();
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
        toast.error('Failed to stop speech recognition');
      }
    }
  }, [recognition, isListening, stopMonitoring]);

  const changeLanguage = useCallback(
    (newLanguage: string) => {
      if (isListening) {
        stopListening();
      }

      setCurrentLanguage(newLanguage);
    },
    [isListening, stopListening],
  );

  return {
    isListening,
    startListening,
    stopListening,
    permissionState,
    currentLanguage,
    changeLanguage,
    audioLevel,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
};
