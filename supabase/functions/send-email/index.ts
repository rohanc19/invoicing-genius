// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Email templates
const EMAIL_TEMPLATES = {
  INVOICE_CREATED: {
    subject: "New Invoice from {{businessName}}",
    html: `
      <h1>Invoice #{{invoiceNumber}}</h1>
      <p>Dear {{clientName}},</p>
      <p>A new invoice has been created for you.</p>
      <p><strong>Invoice Number:</strong> {{invoiceNumber}}</p>
      <p><strong>Amount:</strong> {{amount}}</p>
      <p><strong>Due Date:</strong> {{dueDate}}</p>
      {{#if message}}
      <p><strong>Message:</strong> {{message}}</p>
      {{/if}}
      <p>You can view and pay your invoice by clicking the button below:</p>
      <p><a href="{{viewUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View Invoice</a></p>
      <p>Thank you for your business!</p>
      <p>Regards,<br>{{businessName}}</p>
    `,
  },
  INVOICE_REMINDER: {
    subject: "Invoice Reminder from {{businessName}}",
    html: `
      <h1>Invoice Reminder</h1>
      <p>Dear Client,</p>
      <p>This is a friendly reminder that invoice #{{invoiceNumber}} is due on {{dueDate}}.</p>
      <p><strong>Invoice Number:</strong> {{invoiceNumber}}</p>
      <p><strong>Amount:</strong> {{amount}}</p>
      <p><strong>Due Date:</strong> {{dueDate}}</p>
      <p>You can view and pay your invoice by clicking the button below:</p>
      <p><a href="{{viewUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View Invoice</a></p>
      <p>Thank you for your business!</p>
      <p>Regards,<br>{{businessName}}</p>
    `,
  },
  INVOICE_OVERDUE: {
    subject: "Overdue Invoice from {{businessName}}",
    html: `
      <h1>Overdue Invoice</h1>
      <p>Dear Client,</p>
      <p>This is to inform you that invoice #{{invoiceNumber}} is now {{daysOverdue}} days overdue.</p>
      <p><strong>Invoice Number:</strong> {{invoiceNumber}}</p>
      <p><strong>Amount:</strong> {{amount}}</p>
      <p><strong>Due Date:</strong> {{dueDate}}</p>
      <p>Please make payment as soon as possible to avoid any further delays.</p>
      <p>You can view and pay your invoice by clicking the button below:</p>
      <p><a href="{{viewUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View Invoice</a></p>
      <p>Thank you for your attention to this matter.</p>
      <p>Regards,<br>{{businessName}}</p>
    `,
  },
  INVOICE_PAID: {
    subject: "Invoice Paid - {{businessName}}",
    html: `
      <h1>Invoice Paid</h1>
      <p>Dear Client,</p>
      <p>Thank you for your payment of invoice #{{invoiceNumber}}.</p>
      <p><strong>Invoice Number:</strong> {{invoiceNumber}}</p>
      <p><strong>Amount Paid:</strong> {{amount}}</p>
      <p><strong>Payment Date:</strong> {{paymentDate}}</p>
      <p>You can view your invoice by clicking the button below:</p>
      <p><a href="{{viewUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View Invoice</a></p>
      <p>We appreciate your business!</p>
      <p>Regards,<br>{{businessName}}</p>
    `,
  },
  ESTIMATE_CREATED: {
    subject: "New Estimate from {{businessName}}",
    html: `
      <h1>Estimate #{{estimateNumber}}</h1>
      <p>Dear {{clientName}},</p>
      <p>A new estimate has been created for you.</p>
      <p><strong>Estimate Number:</strong> {{estimateNumber}}</p>
      <p><strong>Amount:</strong> {{amount}}</p>
      <p><strong>Valid Until:</strong> {{expiryDate}}</p>
      {{#if message}}
      <p><strong>Message:</strong> {{message}}</p>
      {{/if}}
      <p>You can view and respond to your estimate by clicking the button below:</p>
      <p><a href="{{viewUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View Estimate</a></p>
      <p>Thank you for considering our services!</p>
      <p>Regards,<br>{{businessName}}</p>
    `,
  },
  ESTIMATE_REMINDER: {
    subject: "Estimate Reminder from {{businessName}}",
    html: `
      <h1>Estimate Reminder</h1>
      <p>Dear Client,</p>
      <p>This is a friendly reminder about estimate #{{estimateNumber}} which is valid until {{expiryDate}}.</p>
      <p><strong>Estimate Number:</strong> {{estimateNumber}}</p>
      <p><strong>Amount:</strong> {{amount}}</p>
      <p><strong>Valid Until:</strong> {{expiryDate}}</p>
      <p>You can view and respond to your estimate by clicking the button below:</p>
      <p><a href="{{viewUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View Estimate</a></p>
      <p>Thank you for considering our services!</p>
      <p>Regards,<br>{{businessName}}</p>
    `,
  },
  ESTIMATE_ACCEPTED: {
    subject: "Estimate Accepted - {{businessName}}",
    html: `
      <h1>Estimate Accepted</h1>
      <p>Dear Client,</p>
      <p>Thank you for accepting estimate #{{estimateNumber}}.</p>
      <p><strong>Estimate Number:</strong> {{estimateNumber}}</p>
      <p><strong>Amount:</strong> {{amount}}</p>
      <p>We will be in touch shortly to discuss next steps.</p>
      <p>You can view your estimate by clicking the button below:</p>
      <p><a href="{{viewUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View Estimate</a></p>
      <p>We look forward to working with you!</p>
      <p>Regards,<br>{{businessName}}</p>
    `,
  },
  ESTIMATE_DECLINED: {
    subject: "Estimate Declined - {{businessName}}",
    html: `
      <h1>Estimate Declined</h1>
      <p>Dear Client,</p>
      <p>We notice that you have declined estimate #{{estimateNumber}}.</p>
      <p><strong>Estimate Number:</strong> {{estimateNumber}}</p>
      <p><strong>Amount:</strong> {{amount}}</p>
      <p>If you have any questions or would like to discuss alternatives, please don't hesitate to contact us.</p>
      <p>You can view your estimate by clicking the button below:</p>
      <p><a href="{{viewUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View Estimate</a></p>
      <p>Thank you for considering our services.</p>
      <p>Regards,<br>{{businessName}}</p>
    `,
  },
  CLIENT_PORTAL_INVITE: {
    subject: "Client Portal Invitation - {{businessName}}",
    html: `
      <h1>Client Portal Invitation</h1>
      <p>Dear {{clientName}},</p>
      <p>You have been invited to access the client portal for {{businessName}}.</p>
      <p>In the client portal, you can:</p>
      <ul>
        <li>View and pay invoices</li>
        <li>View and respond to estimates</li>
        <li>Track payment history</li>
        <li>Download documents</li>
      </ul>
      <p>Click the button below to set up your account:</p>
      <p><a href="{{inviteUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">Set Up Account</a></p>
      <p>This invitation link will expire in 7 days.</p>
      <p>Thank you for your business!</p>
      <p>Regards,<br>{{businessName}}</p>
    `,
  },
  PAYMENT_RECEIVED: {
    subject: "Payment Receipt - {{businessName}}",
    html: `
      <h1>Payment Receipt</h1>
      <p>Dear Client,</p>
      <p>We have received your payment for invoice #{{invoiceNumber}}.</p>
      <p><strong>Invoice Number:</strong> {{invoiceNumber}}</p>
      <p><strong>Amount Paid:</strong> {{amount}}</p>
      <p><strong>Payment Date:</strong> {{date}}</p>
      <p>You can view your invoice by clicking the button below:</p>
      <p><a href="{{viewUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View Invoice</a></p>
      <p>Thank you for your business!</p>
      <p>Regards,<br>{{businessName}}</p>
    `,
  },
};

