
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
  addFooter
} from "./pdf";

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

// Export empty functions to maintain compatibility
export const shareInvoicePDF = async () => false;
export const shareInvoiceViaWhatsApp = async () => false;
export const shareInvoiceViaEmail = () => '';
