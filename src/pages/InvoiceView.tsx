import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Invoice } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FileText, ArrowLeft, Edit, Printer, Download, Check, X, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import InvoiceDisplay from "@/components/InvoiceDisplay";
import AppHeader from "@/components/AppHeader";
import PaymentTracker from "@/components/PaymentTracker";
import EmailDialog from "@/components/EmailDialog";
import { format } from "date-fns";
import { exportToPDF } from "@/utils/pdfUtils";

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
}

const InvoiceView = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setUserProfile(data);
        }
      } catch (error: any) {
        toast({
          title: "Error fetching profile",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (!user || !id) return;

        setIsLoading(true);

        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (invoiceError) throw invoiceError;

        const { data: productsData, error: productsError } = await supabase
          .from('invoice_products')
          .select('*')
          .eq('invoice_id', id);

        if (productsError) throw productsError;

        const total = (productsData || []).reduce((sum, product) => {
          const lineTotal = product.quantity * product.price;
          const lineTax = lineTotal * (product.tax / 100);
          const lineDiscount = lineTotal * (product.discount / 100);
          return sum + lineTotal + lineTax - lineDiscount;
        }, 0);

        const fullInvoice = {
          ...invoiceData,
          products: productsData || [],
          total_amount: total
        };

        setInvoice(fullInvoice);
      } catch (error: any) {
        toast({
          title: "Error fetching invoice",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [id, user]);

  const handleStatusChange = async (newStatus: 'paid' | 'unpaid') => {
    if (!invoice) return;

    try {
      setIsUpdatingStatus(true);

      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoice.id);

      if (error) throw error;

      setInvoice({
        ...invoice,
        status: newStatus
      });

      toast({
        title: "Status updated",
        description: `Invoice marked as ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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
              <Button onClick={() => navigate('/invoices')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Invoices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AppHeader userProfile={userProfile} />

      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
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
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" onClick={() => navigate(`/edit-invoice/${invoice.id}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
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
                      <tr key={index} className="bg-white">
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
                </tfoot>
              </table>
            </div>

            {invoice.notes && (
              <div className="mb-8">
                <h3 className="font-medium text-sm text-gray-500 mb-2">Notes</h3>
                <div className="text-gray-600 text-sm whitespace-pre-line p-4 bg-gray-50 rounded-md">{invoice.notes}</div>
              </div>
            )}

            <div className="border-t pt-6 flex justify-end">
              <div className="flex flex-col items-end gap-4">
                <div className="text-sm font-medium text-gray-500">
                  {invoice.status === 'paid' ? 'Mark as unpaid?' : 'Mark invoice as paid?'}
                </div>
                <div className="flex gap-2">
                  {invoice.status === 'paid' ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange('unpaid')}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Mark as Unpaid
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange('paid')}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Tracker */}
        <PaymentTracker
          invoiceId={invoice.id}
          totalAmount={invoice.total_amount}
          onPaymentUpdate={() => {
            // Refresh invoice data when payment is updated
            setInvoice({
              ...invoice,
              status: 'paid'
            });
          }}
        />
      </div>

      {/* Email Dialog */}
      {invoice && (
        <EmailDialog
          isOpen={isEmailDialogOpen}
          onClose={() => setIsEmailDialogOpen(false)}
          document={{
            id: invoice.id,
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
          }}
          documentType="invoice"
          recipientEmail={invoice.client_email || ''}
          recipientName={invoice.client_name}
        />
      )}
    </div>
  );
};

export default InvoiceView;
