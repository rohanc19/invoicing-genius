
import React from "react";
import { EstimateProduct } from "../types/estimate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { calculateSubtotal, calculateTotalTax, calculateTotalDiscount, calculateTotal, formatCurrency } from "@/utils/calculations";

interface EstimateSummaryProps {
  products: EstimateProduct[];
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
}

const EstimateSummary: React.FC<EstimateSummaryProps> = ({ products, notes, setNotes }) => {
  const subtotal = calculateSubtotal(products);
  const totalTax = calculateTotalTax(products);
  const totalDiscount = calculateTotalDiscount(products);
  const total = calculateTotal(products);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={handleNotesChange}
              placeholder="Add any additional notes or terms here..."
              rows={5}
              className="mt-2"
            />
          </div>
          
          <div className="w-full md:w-1/2">
            <div className="border rounded-md p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm">Taxes:</span>
                <span>{formatCurrency(totalTax)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm">Discounts:</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
              
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EstimateSummary;
