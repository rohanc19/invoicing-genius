import { supabase } from '@/integrations/supabase/client';
import { saveAs } from 'file-saver';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Define schema for backup data
const backupDataSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  user_id: z.string().uuid(),
  data: z.object({
    invoices: z.array(z.any()).optional(),
    estimates: z.array(z.any()).optional(),
    clients: z.array(z.any()).optional(),
    recurring_invoices: z.array(z.any()).optional(),
    profile: z.any().optional(),
    settings: z.any().optional(),
    products: z.array(z.any()).optional(),
    invoice_products: z.array(z.any()).optional(),
    estimate_products: z.array(z.any()).optional(),
    invoice_payments: z.array(z.any()).optional(),
  }),
  metadata: z.object({
    app_version: z.string().optional(),
    device_info: z.string().optional(),
    backup_type: z.enum(['manual', 'automatic']),
    backup_name: z.string().optional(),
    backup_description: z.string().optional(),
  }),
});

type BackupData = z.infer<typeof backupDataSchema>;

interface BackupOptions {
  includeInvoices?: boolean;
  includeEstimates?: boolean;
  includeClients?: boolean;
  includeRecurringInvoices?: boolean;
  includeProfile?: boolean;
  includeSettings?: boolean;
  includeProducts?: boolean;
  backupName?: string;
  backupDescription?: string;
  backupType?: 'manual' | 'automatic';
}

interface RestoreOptions {
  overwriteExisting?: boolean;
  importInvoices?: boolean;
  importEstimates?: boolean;
  importClients?: boolean;
  importRecurringInvoices?: boolean;
  importProfile?: boolean;
  importSettings?: boolean;
  importProducts?: boolean;
}

/**
 * Create a backup of user data
 * @param userId User ID
 * @param options Backup options
 * @returns Backup data object
 */
export const createBackup = async (
  userId: string,
  options: BackupOptions = {}
): Promise<BackupData> => {
  const {
    includeInvoices = true,
    includeEstimates = true,
    includeClients = true,
    includeRecurringInvoices = true,
    includeProfile = true,
    includeSettings = true,
    includeProducts = true,
    backupName = `Backup ${new Date().toLocaleDateString()}`,
    backupDescription = '',
    backupType = 'manual',
  } = options;

  try {
    const data: BackupData['data'] = {};

    // Fetch invoices
    if (includeInvoices) {
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId);

      if (invoicesError) throw invoicesError;
      data.invoices = invoices;

      // Fetch invoice products
      const { data: invoiceProducts, error: invoiceProductsError } = await supabase
        .from('invoice_products')
        .select('*')
        .in(
          'invoice_id',
          invoices.map((invoice) => invoice.id)
        );

      if (invoiceProductsError) throw invoiceProductsError;
      data.invoice_products = invoiceProducts;

      // Fetch invoice payments
      const { data: invoicePayments, error: invoicePaymentsError } = await supabase
        .from('invoice_payments')
        .select('*')
        .in(
          'invoice_id',
          invoices.map((invoice) => invoice.id)
        );

      if (invoicePaymentsError) throw invoicePaymentsError;
      data.invoice_payments = invoicePayments;
    }

    // Fetch estimates
    if (includeEstimates) {
      const { data: estimates, error: estimatesError } = await supabase
        .from('estimates')
        .select('*')
        .eq('user_id', userId);

      if (estimatesError) throw estimatesError;
      data.estimates = estimates;

      // Fetch estimate products
      const { data: estimateProducts, error: estimateProductsError } = await supabase
        .from('estimate_products')
        .select('*')
        .in(
          'estimate_id',
          estimates.map((estimate) => estimate.id)
        );

      if (estimateProductsError) throw estimateProductsError;
      data.estimate_products = estimateProducts;
    }

    // Fetch clients
    if (includeClients) {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId);

      if (clientsError) throw clientsError;
      data.clients = clients;
    }

    // Fetch recurring invoices
    if (includeRecurringInvoices) {
      const { data: recurringInvoices, error: recurringInvoicesError } = await supabase
        .from('recurring_invoices')
        .select('*')
        .eq('user_id', userId);

      if (recurringInvoicesError) throw recurringInvoicesError;
      data.recurring_invoices = recurringInvoices;
    }

    // Fetch profile
    if (includeProfile) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      data.profile = profile;
    }

    // Fetch settings
    if (includeSettings) {
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
      data.settings = settings;
    }

    // Fetch products
    if (includeProducts) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);

      if (productsError) throw productsError;
      data.products = products;
    }

    // Create backup object
    const backup: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      user_id: userId,
      data,
      metadata: {
        app_version: '1.0.0',
        device_info: navigator.userAgent,
        backup_type: backupType,
        backup_name: backupName,
        backup_description: backupDescription,
      },
    };

    // Save backup to database
    const { error: backupError } = await supabase.from('backups').insert({
      user_id: userId,
      name: backupName,
      description: backupDescription,
      data: backup,
      type: backupType,
      created_at: new Date().toISOString(),
    });

    if (backupError) throw backupError;

    return backup;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

/**
 * Download backup as a file
 * @param backup Backup data
 * @param filename Filename
 */
export const downloadBackup = (backup: BackupData, filename?: string): void => {
  try {
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });

    saveAs(
      blob,
      filename || `invoicing-genius-backup-${new Date().toISOString().split('T')[0]}.json`
    );
  } catch (error) {
    console.error('Error downloading backup:', error);
    throw error;
  }
};

/**
 * Restore data from backup
 * @param backup Backup data
 * @param userId User ID
 * @param options Restore options
 */
