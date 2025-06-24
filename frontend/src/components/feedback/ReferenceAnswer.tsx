import React, { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReferenceAnswerProps {
  text: string;
}

export const ReferenceAnswer: React.FC<ReferenceAnswerProps> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 60;
  
  if (!text) return null;

  if (text.length <= maxLength) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {!expanded ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                {text.slice(0, maxLength)}...
                <button
                  className="ml-1 text-xs text-blue-600 underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(true);
                  }}
                  tabIndex={0}
                  type="button"
                >
                  Read more
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs whitespace-pre-line">
              {text}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span>
          {text}
          <button
            className="ml-1 text-xs text-blue-600 underline"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
            tabIndex={0}
            type="button"
          >
            Show less
          </button>
        </span>
      )}
    </span>
  );
};

export default ReferenceAnswer;
