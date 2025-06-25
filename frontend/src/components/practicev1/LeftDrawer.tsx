import React, { useState } from "react";
import { X } from "lucide-react";
import { useTests } from "@/hooks/useTests";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/textFormatting";
import { useProducts } from "@/hooks/useProducts";
import { VISITOR_PERSONA_OPTIONS, visitorPersonaFields } from "@/data/visitPersona";
import { renderFilePreview } from "@/components/ui/filePreview";

interface LeftDrawerProps {
  open: boolean;
  onClose: () => void;
  testId: string;
}
const DRAWER_WIDTH = 400;
// const DRAWER_MIN_WIDTH = 0;

const LeftDrawer: React.FC<LeftDrawerProps> = ({
  open,
  onClose,
  testId,
}) => {
  const { fetchTestById } = useTests();
  const test = fetchTestById(testId);
  const { fetchProductById } = useProducts();
  const [showFullDescription, setShowFullDescription] = useState(false);
  // Dummy product info for demonstration; replace with real product fetch logic
  const product = fetchProductById(test?.product_id);
  // File preview logic from ProductDetails
 
  const heading=`${test?.name || "Test Configuration"} Details`
  return (
    <div
      className={`transition-all duration-300 h-full bg-white border-r shadow-lg flex flex-col relative`}
      style={{
        width: open ? DRAWER_WIDTH : 0,
        minWidth: open ? 300 : 0,
      }}
    >
      {/* Toggle button always visible when closed */}
      {!open && (
        <button
          className="absolute top-4 left-0 z-10 bg-white border rounded-r px-2 py-1 shadow"
          onClick={onClose}
          aria-label="Open Test Config Drawer"
        >
          <span className="font-bold">&#9776;</span>
        </button>
      )}
      {/* Header and close button */}
      {open && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white sticky top-0 z-10">
          <span className="font-semibold text-lg">
            {heading}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      {/* Product Information */}
      {open && (
        <div className="overflow-y-auto h-[calc(100vh-3.5rem)] p-4 space-y-6">
          {product && (
            <div className="bg-gray-50 rounded-lg shadow p-4 mb-4">
              <div className="font-semibold text-lg mb-2">Product Information</div>
              <div className="space-y-4">
                <div className="flex flex-col bg-gray-100 rounded p-2">
                  <div className="text-xs text-gray-500">Name</div>
                  <div className="text-base">{product.name}</div>
                </div>
                <div className="flex flex-col bg-gray-100 rounded p-2">
                  <div className="text-xs text-gray-500">Description</div>
                  <div className="text-sm">
                    {product.description && product.description.length > 100 && !showFullDescription ? (
                      <>
                        {product.description.slice(0, 100)}...
                        <button
                          className="text-blue-600 underline ml-1 text-s font-medium"
                          onClick={() => setShowFullDescription(true)}
                        >
                          Read more
                        </button>
                      </>
                    ) : (
                      <>
                        {product.description}
                        {product.description && product.description.length > 100 && (
                          <button
                            className="text-blue-600 underline ml-1 text-s font-medium"
                            onClick={() => setShowFullDescription(false)}
                          >
                            Show less
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {product.file_url && (
                  <div className="flex flex-col bg-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500">Attached File</div>
                    <div className="text-base">{renderFilePreview(product.file_url, product.file_name)}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Visitor Persona */}
          <div className="bg-gray-50 rounded-lg shadow p-4 mb-4">
            <div className="font-semibold text-lg mb-2">Visitor Persona</div>
            <div className="space-y-4">
              {test?.visitorPersona &&
                visitorPersonaFields.map((field) => {
                  const value = test.visitorPersona[field.key];
                  let displayValue = value;
                  // If the field has options, map value to label
                  if (VISITOR_PERSONA_OPTIONS[field.key]) {
                    const option = VISITOR_PERSONA_OPTIONS[field.key].find((opt) => opt.value === value);
                    displayValue = option ? option.label : value;
                  }
                  return (
                    <div key={field.key} className="flex flex-col bg-gray-100 rounded p-2">
                      <div className="text-xs text-gray-500">{field.label}</div>
                      <div className="text-base">{displayValue}</div>
                    </div>
                  );
                })}
            </div>
          </div>
          {/* Additional Criteria */}
          <div className="bg-gray-50 rounded-lg shadow p-4">
            <div className="font-semibold text-lg mb-2">
              Additional Criteria
            </div>
            <div className="space-y-4">
              <div className="flex flex-col bg-gray-100 rounded p-2">
                <div className="text-xs text-gray-500">
                  Distraction Handling
                </div>
                <div className="text-base">
                  {test?.additionalCriteria?.distraction_handling ? "Yes" : "No"}
                </div>
              </div>
              <div className="flex flex-col bg-gray-100 rounded p-2">
                <div className="text-xs text-gray-500">
                  Communication Simplicity
                </div>
                <div className="text-base">
                  {test?.additionalCriteria?.communication_simplicity ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftDrawer;
