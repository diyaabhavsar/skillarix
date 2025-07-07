import { useProducts } from "@/hooks/useProducts";
import { useTests } from "@/hooks/useTests";
import React from "react";
import { ArrowLeft, Info, Sparkles, Settings } from "lucide-react";
import { Button } from "../ui/button";

interface ChatHeadingProps {
  productId: string;
  testId: string;
  onBack?: () => void;
  disableBack?: boolean;
  onToggleDrawer?: () => void;
  onLeftDrawer?: () => void;
}

const ChatHeading: React.FC<ChatHeadingProps> = ({
  productId,
  testId,
  onBack,
  disableBack,
  onToggleDrawer,
  onLeftDrawer,
}) => {
  const { getProductName } = useProducts();
  const { getTestName } = useTests();
  const productName = getProductName(productId);
  const testName = getTestName(testId);
  const title =
    testName && productName
      ? `${testName} - ${productName} : Assessment`
      : "Assessment";
  return (
    <div className="w-full flex justify-center items-center mt-6 mb-2 relative">
      {/* Back button - right side */}
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2"
          onClick={onBack}
          disabled={disableBack}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      
      {/* Prompt drawer button - left side */}
      {onToggleDrawer && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2"
          onClick={onToggleDrawer}
          aria-label="Toggle AI prompt drawer"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      )}
      
      {/* Left drawer button - left side, further left */}
      {onLeftDrawer && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-16 top-1/2 -translate-y-1/2"
          onClick={onLeftDrawer}
          aria-label="Toggle test configuration settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      )}
      <h2 className="text-2xl font-bold text-gray-800 text-center w-full">
        {title}
      </h2>
    </div>
  );
};

export default ChatHeading;
