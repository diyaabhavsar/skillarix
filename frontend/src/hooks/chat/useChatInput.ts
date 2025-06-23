import { useCallback, useRef, useState } from "react";
import nlp from "compromise";
import React from "react";

// Compromise type augmentation
declare module "compromise" {
  interface View {
    contractions(): View;
    expand(): View;
    contract(): View;
    questions(): View;
  }
}

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
  const interimTextRef = useRef<string>('');
  const accumulatedTextRef = useRef<string>('');
  let isProcessing = false;
  let pauseTimer: number | null = null;

  // Shared text processing function
  const processText = (text: string) => {
    if (!text?.trim()) return "";

    // Remove any existing interim text from the final result
    if (interimTextRef.current && text.endsWith(interimTextRef.current)) {
      text = text.slice(0, -interimTextRef.current.length).trim();
    }

    // Process with Compromise for better grammar and formatting
    const doc = nlp(text);
    
    // Ensure proper capitalization and punctuation
    doc.sentences().forEach((sentence: any) => {
      // Capitalize first word of each sentence
      const words = sentence.text().split(' ');
      if (words.length > 0) {
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      }
      const processedSentence = words.join(' ');
      
      // Add period if no ending punctuation
      if (!sentence.has('#Period') && !sentence.has('#QuestionMark') && !sentence.has('#ExclamationMark')) {
        sentence.post('.');
      }
    });

    // Get the processed text
    let processedText = doc.text();

    // Clean up any double spaces or unnecessary whitespace
    processedText = processedText.replace(/\s+/g, ' ').trim();

    // Update accumulated text
    accumulatedTextRef.current = processedText;

    return processedText;
  };

  // Enhanced text processing using Compromise
  const enhanceText = useCallback((text: string): string => {
    if (!text) return "";

    // Process text with Compromise
    let doc = nlp(text);

    // Fix capitalization and basic grammar
    doc.sentences().forEach((sentence) => {
      sentence.toLowerCase();
      sentence.firstTerms().toTitleCase();
    });

    // Fix contractions manually since TypeScript doesn't recognize the methods
    doc.match("I am").replace("I'm");
    doc.match("you are").replace("you're");
    doc.match("they are").replace("they're");
    doc.match("we are").replace("we're");
    doc.match("it is").replace("it's");
    doc.match("that is").replace("that's");

    // Fix subject-verb agreement
    doc.match("(i|you|we|they) is").replace("$1 are");
    doc.match("(he|she|it) are").replace("$1 is");

    // Enhance greetings
    doc.match("^(hi|hello|hey)$").append(", ");
    doc.match("^(good|Good) (morning|afternoon|evening)$").append(", ");

    // Fix question marks
    doc.questions().forEach((q) => {
      if (!q.text().endsWith("?")) {
        q.append("?");
      }
    });

    // Get enhanced text
    let processed = doc.text();

    // Final cleanup
    processed = processed
      // Remove multiple spaces
      .replace(/\s+/g, " ")
      // Ensure proper spacing after punctuation
      .replace(/([.!?,;:])(\w)/g, "$1 $2")
      // Fix any remaining capitalization issues
      .replace(
        /([.!?]\s+)([a-z])/g,
        (_, punct, letter) => punct + letter.toUpperCase()
      )
      .trim();

    // Ensure proper ending punctuation
    if (!processed.match(/[.!?]$/)) {
      processed += ".";
    }

    return processed;
  }, []);

  // Text input handling
  const animateTextareaScroll = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      requestAnimationFrame(() => {
        textarea.scroll({
          top: textarea.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, []);
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      // Process the input text the same way as voice input
      if (newText.trim()) {
        processText(newText);
      }
      onSalespersonInputChange(newText);
      animateTextareaScroll();
      if (textareaRef.current) {
        setCursorPosition(textareaRef.current.selectionStart);
      }
    },
    [onSalespersonInputChange, animateTextareaScroll]
  );
  const handleSend = useCallback(() => {
    // Only enhance text when sending
    const enhancedText = enhanceText(salespersonInput.trim());

    if (enhancedText) {
      onSendResponse();
    }
  }, [salespersonInput, onSendResponse, enhanceText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && salespersonInput.trim()) {
        e.preventDefault();
        handleSend();
      }
    },
    [salespersonInput, handleSend]
  );

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
    const needsSpace =
      shouldPrependSpace &&
      textBeforeCursor.length > 0 &&
      ![" ", "\n"].includes(textBeforeCursor[textBeforeCursor.length - 1]);

    const spacePrefix = needsSpace ? " " : "";
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

    if (!("webkitSpeechRecognition" in window)) {
      console.error("Speech recognition not supported");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-US";

    const resetPauseTimer = () => {
      if (pauseTimer) {
        window.clearTimeout(pauseTimer);
      }
      pauseTimer = window.setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
      }, 3000);
    };

    recognition.onstart = () => {
      console.log("🎤 Voice recognition started");
      onVoiceStateChange?.();
      // Don't reset accumulated text on start
      isProcessing = false;
    };

    recognition.onresult = (event: any) => {
      resetPauseTimer();

      // Get the last result
      const result = event.results[event.results.length - 1];

      if (result.isFinal) {
        const transcript = result[0].transcript;
        const processedText = processText(transcript);
        if (processedText) {
          onSalespersonInputChange(processedText);
        }
      } else {
        interimTextRef.current = result[0].transcript;
        // Show interim results in textarea
        const currentText = salespersonInput || "";
        const newText = currentText + (currentText ? " " : "") + interimTextRef.current;
        onSalespersonInputChange(newText);
        console.log("🎤 Speaking...:", interimTextRef.current);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (pauseTimer) {
        window.clearTimeout(pauseTimer);
      }
      if (event.error !== "no-speech") {
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
        const processedText = accumulatedTextRef.current.trim();
        if (processedText && !isProcessing) {
          const updatedText = salespersonInput 
            ? `${salespersonInput} ${processedText}`
            : processedText;
          onSalespersonInputChange(updatedText);
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
