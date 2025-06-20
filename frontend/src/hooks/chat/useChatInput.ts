import { useCallback, useRef, useState } from 'react';

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
  const insertAtCursor = useCallback((insertText: string) => {
    // Get the current text segments
    const before = salespersonInput.substring(0, cursorPosition).trim();
    const after = salespersonInput.substring(cursorPosition).trim();
      // Combine text segments without heavy formatting during input
    let newText = before;
    if (newText && !newText.endsWith(' ')) newText += ' ';
    newText += insertText.trim();
    if (after) {
      if (!newText.endsWith(' ')) newText += ' ';
      newText += after;
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
  }, [cursorPosition, salespersonInput, onSalespersonInputChange, formatText]);
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
          finalTranscript += ' ' + transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // If we have a final transcript segment, update the text
      if (finalTranscript.trim()) {
        insertAtCursor(finalTranscript);
        finalTranscript = '';
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

  return {
    textareaRef,
    handleInput,
    handleKeyDown,
    handleVoiceInput,
    handleCursorChange,
    cleanup,
    isVoiceActive: Boolean(recognitionRef.current),
  };
};
