import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";
import { Estimate } from "@/types/estimate";
import { exportToPDF } from "./pdfUtils";

// Email templates
const EMAIL_TEMPLATES = {
  INVOICE_CREATED: 'invoice_created',
  INVOICE_REMINDER: 'invoice_reminder',
  INVOICE_OVERDUE: 'invoice_overdue',
  INVOICE_PAID: 'invoice_paid',
  ESTIMATE_CREATED: 'estimate_created',
  ESTIMATE_REMINDER: 'estimate_reminder',
  ESTIMATE_ACCEPTED: 'estimate_accepted',
  ESTIMATE_DECLINED: 'estimate_declined',
  CLIENT_PORTAL_INVITE: 'client_portal_invite',
  PAYMENT_RECEIVED: 'payment_received',
};

/**
 * Send an email using Supabase Edge Functions
 * @param to Recipient email address
 * @param templateId Email template ID
 * @param data Data to populate the template
 * @param attachmentUrl Optional URL to a file attachment
 */
export const sendEmail = async (
  to: string,
  templateId: string,
  data: Record<string, any>,
  attachmentUrl?: string
): Promise<boolean> => {
  try {
    // Call Supabase Edge Function for sending emails
    const { data: response, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        templateId,
        data,
        attachmentUrl
      }
    });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send an invoice to a client via email
 * @param invoice Invoice data
 * @param recipientEmail Client email address
 * @param message Optional custom message
 */
