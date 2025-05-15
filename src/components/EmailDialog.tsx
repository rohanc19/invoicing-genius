import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { sendInvoiceEmail, sendEstimateEmail } from "@/utils/emailUtils";
import { Invoice } from "@/types/invoice";
import { Estimate } from "@/types/estimate";
import { Mail, Loader2 } from "lucide-react";

interface EmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: Invoice | Estimate;
  documentType: 'invoice' | 'estimate';
  recipientEmail?: string;
  recipientName?: string;
}

const EmailDialog: React.FC<EmailDialogProps> = ({
  isOpen,
  onClose,
  document,
  documentType,
  recipientEmail = '',
  recipientName = ''
}) => {
  const [email, setEmail] = useState(recipientEmail);
  const [subject, setSubject] = useState(
    documentType === 'invoice' 
      ? `Invoice #${(document as Invoice).details.invoiceNumber}` 
      : `Estimate #${(document as Estimate).details.estimateNumber}`
  );
  const [message, setMessage] = useState('');
  const [attachPdf, setAttachPdf] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let success;
      
      if (documentType === 'invoice') {
        success = await sendInvoiceEmail(
          document as Invoice,
          email,
          message
        );
      } else {
        success = await sendEstimateEmail(
          document as Estimate,
          email,
          message
        );
      }
      
      if (success) {
        toast({
          title: "Email sent",
          description: `The ${documentType} has been sent to ${email}`,
        });
        onClose();
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error: any) {
      toast({
        title: "Error sending email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send {documentType === 'invoice' ? 'Invoice' : 'Estimate'} via Email</DialogTitle>
          <DialogDescription>
            Send this {documentType} to your client via email.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Enter a message to include with your ${documentType}...`}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="attachPdf"
              checked={attachPdf}
              onCheckedChange={(checked) => setAttachPdf(checked as boolean)}
            />
            <Label htmlFor="attachPdf" className="text-sm font-normal">
              Attach PDF
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailDialog;
