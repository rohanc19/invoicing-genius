
import React from "react";
import { Invoice } from "@/types/invoice";
import { format } from "date-fns";
import { calculateProductTotal, calculateTotal, formatCurrency } from "@/utils/calculations";

interface InvoiceDisplayProps {
  invoice: Invoice;
}

const InvoiceDisplay: React.FC<InvoiceDisplayProps> = ({ invoice }) => {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-medium text-sm text-gray-500 mb-1">From</h3>
          <div className="text-lg font-medium">{invoice.details.yourCompany || 'Your Company'}</div>
          <div>{invoice.details.yourEmail}</div>
          <div className="text-gray-600 text-sm">{invoice.details.yourAddress}</div>
        </div>
        
        <div>
          <h3 className="font-medium text-sm text-gray-500 mb-1">To</h3>
          <div className="text-lg font-medium">{invoice.details.clientName}</div>
          <div>{invoice.details.clientEmail}</div>
          <div className="text-gray-600 text-sm">{invoice.details.clientAddress}</div>
        </div>
      </div>
      
      {/* Invoice Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <h3 className="font-medium text-sm text-gray-500 mb-1">Invoice Number</h3>
          <div>{invoice.details.invoiceNumber}</div>
        </div>
        
        <div>
          <h3 className="font-medium text-sm text-gray-500 mb-1">Invoice Date</h3>
          <div>{invoice.details.date ? format(new Date(invoice.details.date), 'MMMM dd, yyyy') : 'N/A'}</div>
        </div>
        
        <div>
          <h3 className="font-medium text-sm text-gray-500 mb-1">Due Date</h3>
          <div>{invoice.details.dueDate ? format(new Date(invoice.details.dueDate), 'MMMM dd, yyyy') : 'N/A'}</div>
        </div>
      </div>
      
      {/* Products Table */}
      <div className="border rounded-md mb-6 overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Qty</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Price</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Tax (%)</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Discount (%)</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoice.products.map((product, index) => {
              const itemTotal = calculateProductTotal(product);
              
              return (
                <tr key={index} className="bg-white">
                  <td className="px-4 py-3 text-sm">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-right">{product.quantity}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3 text-sm text-right">{product.tax}%</td>
                  <td className="px-4 py-3 text-sm text-right">{product.discount}%</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(itemTotal)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-muted">
            <tr>
              <td colSpan={5} className="px-4 py-3 text-right font-bold">Total:</td>
              <td className="px-4 py-3 text-right font-bold">{formatCurrency(calculateTotal(invoice.products))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Notes */}
      {invoice.notes && (
        <div>
          <h3 className="font-medium text-sm text-gray-500 mb-2">Notes</h3>
          <div className="text-gray-600 text-sm whitespace-pre-line p-4 bg-gray-50 rounded-md">{invoice.notes}</div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDisplay;
