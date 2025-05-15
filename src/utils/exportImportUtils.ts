import { supabase } from "@/integrations/supabase/client";
import { saveAs } from "file-saver";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

// Define schema for exported data
const exportedDataSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  user_id: z.string().uuid(),
  data: z.object({
    invoices: z.array(z.any()).optional(),
    estimates: z.array(z.any()).optional(),
    clients: z.array(z.any()).optional(),
    recurring_invoices: z.array(z.any()).optional(),
    profile: z.any().optional(),
  }),
});

type ExportedData = z.infer<typeof exportedDataSchema>;

/**
 * Export all user data to a JSON file
 * @param userId User ID
 * @param includeInvoices Whether to include invoices
 * @param includeEstimates Whether to include estimates
 * @param includeClients Whether to include clients
 * @param includeRecurringInvoices Whether to include recurring invoices
 * @param includeProfile Whether to include user profile
 */
export const exportAllData = async (
  userId: string,
  includeInvoices = true,
  includeEstimates = true,
  includeClients = true,
  includeRecurringInvoices = true,
  includeProfile = true
): Promise<boolean> => {
  try {
    const exportData: ExportedData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      user_id: userId,
      data: {}
    };
    
    // Export invoices
    if (includeInvoices) {
      // Fetch invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId);
        
      if (invoicesError) throw invoicesError;
      
      // Fetch invoice products for each invoice
      const invoicesWithProducts = await Promise.all(
        (invoices || []).map(async (invoice) => {
          const { data: products, error: productsError } = await supabase
            .from('invoice_products')
            .select('*')
            .eq('invoice_id', invoice.id);
            
          if (productsError) throw productsError;
          
          return {
            ...invoice,
            products: products || []
          };
        })
      );
      
      exportData.data.invoices = invoicesWithProducts;
    }
    
    // Export estimates
    if (includeEstimates) {
      // Fetch estimates
      const { data: estimates, error: estimatesError } = await supabase
        .from('estimates')
        .select('*')
        .eq('user_id', userId);
        
      if (estimatesError) throw estimatesError;
      
      // Fetch estimate products for each estimate
      const estimatesWithProducts = await Promise.all(
        (estimates || []).map(async (estimate) => {
          const { data: products, error: productsError } = await supabase
            .from('estimate_products')
            .select('*')
            .eq('estimate_id', estimate.id);
            
          if (productsError) throw productsError;
          
          return {
            ...estimate,
            products: products || []
          };
        })
      );
      
      exportData.data.estimates = estimatesWithProducts;
    }
    
    // Export clients
    if (includeClients) {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId);
        
      if (clientsError) throw clientsError;
      
      exportData.data.clients = clients || [];
    }
    
    // Export recurring invoices
    if (includeRecurringInvoices) {
      // Fetch recurring invoices
      const { data: recurringInvoices, error: recurringInvoicesError } = await supabase
        .from('recurring_invoices')
        .select('*')
        .eq('user_id', userId);
        
      if (recurringInvoicesError) throw recurringInvoicesError;
      
      // Fetch recurring invoice products for each recurring invoice
      const recurringInvoicesWithProducts = await Promise.all(
        (recurringInvoices || []).map(async (recurringInvoice) => {
          const { data: products, error: productsError } = await supabase
            .from('recurring_invoice_products')
            .select('*')
            .eq('recurring_invoice_id', recurringInvoice.id);
            
          if (productsError) throw productsError;
          
          return {
            ...recurringInvoice,
            products: products || []
          };
        })
      );
      
      exportData.data.recurring_invoices = recurringInvoicesWithProducts;
    }
    
    // Export profile
    if (includeProfile) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      exportData.data.profile = profile;
    }
    
    // Generate file name
    const fileName = `invoicing-genius-export-${new Date().toISOString().split('T')[0]}.json`;
    
    // Convert to JSON and save
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    saveAs(blob, fileName);
    
    return true;
  } catch (error: any) {
    console.error('Error exporting data:', error);
    toast({
      title: "Export failed",
      description: error.message,
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Import data from a JSON file
 * @param file JSON file to import
 * @param userId User ID
 * @param options Import options
 */
export const importData = async (
  file: File,
  userId: string,
  options: {
    importInvoices?: boolean;
    importEstimates?: boolean;
    importClients?: boolean;
    importRecurringInvoices?: boolean;
    importProfile?: boolean;
    overwriteExisting?: boolean;
  } = {}
): Promise<boolean> => {
  const {
    importInvoices = true,
    importEstimates = true,
    importClients = true,
    importRecurringInvoices = true,
    importProfile = true,
    overwriteExisting = false
  } = options;
  
  try {
    // Read file
    const fileContent = await readFileAsText(file);
    const importData = JSON.parse(fileContent);
    
    // Validate data
    const validationResult = exportedDataSchema.safeParse(importData);
    
    if (!validationResult.success) {
      throw new Error("Invalid import file format");
    }
    
    const data = validationResult.data;
    
    // Import clients first (since invoices and estimates reference them)
    if (importClients && data.data.clients && data.data.clients.length > 0) {
      await importClientsData(data.data.clients, userId, overwriteExisting);
    }
    
    // Import invoices
    if (importInvoices && data.data.invoices && data.data.invoices.length > 0) {
      await importInvoicesData(data.data.invoices, userId, overwriteExisting);
    }
    
    // Import estimates
    if (importEstimates && data.data.estimates && data.data.estimates.length > 0) {
      await importEstimatesData(data.data.estimates, userId, overwriteExisting);
    }
    
    // Import recurring invoices
    if (importRecurringInvoices && data.data.recurring_invoices && data.data.recurring_invoices.length > 0) {
      await importRecurringInvoicesData(data.data.recurring_invoices, userId, overwriteExisting);
    }
    
    // Import profile
    if (importProfile && data.data.profile) {
      await importProfileData(data.data.profile, userId, overwriteExisting);
    }
    
    return true;
  } catch (error: any) {
    console.error('Error importing data:', error);
    toast({
      title: "Import failed",
      description: error.message,
      variant: "destructive",
    });
    return false;
  }
};

// Helper function to read file as text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target) {
        resolve(event.target.result as string);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

// Helper function to import clients data
const importClientsData = async (
  clients: any[],
  userId: string,
  overwriteExisting: boolean
): Promise<void> => {
  // If overwriteExisting, delete existing clients first
  if (overwriteExisting) {
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) throw deleteError;
  }
  
  // Prepare clients for import
  const clientsToImport = clients.map(client => ({
    ...client,
    user_id: userId,
    id: overwriteExisting ? client.id : undefined, // Keep original ID if overwriting
    created_at: client.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  // Insert clients
  const { error: insertError } = await supabase
    .from('clients')
    .insert(clientsToImport);
    
  if (insertError) throw insertError;
};

// Helper function to import invoices data
const importInvoicesData = async (
  invoices: any[],
  userId: string,
  overwriteExisting: boolean
): Promise<void> => {
  // If overwriteExisting, delete existing invoices first
  if (overwriteExisting) {
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) throw deleteError;
  }
  
  // Process each invoice
  for (const invoice of invoices) {
    const { products, ...invoiceData } = invoice;
    
    // Prepare invoice for import
    const invoiceToImport = {
      ...invoiceData,
      user_id: userId,
      id: overwriteExisting ? invoiceData.id : undefined, // Keep original ID if overwriting
      created_at: invoiceData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert invoice
    const { data: insertedInvoice, error: insertError } = await supabase
      .from('invoices')
      .insert(invoiceToImport)
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    // Prepare products for import
    const productsToImport = products.map((product: any) => ({
      ...product,
      invoice_id: insertedInvoice.id,
      id: overwriteExisting ? product.id : undefined // Keep original ID if overwriting
    }));
    
    // Insert products
    if (productsToImport.length > 0) {
      const { error: productsError } = await supabase
        .from('invoice_products')
        .insert(productsToImport);
        
      if (productsError) throw productsError;
    }
  }
};

// Helper function to import estimates data
const importEstimatesData = async (
  estimates: any[],
  userId: string,
  overwriteExisting: boolean
): Promise<void> => {
  // If overwriteExisting, delete existing estimates first
  if (overwriteExisting) {
    const { error: deleteError } = await supabase
      .from('estimates')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) throw deleteError;
  }
  
  // Process each estimate
  for (const estimate of estimates) {
    const { products, ...estimateData } = estimate;
    
    // Prepare estimate for import
    const estimateToImport = {
      ...estimateData,
      user_id: userId,
      id: overwriteExisting ? estimateData.id : undefined, // Keep original ID if overwriting
      created_at: estimateData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert estimate
    const { data: insertedEstimate, error: insertError } = await supabase
      .from('estimates')
      .insert(estimateToImport)
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    // Prepare products for import
    const productsToImport = products.map((product: any) => ({
      ...product,
      estimate_id: insertedEstimate.id,
      id: overwriteExisting ? product.id : undefined // Keep original ID if overwriting
    }));
    
    // Insert products
    if (productsToImport.length > 0) {
      const { error: productsError } = await supabase
        .from('estimate_products')
        .insert(productsToImport);
        
      if (productsError) throw productsError;
    }
  }
};

// Helper function to import recurring invoices data
const importRecurringInvoicesData = async (
  recurringInvoices: any[],
  userId: string,
  overwriteExisting: boolean
): Promise<void> => {
  // If overwriteExisting, delete existing recurring invoices first
  if (overwriteExisting) {
    const { error: deleteError } = await supabase
      .from('recurring_invoices')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) throw deleteError;
  }
  
  // Process each recurring invoice
  for (const recurringInvoice of recurringInvoices) {
    const { products, ...recurringInvoiceData } = recurringInvoice;
    
    // Prepare recurring invoice for import
    const recurringInvoiceToImport = {
      ...recurringInvoiceData,
      user_id: userId,
      id: overwriteExisting ? recurringInvoiceData.id : undefined, // Keep original ID if overwriting
      created_at: recurringInvoiceData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert recurring invoice
    const { data: insertedRecurringInvoice, error: insertError } = await supabase
      .from('recurring_invoices')
      .insert(recurringInvoiceToImport)
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    // Prepare products for import
    const productsToImport = products.map((product: any) => ({
      ...product,
      recurring_invoice_id: insertedRecurringInvoice.id,
      id: overwriteExisting ? product.id : undefined // Keep original ID if overwriting
    }));
    
    // Insert products
    if (productsToImport.length > 0) {
      const { error: productsError } = await supabase
        .from('recurring_invoice_products')
        .insert(productsToImport);
        
      if (productsError) throw productsError;
    }
  }
};

// Helper function to import profile data
const importProfileData = async (
  profile: any,
  userId: string,
  overwriteExisting: boolean
): Promise<void> => {
  if (overwriteExisting) {
    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        ...profile,
        id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) throw updateError;
  }
};
