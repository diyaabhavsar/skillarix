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
  const formatText = useCallback((before: string, insert: string, after: string): string => {
    const beforeText = before.trim();
    const afterText = after.trim();
    let newText = '';

    if (!beforeText) {
      // Start of text - enhance the insert text
      newText = enhanceText(insert);
    } else {
      // Check if the previous text ends with punctuation
      const endsWithPunctuation = /[.!?]$/.test(beforeText);
      
      if (endsWithPunctuation) {
        // After a complete sentence - enhance the insert text
        newText = beforeText + ' ' + enhanceText(insert);
      } else {
        // Continue the current sentence
        newText = beforeText + ' ' + insert.trim().toLowerCase();
      }
    }
    
    // Handle the text that comes after
    if (afterText) {
      // If we have text after, ensure proper separation
      const needsPunctuation = !/[.!?]$/.test(newText);
      newText += (needsPunctuation ? '. ' : ' ') + afterText;
      // Enhance the final text to ensure proper ending
      newText = enhanceText(newText);
    } else {
      // No text after, just enhance what we have
      newText = enhanceText(newText);
    }

    return newText;
  }, [enhanceText]);

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
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && salespersonInput.trim()) {
      e.preventDefault();
      // Enhance text only when sending
      const enhancedText = enhanceText(salespersonInput);
      onSalespersonInputChange(enhancedText);
      onSendResponse();
    }
  }, [salespersonInput, onSendResponse, enhanceText, onSalespersonInputChange]);

  // Voice input handling
  const insertAtCursor = useCallback((insertText: string, appendMode = false) => {
    // Get the current text segments
    const before = salespersonInput.substring(0, cursorPosition).trim();
    const after = salespersonInput.substring(cursorPosition).trim();
    
    let newText = '';
    
    if (appendMode) {
      // In append mode, add to existing text with proper spacing
      newText = salespersonInput;
      if (newText && !newText.endsWith(' ')) newText += ' ';
      newText += insertText.trim();
    } else {
      // In insert mode, handle cursor position
      newText = before;
      if (newText && !newText.endsWith(' ')) newText += ' ';
      newText += insertText.trim();
      if (after) {
        if (!newText.endsWith(' ')) newText += ' ';
        newText += after;
      }
    }
    
    // Update text and cursor position
    const newPosition = newText.length;
    onSalespersonInputChange(newText);
    setCursorPosition(newPosition);
    
    // Update cursor position in textarea
    if (textareaRef.current) {
      requestAnimationFrame(() => {
        textareaRef.current?.setSelectionRange(newPosition, newPosition);
        textareaRef.current?.focus();
      });
    }
  }, [cursorPosition, salespersonInput, onSalespersonInputChange]);
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

    let finalTranscript = '';
    let pauseTimer: number | null = null;
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    const resetPauseTimer = () => {
      if (pauseTimer) {
        window.clearTimeout(pauseTimer);
      }
      // Set a new timer for 1.5 seconds of silence
      pauseTimer = window.setTimeout(() => {
        if (finalTranscript.trim()) {
          insertAtCursor(finalTranscript);
          finalTranscript = '';
        }
        // Restart recognition to keep listening
        try {
          recognition.start();
        } catch (e) {
          // Ignore errors about recognition already started
        }
      }, 1500);
    };

    recognition.onstart = () => {
      onVoiceStateChange?.();
      finalTranscript = '';
    };

    recognition.onresult = (event: any) => {
      resetPauseTimer();
      
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Enhanced transcript processing
          let processedTranscript = transcript.trim();
          
          // Proper sentence capitalization
          processedTranscript = processedTranscript.replace(/([.!?]\s+|^)([a-z])/g, 
            (match, separator, letter) => separator + letter.toUpperCase()
          );
          
          // Fix common speech recognition issues
          processedTranscript = processedTranscript
            // Fix "I" capitalization
            .replace(/\bi\b/g, "I")
            .replace(/\bi'm\b/gi, "I'm")
            .replace(/\bi'll\b/gi, "I'll")
            .replace(/\bi've\b/gi, "I've")
            .replace(/\bi'd\b/gi, "I'd")
            // Fix common proper nouns
            .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
              word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
              word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

          // Smart punctuation handling
          if (processedTranscript && !/[.!?]$/.test(processedTranscript)) {
            // Check if it's a question
            if (/^(who|what|where|when|why|how|is|are|was|were|do|does|did|will|would|should|could|can|may|might)\b/i.test(processedTranscript)) {
              processedTranscript += '?';
            } else {
              processedTranscript += '.';
            }
          }
          
          finalTranscript += (finalTranscript ? ' ' : '') + processedTranscript;
          
          // Process and insert the final text
          // Use enhanced text processing and append mode if there's existing text
          const enhancedText = enhanceText(processedTranscript);
          insertAtCursor(enhancedText, Boolean(salespersonInput.trim()));
        } else {
          interimTranscript = transcript;
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
      // Only clear recognition if we're actually stopping (not just paused)
      if (!recognitionRef.current) {
        if (pauseTimer) {
          window.clearTimeout(pauseTimer);
        }
        onVoiceStateChange?.();
      } else {
        // Try to restart if we're still supposed to be recording
        try {
          recognition.start();
        } catch (e) {
          // Ignore errors about recognition already started
        }
      }
    };

    recognition.start();
  }, [insertAtCursor, onVoiceStateChange]);

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
