import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FileText, ArrowLeft, CreditCard, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { useTheme } from "@/contexts/ThemeContext";
import StripePaymentWrapper from "@/components/StripePaymentForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InvoiceData {
  id: string;
  invoice_number: string;
  date: string;
  due_date: string;
  client_name: string;
  client_email: string | null;
  client_address: string | null;
  your_company: string | null;
  your_email: string | null;
  your_address: string | null;
  notes: string | null;
  status: string;
  total_amount: number;
  total_paid: number;
}

const ClientPayment = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [paymentTab, setPaymentTab] = useState<string>('card');

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Fetch client information and invoice
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user || !id) return;
        
        setIsLoading(true);
        
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
          navigate('/client');
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
        
        // Check if client has access to this invoice
        const { data: accessData, error: accessError } = await supabase
          .from('client_access')
          .select('*')
          .eq('client_id', clientUserData.client_id)
          .eq('invoice_id', id)
          .single();
          
        if (accessError) {
          toast({
            title: "Access denied",
            description: "You don't have access to this invoice.",
            variant: "destructive",
          });
          navigate('/client');
          return;
        }
        
        // Fetch invoice details
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .single();
        
        if (invoiceError) throw invoiceError;
        
        // Fetch invoice products
        const { data: productsData, error: productsError } = await supabase
          .from('invoice_products')
          .select('*')
          .eq('invoice_id', id);
        
        if (productsError) throw productsError;
        
        // Fetch payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('invoice_payments')
          .select('*')
          .eq('invoice_id', id)
          .order('date', { ascending: false });
          
        if (paymentsError) throw paymentsError;
        
        // Calculate total amount
        const total = (productsData || []).reduce((sum, product) => {
          const lineTotal = product.quantity * product.price;
          const lineTax = lineTotal * (product.tax / 100);
          const lineDiscount = lineTotal * (product.discount / 100);
          return sum + lineTotal + lineTax - lineDiscount;
        }, 0);
        
        // Calculate total paid
        const totalPaid = (paymentsData || []).reduce((sum, payment) => {
          return sum + payment.amount;
        }, 0);
        
        const fullInvoice = {
          ...invoiceData,
          total_amount: total,
          total_paid: totalPaid
        };
        
        setInvoice(fullInvoice);
      } catch (error: any) {
        toast({
          title: "Error fetching invoice",
          description: error.message,
          variant: "destructive",
        });
        navigate('/client');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const handlePaymentSuccess = () => {
    navigate(`/client/invoice/${id}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-center">Loading payment details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-4">Invoice not found</h2>
              <Button onClick={() => navigate('/client')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Client Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Calculate remaining amount
  const remainingAmount = Math.max(0, invoice.total_amount - invoice.total_paid);
  
  // Check if invoice is already paid
  if (remainingAmount <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
        <div className="bg-primary text-white p-4 mb-8 dark:bg-gray-800">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <h1 className="text-xl font-bold">Client Portal</h1>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="text-green-600 mb-4">
                  <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Invoice Already Paid</h2>
                <p className="mb-6 text-muted-foreground">
                  This invoice has been fully paid. Thank you for your payment!
                </p>
                <Button onClick={() => navigate(`/client/invoice/${id}`)}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(`/client/invoice/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoice
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
                    <p className="font-medium">{invoice.invoice_number}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">From</h3>
                    <p className="font-medium">{invoice.your_company || 'Company'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                    <p className="font-medium">{invoice.due_date ? format(new Date(invoice.due_date), 'MMMM dd, yyyy') : 'N/A'}</p>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
                    <p className="text-xl font-bold">{formatCurrency(invoice.total_amount)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Amount Paid</h3>
                    <p className="text-green-600 font-medium">{formatCurrency(invoice.total_paid)}</p>
                  </div>
                  
                  <div className="pt-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Balance Due</h3>
                    <p className="text-xl font-bold text-amber-600">{formatCurrency(remainingAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Make a Payment</CardTitle>
                <CardDescription>
                  Choose your payment method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="card" value={paymentTab} onValueChange={setPaymentTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="card">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Credit Card
                    </TabsTrigger>
                    <TabsTrigger value="manual">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Manual Payment
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="card" className="pt-4">
                    <StripePaymentWrapper 
                      invoiceId={invoice.id}
                      amount={remainingAmount}
                      onSuccess={handlePaymentSuccess}
                      onCancel={() => navigate(`/client/invoice/${id}`)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="manual" className="pt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Manual Payment Instructions</CardTitle>
                        <CardDescription>
                          Follow these instructions to make a manual payment
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium">Bank Transfer</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Please transfer {formatCurrency(remainingAmount)} to the following account:
                            </p>
                            <div className="bg-muted p-3 rounded-md mt-2 text-sm">
                              <p><span className="font-medium">Bank:</span> Example Bank</p>
                              <p><span className="font-medium">Account Name:</span> {invoice.your_company}</p>
                              <p><span className="font-medium">Account Number:</span> XXXX-XXXX-XXXX</p>
                              <p><span className="font-medium">Reference:</span> INV-{invoice.invoice_number}</p>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t">
                            <h3 className="font-medium">After Payment</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              After making your payment, please notify us by clicking the button below or contacting us directly.
                            </p>
                            <Button 
                              className="mt-4"
                              onClick={() => navigate(`/client/invoice/${id}`)}
                            >
                              I've Made a Payment
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPayment;
