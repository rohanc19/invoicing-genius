
import React from "react";
import { Product } from "../types/invoice";
import ProductItem from "./ProductItem";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface ProductListProps {
  products: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  onUpdateProducts?: (products: Product[]) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, setProducts, onUpdateProducts }) => {
  const addProduct = () => {
    const newProduct: Product = {
      id: uuidv4(),
      name: "",
      quantity: 1,
      price: 0,
      tax: 0,
      discount: 0,
    };
    
    const updatedProducts = [...products, newProduct];
    
    if (setProducts) {
      setProducts(updatedProducts);
    } else if (onUpdateProducts) {
      onUpdateProducts(updatedProducts);
    }
  };
  
  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    const updatedProducts = products.map(product => 
      product.id === id ? { ...product, ...updatedFields } : product
    );
    
    if (setProducts) {
      setProducts(updatedProducts);
    } else if (onUpdateProducts) {
      onUpdateProducts(updatedProducts);
    }
  };
  
  const removeProduct = (id: string) => {
    const updatedProducts = products.filter(product => product.id !== id);
    
    if (setProducts) {
      setProducts(updatedProducts);
    } else if (onUpdateProducts) {
      onUpdateProducts(updatedProducts);
    }
  };
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Items</h2>
        <Button 
          onClick={addProduct}
          variant="outline"
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
          No items added yet. Click "Add Item" to get started.
        </div>
      ) : (
        products.map((product, index) => (
          <ProductItem
            key={product.id}
            product={product}
            updateProduct={updateProduct}
            removeProduct={removeProduct}
            index={index}
          />
        ))
      )}
    </div>
  );
};

export default ProductList;
