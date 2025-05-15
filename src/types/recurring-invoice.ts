import { Product } from "./invoice";

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringInvoiceDetails {
  title: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  nextDate: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  yourCompany: string;
  yourEmail: string;
  yourAddress: string;
}

export interface RecurringInvoice {
  id?: string;
  details: RecurringInvoiceDetails;
  products: Product[];
  notes?: string;
  isActive: boolean;
}
