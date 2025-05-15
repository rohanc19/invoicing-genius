import { z } from "zod";
import { productSchema } from "./invoice.schema";

// Recurring frequency schema
export const recurringFrequencySchema = z.enum([
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
]);

// Recurring invoice details schema
export const recurringInvoiceDetailsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  frequency: recurringFrequencySchema,
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  nextDate: z.string().min(1, "Next date is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email address").or(z.string().length(0)),
  clientAddress: z.string(),
  yourCompany: z.string().min(1, "Your company name is required"),
  yourEmail: z.string().email("Invalid email address").or(z.string().length(0)),
  yourAddress: z.string(),
});

// Recurring invoice schema
export const recurringInvoiceSchema = z.object({
  id: z.string().uuid().optional(),
  details: recurringInvoiceDetailsSchema,
  products: z.array(productSchema).min(1, "At least one product is required"),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Type definitions based on the schemas
export type RecurringFrequency = z.infer<typeof recurringFrequencySchema>;
export type RecurringInvoiceDetails = z.infer<typeof recurringInvoiceDetailsSchema>;
export type RecurringInvoice = z.infer<typeof recurringInvoiceSchema>;

// Validation functions
export const validateRecurringInvoiceDetails = (details: any): { success: boolean; errors?: Record<string, string> } => {
  const result = recurringInvoiceDetailsSchema.safeParse(details);
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

export const validateRecurringInvoice = (recurringInvoice: any): { success: boolean; errors?: Record<string, any> } => {
  const result = recurringInvoiceSchema.safeParse(recurringInvoice);
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
