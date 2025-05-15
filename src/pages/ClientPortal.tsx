import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  ExternalLink, 
  FileBarChart,
  User,
  LogOut,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { z } from "zod";

// Define payment schema using Zod
const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
});

interface ClientInvoice {
  id: string;
  invoice_number: string;
  date: string;
  due_date: string;
  total_amount: number;
  status: string;
  business_name: string;
}

interface ClientEstimate {
  id: string;
  estimate_number: string;
  date: string;
  due_date: string;
  total_amount: number;
  status: string;
  business_name: string;
}

const ClientPortal = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [estimates, setEstimates] = useState<ClientEstimate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: "card",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Fetch client information
  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        if (!user) return;
        
        // Get client ID for this user
        const { data: clientUserData, error: clientUserError } = await supabase
          .from('client_users')
          .select('client_id')
          .eq('user_id', user.id)
          .single();
          
        if (clientUserError) throw clientUserError;
        
        if (!clientUserData) {
          toast({
            title: "No client account found",
            description: "You don't have a client account associated with this login.",
            variant: "destructive",
          });
          return;
        }
        
        // Get client details
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientUserData.client_id)
          .single();
          
        if (clientError) throw clientError;
        
        setClientInfo(clientData);
        
        // Fetch invoices for this client
        const { data: invoiceAccessData, error: invoiceAccessError } = await supabase
          .from('client_access')
          .select('invoice_id')
          .eq('client_id', clientUserData.client_id)
          .not('invoice_id', 'is', null);
          
        if (invoiceAccessError) throw invoiceAccessError;
        
        if (invoiceAccessData && invoiceAccessData.length > 0) {
          const invoiceIds = invoiceAccessData.map(item => item.invoice_id);
          
          const { data: invoicesData, error: invoicesError } = await supabase
            .from('invoices')
            .select(`
              id,
              invoice_number,
              date,
              due_date,
              status,
              your_company
            `)
            .in('id', invoiceIds);
            
          if (invoicesError) throw invoicesError;
          
          // Calculate totals for each invoice
          const invoicesWithTotals = await Promise.all(
            (invoicesData || []).map(async (invoice) => {
              const { data: products, error: productsError } = await supabase
                .from('invoice_products')
                .select('*')
                .eq('invoice_id', invoice.id);
                
              if (productsError) throw productsError;
                
              const total = (products || []).reduce((sum, product) => {
                const lineTotal = product.quantity * product.price;
                const lineTax = lineTotal * (product.tax / 100);
                const lineDiscount = lineTotal * (product.discount / 100);
                return sum + lineTotal + lineTax - lineDiscount;
              }, 0);
                
              return {
                id: invoice.id,
                invoice_number: invoice.invoice_number,
                date: invoice.date,
                due_date: invoice.due_date,
                total_amount: total,
                status: invoice.status || 'unpaid',
                business_name: invoice.your_company
              };
            })
          );
            
          setInvoices(invoicesWithTotals);
        }
        
        // Fetch estimates for this client
        const { data: estimateAccessData, error: estimateAccessError } = await supabase
          .from('client_access')
          .select('estimate_id')
          .eq('client_id', clientUserData.client_id)
          .not('estimate_id', 'is', null);
          
        if (estimateAccessError) throw estimateAccessError;
        
        if (estimateAccessData && estimateAccessData.length > 0) {
          const estimateIds = estimateAccessData.map(item => item.estimate_id);
          
          const { data: estimatesData, error: estimatesError } = await supabase
            .from('estimates')
            .select(`
              id,
              estimate_number,
              date,
              due_date,
              status,
              your_company
            `)
            .in('id', estimateIds);
            
          if (estimatesError) throw estimatesError;
          
          // Calculate totals for each estimate
          const estimatesWithTotals = await Promise.all(
            (estimatesData || []).map(async (estimate) => {
              const { data: products, error: productsError } = await supabase
                .from('estimate_products')
                .select('*')
                .eq('estimate_id', estimate.id);
                
              if (productsError) throw productsError;
                
              const total = (products || []).reduce((sum, product) => {
                const lineTotal = product.quantity * product.price;
                const lineTax = lineTotal * (product.tax / 100);
                const lineDiscount = lineTotal * (product.discount / 100);
                return sum + lineTotal + lineTax - lineDiscount;
              }, 0);
                
              return {
                id: estimate.id,
                estimate_number: estimate.estimate_number,
                date: estimate.date,
                due_date: estimate.due_date,
                total_amount: total,
                status: estimate.status || 'draft',
                business_name: estimate.your_company
              };
            })
          );
            
          setEstimates(estimatesWithTotals);
        }
      } catch (error: any) {
        toast({
          title: "Error fetching client data",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientInfo();
  }, [user]);

  // Handle payment dialog open
  const handlePaymentDialogOpen = (invoice: ClientInvoice) => {
    setSelectedInvoice(invoice);
    setPaymentDetails({
      ...paymentDetails,
      amount: invoice.total_amount
    });
    setIsPaymentDialogOpen(true);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      setPaymentDetails(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setPaymentDetails(prev => ({
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
    setPaymentDetails(prev => ({
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
      paymentSchema.parse(paymentDetails);
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

  // Submit payment
  const submitPayment = async () => {
    if (!selectedInvoice) return;
    
    if (!validatePayment()) return;
    
    try {
      setIsSubmitting(true);
      
      // Insert payment
      const { data, error } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: selectedInvoice.id,
          amount: paymentDetails.amount,
          date: paymentDetails.date,
          method: paymentDetails.method,
          notes: paymentDetails.notes || null
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Check if invoice is fully paid
      if (paymentDetails.amount >= selectedInvoice.total_amount) {
        // Update invoice status to paid
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', selectedInvoice.id);
          
        if (updateError) throw updateError;
        
        // Update local state
        setInvoices(prev => 
          prev.map(invoice => 
            invoice.id === selectedInvoice.id 
              ? { ...invoice, status: 'paid' } 
              : invoice
          )
        );
      }
      
      toast({
        title: "Payment submitted",
        description: "Your payment has been recorded successfully.",
        variant: "default",
      });
      
      // Close dialog and reset form
      setIsPaymentDialogOpen(false);
      setPaymentDetails({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        method: "card",
        notes: "",
      });
      setSelectedInvoice(null);
      
    } catch (error: any) {
      toast({
        title: "Error submitting payment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="bg-primary text-white p-4 mb-8 dark:bg-gray-800">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-bold">Client Portal</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-white hover:text-white hover:bg-primary/80 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            {clientInfo && (
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className="text-sm hidden md:inline">{clientInfo.client_name}</span>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-white hover:text-white hover:bg-primary/80 dark:hover:bg-gray-700"
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-12">Loading your data...</div>
        ) : !clientInfo ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Client Account Found</h2>
                <p className="mb-4">You don't have a client account associated with this login.</p>
                <Button onClick={signOut}>Sign Out</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome, {clientInfo.client_name}</CardTitle>
                  <CardDescription>
                    View and manage your invoices and estimates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Your Information</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Email:</span> {clientInfo.client_email || 'Not provided'}</p>
                        <p><span className="font-medium">Address:</span> {clientInfo.client_address || 'Not provided'}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Quick Actions</h3>
                      <div className="flex flex-wrap gap-2">
                        {invoices.some(invoice => invoice.status !== 'paid') && (
                          <Button variant="outline" size="sm">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Make a Payment
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View Documents
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Your Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">You don't have any invoices yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Business</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                              <TableCell>{invoice.business_name}</TableCell>
                              <TableCell>{invoice.date ? format(new Date(invoice.date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                              <TableCell>{invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                              <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                              <TableCell>
                                <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                                  {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    asChild
                                  >
                                    <Link to={`/client/invoice/${invoice.id}`}>
                                      <ExternalLink className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  {invoice.status !== 'paid' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handlePaymentDialogOpen(invoice)}
                                    >
                                      <DollarSign className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileBarChart className="h-5 w-5 mr-2" />
                    Your Estimates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {estimates.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">You don't have any estimates yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Estimate #</TableHead>
                            <TableHead>Business</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {estimates.map((estimate) => (
                            <TableRow key={estimate.id}>
                              <TableCell className="font-medium">{estimate.estimate_number}</TableCell>
                              <TableCell>{estimate.business_name}</TableCell>
                              <TableCell>{estimate.date ? format(new Date(estimate.date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                              <TableCell>{estimate.due_date ? format(new Date(estimate.due_date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                              <TableCell>{formatCurrency(estimate.total_amount)}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  estimate.status === 'accepted' ? 'default' : 
                                  estimate.status === 'declined' ? 'destructive' : 
                                  'secondary'
                                }>
                                  {estimate.status === 'accepted' ? 'Accepted' : 
                                   estimate.status === 'declined' ? 'Declined' : 
                                   estimate.status === 'sent' ? 'Pending' : 'Draft'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  asChild
                                >
                                  <Link to={`/client/estimate/${estimate.id}`}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
      
      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a Payment</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>Record a payment for invoice #{selectedInvoice.invoice_number}</>
              )}
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
                  value={paymentDetails.amount || ''}
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
                  value={paymentDetails.date}
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
                value={paymentDetails.method}
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
                value={paymentDetails.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPayment} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Submit Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientPortal;
