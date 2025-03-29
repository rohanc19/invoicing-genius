import { Invoice } from "../types/invoice";
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
export const exportToPDF = (invoice: Invoice, download: boolean = false) => {
  if (download) {
    return downloadInvoicePDF(invoice);
  } else {
    return printInvoicePDF(invoice);
  }
};

const generateInvoicePDF = (invoice: Invoice) => {
  const doc = new jsPDF();
  
  // Set up document properties
  doc.setProperties({
    title: `Invoice ${invoice.details.invoiceNumber}`,
    subject: `Invoice for ${invoice.details.clientName}`,
    author: invoice.details.yourCompany,
    keywords: 'invoice, billing',
    creator: 'Invoice Generator'
  });
  
  // Add styled header
  doc.setFillColor(40, 99, 235); // primary blue
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("INVOICE", 14, 16);
  
  // Add invoice number on the header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${invoice.details.invoiceNumber}`, doc.internal.pageSize.getWidth() - 20, 16, { align: 'right' });
  
  // Add company information
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  doc.text(`FROM:`, 14, 35);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.details.yourCompany}`, 14, 40);
  doc.text(`${invoice.details.yourEmail}`, 14, 45);
  doc.text(`${invoice.details.yourAddress}`, 14, 50);
  
  // Add client information
  doc.setFont('helvetica', 'bold');
  doc.text(`BILL TO:`, 14, 65);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.details.clientName}`, 14, 70);
  doc.text(`${invoice.details.clientEmail}`, 14, 75);
  doc.text(`${invoice.details.clientAddress}`, 14, 80);
  
  // Add invoice details
  doc.setFont('helvetica', 'bold');
  doc.text(`INVOICE DETAILS:`, 140, 35);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${invoice.details.date}`, 140, 40);
  doc.text(`Due Date: ${invoice.details.dueDate}`, 140, 45);
  
  // Add separator line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(14, 90, doc.internal.pageSize.getWidth() - 14, 90);
  
  // Add product table with improved styling
  const tableColumn = ["Item", "Quantity", "Price", "Discount", "Tax", "Total"];
  const tableRows: any[] = [];
  
  invoice.products.forEach(product => {
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
  doc.text(`${formatCurrency(calculateSubtotal(invoice.products))}`, 190, finalY + 8, { align: 'right' });
  
  doc.text(`Discount:`, 125, finalY + 16);
  doc.text(`-${formatCurrency(calculateTotalDiscount(invoice.products))}`, 190, finalY + 16, { align: 'right' });
  
  doc.text(`Tax:`, 125, finalY + 24);
  doc.text(`${formatCurrency(calculateTotalTax(invoice.products))}`, 190, finalY + 24, { align: 'right' });
  
  // Add line before total
  doc.setDrawColor(200, 200, 200);
  doc.line(125, finalY + 28, 190, finalY + 28);
  
  doc.setFontSize(11);
  doc.setTextColor(40, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total:`, 125, finalY + 36);
  doc.text(`${formatCurrency(calculateTotal(invoice.products))}`, 190, finalY + 36, { align: 'right' });
  
  // Add notes if available with better styling
  if (invoice.notes) {
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
    doc.text(invoice.notes, 20, notesY + 14, { 
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
  doc.text(`Thank you for your business! If you have any questions, please contact us at ${invoice.details.yourEmail}`, 
    doc.internal.pageSize.getWidth() / 2, pageHeight - 12, { align: 'center' });
  
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 
    doc.internal.pageSize.getWidth() / 2, pageHeight - 7, { align: 'center' });
  
  return doc;
};

const downloadInvoicePDF = (invoice: Invoice) => {
  const doc = generateInvoicePDF(invoice);
  doc.save(`Invoice_${invoice.details.invoiceNumber}.pdf`);
};

const printInvoicePDF = (invoice: Invoice) => {
  const doc = generateInvoicePDF(invoice);
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

export const shareInvoicePDF = async (invoice: Invoice) => {
  const doc = generateInvoicePDF(invoice);
  const pdfBlob = doc.output('blob');
  
  if (navigator.share) {
    const file = new File([pdfBlob], `Invoice_${invoice.details.invoiceNumber}.pdf`, { type: 'application/pdf' });
    
    try {
      await navigator.share({
        files: [file],
        title: `Invoice ${invoice.details.invoiceNumber}`,
        text: `Invoice for ${invoice.details.clientName}`,
      });
      return true;
    } catch (error) {
      console.error('Error sharing the invoice', error);
      return false;
    }
  } else {
    // Fallback for browsers without Web Share API
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoice.details.invoiceNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  }
};

// Add WhatsApp sharing functionality
export const shareInvoiceViaWhatsApp = async (invoice: Invoice) => {
  const doc = generateInvoicePDF(invoice);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  // Create a temporary link to download the PDF
  const tempLink = document.createElement('a');
  tempLink.href = pdfUrl;
  tempLink.download = `Invoice_${invoice.details.invoiceNumber}.pdf`;
  tempLink.click();
  
  // Construct the WhatsApp message
  const message = encodeURIComponent(
    `Hello ${invoice.details.clientName},\n\n` +
    `I'm sharing Invoice #${invoice.details.invoiceNumber} with you.\n` +
    `Total: ${formatCurrency(calculateTotal(invoice.products))}\n\n` +
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
