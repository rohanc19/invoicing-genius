
import React from "react";
import { Estimate } from "../types/estimate";
import { exportEstimateToPDF, shareEstimatePDF, shareEstimateViaWhatsApp, shareEstimateViaEmail } from "../utils/estimatePdfUtils";
import DocumentActionButtons from "./DocumentActionButtons";

interface EstimateActionButtonsProps {
  estimate: Estimate;
  compact?: boolean;
}

const EstimateActionButtons: React.FC<EstimateActionButtonsProps> = ({ 
  estimate, 
  compact = false 
}) => {
  return (
    <DocumentActionButtons
      document={estimate}
      documentType="estimate"
      compact={compact}
      onPrint={() => exportEstimateToPDF(estimate)}
      onDownload={() => exportEstimateToPDF(estimate, true)}
      onShare={() => shareEstimatePDF(estimate)}
      onWhatsAppShare={() => shareEstimateViaWhatsApp(estimate)}
      onEmailShare={() => window.location.href = shareEstimateViaEmail(estimate)}
    />
  );
};

export default EstimateActionButtons;
