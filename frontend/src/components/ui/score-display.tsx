import React, { useMemo } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

type ThemeMode = "light" | "dark";
type ScoreLevel = "excellent" | "good" | "average" | "poor";

interface ColorConfig {
  gradient: string;
  ring: string;
  background: string;
  text: string;
}

const scoreColorConfig: Record<ScoreLevel, Record<ThemeMode, ColorConfig>> = {
  excellent: {
    light: {
      gradient: "from-emerald-500 to-teal-400",
      ring: "ring-emerald-500/20",
      background: "bg-emerald-50",
      text: "text-emerald-700"
    },
    dark: {
      gradient: "from-emerald-400 to-teal-300",
      ring: "ring-emerald-400/20",
      background: "bg-emerald-500/10",
      text: "text-emerald-300"
    }
  },
  good: {
    light: {
      gradient: "from-green-500 to-emerald-400",
      ring: "ring-green-500/20",
      background: "bg-green-50",
      text: "text-green-700"
    },
    dark: {
      gradient: "from-green-400 to-emerald-300",
      ring: "ring-green-400/20",
      background: "bg-green-500/10",
      text: "text-green-300"
    }
  },
  average: {
    light: {
      gradient: "from-amber-500 to-yellow-400",
      ring: "ring-amber-500/20",
      background: "bg-amber-50",
      text: "text-amber-700"
    },
    dark: {
      gradient: "from-amber-400 to-yellow-300",
      ring: "ring-amber-400/20",
      background: "bg-amber-500/10",
      text: "text-amber-300"
    }
  },
  poor: {
    light: {
      gradient: "from-red-500 to-rose-400",
      ring: "ring-red-500/20",
      background: "bg-red-50",
      text: "text-red-700"
    },
    dark: {
      gradient: "from-red-400 to-rose-300",
      ring: "ring-red-400/20",
      background: "bg-red-500/10",
      text: "text-red-300"
    }
  }
} as const;

const sizeConfig = {
  sm: {
    container: "w-10 h-10",
    scoreText: "text-sm",
    maxScoreText: "text-xs",
    strokeWidth: 3,
    radius: 18,
    center: 20
  },
  md: {
    container: "w-14 h-14",
    scoreText: "text-base",
    maxScoreText: "text-xs",
    strokeWidth: 4,
    radius: 24,
    center: 28
  },
  lg: {
    container: "w-20 h-20",
    scoreText: "text-xl",
    maxScoreText: "text-sm",
    strokeWidth: 5,
    radius: 35,
    center: 40
  }
} as const;

export const ScoreDisplay: React.FC<ScoreDisplayProps> = React.memo(({
  score,
  maxScore = 10,
  size = "md",
  showTooltip = true
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const { percentage, colorConfig, scoreDescription } = useMemo(() => {
    const percentage = (score / maxScore) * 100;
    
    let level: ScoreLevel = "poor";
    if (percentage >= 70) level = "excellent";
    else if (percentage >= 40) level = "good";
    else if (percentage >= 20) level = "average";
    
    return {
      percentage,
      colorConfig: scoreColorConfig[level][isDark ? "dark" : "light"],
      scoreDescription: level.charAt(0).toUpperCase() + level.slice(1)
    };
  }, [score, maxScore, isDark]);

  const dimensions = sizeConfig[size];
  const uniqueGradientId = `score-gradient-${score}-${size}`;
  
  const scoreDisplay = (
    <div 
      className={cn(
        "relative flex items-center justify-center group cursor-help",
        dimensions.container
      )}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={maxScore}
      aria-valuenow={score}
      aria-label={`Score: ${score} out of ${maxScore}`}
    >
      {/* Background with hover effect */}
      <div className={cn(
        "absolute inset-0 rounded-full transition-all duration-300",
        colorConfig.background,
        "group-hover:scale-110"
      )} />
      
      {/* Gradient ring */}
      <div className={cn(
        "absolute inset-[2px] rounded-full transition-all duration-300",
        colorConfig.ring,
        isDark ? "bg-slate-900" : "bg-white",
        "group-hover:ring-opacity-100"
      )} />
      
      {/* SVG Progress Circle */}
      <div className="absolute inset-0" aria-hidden="true">
        <svg className="w-full h-full -rotate-90" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={dimensions.center}
            cy={dimensions.center}
            r={dimensions.radius}
            stroke="currentColor"
            strokeWidth={dimensions.strokeWidth}
            fill="none"
            className={cn(
              "transition-all duration-500 ease-out",
              isDark ? "text-slate-800" : "text-slate-100"
            )}
          />
          <circle
            cx={dimensions.center}
            cy={dimensions.center}
            r={dimensions.radius}
            stroke={`url(#${uniqueGradientId})`}
            strokeWidth={dimensions.strokeWidth}
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            strokeDasharray={`${percentage * (Math.PI * dimensions.radius * 2 / 100)} 999`}
          />
          <defs>
            <linearGradient
              id={uniqueGradientId}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" className={colorConfig.gradient.split(' ')[0]} />
              <stop offset="100%" className={colorConfig.gradient.split(' ')[1]} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Score Text */}
      <div className="relative text-center z-10 transition-transform group-hover:scale-105">
        <span className={cn(
          dimensions.scoreText,
          "font-semibold",
          colorConfig.text
        )}>
          {score}
        </span>
        <span className={cn(
          dimensions.maxScoreText,
          "ml-0.5",
          isDark ? "text-slate-500" : "text-slate-400"
        )}>
          /{maxScore}
        </span>
      </div>
    </div>
  );

  if (!showTooltip) return scoreDisplay;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {scoreDisplay}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-sm">
          <p><span className={colorConfig.text}>{scoreDescription}</span></p>
          <p className="text-xs text-muted-foreground">Score: {score} out of {maxScore}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
