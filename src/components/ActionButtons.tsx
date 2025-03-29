
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  Save, 
  FileText, 
  Download, 
  Share, 
  MessageCircle, 
  Mail 
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Invoice } from "../types/invoice";
import { exportToPDF, shareInvoicePDF, shareInvoiceViaWhatsApp } from "../utils/pdfUtils";
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
  const [isSharing, setIsSharing] = useState(false);
  
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

  const handleWhatsAppShare = async () => {
    setIsSharing(true);
    try {
      await shareInvoiceViaWhatsApp(invoice);
    } finally {
      setIsSharing(false);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Invoice ${invoice.details.invoiceNumber}`);
    const body = encodeURIComponent(
      `Hello ${invoice.details.clientName},\n\nPlease find attached the invoice ${invoice.details.invoiceNumber}.\n\nBest regards,\n${invoice.details.yourCompany}`
    );
    window.location.href = `mailto:${invoice.details.clientEmail}?subject=${subject}&body=${body}`;
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
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            disabled={disabled || isSharing}
            className="flex items-center gap-2"
          >
            <Share className="h-5 w-5" />
            <span>{isSharing ? "Sharing..." : "Share"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {navigator.share && (
            <DropdownMenuItem onClick={async () => {
              setIsSharing(true);
              try {
                await shareInvoicePDF(invoice);
              } finally {
                setIsSharing(false);
              }
            }}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleWhatsAppShare}>
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEmailShare}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
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
