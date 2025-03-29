import { Estimate } from "../types/estimate";
import { calculateProductTotal, calculateSubtotal, calculateTotal, calculateTotalDiscount, calculateTotalTax, formatCurrency } from "./calculations";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Add type declarations for jspdf-autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
  doc.setFillColor(40, 99, 235); // primary blue
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("ESTIMATE", 14, 16);
  
  // Add estimate number on the header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${estimate.details.estimateNumber}`, doc.internal.pageSize.getWidth() - 20, 16, { align: 'right' });
  
  // Add company information
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  doc.text(`FROM:`, 14, 35);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`${estimate.details.yourCompany}`, 14, 40);
  doc.text(`${estimate.details.yourEmail}`, 14, 45);
  doc.text(`${estimate.details.yourAddress}`, 14, 50);
  
  // Add client information
  doc.setFont('helvetica', 'bold');
  doc.text(`TO:`, 14, 65);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`${estimate.details.clientName}`, 14, 70);
  doc.text(`${estimate.details.clientEmail}`, 14, 75);
  doc.text(`${estimate.details.clientAddress}`, 14, 80);
  
  // Add estimate details
  doc.setFont('helvetica', 'bold');
  doc.text(`ESTIMATE DETAILS:`, 140, 35);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${estimate.details.date}`, 140, 40);
  doc.text(`Due Date: ${estimate.details.dueDate}`, 140, 45);
  doc.text(`Status: ${estimate.status ? estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1) : 'Draft'}`, 140, 50);
  
  // Add separator line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(14, 90, doc.internal.pageSize.getWidth() - 14, 90);
  
  // Add product table with improved styling
  const tableColumn = ["Item", "Quantity", "Price", "Discount", "Tax", "Total"];
  const tableRows: any[] = [];
  
  estimate.products.forEach(product => {
    const productTotal = calculateProductTotal(product);
    tableRows.push([
      product.name,
      product.quantity,
      formatCurrency(product.price),
      `${product.discount}%`,
      `${product.tax}%`,
      formatCurrency(productTotal)
    ]);
  });
  
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 95,
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      cellPadding: 5,
      lineColor: [220, 220, 220],
      lineWidth: 0.1
    },
    headStyles: { 
      fillColor: [40, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    }
  });
  
  // Add totals with better styling
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Add summary box
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(120, finalY, 75, 40, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Subtotal:`, 125, finalY + 8);
  doc.text(`${formatCurrency(calculateSubtotal(estimate.products))}`, 190, finalY + 8, { align: 'right' });
  
  doc.text(`Discount:`, 125, finalY + 16);
  doc.text(`-${formatCurrency(calculateTotalDiscount(estimate.products))}`, 190, finalY + 16, { align: 'right' });
  
  doc.text(`Tax:`, 125, finalY + 24);
  doc.text(`${formatCurrency(calculateTotalTax(estimate.products))}`, 190, finalY + 24, { align: 'right' });
  
  // Add line before total
  doc.setDrawColor(200, 200, 200);
  doc.line(125, finalY + 28, 190, finalY + 28);
  
  doc.setFontSize(11);
  doc.setTextColor(40, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total:`, 125, finalY + 36);
  doc.text(`${formatCurrency(calculateTotal(estimate.products))}`, 190, finalY + 36, { align: 'right' });
  
  // Add notes if available with better styling
  if (estimate.notes) {
    const notesY = finalY + 50;
    
    // Notes box
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, notesY, 180, 30, 2, 2, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.text("Notes:", 20, notesY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.text(estimate.notes, 20, notesY + 14, { 
      maxWidth: 170,
      lineHeightFactor: 1.5
    });
  }
  
  // Add footer
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add colored footer
  doc.setFillColor(240, 242, 244);
  doc.rect(0, pageHeight - 20, doc.internal.pageSize.getWidth(), 20, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.text(`Thank you for considering our proposal! If you have any questions, please contact us at ${estimate.details.yourEmail}`, 
    doc.internal.pageSize.getWidth() / 2, pageHeight - 12, { align: 'center' });
  
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 
    doc.internal.pageSize.getWidth() / 2, pageHeight - 7, { align: 'center' });
  
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

// Add WhatsApp sharing functionality
export const shareEstimateViaWhatsApp = async (estimate: Estimate) => {
  const doc = generateEstimatePDF(estimate);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  // Create a temporary link to download the PDF
  const tempLink = document.createElement('a');
  tempLink.href = pdfUrl;
  tempLink.download = `Estimate_${estimate.details.estimateNumber}.pdf`;
  tempLink.click();
  
  // Construct the WhatsApp message
  const message = encodeURIComponent(
    `Hello ${estimate.details.clientName},\n\n` +
    `I'm sharing Estimate #${estimate.details.estimateNumber} with you.\n` +
    `Total: ${formatCurrency(calculateTotal(estimate.products))}\n\n` +
    `Please check the attached PDF for details.`
  );
  
  // Open WhatsApp with the pre-filled message
  const whatsappUrl = `https://wa.me/?text=${message}`;
  window.open(whatsappUrl, '_blank');
  
  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(pdfUrl);
  }, 100);
  
  return true;
};
