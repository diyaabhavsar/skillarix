import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Link, Plus } from "lucide-react";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import ProductForm from "./ProductForm";

const SetupHeader = ({ onProductAdded }: { onProductAdded?: () => void }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pb-1">
          Products
        </h1>
        <p className="text-muted-foreground">
          Manage your product documentation
        </p>
      </div>
      <div className="flex gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="group transition-all">
              <Plus className="h-4 w-4 mr-2" />
              <span>Add New Product</span>
            </Button>
          </SheetTrigger>
          <ProductForm onSuccess={onProductAdded} />
        </Sheet>
      </div>
    </div>
  );
};

const TestSetupHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pb-1">
          {" "}
          Test Setup Configuration{" "}
        </h1>
        <p className="text-muted-foreground">Test Configuration</p>
      </div>
      {/* <div className="flex gap-3">
        <Button
          variant="outline"
          asChild
          className="group transition-all hover:border-primary"
        >
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Dashboard</span>
          </Link>
        </Button>
      </div> */}
    </div>
  );
};
// const TestSetupHeader = () => {
//   return (
//     <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 animate-fade-in">
//       <div>
//         <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pb-1"> Test Setup Configuration </h1>
//         <p className="text-muted-foreground">Test Configuration</p>
//       </div>
//       <div className="flex gap-3">
//         <Button variant="outline" asChild className="group transition-all hover:border-primary">
//           <Link to="/dashboard" className="flex items-center gap-2">
//             <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
//             <span>Back to Dashboard</span>
//           </Link>
//         </Button>
//       </div>
//     </div>
//   );
// };

export { SetupHeader, TestSetupHeader };
