
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  Download, 
  Share, 
  Mail, 
  MessageCircle 
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Estimate } from "../types/estimate";
import { exportEstimateToPDF, shareEstimatePDF, shareEstimateViaWhatsApp, shareEstimateViaEmail } from "../utils/estimatePdfUtils";
import { toast } from "@/hooks/use-toast";

interface EstimateActionButtonsProps {
  estimate: Estimate;
  compact?: boolean;
}

const EstimateActionButtons: React.FC<EstimateActionButtonsProps> = ({ 
  estimate, 
  compact = false 
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isWhatsAppSharing, setIsWhatsAppSharing] = useState(false);
  const [isEmailSharing, setIsEmailSharing] = useState(false);

  const handlePrint = () => {
    exportEstimateToPDF(estimate, false);
  };

  const handleDownload = () => {
    exportEstimateToPDF(estimate, true);
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await shareEstimatePDF(estimate);
    } catch (error) {
      toast({
        title: "Sharing failed",
        description: "Could not share the estimate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  const handleWhatsAppShare = async () => {
    setIsWhatsAppSharing(true);
    try {
      await shareEstimateViaWhatsApp(estimate);
    } catch (error) {
      toast({
        title: "WhatsApp sharing failed",
        description: "Could not share via WhatsApp. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsWhatsAppSharing(false);
    }
  };

  const handleEmailShare = () => {
    setIsEmailSharing(true);
    try {
      window.location.href = shareEstimateViaEmail(estimate);
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

  // Compact mode for sidebar
  if (compact) {
    return (
      <div className="space-y-3">
        <Button 
          className="w-full" 
          variant="outline"
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Estimate
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
              {isSharing || isWhatsAppSharing || isEmailSharing ? "Sharing..." : "Share Estimate"}
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

  // Default mode for inline buttons
  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={handlePrint}
      >
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleDownload}
      >
        <Download className="h-4 w-4 mr-2" />
        Download PDF
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={isSharing || isWhatsAppSharing || isEmailSharing}
          >
            <Share className="h-4 w-4 mr-2" />
            {isSharing || isWhatsAppSharing || isEmailSharing ? "Sharing..." : "Share"}
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
    </div>
  );
};

export default EstimateActionButtons;
