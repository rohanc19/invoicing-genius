
import { Invoice } from "../types/invoice";
import { calculateSubtotal, calculateTotal, calculateTotalDiscount, calculateTotalTax } from "./calculations";
import * as XLSX from "xlsx";

export const exportToExcel = (invoice: Invoice) => {
  const workbook = XLSX.utils.book_new();

  // Invoice details worksheet
  const detailsData = [
    ["Invoice Number", invoice.details.invoiceNumber],
    ["Date", invoice.details.date],
    ["Due Date", invoice.details.dueDate],
    ["Client", invoice.details.clientName],
    ["Client Email", invoice.details.clientEmail],
    ["Client Address", invoice.details.clientAddress],
    ["Company", invoice.details.yourCompany],
    ["Company Email", invoice.details.yourEmail],
    ["Company Address", invoice.details.yourAddress],
    ["Notes", invoice.notes || ""]
  ];
  
  const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
  XLSX.utils.book_append_sheet(workbook, detailsSheet, "Invoice Details");

  // Products worksheet
  const productsData = [
    ["Name", "Quantity", "Price", "Discount (%)", "Tax (%)", "Total"]
  ];
  
  invoice.products.forEach(product => {
    const subtotal = product.quantity * product.price;
    const discountAmount = subtotal * (product.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (product.tax / 100);
    const total = afterDiscount + taxAmount;
    
    productsData.push([
      product.name,
      product.quantity.toString(),
      product.price.toString(),
      product.discount.toString(),
      product.tax.toString(),
      total.toString()
    ]);
  });
  
  // Summary row
  productsData.push([]);
  productsData.push(["Subtotal", "", "", "", "", calculateSubtotal(invoice.products).toString()]);
  productsData.push(["Discount", "", "", "", "", calculateTotalDiscount(invoice.products).toString()]);
  productsData.push(["Tax", "", "", "", "", calculateTotalTax(invoice.products).toString()]);
  productsData.push(["Total", "", "", "", "", calculateTotal(invoice.products).toString()]);
  
  const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
  XLSX.utils.book_append_sheet(workbook, productsSheet, "Products");

  // Generate xlsx file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Create a Blob from the buffer
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice_${invoice.details.invoiceNumber}.xlsx`;
  link.click();
  
  // Clean up
  URL.revokeObjectURL(url);
};
