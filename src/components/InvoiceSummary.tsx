
import React from "react";
import { Product } from "../types/invoice";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  calculateSubtotal,
  calculateTotal, 
  calculateTotalDiscount, 
  calculateTotalTax, 
  formatCurrency 
} from "../utils/calculations";

interface InvoiceSummaryProps {
  products: Product[];
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ 
  products,
  notes,
  setNotes
}) => {
  const subtotal = calculateSubtotal(products);
  const totalDiscount = calculateTotalDiscount(products);
  const totalTax = calculateTotalTax(products);
  const total = calculateTotal(products);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="md:col-span-2">
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or payment terms..."
              className="h-32"
            />
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Summary</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount:</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span>{formatCurrency(totalTax)}</span>
              </div>
              
              <div className="pt-2 mt-2 border-t">
                <div className="flex justify-between font-medium text-lg">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceSummary;
