
import React from "react";
import { Invoice } from "../types/invoice";
import { exportToPDF } from "../utils/pdfUtils";
import { exportToExcel } from "../utils/exportUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import DocumentActionButtons from "./DocumentActionButtons";

interface ActionButtonsProps {
  invoice: Invoice;
  disabled: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ invoice, disabled }) => {
  const { user } = useAuth();
  
  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to save invoices",
        variant: "destructive",
      });
      return;
    }
    
    // Insert invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        invoice_number: invoice.details.invoiceNumber,
        client_name: invoice.details.clientName,
        client_email: invoice.details.clientEmail,
        client_address: invoice.details.clientAddress,
        your_company: invoice.details.yourCompany,
        your_email: invoice.details.yourEmail,
        your_address: invoice.details.yourAddress,
        date: invoice.details.date,
        due_date: invoice.details.dueDate,
        notes: invoice.notes,
        status: 'unpaid',
        is_draft: false
      })
      .select()
      .single();
      
    if (invoiceError) throw invoiceError;
    
    // Insert products
    const productsToInsert = invoice.products.map(product => ({
      invoice_id: invoiceData.id,
      name: product.name,
      quantity: product.quantity,
      price: product.price,
      tax: product.tax,
      discount: product.discount,
    }));
    
    const { error: productsError } = await supabase
      .from('invoice_products')
      .insert(productsToInsert);
      
    if (productsError) throw productsError;
    
    toast({
      title: "Invoice saved",
      description: `Invoice ${invoice.details.invoiceNumber} has been saved`,
    });
  };

  return (
    <DocumentActionButtons
      document={invoice}
      documentType="invoice"
      disabled={disabled}
      onPrint={() => exportToPDF(invoice)}
      onDownload={() => exportToPDF(invoice, true)}
      onSave={handleSave}
      showSaveButton={true}
    />
  );
};

export default ActionButtons;
