import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DollarSign, 
  Plus, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

// Define payment schema using Zod
const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
});

type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  date: string;
  method: string;
  notes?: string;
  created_at: string;
};

interface PaymentTrackerProps {
  invoiceId: string;
  totalAmount: number;
  onPaymentUpdate: () => void;
}

const PaymentTracker: React.FC<PaymentTrackerProps> = ({ 
  invoiceId, 
  totalAmount,
  onPaymentUpdate
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: "card",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [totalPaid, setTotalPaid] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(totalAmount);

  // Fetch payments
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('invoice_payments')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('date', { ascending: false });
          
        if (error) throw error;
        
        setPayments(data || []);
        
        // Calculate total paid
        const paid = (data || []).reduce((sum, payment) => sum + payment.amount, 0);
        setTotalPaid(paid);
        setRemainingAmount(totalAmount - paid);
        
      } catch (error: any) {
        toast({
          title: "Error fetching payments",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPayments();
  }, [invoiceId, totalAmount]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      setNewPayment(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setNewPayment(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Handle select change
  const handleSelectChange = (value: string) => {
    setNewPayment(prev => ({
      ...prev,
      method: value
    }));
    
    // Clear error for method field
    if (errors.method) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.method;
        return updated;
      });
    }
  };

  // Validate payment
  const validatePayment = () => {
    try {
      paymentSchema.parse(newPayment);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Add payment
  const addPayment = async () => {
    if (!validatePayment()) return;
    
    try {
      setIsLoading(true);
      
      // Insert payment
      const { data, error } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: invoiceId,
          amount: newPayment.amount,
          date: newPayment.date,
          method: newPayment.method,
          notes: newPayment.notes || null
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update payments list
      setPayments(prev => [data, ...prev]);
      
      // Calculate new totals
      const newTotalPaid = totalPaid + newPayment.amount;
      setTotalPaid(newTotalPaid);
      setRemainingAmount(totalAmount - newTotalPaid);
      
      // Check if invoice is fully paid
      if (newTotalPaid >= totalAmount) {
        // Update invoice status to paid
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', invoiceId);
          
        if (updateError) throw updateError;
        
        toast({
          title: "Invoice marked as paid",
          description: "The invoice has been fully paid and its status has been updated.",
          variant: "default",
        });
        
        // Notify parent component
        onPaymentUpdate();
      } else {
        toast({
          title: "Payment added",
          description: "The payment has been recorded successfully.",
          variant: "default",
        });
      }
      
      // Reset form
      setNewPayment({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        method: "card",
        notes: "",
      });
      
      // Close dialog
      setIsAddingPayment(false);
      
    } catch (error: any) {
      toast({
        title: "Error adding payment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Payment Tracking</span>
          <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>
                  Add a new payment for this invoice.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      className="pl-8"
                      value={newPayment.amount || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-sm text-destructive">{errors.amount}</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      className="pl-8"
                      value={newPayment.date}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.date && (
                    <p className="text-sm text-destructive">{errors.date}</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select
                    value={newPayment.method}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.method && (
                    <p className="text-sm text-destructive">{errors.method}</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    name="notes"
                    value={newPayment.notes}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingPayment(false)}>
                  Cancel
                </Button>
                <Button onClick={addPayment} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Payment"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Track payments for this invoice
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Amount</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount)}
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-1">Amount Paid</div>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPaid)}
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-1">Remaining</div>
            <div className="text-2xl font-bold text-amber-600">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(remainingAmount)}
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No payments recorded</h3>
            <p className="mb-4">Record a payment to track the invoice status</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{format(new Date(payment.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(payment.method)}
                      <span className="capitalize">{payment.method}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payment.amount)}
                  </TableCell>
                  <TableCell>{payment.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
        </div>
        {remainingAmount <= 0 && (
          <div className="flex items-center text-green-600">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Fully Paid</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default PaymentTracker;
