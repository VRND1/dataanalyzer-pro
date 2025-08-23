import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Search, Loader, MessageSquare, Mic, MicOff, X, Globe, AlertCircle, Check, Volume2 } from 'lucide-react';

// Extend Window interface to include SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

type SpeechRecognition = any;

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
}

interface SpeechRecognitionError extends Event {
  error: string;
  message?: string;
}

interface NLQueryInputProps {
  onQuery: (query: string) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
  className?: string;
  enableVoice?: boolean;
  onClear?: () => void;
  defaultLanguage?: string;
  recognitionTimeout?: number;
  maxLength?: number;
  suggestions?: string[];
  showWordCount?: boolean;
  autoFocus?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
];

const DEFAULT_SUGGESTIONS = [
  "Show me sales data for last quarter",
  "What are the top performing products?",
  "Compare revenue by region",
  "Analyze customer satisfaction trends"
];

export function NLQueryInput({
  onQuery,
  isLoading,
  placeholder = "Ask a question about your data...",
  className = "",
  enableVoice = true,
  onClear,
  defaultLanguage = 'en-US',
  recognitionTimeout = 15000,
  maxLength = 500,
  suggestions = DEFAULT_SUGGESTIONS,
  showWordCount = true,
  autoFocus = true,
}: NLQueryInputProps) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [recognitionSuccess, setRecognitionSuccess] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check speech recognition support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSpeechSupported(!!SpeechRecognition);
  }, []);

  // Auto-focus input
  useEffect(() => {
    if (autoFocus && !isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, autoFocus]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLanguageMenu || showSuggestions) {
        const target = event.target as Element;
        if (!target.closest('.language-menu') && !target.closest('.suggestions-menu')) {
          setShowLanguageMenu(false);
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageMenu, showSuggestions]);

  const handleSubmit = async (submitQuery?: string) => {
    const queryToSubmit = submitQuery || query;
    if (!queryToSubmit.trim() || isLoading || queryToSubmit.length > maxLength) return;
    
    try {
      await onQuery(queryToSubmit.trim());
      setQuery('');
      setShowSuggestions(false);
    } catch (error) {
      console.error('Query submission failed:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowLanguageMenu(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setQuery(value);
      setShowSuggestions(value.length === 0 && suggestions.length > 0);
    }
  };

  const handleClear = () => {
    setQuery('');
    setRecognitionError(null);
    setRecognitionSuccess(false);
    onClear?.();
    inputRef.current?.focus();
    setShowSuggestions(suggestions.length > 0);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const showSuccessMessage = () => {
    setRecognitionSuccess(true);
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    successTimeoutRef.current = setTimeout(() => {
      setRecognitionSuccess(false);
    }, 2000);
  };

  const toggleVoiceRecognition = () => {
    if (!enableVoice || !isSpeechSupported) return;

    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setRecognitionError("Speech recognition not supported in this browser");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;
      
      recognition.onstart = () => {
        setIsListening(true);
        setIsRecording(true);
        setRecognitionError(null);
        setRecognitionSuccess(false);
        setShowSuggestions(false);
        
        timeoutRef.current = setTimeout(() => {
          stopVoiceRecognition();
          setRecognitionError('Voice recognition timed out');
        }, recognitionTimeout);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          setQuery(transcript);
          showSuccessMessage();
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        }
      };

      recognition.onerror = (event: Event) => {
        const errorEvent = event as SpeechRecognitionError;
        console.error('Speech recognition error:', errorEvent.error);
        setIsListening(false);
        setIsRecording(false);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        const errorMessages: Record<string, string> = {
          'no-speech': 'No speech detected. Please try again.',
          'audio-capture': 'Microphone not found. Check your microphone connection.',
          'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
          'network': 'Network error. Please check your connection.',
          'aborted': 'Speech recognition was stopped.',
        };
        
        setRecognitionError(errorMessages[errorEvent.error] || 'Voice recognition failed. Please try again.');
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsRecording(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setRecognitionError('Failed to start voice recognition');
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsListening(false);
    setIsRecording(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const wordCount = query.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isOverLimit = query.length > maxLength;
  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="relative flex items-center">
          <MessageSquare className="absolute left-4 w-5 h-5 text-gray-400 z-10" />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(query.length === 0 && suggestions.length > 0)}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={maxLength}
            className={`w-full pl-12 pr-20 py-4 bg-white border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 text-base ${
              isOverLimit ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
            } ${isRecording ? 'ring-2 ring-red-200 border-red-300' : ''}`}
            aria-label="Natural language query input"
            aria-describedby={recognitionError ? 'error-message' : undefined}
          />
          
          <div className="absolute right-3 flex items-center space-x-1">
            {query && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                aria-label="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {enableVoice && isSpeechSupported && (
              <>
                <button
                  type="button"
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all relative language-menu"
                  aria-label={`Current language: ${currentLang?.name}`}
                  title={`Current language: ${currentLang?.name}`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 text-xs">
                    {currentLang?.flag}
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={toggleVoiceRecognition}
                  disabled={isLoading}
                  className={`p-2 rounded-lg transition-all relative ${
                    isListening 
                      ? 'text-red-500 bg-red-50 animate-pulse' 
                      : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  aria-label={isListening ? "Stop listening" : "Start voice input"}
                  title={isListening ? "Click to stop listening" : "Click to start voice input"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isRecording && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                  )}
                </button>
              </>
            )}
            
            <button
              type="submit"
              disabled={!query.trim() || isLoading || isOverLimit}
              onClick={() => handleSubmit()}
              className={`p-2 rounded-lg transition-all ${
                !query.trim() || isLoading || isOverLimit
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              }`}
              aria-label="Submit query"
              title="Submit query (Enter)"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        
        {/* Language Selection Menu */}
        {showLanguageMenu && enableVoice && isSpeechSupported && (
          <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 language-menu">
            <div className="py-2 max-h-64 overflow-y-auto min-w-48">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                Select Language
              </div>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang.code);
                    setShowLanguageMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
                    selectedLanguage === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm">{lang.name}</span>
                  {selectedLanguage === lang.code && <Check className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Suggestions Menu */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 suggestions-menu">
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                Try asking...
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Status Messages and Info */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <span className="text-gray-500">Press Enter to submit • Esc to close menus</span>
          {enableVoice && isSpeechSupported && (
            <span className="text-gray-500">• {currentLang?.flag} {currentLang?.name}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {showWordCount && query.trim() && (
            <span className="text-gray-500">
              {wordCount} word{wordCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className={`${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
            {query.length}/{maxLength}
          </span>
        </div>
      </div>
      
      {/* Status Messages */}
      <div className="mt-2 min-h-[20px]">
        {isListening && (
          <div className="flex items-center space-x-2 text-blue-600">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Listening... Speak now</span>
          </div>
        )}
        
        {recognitionSuccess && (
          <div className="flex items-center space-x-2 text-green-600">
            <Check className="w-4 h-4" />
            <span className="text-sm">Voice input captured successfully!</span>
          </div>
        )}
        
        {recognitionError && (
          <div className="flex items-center space-x-2 text-red-600" id="error-message">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{recognitionError}</span>
          </div>
        )}
        
        {!enableVoice && (
          <div className="text-xs text-gray-400">
            Voice input is disabled
          </div>
        )}
        
        {enableVoice && !isSpeechSupported && (
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Voice input not supported in this browser</span>
          </div>
        )}
      </div>
    </div>
  );
} 