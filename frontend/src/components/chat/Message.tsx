import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface MessageProps {
  text: string;
  isCustomer: boolean;
}

export const Message = memo(({ text, isCustomer }: MessageProps) => (
  <div className={cn(
    "flex items-start gap-2",
    !isCustomer && "justify-end"
  )}>
    <div className="flex-1 max-w-[90%] md:max-w-[85%]">
      <div className={cn(
        "flex flex-col gap-1",
        !isCustomer && "items-end"
      )}>
        <span className={cn(
          "text-sm font-medium px-2",
          isCustomer ? "text-blue-600" : "text-green-600"
        )}>
          {isCustomer ? "Customer" : "You"}
        </span>
        <div className={cn(
          "px-6 py-4 shadow-sm rounded-2xl",
          isCustomer ? "bg-white rounded-tl-none" : "bg-green-50 rounded-tr-none"
        )}>
          {text}
        </div>
      </div>
    </div>
  </div>
));

Message.displayName = "Message";
