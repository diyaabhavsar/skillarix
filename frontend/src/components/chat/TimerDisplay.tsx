import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  time: string;
  isActive: boolean;
  timeLeft: number;
  totalTime: number;
}

export const TimerDisplay = memo(({ time, isActive, timeLeft, totalTime }: TimerDisplayProps) => {
  const progress = (timeLeft / totalTime) * 100;
  const isLowTime = timeLeft <= 60; // Last minute
  const isVeryLowTime = timeLeft <= 30; // Last 30 seconds
  const isCriticalTime = timeLeft <= 10; // Last 10 seconds

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 px-5 py-3 rounded-full",
        "bg-background/90 backdrop-blur shadow-md border transition-all duration-300",
        isLowTime && "border-red-400",
        isVeryLowTime && "border-red-500 scale-105",
        isCriticalTime && "border-red-600 scale-110"
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isLowTime ? "warning" : "normal"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="relative"
        >
          <Clock 
            className={cn(
              "w-5 h-5 transition-colors duration-300",
              isLowTime ? "text-red-500" : "text-gray-500",
              isVeryLowTime && "text-red-600",
              isCriticalTime && "text-red-700"
            )}
          />
          {isLowTime && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500/20"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-1.5">
        <span
          className={cn(
            "text-sm font-semibold tracking-wide transition-colors duration-300",
            isLowTime ? "text-red-500" : "text-gray-700",
            isVeryLowTime && "text-red-600 font-bold",
            isCriticalTime && "text-red-700"
          )}
        >
          {time}
        </span>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full transition-colors duration-300",
              isLowTime ? "bg-red-500" : "bg-blue-500",
              isVeryLowTime && "bg-red-600",
              isCriticalTime && "bg-red-700"
            )}
            initial={{ width: "100%" }}
            animate={{ 
              width: `${progress}%`,
              transition: {
                duration: 1,
                ease: "linear"
              }
            }}
            style={{
              boxShadow: isLowTime ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
            }}
          />
        </div>
      </div>

      {isLowTime && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -right-1 -top-1"
        >
          <span className={cn(
            "px-2 py-0.5 text-xs font-bold rounded-full",
            "bg-red-500 text-white shadow-lg",
            isVeryLowTime && "bg-red-600",
            isCriticalTime && "bg-red-700"
          )}>
            {timeLeft}s
          </span>
        </motion.div>
      )}
    </motion.div>
  );
});

TimerDisplay.displayName = "TimerDisplay";
