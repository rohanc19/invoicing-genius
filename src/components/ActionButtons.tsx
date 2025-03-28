
import React, { useState } from "react";
import { Invoice } from "../types/invoice";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Share2, 
  FileSpreadsheet, 
  FilePlus,
  Loader2
} from "lucide-react";
import { 
  downloadInvoicePDF, 
  shareInvoicePDF 
} from "../utils/pdfUtils";
import { exportToExcel } from "../utils/exportUtils";
import { toast } from "sonner";

interface ActionButtonsProps {
  invoice: Invoice;
  disabled: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ invoice, disabled }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      await downloadInvoicePDF(invoice);
      toast.success("Invoice PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSharePDF = async () => {
    setIsGenerating(true);
    try {
      const shared = await shareInvoicePDF(invoice);
      if (shared) {
        toast.success("Invoice shared successfully");
      }
    } catch (error) {
      console.error("Error sharing PDF:", error);
      toast.error("Failed to share invoice");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleExportToExcel = () => {
    try {
      exportToExcel(invoice);
      toast.success("Invoice exported to Excel successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    }
  };
  
  return (
    <div className="flex flex-wrap gap-3 justify-center md:justify-end">
      <Button
        variant="outline"
        className="gap-2"
        onClick={handleExportToExcel}
        disabled={disabled || isGenerating}
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export to Excel
      </Button>
      
      <Button
        variant="outline"
        className="gap-2"
        onClick={handleSharePDF}
        disabled={disabled || isGenerating}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      
      <Button
        variant="outline"
        className="gap-2"
        onClick={handleDownloadPDF}
        disabled={disabled || isGenerating}
      >
        <Download className="h-4 w-4" />
        Download PDF
      </Button>
      
      <Button
        className="gap-2"
        onClick={handleDownloadPDF}
        disabled={disabled || isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FilePlus className="h-4 w-4" />
        )}
        Generate Invoice
      </Button>
    </div>
  );
};

export default ActionButtons;
