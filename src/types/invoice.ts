
export interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  tax: number;
  discount: number;
}

export interface InvoiceDetails {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  yourCompany: string;
  yourEmail: string;
  yourAddress: string;
}

export interface Invoice {
  details: InvoiceDetails;
  products: Product[];
  notes?: string;
}