export const sendInvoiceEmail = async (
  invoice: Invoice,
  recipientEmail: string,
  message?: string
): Promise<boolean> => {
  try {
    // Generate PDF and get temporary URL
    const pdfBlob = await exportToPDF(invoice, true, true);
    
    if (!pdfBlob) {
      throw new Error('Failed to generate PDF');
    }
    
    // Upload PDF to Supabase Storage
    const fileName = `invoices/${invoice.details.invoiceNumber}_${Date.now()}.pdf`;
    const { data: fileData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
      
    if (uploadError) throw uploadError;
    
    // Get public URL for the file
    const { data: urlData } = await supabase.storage
      .from('documents')
      .getPublicUrl(fileName);
      
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for the file');
    }
    
    // Send email with attachment
    return await sendEmail(
      recipientEmail,
      EMAIL_TEMPLATES.INVOICE_CREATED,
      {
        invoiceNumber: invoice.details.invoiceNumber,
        clientName: invoice.details.clientName,
        amount: calculateTotal(invoice),
        dueDate: invoice.details.dueDate,
        message: message || '',
        businessName: invoice.details.yourCompany,
        viewUrl: `${window.location.origin}/client/invoice/${invoice.id}`
      },
      urlData.publicUrl
    );
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
};

/**
 * Send an estimate to a client via email
 * @param estimate Estimate data
 * @param recipientEmail Client email address
 * @param message Optional custom message
 */
export const sendEstimateEmail = async (
  estimate: Estimate,
  recipientEmail: string,
  message?: string
): Promise<boolean> => {
  try {
    // Generate PDF and get temporary URL
    const pdfBlob = await exportToPDF(estimate, true, true);
    
    if (!pdfBlob) {
      throw new Error('Failed to generate PDF');
    }
    
    // Upload PDF to Supabase Storage
    const fileName = `estimates/${estimate.details.estimateNumber}_${Date.now()}.pdf`;
    const { data: fileData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
      
    if (uploadError) throw uploadError;
    
    // Get public URL for the file
    const { data: urlData } = await supabase.storage
      .from('documents')
      .getPublicUrl(fileName);
      
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for the file');
    }
    
    // Send email with attachment
    return await sendEmail(
      recipientEmail,
      EMAIL_TEMPLATES.ESTIMATE_CREATED,
      {
        estimateNumber: estimate.details.estimateNumber,
        clientName: estimate.details.clientName,
        amount: calculateTotal(estimate),
        expiryDate: estimate.details.dueDate,
        message: message || '',
        businessName: estimate.details.yourCompany,
        viewUrl: `${window.location.origin}/client/estimate/${estimate.id}`
      },
      urlData.publicUrl
    );
  } catch (error) {
    console.error('Error sending estimate email:', error);
    return false;
  }
};

/**
 * Send a payment receipt to a client
 * @param invoiceId Invoice ID
 * @param paymentAmount Payment amount
 * @param recipientEmail Client email address
 */
export const sendPaymentReceiptEmail = async (
  invoiceId: string,
  invoiceNumber: string,
  paymentAmount: number,
  recipientEmail: string,
  businessName: string
): Promise<boolean> => {
  try {
    return await sendEmail(
      recipientEmail,
      EMAIL_TEMPLATES.PAYMENT_RECEIVED,
      {
        invoiceNumber,
        amount: formatCurrency(paymentAmount),
        date: new Date().toLocaleDateString(),
        businessName,
        viewUrl: `${window.location.origin}/client/invoice/${invoiceId}`
      }
    );
  } catch (error) {
    console.error('Error sending payment receipt:', error);
    return false;
  }
};

/**
 * Send a client portal invitation
 * @param clientEmail Client email address
 * @param clientName Client name
 * @param businessName Your business name
 * @param inviteUrl Invitation URL
 */
export const sendClientPortalInvite = async (
  clientEmail: string,
  clientName: string,
  businessName: string,
  inviteUrl: string
): Promise<boolean> => {
  try {
    return await sendEmail(
      clientEmail,
      EMAIL_TEMPLATES.CLIENT_PORTAL_INVITE,
      {
        clientName,
        businessName,
        inviteUrl
      }
    );
  } catch (error) {
    console.error('Error sending client portal invite:', error);
    return false;
  }
};

/**
 * Send an invoice reminder to a client
 * @param invoiceId Invoice ID
 * @param invoiceNumber Invoice number
 * @param dueDate Due date
 * @param amount Invoice amount
 * @param recipientEmail Client email address
 * @param businessName Your business name
 */
export const sendInvoiceReminderEmail = async (
  invoiceId: string,
  invoiceNumber: string,
  dueDate: string,
  amount: number,
  recipientEmail: string,
  businessName: string
): Promise<boolean> => {
  try {
    return await sendEmail(
      recipientEmail,
      EMAIL_TEMPLATES.INVOICE_REMINDER,
      {
        invoiceNumber,
        dueDate: new Date(dueDate).toLocaleDateString(),
        amount: formatCurrency(amount),
        businessName,
        viewUrl: `${window.location.origin}/client/invoice/${invoiceId}`
      }
    );
  } catch (error) {
    console.error('Error sending invoice reminder:', error);
    return false;
  }
};

/**
 * Send an overdue invoice notification to a client
 * @param invoiceId Invoice ID
 * @param invoiceNumber Invoice number
 * @param dueDate Due date
 * @param amount Invoice amount
 * @param recipientEmail Client email address
 * @param businessName Your business name
 */
export const sendOverdueInvoiceEmail = async (
  invoiceId: string,
  invoiceNumber: string,
  dueDate: string,
  amount: number,
  recipientEmail: string,
  businessName: string
): Promise<boolean> => {
  try {
    return await sendEmail(
      recipientEmail,
      EMAIL_TEMPLATES.INVOICE_OVERDUE,
      {
        invoiceNumber,
        dueDate: new Date(dueDate).toLocaleDateString(),
        amount: formatCurrency(amount),
        businessName,
        daysOverdue: calculateDaysOverdue(dueDate),
        viewUrl: `${window.location.origin}/client/invoice/${invoiceId}`
      }
    );
  } catch (error) {
    console.error('Error sending overdue invoice notification:', error);
    return false;
  }
};

// Helper functions
const calculateTotal = (document: Invoice | Estimate): string => {
  const total = document.products.reduce((sum, product) => {
    const lineTotal = product.quantity * product.price;
    const lineTax = lineTotal * (product.tax / 100);
    const lineDiscount = lineTotal * (product.discount / 100);
    return sum + lineTotal + lineTax - lineDiscount;
  }, 0);
  
  return formatCurrency(total);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const calculateDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
