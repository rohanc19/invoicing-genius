
import React from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download, Share, MessageCircle } from "lucide-react";
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
  const handlePrint = () => {
    exportEstimateToPDF(estimate, false);
  };

  const handleDownload = () => {
    exportEstimateToPDF(estimate, true);
  };

  const handleShare = async () => {
    await shareEstimatePDF(estimate);
  };
  
  const handleWhatsAppShare = async () => {
    await shareEstimateViaWhatsApp(estimate);
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
        
        {navigator.share && (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={handleShare}
          >
            <Share className="h-4 w-4 mr-2" />
            Share Estimate
          </Button>
        )}
        
        <Button 
          className="w-full" 
          variant="outline"
          onClick={handleWhatsAppShare}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Share via WhatsApp
        </Button>
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
      
      {navigator.share && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleShare}
        >
          <Share className="h-4 w-4 mr-2" />
          Share
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleWhatsAppShare}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        WhatsApp
      </Button>
    </div>
  );
};

export default EstimateActionButtons;
