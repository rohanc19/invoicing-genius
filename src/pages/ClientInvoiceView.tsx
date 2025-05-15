import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FileText, ArrowLeft, Printer, Download, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { exportToPDF } from "@/utils/pdfUtils";
import { useTheme } from "@/contexts/ThemeContext";

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
  products: any[];
  total_amount: number;
  payments: any[];
  total_paid: number;
}

const ClientInvoiceView = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<any>(null);

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
          products: productsData || [],
          total_amount: total,
          payments: paymentsData || [],
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

  const handlePrint = () => {
    if (!invoice) return;
    
    const invoiceForPdf = {
      details: {
        invoiceNumber: invoice.invoice_number,
        date: invoice.date,
        dueDate: invoice.due_date,
        clientName: invoice.client_name,
        clientEmail: invoice.client_email || '',
        clientAddress: invoice.client_address || '',
        yourCompany: invoice.your_company || '',
        yourEmail: invoice.your_email || '',
        yourAddress: invoice.your_address || '',
      },
      products: invoice.products,
      notes: invoice.notes || '',
    };
    
    exportToPDF(invoiceForPdf);
  };
  
  const handleDownload = () => {
    if (!invoice) return;
    
    const invoiceForPdf = {
      details: {
        invoiceNumber: invoice.invoice_number,
        date: invoice.date,
        dueDate: invoice.due_date,
        clientName: invoice.client_name,
        clientEmail: invoice.client_email || '',
        clientAddress: invoice.client_address || '',
        yourCompany: invoice.your_company || '',
        yourEmail: invoice.your_email || '',
        yourAddress: invoice.your_address || '',
      },
      products: invoice.products,
      notes: invoice.notes || '',
    };
    
    exportToPDF(invoiceForPdf, true);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-center">Loading invoice details...</div>
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
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/client')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Client Portal
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            {invoice.status !== 'paid' && (
              <Button onClick={() => navigate(`/client/pay/${invoice.id}`)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Make Payment
              </Button>
            )}
          </div>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice #{invoice.invoice_number}</CardTitle>
              <Badge 
                variant={invoice.status === 'paid' ? 'default' : 'destructive'}
                className="text-sm"
              >
                {invoice.status === 'paid' ? 'PAID' : 'UNPAID'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-1">From</h3>
                <div className="text-lg font-medium">{invoice.your_company || 'Your Company'}</div>
                {invoice.your_email && <div>{invoice.your_email}</div>}
                {invoice.your_address && <div className="text-gray-600 text-sm">{invoice.your_address}</div>}
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-1">Bill To</h3>
                <div className="text-lg font-medium">{invoice.client_name}</div>
                {invoice.client_email && <div>{invoice.client_email}</div>}
                {invoice.client_address && <div className="text-gray-600 text-sm">{invoice.client_address}</div>}
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-1">Invoice Date</h3>
                <div>{invoice.date ? format(new Date(invoice.date), 'MMMM dd, yyyy') : 'N/A'}</div>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-1">Due Date</h3>
                <div>{invoice.due_date ? format(new Date(invoice.due_date), 'MMMM dd, yyyy') : 'N/A'}</div>
              </div>
            </div>
            
            <div className="border rounded-md mb-8 overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Price</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Tax (%)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Discount (%)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.products.map((product, index) => {
                    const lineTotal = product.quantity * product.price;
                    const lineTax = lineTotal * (product.tax / 100);
                    const lineDiscount = lineTotal * (product.discount / 100);
                    const itemTotal = lineTotal + lineTax - lineDiscount;
                    
                    return (
                      <tr key={index} className="bg-white dark:bg-gray-800">
                        <td className="px-4 py-3 text-sm">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-right">{product.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(product.price)}</td>
                        <td className="px-4 py-3 text-sm text-right">{product.tax}%</td>
                        <td className="px-4 py-3 text-sm text-right">{product.discount}%</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(itemTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right font-bold">Total:</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(invoice.total_amount)}</td>
                  </tr>
                  {invoice.total_paid > 0 && (
                    <>
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-right font-medium">Amount Paid:</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(invoice.total_paid)}</td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-right font-bold">Balance Due:</td>
                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(Math.max(0, invoice.total_amount - invoice.total_paid))}</td>
                      </tr>
                    </>
                  )}
                </tfoot>
              </table>
            </div>
            
            {invoice.notes && (
              <div className="mb-8">
                <h3 className="font-medium text-sm text-gray-500 mb-2">Notes</h3>
                <div className="text-gray-600 text-sm whitespace-pre-line p-4 bg-gray-50 dark:bg-gray-800 rounded-md">{invoice.notes}</div>
              </div>
            )}
            
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="mb-8">
                <h3 className="font-medium text-sm text-gray-500 mb-2">Payment History</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Method</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoice.payments.map((payment, index) => (
                        <tr key={index} className="bg-white dark:bg-gray-800">
                          <td className="px-4 py-3 text-sm">{format(new Date(payment.date), 'MMM dd, yyyy')}</td>
                          <td className="px-4 py-3 text-sm capitalize">{payment.method}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(payment.amount)}</td>
                          <td className="px-4 py-3 text-sm">{payment.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientInvoiceView;
