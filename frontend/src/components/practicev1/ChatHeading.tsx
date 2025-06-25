import { useProducts } from "@/hooks/useProducts";
import { useTests } from "@/hooks/useTests";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";

interface ChatHeadingProps {
  productId: string;
  testId: string;
  onBack?: () => void;
  disableBack?: boolean;
}

const ChatHeading: React.FC<ChatHeadingProps> = ({
  productId,
  testId,
  onBack,
  disableBack,
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
      {onBack && (
        <Button
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center px-4 py-2 text-white hover:text-white disabled:opacity-50"
          onClick={onBack}
          disabled={disableBack}
        >
           Back
        </Button>
      )}
      <h2 className="text-2xl font-bold text-gray-800 text-center w-full">
        {title}
      </h2>
    </div>
  );
};

export default ChatHeading;
