
import { Estimate } from "../types/estimate";
import { calculateProductTotal, calculateSubtotal, calculateTotal, calculateTotalDiscount, calculateTotalTax, formatCurrency } from "./calculations";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { 
  DocumentProduct, 
  createDocumentHeader, 
  addCompanyClientInfo, 
  addProductTable, 
  addSummaryBox, 
  addNotes, 
  addFooter,
  shareDocumentViaWhatsApp,
  createEmailLink
} from "./pdfCommonUtils";

// Export this function for use in ActionButtons component
export const exportEstimateToPDF = (estimate: Estimate, download: boolean = false) => {
  if (download) {
    return downloadEstimatePDF(estimate);
  } else {
    return printEstimatePDF(estimate);
  }
};

const generateEstimatePDF = (estimate: Estimate) => {
  const doc = new jsPDF();
  
  // Set up document properties
  doc.setProperties({
    title: `Estimate ${estimate.details.estimateNumber}`,
    subject: `Estimate for ${estimate.details.clientName}`,
    author: estimate.details.yourCompany,
    keywords: 'estimate, proposal',
    creator: 'Estimate Generator'
  });
  
  // Add styled header
  createDocumentHeader(doc, "ESTIMATE", estimate.details.estimateNumber);
  
  // Add company and client information
  addCompanyClientInfo(doc, {
    number: estimate.details.estimateNumber,
    date: estimate.details.date,
    dueDate: estimate.details.dueDate,
    clientName: estimate.details.clientName,
    clientEmail: estimate.details.clientEmail,
    clientAddress: estimate.details.clientAddress,
    yourCompany: estimate.details.yourCompany,
    yourEmail: estimate.details.yourEmail,
    yourAddress: estimate.details.yourAddress
  });
  
  // Add product table
  const productsForTable: DocumentProduct[] = estimate.products.map(p => ({
    id: p.id,
    name: p.name,
    quantity: p.quantity,
    price: p.price,
    tax: p.tax,
    discount: p.discount
  }));
  
  addProductTable(doc, productsForTable, formatCurrency, calculateProductTotal);
  
  // Add summary box
  const finalY = addSummaryBox(
    doc, 
    productsForTable, 
    formatCurrency,
    calculateSubtotal,
    calculateTotalDiscount,
    calculateTotalTax,
    calculateTotal
  );
  
  // Add notes if available
  if (estimate.notes) {
    addNotes(doc, estimate.notes, finalY);
  }
  
  // Add footer
  addFooter(doc, estimate.details.yourEmail);
  
  return doc;
};

const downloadEstimatePDF = (estimate: Estimate) => {
  const doc = generateEstimatePDF(estimate);
  doc.save(`Estimate_${estimate.details.estimateNumber}.pdf`);
};

const printEstimatePDF = (estimate: Estimate) => {
  const doc = generateEstimatePDF(estimate);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url);
  
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      URL.revokeObjectURL(url);
    };
  }
};

export const shareEstimatePDF = async (estimate: Estimate) => {
  const doc = generateEstimatePDF(estimate);
  const pdfBlob = doc.output('blob');
  
  if (navigator.share) {
    const file = new File([pdfBlob], `Estimate_${estimate.details.estimateNumber}.pdf`, { type: 'application/pdf' });
    
    try {
      await navigator.share({
        files: [file],
        title: `Estimate ${estimate.details.estimateNumber}`,
        text: `Estimate for ${estimate.details.clientName}`,
      });
      return true;
    } catch (error) {
      console.error('Error sharing the estimate', error);
      return false;
    }
  } else {
    // Fallback for browsers without Web Share API
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Estimate_${estimate.details.estimateNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  }
};

// Fixed WhatsApp sharing functionality to properly share the PDF
export const shareEstimateViaWhatsApp = async (estimate: Estimate) => {
  const doc = generateEstimatePDF(estimate);
  const pdfBlob = doc.output('blob');
  
  return shareDocumentViaWhatsApp(
    pdfBlob,
    `Estimate_${estimate.details.estimateNumber}.pdf`,
    estimate.details.clientName,
    'Estimate',
    estimate.details.estimateNumber,
    formatCurrency(calculateTotal(estimate.products))
  );
};

// Helper for email sharing
export const shareEstimateViaEmail = (estimate: Estimate) => {
  return createEmailLink(
    estimate.details.clientEmail,
    'Estimate',
    estimate.details.estimateNumber,
    estimate.details.yourCompany,
    estimate.details.clientName
  );
};
