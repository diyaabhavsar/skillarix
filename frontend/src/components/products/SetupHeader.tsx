import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SideSheet from "@/components/SideSheet";

const SetupHeader = ({}: { onProductAdded?: () => void }) => {
  const navigate = useNavigate();

  const handleAddNewProduct = () => {
    navigate("/product/setup");
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product documentation
          </p>
        </div>
        <Button onClick={handleAddNewProduct} size="lg" className="px-6">
          Add New Product
        </Button>
      </div>
    </div>
  );
};

const TestSetupHeader = () => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Setup Configuration</h1>
          <p className="text-muted-foreground">Test Configuration</p>
        </div>
      </div>
    </div>
  );
};

const PracticeHeader = () => {
  const navigate = useNavigate();

  const handleStartNewSession = () => {
    navigate("/session/setup");
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assessment History</h1>
          <p className="text-muted-foreground">
            Review your past assessment and performance
          </p>
        </div>
        <Button onClick={handleStartNewSession} size="lg" className="px-6">
          New Session
        </Button>
      </div>
    </div>
  );
};

const CategoryHeader = ({ onToggleInput }: { onToggleInput: () => void }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage your product categories
          </p>
        </div>
        <Button className="group transition-all" onClick={onToggleInput}>
          <Plus className="h-4 w-4 mr-2" />
          <span>Add Category</span>
        </Button>
      </div>
    </div>
  );
};



export {
  SetupHeader,
  TestSetupHeader,
  PracticeHeader,
  CategoryHeader,
};
