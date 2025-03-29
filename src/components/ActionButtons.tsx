
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Save, FileText, Download } from "lucide-react";
import { Invoice } from "../types/invoice";
import { exportToPDF } from "../utils/pdfUtils";
import { exportToExcel } from "../utils/exportUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ActionButtonsProps {
  invoice: Invoice;
  disabled: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ invoice, disabled }) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to save invoices",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
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
      
    } catch (error: any) {
      toast({
        title: "Error saving invoice",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-end">
      <Button 
        variant="outline" 
        disabled={disabled} 
        onClick={() => exportToPDF(invoice)}
        className="flex items-center gap-2"
      >
        <Printer className="h-5 w-5" />
        <span>Print</span>
      </Button>
      
      <Button 
        variant="outline" 
        disabled={disabled} 
        onClick={() => exportToExcel(invoice)}
        className="flex items-center gap-2"
      >
        <FileText className="h-5 w-5" />
        <span>Export to Excel</span>
      </Button>
      
      <Button 
        variant="outline" 
        disabled={disabled} 
        onClick={() => exportToPDF(invoice, true)}
        className="flex items-center gap-2"
      >
        <Download className="h-5 w-5" />
        <span>Download PDF</span>
      </Button>
      
      <Button 
        disabled={disabled || isSaving} 
        onClick={handleSave}
        className="flex items-center gap-2"
      >
        <Save className="h-5 w-5" />
        <span>{isSaving ? "Saving..." : "Save Invoice"}</span>
      </Button>
    </div>
  );
};

export default ActionButtons;