export const restoreFromBackup = async (
  backup: BackupData,
  userId: string,
  options: RestoreOptions = {}
): Promise<void> => {
  const {
    overwriteExisting = false,
    importInvoices = true,
    importEstimates = true,
    importClients = true,
    importRecurringInvoices = true,
    importProfile = true,
    importSettings = true,
    importProducts = true,
  } = options;

  try {
    // Validate backup data
    backupDataSchema.parse(backup);

    // Restore clients
    if (importClients && backup.data.clients) {
      if (overwriteExisting) {
        // Delete existing clients
        await supabase.from('clients').delete().eq('user_id', userId);
      }

      // Insert clients
      for (const client of backup.data.clients) {
        const newClient = {
          ...client,
          id: overwriteExisting ? client.id : uuidv4(),
          user_id: userId,
        };

        const { error } = await supabase.from('clients').insert(newClient);
        if (error) throw error;
      }
    }

    // Restore products
    if (importProducts && backup.data.products) {
      if (overwriteExisting) {
        // Delete existing products
        await supabase.from('products').delete().eq('user_id', userId);
      }

      // Insert products
      for (const product of backup.data.products) {
        const newProduct = {
          ...product,
          id: overwriteExisting ? product.id : uuidv4(),
          user_id: userId,
        };

        const { error } = await supabase.from('products').insert(newProduct);
        if (error) throw error;
      }
    }

    // Restore invoices
    if (importInvoices && backup.data.invoices) {
      if (overwriteExisting) {
        // Delete existing invoices
        await supabase.from('invoices').delete().eq('user_id', userId);
      }

      // Insert invoices
      const invoiceIdMap = new Map<string, string>();
      for (const invoice of backup.data.invoices) {
        const oldId = invoice.id;
        const newId = overwriteExisting ? oldId : uuidv4();
        invoiceIdMap.set(oldId, newId);

        const newInvoice = {
          ...invoice,
          id: newId,
          user_id: userId,
        };

        const { error } = await supabase.from('invoices').insert(newInvoice);
        if (error) throw error;
      }

      // Restore invoice products
      if (backup.data.invoice_products) {
        // Insert invoice products
        for (const product of backup.data.invoice_products) {
          const newInvoiceId = invoiceIdMap.get(product.invoice_id);
          if (!newInvoiceId) continue;

          const newProduct = {
            ...product,
            id: overwriteExisting ? product.id : uuidv4(),
            invoice_id: newInvoiceId,
          };

          const { error } = await supabase.from('invoice_products').insert(newProduct);
          if (error) throw error;
        }
      }

      // Restore invoice payments
      if (backup.data.invoice_payments) {
        // Insert invoice payments
        for (const payment of backup.data.invoice_payments) {
          const newInvoiceId = invoiceIdMap.get(payment.invoice_id);
          if (!newInvoiceId) continue;

          const newPayment = {
            ...payment,
            id: overwriteExisting ? payment.id : uuidv4(),
            invoice_id: newInvoiceId,
          };

          const { error } = await supabase.from('invoice_payments').insert(newPayment);
          if (error) throw error;
        }
      }
    }

    // Restore estimates
    if (importEstimates && backup.data.estimates) {
      if (overwriteExisting) {
        // Delete existing estimates
        await supabase.from('estimates').delete().eq('user_id', userId);
      }

      // Insert estimates
      const estimateIdMap = new Map<string, string>();
      for (const estimate of backup.data.estimates) {
        const oldId = estimate.id;
        const newId = overwriteExisting ? oldId : uuidv4();
        estimateIdMap.set(oldId, newId);

        const newEstimate = {
          ...estimate,
          id: newId,
          user_id: userId,
        };

        const { error } = await supabase.from('estimates').insert(newEstimate);
        if (error) throw error;
      }

      // Restore estimate products
      if (backup.data.estimate_products) {
        // Insert estimate products
        for (const product of backup.data.estimate_products) {
          const newEstimateId = estimateIdMap.get(product.estimate_id);
          if (!newEstimateId) continue;

          const newProduct = {
            ...product,
            id: overwriteExisting ? product.id : uuidv4(),
            estimate_id: newEstimateId,
          };

          const { error } = await supabase.from('estimate_products').insert(newProduct);
          if (error) throw error;
        }
      }
    }

    // Restore recurring invoices
    if (importRecurringInvoices && backup.data.recurring_invoices) {
      if (overwriteExisting) {
        // Delete existing recurring invoices
        await supabase.from('recurring_invoices').delete().eq('user_id', userId);
      }

      // Insert recurring invoices
      for (const invoice of backup.data.recurring_invoices) {
        const newInvoice = {
          ...invoice,
          id: overwriteExisting ? invoice.id : uuidv4(),
          user_id: userId,
        };

        const { error } = await supabase.from('recurring_invoices').insert(newInvoice);
        if (error) throw error;
      }
    }

    // Restore profile
    if (importProfile && backup.data.profile) {
      if (overwriteExisting) {
        // Update profile
        const { error } = await supabase
          .from('profiles')
          .update({
            ...backup.data.profile,
            id: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) throw error;
      }
    }

    // Restore settings
    if (importSettings && backup.data.settings) {
      if (overwriteExisting) {
        // Update settings
        const { error } = await supabase
          .from('user_settings')
          .update({
            ...backup.data.settings,
            user_id: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) throw error;
      }
    }

    // Log restore operation
    await supabase.from('backup_logs').insert({
      user_id: userId,
      backup_id: backup.metadata.backup_name,
      action: 'restore',
      details: {
        options,
        timestamp: new Date().toISOString(),
      },
    });

    toast({
      title: 'Restore Complete',
      description: 'Your data has been restored successfully.',
    });
  } catch (error) {
    console.error('Error restoring from backup:', error);
    throw error;
  }
};
