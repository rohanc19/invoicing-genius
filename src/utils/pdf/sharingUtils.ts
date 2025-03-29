
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import React from "react";

// Improved function to share a document via WhatsApp
export const shareDocumentViaWhatsApp = async (
  pdfBlob: Blob,
  fileName: string,
  recipientName: string,
  documentType: string,
  documentNumber: string,
  total: string
) => {
  
  try {
    // Download the PDF first
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const tempLink = document.createElement('a');
    tempLink.href = pdfUrl;
    tempLink.download = fileName;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    
    // Show user instructions toast
    toast({
      title: "PDF Downloaded",
      description: "1. The PDF has been downloaded. 2. Click 'Continue to WhatsApp' to open WhatsApp. 3. Attach the PDF manually using the clip icon.",
      duration: 7000,
    });
    
    // Wait a moment to ensure download starts
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Construct a message for WhatsApp
    const message = encodeURIComponent(
      `Hello ${recipientName},\n\n` +
      `I'm sharing ${documentType} #${documentNumber} with you.\n` +
      `Total: ${total}\n\n` +
      `Please see the attached ${documentType.toLowerCase()} document.`
    );
    
    // Create a button to continue to WhatsApp after download
    const continueToastId = "continue-to-whatsapp";
    
    // Check if toast already exists and remove it
    const existingToast = document.getElementById(continueToastId);
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create a new toast with a continue button
    setTimeout(() => {
      toast({
        title: "Continue to WhatsApp",
        description: "PDF downloaded. Click below to open WhatsApp and then attach the PDF manually.",
        action: React.createElement(ToastAction, {
          onClick: () => window.open(`https://wa.me/?text=${message}`, '_blank'),
          children: "Continue to WhatsApp"
        }),
        duration: 10000,
      });
    }, 1000);
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Error sharing via WhatsApp:', error);
    toast({
      title: "Sharing failed",
      description: "Could not share the document. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};

// Generic function to share a document via Email
export const createEmailLink = (
  recipientEmail: string,
  documentType: string,
  documentNumber: string,
  companyName: string,
  recipientName: string
) => {
  const subject = encodeURIComponent(`${documentType} ${documentNumber}`);
  const body = encodeURIComponent(
    `Hello ${recipientName},\n\nPlease find attached the ${documentType.toLowerCase()} ${documentNumber}.\n\nBest regards,\n${companyName}`
  );
  return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
};
