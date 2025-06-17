import { useState, useEffect, useCallback } from 'react';

interface UseAssessmentTimerProps {
  duration: number; // duration in seconds
  onTimeEnd: () => void;
}

export const useAssessmentTimer = ({ duration, onTimeEnd }: UseAssessmentTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);

  const startTimer = useCallback(() => {
    setIsActive(true);
    setTimeLeft(duration);
  }, [duration]);

  const stopTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resetTimer = useCallback(() => {
    setTimeLeft(duration);
    setIsActive(false);
  }, [duration]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            stopTimer();
            onTimeEnd();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeLeft, onTimeEnd, stopTimer]);

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
    isActive,
    startTimer,
    stopTimer,
    resetTimer,
  };
};
