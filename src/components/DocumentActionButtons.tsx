
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
import { toast } from "@/hooks/use-toast";

interface DocumentActionButtonsProps {
  document: any; // Invoice or Estimate
  documentType: 'invoice' | 'estimate';
  disabled?: boolean;
  compact?: boolean;
  onSave?: () => Promise<void>;
  onPrint: () => void;
  onDownload: () => void;
  onShare: () => Promise<void>;
  onWhatsAppShare: () => Promise<void>;
  onEmailShare: () => void;
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
  onShare,
  onWhatsAppShare,
  onEmailShare,
  showSaveButton = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isWhatsAppSharing, setIsWhatsAppSharing] = useState(false);
  const [isEmailSharing, setIsEmailSharing] = useState(false);

  const handlePrint = () => {
    onPrint();
  };

  const handleDownload = () => {
    onDownload();
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await onShare();
    } catch (error) {
      toast({
        title: `${documentType === 'invoice' ? 'Invoice' : 'Estimate'} sharing failed`,
        description: `Could not share the ${documentType}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  const handleWhatsAppShare = async () => {
    setIsWhatsAppSharing(true);
    try {
      await onWhatsAppShare();
    } catch (error) {
      toast({
        title: "WhatsApp sharing failed",
        description: `Could not share via WhatsApp. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsWhatsAppSharing(false);
    }
  };

  const handleEmailShare = () => {
    setIsEmailSharing(true);
    try {
      onEmailShare();
    } catch (error) {
      toast({
        title: "Email sharing failed",
        description: "Could not share via email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEmailSharing(false);
    }
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              className="w-full" 
              variant="outline"
              disabled={isSharing || isWhatsAppSharing || isEmailSharing}
            >
              <Share className="h-4 w-4 mr-2" />
              {isSharing || isWhatsAppSharing || isEmailSharing ? "Sharing..." : `Share ${documentType === 'invoice' ? 'Invoice' : 'Estimate'}`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {navigator.share && (
              <DropdownMenuItem onClick={handleShare} disabled={isSharing || isWhatsAppSharing || isEmailSharing}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={handleWhatsAppShare} 
              disabled={isSharing || isWhatsAppSharing || isEmailSharing}
              className="flex items-center"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {isWhatsAppSharing ? "Processing..." : "WhatsApp"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleEmailShare} 
              disabled={isSharing || isWhatsAppSharing || isEmailSharing}
            >
              <Mail className="h-4 w-4 mr-2" />
              {isEmailSharing ? "Opening Email..." : "Email"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size={showSaveButton ? "default" : "sm"}
            disabled={disabled || isSharing || isWhatsAppSharing || isEmailSharing}
            className={showSaveButton ? "flex items-center gap-2" : ""}
          >
            <Share className={showSaveButton ? "h-5 w-5" : "h-4 w-4 mr-2"} />
            <span>{isSharing || isWhatsAppSharing || isEmailSharing ? "Sharing..." : "Share"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {navigator.share && (
            <DropdownMenuItem onClick={handleShare} disabled={isSharing || isWhatsAppSharing || isEmailSharing}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={handleWhatsAppShare} 
            disabled={isSharing || isWhatsAppSharing || isEmailSharing}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {isWhatsAppSharing ? "Processing..." : "WhatsApp"}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleEmailShare} 
            disabled={isSharing || isWhatsAppSharing || isEmailSharing}
          >
            <Mail className="h-4 w-4 mr-2" />
            {isEmailSharing ? "Opening Email..." : "Email"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
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
