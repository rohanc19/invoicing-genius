
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { InvoiceDetails, Product, Invoice } from "../types/invoice";
import InvoiceHeader from "../components/InvoiceHeader";
import ProductList from "../components/ProductList";
import InvoiceSummary from "../components/InvoiceSummary";
import ActionButtons from "../components/ActionButtons";
import { 
  File, 
  ReceiptText
} from "lucide-react";

const Index = () => {
  // Invoice details state
  const [details, setDetails] = useState<InvoiceDetails>({
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0], // Due in 14 days
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    yourCompany: "",
    yourEmail: "",
    yourAddress: "",
  });

  // Products state
  const [products, setProducts] = useState<Product[]>([
    {
      id: uuidv4(),
      name: "",
      quantity: 1,
      price: 0,
      tax: 0,
      discount: 0,
    },
  ]);

  // Notes state
  const [notes, setNotes] = useState<string>("");

  // Compute if form is valid
  const isFormValid = 
    details.yourCompany.trim() !== "" && 
    details.clientName.trim() !== "" && 
    products.length > 0 && 
    products.every(product => product.name.trim() !== "" && product.quantity > 0);

  // Create invoice object
  const invoice: Invoice = {
    details,
    products,
    notes,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-primary text-white p-4 mb-8">
        <div className="container mx-auto px-4 flex items-center gap-2">
          <ReceiptText className="h-6 w-6" />
          <h1 className="text-xl font-bold">Invoicing Genius</h1>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <File className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Create Invoice</h2>
        </div>
        
        <InvoiceHeader details={details} setDetails={setDetails} />
        
        <ProductList products={products} setProducts={setProducts} />
        
        <InvoiceSummary 
          products={products}
          notes={notes}
          setNotes={setNotes}
        />
        
        <ActionButtons invoice={invoice} disabled={!isFormValid} />
      </div>
    </div>
  );
};

export default Index;
