import { useEffect, useRef } from "react";

export function useAutoScroll(messages: any[], chatContainerRef: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, chatContainerRef]);
}
