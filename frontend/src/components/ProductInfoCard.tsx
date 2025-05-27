
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProductInfoCardProps = {
  productName: string;
  description: string;
  category: string;
  documentStatus: "none" | "uploaded" | "processed" | "error";
};

const ProductInfoCard = ({
  productName,
  description,
  category,
  documentStatus
}: ProductInfoCardProps) => {
  return (
    <Card className="gradient-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">{productName}</CardTitle>
        <CardDescription className="text-muted-foreground line-clamp-1">
          {category}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm line-clamp-3">{description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className={`h-2.5 w-2.5 rounded-full ${
                documentStatus === "none" 
                  ? "bg-gray-300" 
                  : documentStatus === "uploaded" 
                  ? "bg-yellow-400 animate-pulse-subtle" 
                  : documentStatus === "processed" 
                  ? "bg-green-500" 
                  : "bg-red-500"
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {documentStatus === "none" 
                ? "No document" 
                : documentStatus === "uploaded" 
                ? "Processing document" 
                : documentStatus === "processed" 
                ? "Document ready" 
                : "Document error"}
            </span>
          </div>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductInfoCard;
