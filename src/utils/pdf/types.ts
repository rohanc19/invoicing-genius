
import jsPDF from "jspdf";

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
