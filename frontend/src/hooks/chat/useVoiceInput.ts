import { useCallback, useRef, useState } from 'react';
import { enhanceText } from '@/utils/text/textEnhancer';

interface UseVoiceInputProps {
  onSalespersonInputChange: (value: string) => void;
  onVoiceInput: () => void;
  cursorPosition: number;
  currentText: string;
}

export const useVoiceInput = ({
  onSalespersonInputChange,
  onVoiceInput,
  cursorPosition,
  currentText,
}: UseVoiceInputProps) => {
  const insertAtCursor = useCallback((insertText: string) => {
    const enhanced = enhanceText(insertText);
    const before = currentText.substring(0, cursorPosition);
    const after = currentText.substring(cursorPosition);
    
    const newText = `${before}${enhanced} ${after}`;
    onSalespersonInputChange(newText);
    
    return { newPosition: cursorPosition + enhanced.length + 1 };
  }, [cursorPosition, currentText, onSalespersonInputChange]);

  const handleVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      onVoiceInput(); // This will toggle isRecording state
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      insertAtCursor(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      onVoiceInput(); // Turn off recording state
    };

    recognition.onend = () => {
      onVoiceInput(); // Turn off recording state
    };

    recognition.start();
  }, [insertAtCursor, onVoiceInput]);

  return {
    handleVoiceInput,
    insertAtCursor,
  };
};
