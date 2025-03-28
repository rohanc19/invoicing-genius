
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

export const generateInvoicePDF = (invoice: Invoice) => {
  const doc = new jsPDF();
  
  // Add company information
  doc.setFontSize(20);
  doc.setTextColor(40, 99, 235); // primary blue
  doc.text("INVOICE", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  doc.text(`${invoice.details.yourCompany}`, 14, 30);
  doc.text(`${invoice.details.yourEmail}`, 14, 35);
  doc.text(`${invoice.details.yourAddress}`, 14, 40);
  
  // Add invoice details
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  doc.text(`Invoice Number: ${invoice.details.invoiceNumber}`, 140, 30);
  doc.text(`Invoice Date: ${invoice.details.date}`, 140, 35);
  doc.text(`Due Date: ${invoice.details.dueDate}`, 140, 40);

  // Add client information
  doc.setFontSize(12);
  doc.setTextColor(40, 99, 235); // primary blue
  doc.text("Bill To:", 14, 55);
  
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  doc.text(`${invoice.details.clientName}`, 14, 62);
  doc.text(`${invoice.details.clientEmail}`, 14, 67);
  doc.text(`${invoice.details.clientAddress}`, 14, 72);
  
  // Add product table
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
    startY: 80,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { 
      fillColor: [40, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    }
  });
  
  // Add totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  
  doc.text(`Subtotal:`, 140, finalY);
  doc.text(`${formatCurrency(calculateSubtotal(invoice.products))}`, 170, finalY);
  
  doc.text(`Discount:`, 140, finalY + 5);
  doc.text(`${formatCurrency(calculateTotalDiscount(invoice.products))}`, 170, finalY + 5);
  
  doc.text(`Tax:`, 140, finalY + 10);
  doc.text(`${formatCurrency(calculateTotalTax(invoice.products))}`, 170, finalY + 10);
  
  doc.setFontSize(12);
  doc.setTextColor(40, 99, 235);
  doc.text(`Total:`, 140, finalY + 20);
  doc.setFont(undefined, 'bold');
  doc.text(`${formatCurrency(calculateTotal(invoice.products))}`, 170, finalY + 20);
  
  // Add notes if available
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    doc.setFont(undefined, 'normal');
    doc.text("Notes:", 14, finalY + 35);
    doc.text(invoice.notes, 14, finalY + 42);
  }
  
  // Add footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for your business!", 14, finalY + 55);
  
  return doc;
};

export const downloadInvoicePDF = (invoice: Invoice) => {
  const doc = generateInvoicePDF(invoice);
  doc.save(`Invoice_${invoice.details.invoiceNumber}.pdf`);
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
