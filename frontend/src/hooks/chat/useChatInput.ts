import { useCallback, useRef, useState } from 'react';
import { GrammarlyEditorPlugin } from "@grammarly/editor-sdk-react";
import React from 'react';

interface UseChatInputProps {
  onSalespersonInputChange: (value: string) => void;
  onSendResponse: () => void;
  onVoiceStateChange?: () => void;
  salespersonInput: string;
}

interface UseChatInputReturn {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleVoiceInput: () => void;
  handleCursorChange: () => void;
  cleanup: () => void;
  isVoiceActive: boolean;
  GrammarlyWrapper: React.FC<{ children: React.ReactNode }>;
}

export const useChatInput = ({
  onSalespersonInputChange,
  onSendResponse,
  onVoiceStateChange,
  salespersonInput,
}: UseChatInputProps): UseChatInputReturn => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const recognitionRef = useRef<any>(null);
  // Enhance text with proper capitalization and punctuation
  const enhanceText = useCallback((text: string): string => {
    if (!text) return '';
    const trimmed = text.trim();
    // Capitalize the first letter
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    // Ensure it ends with a period if it doesn't already end with punctuation
    const endsWithPunctuation = /[.?!]$/.test(capitalized);
    return endsWithPunctuation ? capitalized : capitalized + '.';
  }, []);

  // Format and combine text segments

  // Text input handling
  const animateTextareaScroll = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      requestAnimationFrame(() => {
        textarea.scroll({
          top: textarea.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  }, []);  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Only update the raw input value, don't enhance during typing
    onSalespersonInputChange(e.target.value);
    animateTextareaScroll();
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  }, [onSalespersonInputChange, animateTextareaScroll]);
  const handleSend = useCallback(() => {
    // Only enhance text when sending
    const enhancedText = enhanceText(salespersonInput.trim());
    
    if (enhancedText) {
      onSendResponse();
    }
  }, [salespersonInput, onSendResponse, enhanceText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && salespersonInput.trim()) {
      e.preventDefault();
      handleSend();
    }
  }, [salespersonInput, handleSend]);

  // Voice input handling
  const insertAtCursor = (text: string, shouldPrependSpace: boolean) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = salespersonInput.substring(0, cursorPosition);
    const textAfterCursor = salespersonInput.substring(cursorPosition);
    
    // Add a space before new text if:
    // 1. There's existing text AND
    // 2. The last character isn't a space or newline AND
    // 3. shouldPrependSpace is true
    const needsSpace = shouldPrependSpace && 
                      textBeforeCursor.length > 0 && 
                      ![' ', '\n'].includes(textBeforeCursor[textBeforeCursor.length - 1]);
    
    const spacePrefix = needsSpace ? ' ' : '';
    const newText = textBeforeCursor + spacePrefix + text + textAfterCursor;
    
    onSalespersonInputChange(newText);
    
    // Set cursor position after the inserted text
    const newPosition = cursorPosition + spacePrefix.length + text.length;
    setTimeout(() => {
      textarea.selectionStart = newPosition;
      textarea.selectionEnd = newPosition;
    }, 0);
  };
  const handleVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      // Stop current recognition
      recognitionRef.current.stop();
      recognitionRef.current = null;
      onVoiceStateChange?.();
      return;
    }

    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    let accumulatedText = '';
    let interimResult = '';
    let lastProcessedResult = '';
    let pauseTimer: number | null = null;
    let silenceStart: number | null = null;
    let isProcessing = false;
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1; // Optimize by only getting the best result
    recognition.lang = 'en-US';

    // Optimize speech recognition settings for better performance
    recognition.interimResults = true;
    recognition.continuous = true;
    
    // Smart text processing with debouncing
    const processText = (text: string) => {
      if (!text.trim() || text === lastProcessedResult) return;
      
      // Quick cleanup before processing
      text = text.trim()
        .replace(/\s+/g, ' ') // Remove extra spaces
        .replace(/(\b\w+\b)(?:\s+\1)+/g, '$1'); // Remove immediate duplicates
      
      // Check if this is a continuation of the previous text
      if (accumulatedText) {
        // Find the overlap between the new text and the existing text
        const words = accumulatedText.split(' ');
        const newWords = text.split(' ');
        const overlapIndex = findOverlap(words, newWords);
        
        if (overlapIndex > 0) {
          // Merge with overlap
          text = [...words.slice(0, overlapIndex), ...newWords].join(' ');
        } else {
          // Append with proper spacing
          text = accumulatedText + (accumulatedText.endsWith('.') ? ' ' : '. ') + text;
        }
      }
      
      lastProcessedResult = text;
      accumulatedText = text;
    };

    // Helper function to find overlap between old and new text
    const findOverlap = (oldWords: string[], newWords: string[]): number => {
      const maxOverlap = Math.min(oldWords.length, newWords.length);
      for (let i = 1; i <= maxOverlap; i++) {
        const oldSlice = oldWords.slice(-i).join(' ').toLowerCase();
        const newSlice = newWords.slice(0, i).join(' ').toLowerCase();
        if (oldSlice === newSlice) return oldWords.length - i;
      }
      return 0;
    };

    // Smart pause detection with dynamic timing
    const resetPauseTimer = () => {
      if (pauseTimer) {
        window.clearTimeout(pauseTimer);
      }
      if (silenceStart === null) {
        silenceStart = Date.now();
      }

      const silenceDuration = Date.now() - silenceStart;
      const pauseThreshold = Math.min(1500, Math.max(500, silenceDuration * 0.5));

      pauseTimer = window.setTimeout(() => {
        if (accumulatedText.trim() && !isProcessing) {
          isProcessing = true;
          insertAtCursor(accumulatedText.trim(), Boolean(salespersonInput.trim()));
          accumulatedText = '';
          lastProcessedResult = '';
          silenceStart = null;
          isProcessing = false;
        }
        
        try {
          recognition.start();
        } catch (e) {
          // Ignore errors about recognition already started
        }
      }, pauseThreshold);
    };

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      onVoiceStateChange?.();
      accumulatedText = '';
      interimResult = '';
      lastProcessedResult = '';
      silenceStart = null;
      isProcessing = false;
    };

    recognition.onresult = (event: any) => {
      silenceStart = null; // Reset silence detection
      resetPauseTimer();
      
      let finalTranscript = '';
      let interimTranscript = '';
      
      // Process all results in one go
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript = transcript;
        } else {
          interimTranscript = transcript;
        }
      }

      if (finalTranscript) {
        processText(finalTranscript);
        console.log('🎤 Final:', finalTranscript);
        console.log('🎤 Accumulated:', accumulatedText);
      } else if (interimTranscript) {
        interimResult = interimTranscript;
        console.log('🎤 Speaking...:', interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (pauseTimer) {
        window.clearTimeout(pauseTimer);
      }
      if (event.error !== 'no-speech') {
        recognitionRef.current = null;
        onVoiceStateChange?.();
      }
      isProcessing = false;
    };

    recognition.onend = () => {
      if (!recognitionRef.current) {
        if (pauseTimer) {
          window.clearTimeout(pauseTimer);
        }
        if (accumulatedText.trim() && !isProcessing) {
          insertAtCursor(accumulatedText.trim(), Boolean(salespersonInput.trim()));
        }
        onVoiceStateChange?.();
      } else {
        try {
          recognition.start();
        } catch (e) {
          // Ignore errors about recognition already started
        }
      }
      isProcessing = false;
    };

    recognition.start();
  }, [insertAtCursor, onVoiceStateChange, salespersonInput]);

  const handleCursorChange = useCallback(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const GrammarlyWrapper: React.FC<{ children: React.ReactNode }> = useCallback(({ children }) => {
    return React.createElement(GrammarlyEditorPlugin, 
      { clientId: "client_XXXXXXXXXXXXXXX", children }, 
    );
  }, []);

  return {
    textareaRef,
    handleInput,
    handleKeyDown,
    handleVoiceInput,
    handleCursorChange,
    cleanup,
    isVoiceActive: Boolean(recognitionRef.current),
    GrammarlyWrapper,
  };
};
