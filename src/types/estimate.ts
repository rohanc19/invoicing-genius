
export interface EstimateProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  tax: number;
  discount: number;
}

export interface EstimateDetails {
  estimateNumber: string;
  date: string;
  dueDate: string;  // Using dueDate instead of expiryDate for consistency
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  yourCompany: string;
  yourEmail: string;
  yourAddress: string;
}

export interface Estimate {
  id?: string;
  details: EstimateDetails;
  products: EstimateProduct[];
  notes?: string;
  status?: 'draft' | 'sent' | 'accepted' | 'declined' | 'converted';
}
