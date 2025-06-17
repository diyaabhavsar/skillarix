import { useCallback, useRef } from 'react';

interface UseTextInputProps {
  onSalespersonInputChange: (value: string) => void;
  onSendResponse: () => void;
  salespersonInput: string;
}

export const useTextInput = ({
  onSalespersonInputChange,
  onSendResponse,
  salespersonInput,
}: UseTextInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, []);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSalespersonInputChange(e.target.value);
    animateTextareaScroll();
  }, [onSalespersonInputChange, animateTextareaScroll]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && salespersonInput.trim()) {
      e.preventDefault();
      onSendResponse();
    }
  }, [salespersonInput, onSendResponse]);

  return {
    textareaRef,
    handleInput,
    handleKeyDown,
    animateTextareaScroll,
  };
};
