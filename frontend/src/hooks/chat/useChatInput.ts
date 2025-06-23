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
    let interimText = '';
    let lastFinalResult = '';
    let pauseTimer: number | null = null;
    let resultIndex = 0;
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    const processSpeechResult = (transcript: string, isFinal: boolean) => {
      // Clean and normalize the transcript
      const cleanTranscript = transcript.trim()
        // Remove multiple spaces
        .replace(/\s+/g, ' ')
        // Remove duplicate phrases that often occur in continuous recognition
        .replace(/\b(\w+\s+\w+)\s+\1\b/g, '$1')
        .trim();

      if (isFinal) {
        // Avoid duplicating the last final result
        if (cleanTranscript !== lastFinalResult) {
          // If the new transcript starts with the end of the last one, trim the overlap
          if (lastFinalResult && cleanTranscript.startsWith(lastFinalResult)) {
            accumulatedText = cleanTranscript;
          } else {
            // Append new text with proper spacing
            accumulatedText = accumulatedText
              ? accumulatedText + (accumulatedText.endsWith('.') ? ' ' : '. ') + cleanTranscript
              : cleanTranscript;
          }
          lastFinalResult = cleanTranscript;
          console.log('🎤 Final:', cleanTranscript);
          console.log('🎤 Accumulated:', accumulatedText);
        }
      } else {
        interimText = cleanTranscript;
        console.log('🎤 Speaking...:', interimText);
      }
    };

    const resetPauseTimer = () => {
      if (pauseTimer) {
        window.clearTimeout(pauseTimer);
      }
      pauseTimer = window.setTimeout(() => {
        if (accumulatedText.trim()) {
          // Smart text processing before insertion
          const processedText = accumulatedText
            // Remove any duplicate phrases that might have slipped through
            .replace(/\b(\w+(?:\s+\w+){0,3})\s+\1\b/g, '$1')
            // Ensure proper sentence structure
            .replace(/\b([.!?])\s+([a-z])/g, (_, punct, letter) => punct + ' ' + letter.toUpperCase())
            .trim();

          insertAtCursor(processedText, Boolean(salespersonInput.trim()));
          accumulatedText = '';
          lastFinalResult = '';
          resultIndex = 0;
        }
        try {
          recognition.start();
        } catch (e) {
          // Ignore errors about recognition already started
        }
      }, 1500);
    };

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      onVoiceStateChange?.();
      accumulatedText = '';
      interimText = '';
      lastFinalResult = '';
      resultIndex = 0;
    };

    recognition.onresult = (event: any) => {
      resetPauseTimer();
      
      for (let i = resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        processSpeechResult(transcript, event.results[i].isFinal);
        if (event.results[i].isFinal) {
          resultIndex = i + 1;
        }
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
    };

    recognition.onend = () => {
      if (!recognitionRef.current) {
        if (pauseTimer) {
          window.clearTimeout(pauseTimer);
        }
        if (accumulatedText.trim()) {
          const processedText = accumulatedText
            .replace(/\b(\w+(?:\s+\w+){0,3})\s+\1\b/g, '$1')
            .replace(/\b([.!?])\s+([a-z])/g, (_, punct, letter) => punct + ' ' + letter.toUpperCase())
            .trim();
          insertAtCursor(processedText, Boolean(salespersonInput.trim()));
        }
        onVoiceStateChange?.();
      } else {
        try {
          recognition.start();
        } catch (e) {
          // Ignore errors about recognition already started
        }
      }
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
