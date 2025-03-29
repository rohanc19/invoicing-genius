
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  Save, 
  FileText, 
  Download
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DocumentActionButtonsProps {
  document: any; // Invoice or Estimate
  documentType: 'invoice' | 'estimate';
  disabled?: boolean;
  compact?: boolean;
  onSave?: () => Promise<void>;
  onPrint: () => void;
  onDownload: () => void;
  showSaveButton?: boolean;
}

const DocumentActionButtons: React.FC<DocumentActionButtonsProps> = ({
  document,
  documentType,
  disabled = false,
  compact = false,
  onSave,
  onPrint,
  onDownload,
  showSaveButton = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handlePrint = () => {
    onPrint();
  };

  const handleDownload = () => {
    onDownload();
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave();
    } catch (error: any) {
      toast({
        title: `Error saving ${documentType}`,
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Compact mode for sidebar (used by EstimateActionButtons)
  if (compact) {
    return (
      <div className="space-y-3">
        <Button 
          className="w-full" 
          variant="outline"
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print {documentType === 'invoice' ? 'Invoice' : 'Estimate'}
        </Button>
        
        <Button 
          className="w-full" 
          variant="outline"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    );
  }

  // Default mode for inline buttons (used by ActionButtons)
  return (
    <div className={showSaveButton ? "mt-8 flex flex-wrap gap-4 justify-center md:justify-end" : "flex flex-wrap gap-2"}>
      <Button 
        variant="outline" 
        size={showSaveButton ? "default" : "sm"}
        disabled={disabled} 
        onClick={handlePrint}
        className={showSaveButton ? "flex items-center gap-2" : ""}
      >
        <Printer className={showSaveButton ? "h-5 w-5" : "h-4 w-4 mr-2"} />
        <span>Print</span>
      </Button>
      
      {showSaveButton && (
        <Button 
          variant="outline" 
          disabled={disabled} 
          onClick={() => {
            // This is specific to the Invoice version, used for Excel export
            if (documentType === 'invoice' && document.exportToExcel) {
              document.exportToExcel(document);
            }
          }}
          className="flex items-center gap-2"
        >
          <FileText className="h-5 w-5" />
          <span>Export to Excel</span>
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size={showSaveButton ? "default" : "sm"}
        disabled={disabled} 
        onClick={handleDownload}
        className={showSaveButton ? "flex items-center gap-2" : ""}
      >
        <Download className={showSaveButton ? "h-5 w-5" : "h-4 w-4 mr-2"} />
        <span>Download PDF</span>
      </Button>
      
      {showSaveButton && onSave && (
        <Button 
          disabled={disabled || isSaving} 
          onClick={handleSave}
          className="flex items-center gap-2"
        >
          <Save className="h-5 w-5" />
          <span>{isSaving ? "Saving..." : `Save ${documentType === 'invoice' ? 'Invoice' : 'Estimate'}`}</span>
        </Button>
      )}
    </div>
  );
};

export default DocumentActionButtons;
