import { z } from "zod";

// Product schema
export const estimateProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Product name is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  price: z.number().min(0, "Price cannot be negative"),
  tax: z.number().min(0, "Tax cannot be negative").max(100, "Tax cannot exceed 100%"),
  discount: z.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%"),
});

// Estimate details schema
export const estimateDetailsSchema = z.object({
  estimateNumber: z.string().min(1, "Estimate number is required"),
  date: z.string().min(1, "Date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email address").or(z.string().length(0)),
  clientAddress: z.string(),
  yourCompany: z.string().min(1, "Your company name is required"),
  yourEmail: z.string().email("Invalid email address").or(z.string().length(0)),
  yourAddress: z.string(),
});

// Estimate status schema
export const estimateStatusSchema = z.enum([
  'draft', 
  'sent', 
  'accepted', 
  'declined', 
  'converted'
]).optional();

// Estimate schema
export const estimateSchema = z.object({
  id: z.string().uuid().optional(),
  details: estimateDetailsSchema,
  products: z.array(estimateProductSchema).min(1, "At least one product is required"),
  notes: z.string().optional(),
  status: estimateStatusSchema,
});

// Type definitions based on the schemas
export type EstimateProduct = z.infer<typeof estimateProductSchema>;
export type EstimateDetails = z.infer<typeof estimateDetailsSchema>;
export type EstimateStatus = z.infer<typeof estimateStatusSchema>;
export type Estimate = z.infer<typeof estimateSchema>;

// Validation functions
export const validateEstimateProduct = (product: any): { success: boolean; error?: string } => {
  const result = estimateProductSchema.safeParse(product);
  if (!result.success) {
    const formattedError = result.error.format();
    // Get the first error message
    const firstError = Object.values(formattedError)
      .find(value => value && typeof value === 'object' && '_errors' in value && value._errors.length > 0);
    
    return { 
      success: false, 
      error: firstError && '_errors' in firstError ? firstError._errors[0] : "Invalid product data" 
    };
  }
  return { success: true };
};

export const validateEstimateDetails = (details: any): { success: boolean; errors?: Record<string, string> } => {
  const result = estimateDetailsSchema.safeParse(details);
  if (!result.success) {
    const formattedError = result.error.format();
    const errors: Record<string, string> = {};
    
    // Extract error messages for each field
    Object.entries(formattedError).forEach(([key, value]) => {
      if (key !== '_errors' && value && typeof value === 'object' && '_errors' in value && value._errors.length > 0) {
        errors[key] = value._errors[0];
      }
    });
    
    return { success: false, errors };
  }
  return { success: true };
};

export const validateEstimate = (estimate: any): { success: boolean; errors?: Record<string, any> } => {
  const result = estimateSchema.safeParse(estimate);
  if (!result.success) {
    const formattedError = result.error.format();
    const errors: Record<string, any> = {};
    
    // Extract error messages for details
    if (formattedError.details && typeof formattedError.details === 'object') {
      errors.details = {};
      Object.entries(formattedError.details).forEach(([key, value]) => {
        if (key !== '_errors' && value && typeof value === 'object' && '_errors' in value && value._errors.length > 0) {
          errors.details[key] = value._errors[0];
        }
      });
    }
    
    // Extract error messages for products
    if (formattedError.products && typeof formattedError.products === 'object') {
      if ('_errors' in formattedError.products && formattedError.products._errors.length > 0) {
        errors.products = formattedError.products._errors[0];
      } else {
        errors.products = [];
        Object.entries(formattedError.products).forEach(([index, value]) => {
          if (value && typeof value === 'object') {
            const productErrors: Record<string, string> = {};
            Object.entries(value).forEach(([field, fieldValue]) => {
              if (field !== '_errors' && fieldValue && typeof fieldValue === 'object' && '_errors' in fieldValue && fieldValue._errors.length > 0) {
                productErrors[field] = fieldValue._errors[0];
              }
            });
            errors.products[parseInt(index)] = productErrors;
          }
        });
      }
    }
    
    return { success: false, errors };
  }
  return { success: true };
};
