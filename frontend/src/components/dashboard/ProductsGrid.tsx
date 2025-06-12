
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProductInfoCard from "@/components/ProductInfoCard";

type Product = {
  id: number;
  name: string;
  description: string;
  category: string;
  documentStatus: "none" | "uploaded" | "processed" | "error";
};

type ProductsGridProps = {
  products: Product[];
};

const ProductsGrid = ({ products }: ProductsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductInfoCard
          key={product.id}
          productName={product.name}
          description={product.description}
          category={product.category}
          documentStatus={product.documentStatus}
        />
      ))}
      
      <Card className="border-dashed bg-muted/50 flex flex-col items-center justify-center p-6 h-full">
        <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center mb-2">
          <span className="text-2xl text-muted-foreground">+</span>
        </div>
        <p className="text-muted-foreground text-sm mb-4">Add a new product</p>
        <Button size="sm" variant="outline" asChild>
          <Link to="/products">Upload Product</Link>
        </Button>
      </Card>
    </div>
  );
};

export default ProductsGrid;
