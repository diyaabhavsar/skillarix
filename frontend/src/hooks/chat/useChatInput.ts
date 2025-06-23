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
    let interimText = '';
    let pauseTimer: number | null = null;
    let isProcessing = false;
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-US';
    
    // Simplified text processing that maintains all content
    const processText = (text: string) => {
      if (!text.trim()) return;
      
      // Clean up the text
      const cleanText = text.trim().replace(/\s+/g, ' ');
      
      // Append new text with proper spacing
      if (accumulatedText) {
        // Add appropriate punctuation and spacing
        const needsPeriod = !accumulatedText.endsWith('.') && 
                           !accumulatedText.endsWith('!') && 
                           !accumulatedText.endsWith('?');
        const punctuation = needsPeriod ? '. ' : ' ';
        accumulatedText += punctuation + cleanText;
      } else {
        // First piece of text
        accumulatedText = cleanText;
      }
      
      console.log('🎤 Final:', text);
      console.log('🎤 Accumulated:', accumulatedText);
    };

    const resetPauseTimer = () => {
      if (pauseTimer) {
        window.clearTimeout(pauseTimer);
      }

      pauseTimer = window.setTimeout(() => {
        if (accumulatedText.trim() && !isProcessing) {
          isProcessing = true;
          // Insert the accumulated text
          insertAtCursor(accumulatedText.trim(), Boolean(salespersonInput.trim()));
          isProcessing = false;
        }
        try {
          recognition.start();
        } catch (e) {
          // Ignore errors about recognition already started
        }
      }, 1000); // Reduced pause threshold for faster response
    };

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      onVoiceStateChange?.();
      // Don't reset accumulated text on start
      interimText = '';
      isProcessing = false;
    };

    recognition.onresult = (event: any) => {
      resetPauseTimer();
      
      // Get the last result
      const result = event.results[event.results.length - 1];
      
      if (result.isFinal) {
        const transcript = result[0].transcript;
        processText(transcript);
      } else {
        interimText = result[0].transcript;
        console.log('🎤 Speaking...:', interimText);
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
