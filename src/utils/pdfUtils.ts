
import { Invoice } from "../types/invoice";
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
  createDocumentHeader(doc, "INVOICE", invoice.details.invoiceNumber);
  
  // Add company and client information
  addCompanyClientInfo(doc, {
    number: invoice.details.invoiceNumber,
    date: invoice.details.date,
    dueDate: invoice.details.dueDate,
    clientName: invoice.details.clientName,
    clientEmail: invoice.details.clientEmail,
    clientAddress: invoice.details.clientAddress,
    yourCompany: invoice.details.yourCompany,
    yourEmail: invoice.details.yourEmail,
    yourAddress: invoice.details.yourAddress
  });
  
  // Add product table
  const productsForTable: DocumentProduct[] = invoice.products.map(p => ({
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
  if (invoice.notes) {
    addNotes(doc, invoice.notes, finalY);
  }
  
  // Add footer
  addFooter(doc, invoice.details.yourEmail);
  
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

// Fixed WhatsApp sharing functionality to properly share the PDF
export const shareInvoiceViaWhatsApp = async (invoice: Invoice) => {
  const doc = generateInvoicePDF(invoice);
  const pdfBlob = doc.output('blob');
  
  return shareDocumentViaWhatsApp(
    pdfBlob,
    `Invoice_${invoice.details.invoiceNumber}.pdf`,
    invoice.details.clientName,
    'Invoice',
    invoice.details.invoiceNumber,
    formatCurrency(calculateTotal(invoice.products))
  );
};

// Helper for email sharing
export const shareInvoiceViaEmail = (invoice: Invoice) => {
  return createEmailLink(
    invoice.details.clientEmail,
    'Invoice',
    invoice.details.invoiceNumber,
    invoice.details.yourCompany,
    invoice.details.clientName
  );
};
