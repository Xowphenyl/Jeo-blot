import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';
import React, { useState, useCallback, forwardRef } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Popover from '@radix-ui/react-popover';
import { type PermissionState, type Language, SUPPORTED_LANGUAGES } from './hooks/useSpeechRecognition';
import { AudioLevelIndicator } from './AudioLevelIndicator';

interface SpeechRecognitionButtonProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
  permissionState: PermissionState;
  audioLevel: number;
  currentLanguage: string;
  supportedLanguages: Language[];
  onLanguageChange: (language: string) => void;
  className?: string;
}

const getTooltipContent = (permissionState: PermissionState, isListening: boolean) => {
  switch (permissionState) {
    case 'denied':
      return 'Microphone access denied. Click to learn how to enable it';
    case 'unsupported':
      return 'Speech recognition is not supported in your browser';
    case 'prompt':
      return 'Click to enable speech recognition';
    default:
      return isListening ? 'Stop listening' : 'Start speech recognition';
  }
};

const getButtonIcon = (permissionState: PermissionState, isListening: boolean) => {
  if (permissionState === 'denied') {
    return <div className="i-ph:microphone-slash text-lg text-red-500" />;
  }

  return isListening ? (
    <div className="i-ph:stop-fill text-lg text-red-500" />
  ) : (
    <div className="i-ph:microphone text-lg" />
  );
};

const handlePermissionDenied = () => {
  const isChrome = navigator.userAgent.indexOf('Chrome') > -1;
  const isFirefox = navigator.userAgent.indexOf('Firefox') > -1;

  if (isChrome) {
    window.open('chrome://settings/content/microphone');
  } else if (isFirefox) {
    window.open('about:preferences#privacy');
  } else {
    alert('Please enable microphone access in your browser settings.');
  }
};

export const SpeechRecognitionButton = forwardRef<HTMLButtonElement, SpeechRecognitionButtonProps>(
  (
    {
      isListening,
      onStart,
      onStop,
      disabled,
      permissionState,
      audioLevel,
      currentLanguage,
      supportedLanguages,
      onLanguageChange,
      className,
    },
    ref,
  ) => {
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

    const handleClick = useCallback(() => {
      if (permissionState === 'denied') {
        handlePermissionDenied();
        return;
      }

      try {
        if (isListening && typeof onStop === 'function') {
          onStop();
        } else if (!isListening && typeof onStart === 'function') {
          onStart();
        }
      } catch (error) {
        console.error('Error handling speech recognition:', error);
      }
    }, [isListening, onStart, onStop, permissionState]);

    const currentLanguageInfo = supportedLanguages.find((lang) => lang.code === currentLanguage);

    return (
      <div className="relative flex items-center gap-2">
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <IconButton
                ref={ref}
                title={getTooltipContent(permissionState, isListening)}
                disabled={disabled || permissionState === 'unsupported'}
                className={classNames(
                  'transition-all',
                  {
                    'text-bolt-elements-item-contentAccent': isListening,
                    'hover:text-bolt-elements-item-contentAccent':
                      !isListening && !disabled && permissionState !== 'denied',
                    'text-red-500 hover:text-red-600': permissionState === 'denied',
                    'opacity-50 cursor-not-allowed': permissionState === 'unsupported',
                  },
                  className,
                )}
                onClick={handleClick}
              >
                {getButtonIcon(permissionState, isListening)}
              </IconButton>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="z-50 px-2 py-1 text-sm font-medium text-white bg-gray-900 rounded-md shadow-lg"
                sideOffset={5}
              >
                {getTooltipContent(permissionState, isListening)}
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        {isListening && (
          <AudioLevelIndicator
            level={audioLevel}
            size="sm"
            className="absolute -top-4 left-1/2 transform -translate-x-1/2"
          />
        )}

        <Popover.Root open={isLanguageMenuOpen} onOpenChange={setIsLanguageMenuOpen}>
          <Popover.Trigger asChild>
            <button
              className={classNames(
                'px-2 py-1 text-xs rounded-md transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bolt-elements-item-contentAccent',
              )}
              sideOffset={5}
            >
              {currentLanguageInfo?.local || currentLanguageInfo?.name || 'Select Language'}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="z-50 w-48 p-1 bg-white rounded-md shadow-lg dark:bg-gray-800" sideOffset={5}>
              <div className="py-1 space-y-1">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    className={classNames(
                      'w-full px-2 py-1 text-sm text-left rounded-md transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700',
                      {
                        'bg-gray-100 dark:bg-gray-700': currentLanguage === lang.code,
                      },
                    )}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setIsLanguageMenuOpen(false);
                    }}
                  >
                    <span className="font-medium">{lang.name}</span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{lang.local}</span>
                  </button>
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    );
  },
);

SpeechRecognitionButton.displayName = 'SpeechRecognitionButton';
