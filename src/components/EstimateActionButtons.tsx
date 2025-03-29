
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
import { exportEstimateToPDF, shareEstimatePDF, shareEstimateViaWhatsApp } from "../utils/estimatePdfUtils";

interface EstimateActionButtonsProps {
  estimate: Estimate;
  compact?: boolean;
}

const EstimateActionButtons: React.FC<EstimateActionButtonsProps> = ({ 
  estimate, 
  compact = false 
}) => {
  const [isSharing, setIsSharing] = useState(false);

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
    } finally {
      setIsSharing(false);
    }
  };
  
  const handleWhatsAppShare = async () => {
    setIsSharing(true);
    try {
      await shareEstimateViaWhatsApp(estimate);
    } finally {
      setIsSharing(false);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Estimate ${estimate.details.estimateNumber}`);
    const body = encodeURIComponent(
      `Hello ${estimate.details.clientName},\n\nPlease find attached the estimate ${estimate.details.estimateNumber}.\n\nBest regards,\n${estimate.details.yourCompany}`
    );
    window.location.href = `mailto:${estimate.details.clientEmail}?subject=${subject}&body=${body}`;
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
              disabled={isSharing}
            >
              <Share className="h-4 w-4 mr-2" />
              {isSharing ? "Sharing..." : "Share Estimate"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {navigator.share && (
              <DropdownMenuItem onClick={handleShare}>
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
            disabled={isSharing}
          >
            <Share className="h-4 w-4 mr-2" />
            {isSharing ? "Sharing..." : "Share"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {navigator.share && (
            <DropdownMenuItem onClick={handleShare}>
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
    </div>
  );
};

export default EstimateActionButtons;
