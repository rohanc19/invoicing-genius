
import React from "react";
import { Product } from "../types/invoice";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { calculateProductTotal, formatCurrency } from "../utils/calculations";

interface ProductItemProps {
  product: Product;
  updateProduct: (id: string, updatedProduct: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  index: number;
}

const ProductItem: React.FC<ProductItemProps> = ({ 
  product, 
  updateProduct, 
  removeProduct,
  index
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Convert to number for numeric fields
    if (["quantity", "price", "discount", "tax"].includes(name)) {
      const numValue = parseFloat(value) || 0;
      updateProduct(product.id, { [name]: numValue });
    } else {
      updateProduct(product.id, { [name]: value });
    }
  };

  const total = calculateProductTotal(product);

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Item #{index + 1}</h3>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => removeProduct(product.id)}
            className="h-8 w-8 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <Label htmlFor={`name-${product.id}`}>Item Name</Label>
            <Input
              id={`name-${product.id}`}
              name="name"
              value={product.name}
              onChange={handleChange}
              placeholder="Item or Service Name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`quantity-${product.id}`}>Quantity</Label>
              <Input
                id={`quantity-${product.id}`}
                name="quantity"
                type="number"
                min="1"
                value={product.quantity}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor={`price-${product.id}`}>Price</Label>
              <Input
                id={`price-${product.id}`}
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={product.price}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor={`discount-${product.id}`}>Discount (%)</Label>
            <Input
              id={`discount-${product.id}`}
              name="discount"
              type="number"
              min="0"
              max="100"
              value={product.discount}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor={`tax-${product.id}`}>Tax (%)</Label>
            <Input
              id={`tax-${product.id}`}
              name="tax"
              type="number"
              min="0"
              value={product.tax}
              onChange={handleChange}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Label>Total</Label>
            <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-foreground flex items-center font-medium">
              {formatCurrency(total)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductItem;