// Function to replace template variables
function compileTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const keys = key.trim().split('.');
    let value = data;
    
    for (const k of keys) {
      value = value[k];
      if (value === undefined) return '';
    }
    
    return value;
  });
}

// Function to handle conditional blocks in templates
function processConditionals(template: string, data: Record<string, any>): string {
  // Handle {{#if variable}}...{{/if}} blocks
  return template.replace(/\{\{#if ([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, condition, content) => {
    const conditionValue = data[condition.trim()];
    return conditionValue ? content : '';
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { to, templateId, data, attachmentUrl } = await req.json();
    
    // Validate required fields
    if (!to || !templateId || !data) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Get template
    const template = EMAIL_TEMPLATES[templateId as keyof typeof EMAIL_TEMPLATES];
    
    if (!template) {
      return new Response(
        JSON.stringify({ error: "Invalid template ID" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Process template
    let htmlContent = processConditionals(template.html, data);
    htmlContent = compileTemplate(htmlContent, data);
    const subject = compileTemplate(template.subject, data);
    
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Log email to database for record keeping
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient: to,
        subject,
        template_id: templateId,
        data_json: data,
        attachment_url: attachmentUrl || null
      });
      
    if (logError) {
      console.error("Error logging email:", logError);
    }
    
    // Prepare email payload
    const emailPayload: any = {
      from: "invoicing-genius@resend.dev",
      to,
      subject,
      html: htmlContent,
    };
    
    // Add attachment if provided
    if (attachmentUrl) {
      emailPayload.attachments = [
        {
          filename: attachmentUrl.split('/').pop(),
          path: attachmentUrl
        }
      ];
    }
    
    // Send email using Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(emailPayload)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to send email");
    }
    
    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
