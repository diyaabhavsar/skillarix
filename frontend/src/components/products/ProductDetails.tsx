import React from "react";
import { SheetHeader, SheetTitle, SheetContent } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components

interface ProductDetailsProps {
  data: {
    name: string;
    description: string;
    categoryId: string;
    categoryName: string;
    createdAt: string;
  };
}

const ProductDetails = ({
  data
}: ProductDetailsProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader className="pb-4">
        <SheetTitle>Product Details</SheetTitle>
      </SheetHeader>
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Name</Label>
              <p className="text-base font-medium">{data.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Category</Label>
              <p className="text-base font-medium">{data.categoryName}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Description</Label>
              <p className="text-base font-medium">{data.description || "-"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Created At</Label>
              <p className="text-base font-medium">{formatDate(data.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SheetContent>
  );
};

export default ProductDetails;
