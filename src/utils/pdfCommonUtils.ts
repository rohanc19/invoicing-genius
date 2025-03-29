import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast } from "@/hooks/use-toast";

// Add type declarations for jspdf-autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface DocumentDetails {
  number: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  yourCompany: string;
  yourEmail: string;
  yourAddress: string;
}

export interface DocumentProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  tax: number;
  discount: number;
}

export interface DocumentData {
  details: DocumentDetails;
  products: DocumentProduct[];
  notes?: string;
}

// Helper to create PDF document header
export const createDocumentHeader = (doc: jsPDF, title: string, number: string) => {
  // Add styled header
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 16);
  
  // Add document number on the header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${number}`, doc.internal.pageSize.getWidth() - 20, 16, { align: 'right' });
};

// Helper to add company and client information
export const addCompanyClientInfo = (doc: jsPDF, details: DocumentDetails) => {
  // Add company information
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  doc.text(`FROM:`, 14, 35);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`${details.yourCompany}`, 14, 40);
  doc.text(`${details.yourEmail}`, 14, 45);
  doc.text(`${details.yourAddress}`, 14, 50);
  
  // Add client information
  doc.setFont('helvetica', 'bold');
  doc.text(`FOR:`, 14, 65);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`${details.clientName}`, 14, 70);
  doc.text(`${details.clientEmail}`, 14, 75);
  doc.text(`${details.clientAddress}`, 14, 80);
  
  // Add document details
  doc.setFont('helvetica', 'bold');
  doc.text(`DETAILS:`, 140, 35);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${details.date}`, 140, 40);
  doc.text(`Expiry Date: ${details.dueDate}`, 140, 45);
  
  // Add separator line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(14, 90, doc.internal.pageSize.getWidth() - 14, 90);
};

// Helper to add product table
export const addProductTable = (doc: jsPDF, products: DocumentProduct[], formatCurrency: (amount: number) => string, calculateProductTotal: (product: DocumentProduct) => number) => {
  const tableColumn = ["Item", "Quantity", "Price", "Discount", "Tax", "Total"];
  const tableRows: any[] = [];
  
  products.forEach(product => {
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
      fillColor: [0, 0, 0],
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
};

// Helper to add summary box
export const addSummaryBox = (doc: jsPDF, products: DocumentProduct[], 
  formatCurrency: (amount: number) => string,
  calculateSubtotal: (products: DocumentProduct[]) => number,
  calculateTotalDiscount: (products: DocumentProduct[]) => number,
  calculateTotalTax: (products: DocumentProduct[]) => number,
  calculateTotal: (products: DocumentProduct[]) => number) => {
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Add summary box
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(120, finalY, 75, 40, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Subtotal:`, 125, finalY + 8);
  doc.text(`${formatCurrency(calculateSubtotal(products))}`, 190, finalY + 8, { align: 'right' });
  
  doc.text(`Discount:`, 125, finalY + 16);
  doc.text(`-${formatCurrency(calculateTotalDiscount(products))}`, 190, finalY + 16, { align: 'right' });
  
  doc.text(`Tax:`, 125, finalY + 24);
  doc.text(`${formatCurrency(calculateTotalTax(products))}`, 190, finalY + 24, { align: 'right' });
  
  // Add line before total
  doc.setDrawColor(200, 200, 200);
  doc.line(125, finalY + 28, 190, finalY + 28);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total:`, 125, finalY + 36);
  doc.text(`${formatCurrency(calculateTotal(products))}`, 190, finalY + 36, { align: 'right' });
  
  return finalY;
};

// Helper to add notes
export const addNotes = (doc: jsPDF, notes: string, finalY: number) => {
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
  doc.text(notes, 20, notesY + 14, { 
    maxWidth: 170,
    lineHeightFactor: 1.5
  });
};

// Helper to add footer
export const addFooter = (doc: jsPDF, contactEmail: string) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add colored footer
  doc.setFillColor(240, 242, 244);
  doc.rect(0, pageHeight - 20, doc.internal.pageSize.getWidth(), 20, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.text(`Thank you for your business! If you have any questions, please contact us at ${contactEmail}`, 
    doc.internal.pageSize.getWidth() / 2, pageHeight - 12, { align: 'center' });
  
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 
    doc.internal.pageSize.getWidth() / 2, pageHeight - 7, { align: 'center' });
};

// Improved function to share a document via WhatsApp
export const shareDocumentViaWhatsApp = async (
  pdfBlob: Blob,
  fileName: string,
  recipientName: string,
  documentType: string,
  documentNumber: string,
  total: string
) => {
  
  try {
    // Download the PDF first
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const tempLink = document.createElement('a');
    tempLink.href = pdfUrl;
    tempLink.download = fileName;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    
    // Show user instructions toast with more detailed steps
    toast({
      title: "PDF Downloaded",
      description: "1. The PDF has been downloaded. 2. Click 'Continue to WhatsApp' to open WhatsApp. 3. Attach the PDF manually using the clip icon.",
      duration: 7000,
    });
    
    // Wait a moment to ensure download starts
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Construct a message for WhatsApp
    const message = encodeURIComponent(
      `Hello ${recipientName},\n\n` +
      `I'm sharing ${documentType} #${documentNumber} with you.\n` +
      `Total: ${total}\n\n` +
      `Please see the attached ${documentType.toLowerCase()} document.`
    );
    
    // Create a button to continue to WhatsApp after download
    const continueToastId = "continue-to-whatsapp";
    
    // Check if toast already exists and remove it
    const existingToast = document.getElementById(continueToastId);
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create a new toast with a continue button
    setTimeout(() => {
      toast({
        title: "Continue to WhatsApp",
        description: "PDF downloaded. Click below to open WhatsApp and then attach the PDF manually.",
        action: (
          <button 
            id={continueToastId}
            onClick={() => window.open(`https://wa.me/?text=${message}`, '_blank')}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-xs"
          >
            Continue to WhatsApp
          </button>
        ),
        duration: 10000,
      });
    }, 1000);
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Error sharing via WhatsApp:', error);
    toast({
      title: "Sharing failed",
      description: "Could not share the document. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};

// Generic function to share a document via Email
export const createEmailLink = (
  recipientEmail: string,
  documentType: string,
  documentNumber: string,
  companyName: string,
  recipientName: string
) => {
  const subject = encodeURIComponent(`${documentType} ${documentNumber}`);
  const body = encodeURIComponent(
    `Hello ${recipientName},\n\nPlease find attached the ${documentType.toLowerCase()} ${documentNumber}.\n\nBest regards,\n${companyName}`
  );
  return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
};
