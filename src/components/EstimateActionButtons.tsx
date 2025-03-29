
import React from "react";
import { Estimate } from "../types/estimate";
import { exportEstimateToPDF } from "../utils/estimatePdfUtils";
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
    />
  );
};

export default EstimateActionButtons;
