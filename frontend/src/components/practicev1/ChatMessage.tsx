import React from "react";

interface ChatMessageProps {
  text: string;
  source: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ text, source }) => (
  <div
    className={`flex ${source === "user" ? "justify-end" : "justify-start"}`}
  >
    <span
      className={`inline-block px-4 py-2 rounded-lg max-w-[70%] break-words shadow ${
        source === "user"
          ? "bg-blue-500 text-white"
          : "bg-gray-200 text-gray-900"
      }`}
    >
      {text}
    </span>
  </div>
);

export default ChatMessage;
