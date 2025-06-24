import React, { useMemo } from "react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import styles from '@/styles/score-display.module.css';

interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const sizeConfig = {
  sm: {
    strokeWidth: 2.5,
    radius: 18,
    center: 20
  },
  md: {
    strokeWidth: 3,
    radius: 24,
    center: 28
  },
  lg: {
    strokeWidth: 4,
    radius: 35,
    center: 40
  }
} as const;

const getScoreLevel = (percentage: number): 'excellent' | 'good' | 'average' | 'poor' => {
  if (percentage >= 75) return 'excellent';
  if (percentage >= 50) return 'good';
  if (percentage >= 25) return 'average';
  return 'poor';
};

interface GradientConfig {
  id: string;
  colors: string[];
  darkColors: string[];
}

const gradientConfigs: Record<ReturnType<typeof getScoreLevel>, GradientConfig> = {
  excellent: {
    id: 'excellent-gradient',
    colors: ['#4F46E5', '#7C3AED', '#2563EB', '#3B82F6'], // Indigo -> Purple -> Blue
    darkColors: ['#6366F1', '#8B5CF6', '#3B82F6', '#60A5FA'] // Light variants
  },
  good: {
    id: 'good-gradient',
    colors: ['#059669', '#10B981', '#14B8A6', '#2DD4BF'], // Emerald -> Green -> Teal
    darkColors: ['#10B981', '#34D399', '#2DD4BF', '#5EEAD4'] // Light variants
  },
  average: {
    id: 'average-gradient',
    colors: ['#D97706', '#F59E0B', '#FBBF24', '#FCD34D'], // Amber -> Yellow -> Gold
    darkColors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'] // Light variants
  },
  poor: {
    id: 'poor-gradient',
    colors: ['#DC2626', '#EF4444', '#F43F5E', '#FB7185'], // Red -> Rose
    darkColors: ['#EF4444', '#F87171', '#FB7185', '#FDA4AF'] // Light variants
  }
};

export const ScoreDisplay: React.FC<ScoreDisplayProps> = React.memo(({
  score,
  maxScore = 10,
  size = "md",
  showTooltip = true
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const { percentage, scoreDescription, scoreLevel, gradientConfig } = useMemo(() => {
    const percentage = (score / maxScore) * 100;
    const level = getScoreLevel(percentage);
    
    return {
      percentage,
      scoreLevel: level,
      scoreDescription: level.charAt(0).toUpperCase() + level.slice(1),
      gradientConfig: gradientConfigs[level]
    };
  }, [score, maxScore]);

  const dimensions = sizeConfig[size];
  
  // Create a unique ID for the gradient to prevent conflicts with multiple instances
  const uniqueGradientId = `score-gradient-${score}-${maxScore}-${size}`;

  const scoreDisplay = (
    <div 
      className={`${styles.scoreDisplay} ${styles[scoreLevel]} ${styles[size]}`}
      data-theme={isDark ? 'dark' : 'light'}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={maxScore}
      aria-valuenow={score}
      aria-label={`Score: ${score} out of ${maxScore} (${scoreDescription})`}
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={uniqueGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {(isDark ? gradientConfig.darkColors : gradientConfig.colors).map((color, index, array) => (
              <stop 
                key={index} 
                offset={`${(index / (array.length - 1)) * 100}%`} 
                stopColor={color}
              />
            ))}
          </linearGradient>
        </defs>
      </svg>
      
      <div className={`${styles.background} ${isDark ? styles.darkBg : styles.lightBg}`} />
      
      <div className={`${styles.ring} ${isDark ? styles.darkRing : styles.lightRing}`} />
      
      <div className={styles.circleContainer} aria-hidden="true">
        <svg className={styles.circleSvg} viewBox={`0 0 ${dimensions.center * 2} ${dimensions.center * 2}`}>
          <circle
            cx={dimensions.center}
            cy={dimensions.center}
            r={dimensions.radius}
            strokeWidth={dimensions.strokeWidth}
            fill="none"
            className={`${styles.circleBackground} ${isDark ? styles.darkCircle : styles.lightCircle}`}
          />
          <circle
            cx={dimensions.center}
            cy={dimensions.center}
            r={dimensions.radius}
            strokeWidth={dimensions.strokeWidth}
            fill="none"
            strokeLinecap="round"
            className={`${styles.circleProgress} ${styles[`${scoreLevel}Progress`]}`}
            strokeDasharray={`${percentage * (Math.PI * dimensions.radius * 2 / 100)} 999`}
            style={{ stroke: `url(#${uniqueGradientId})` }}
          />
        </svg>
      </div>

      <div className={styles.scoreText}>
        <span className={`${styles.score} ${styles[`${scoreLevel}Text`]}`}>
          {score}
        </span>
        <span className={`${styles.maxScore} ${isDark ? styles.darkText : styles.lightText}`}>
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
        <TooltipContent side="top">
          <p className="text-sm font-medium">{scoreDescription}</p>
          <p className="text-xs text-muted-foreground">Score: {score} out of {maxScore}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
