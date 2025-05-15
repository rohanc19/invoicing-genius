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
  Plus, 
  Repeat, 
  ExternalLink, 
  Edit, 
  Trash2,
  Play,
  Pause,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import AppHeader from "@/components/AppHeader";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RecurringInvoiceItem {
  id: string;
  title: string;
  frequency: string;
  next_date: string;
  client_name: string;
  is_active: boolean;
  total_amount?: number;
}

const RecurringInvoicesList = () => {
  const { user } = useAuth();
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!user) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
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

  // Fetch recurring invoices
  useEffect(() => {
    const fetchRecurringInvoices = async () => {
      try {
        if (!user) return;
        
        setIsLoading(true);
        
        const { data: recurringInvoicesData, error: recurringInvoicesError } = await supabase
          .from('recurring_invoices')
          .select(`
            id,
            title,
            frequency,
            next_date,
            client_name,
            is_active
          `)
          .eq('user_id', user.id)
          .order('next_date', { ascending: true });
        
        if (recurringInvoicesError) throw recurringInvoicesError;
        
        const recurringInvoicesWithTotals = await Promise.all(
          (recurringInvoicesData || []).map(async (recurringInvoice) => {
            const { data: products, error: productsError } = await supabase
              .from('recurring_invoice_products')
              .select('*')
              .eq('recurring_invoice_id', recurringInvoice.id);
            
            if (productsError) throw productsError;
            
            const total = (products || []).reduce((sum, product) => {
              const lineTotal = product.quantity * product.price;
              const lineTax = lineTotal * (product.tax / 100);
              const lineDiscount = lineTotal * (product.discount / 100);
              return sum + lineTotal + lineTax - lineDiscount;
            }, 0);
            
            return {
              ...recurringInvoice,
              total_amount: total
            };
          })
        );
        
        setRecurringInvoices(recurringInvoicesWithTotals);
        
      } catch (error: any) {
        toast({
          title: "Error fetching recurring invoices",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecurringInvoices();
  }, [user]);

  // Create new recurring invoice
  const createNewRecurringInvoice = () => {
    navigate('/create-recurring-invoice');
  };

  // Edit recurring invoice
  const editRecurringInvoice = (id: string) => {
    navigate(`/edit-recurring-invoice/${id}`);
  };

  // Toggle recurring invoice active status
  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('recurring_invoices')
        .update({ is_active: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setRecurringInvoices(prev => 
        prev.map(item => 
          item.id === id ? { ...item, is_active: !currentStatus } : item
        )
      );
      
      toast({
        title: `Recurring invoice ${currentStatus ? 'paused' : 'activated'}`,
        description: `The recurring invoice has been ${currentStatus ? 'paused' : 'activated'} successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating recurring invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete recurring invoice
  const deleteRecurringInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recurring_invoices')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setRecurringInvoices(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Recurring invoice deleted",
        description: "The recurring invoice has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting recurring invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Generate invoice from recurring invoice
  const generateInvoice = async (recurringInvoice: RecurringInvoiceItem) => {
    try {
      // Fetch full recurring invoice data
      const { data: fullData, error: fetchError } = await supabase
        .from('recurring_invoices')
        .select('*')
        .eq('id', recurringInvoice.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('recurring_invoice_products')
        .select('*')
        .eq('recurring_invoice_id', recurringInvoice.id);
        
      if (productsError) throw productsError;
      
      if (!fullData || !products) {
        throw new Error("Could not fetch recurring invoice data");
      }
      
      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      
      // Insert new invoice
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user?.id,
          invoice_number: invoiceNumber,
          date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0], // Due in 14 days
          client_name: fullData.client_name,
          client_email: fullData.client_email,
          client_address: fullData.client_address,
          your_company: fullData.your_company,
          your_email: fullData.your_email,
          your_address: fullData.your_address,
          notes: `Generated from recurring invoice: ${fullData.title}\n\n${fullData.notes || ''}`,
          status: 'unpaid'
        })
        .select()
        .single();
        
      if (invoiceError) throw invoiceError;
      
      // Insert invoice products
      const productsToInsert = products.map(product => ({
        invoice_id: newInvoice.id,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        tax: product.tax,
        discount: product.discount,
      }));
      
      const { error: insertProductsError } = await supabase
        .from('invoice_products')
        .insert(productsToInsert);
        
      if (insertProductsError) throw insertProductsError;
      
      // Update next date for recurring invoice
      const currentNextDate = new Date(fullData.next_date);
      let newNextDate;
      
      switch (fullData.frequency) {
        case 'weekly':
          newNextDate = addWeeks(currentNextDate, 1);
          break;
        case 'monthly':
          newNextDate = addMonths(currentNextDate, 1);
          break;
        case 'quarterly':
          newNextDate = addMonths(currentNextDate, 3);
          break;
        case 'yearly':
          newNextDate = addYears(currentNextDate, 1);
          break;
        default:
          newNextDate = addMonths(currentNextDate, 1);
      }
      
      // Check if end date is reached
      if (fullData.end_date && new Date(fullData.end_date) < newNextDate) {
        // Deactivate recurring invoice
        const { error: updateError } = await supabase
          .from('recurring_invoices')
          .update({ 
            is_active: false,
            next_date: newNextDate.toISOString().split('T')[0]
          })
          .eq('id', recurringInvoice.id);
          
        if (updateError) throw updateError;
        
        // Update local state
        setRecurringInvoices(prev => 
          prev.map(item => 
            item.id === recurringInvoice.id 
              ? { 
                  ...item, 
                  is_active: false,
                  next_date: newNextDate.toISOString().split('T')[0]
                } 
              : item
          )
        );
        
        toast({
          title: "Recurring invoice completed",
          description: "The recurring invoice has been deactivated as the end date has been reached.",
        });
      } else {
        // Just update next date
        const { error: updateError } = await supabase
          .from('recurring_invoices')
          .update({ next_date: newNextDate.toISOString().split('T')[0] })
          .eq('id', recurringInvoice.id);
          
        if (updateError) throw updateError;
        
        // Update local state
        setRecurringInvoices(prev => 
          prev.map(item => 
            item.id === recurringInvoice.id 
              ? { ...item, next_date: newNextDate.toISOString().split('T')[0] } 
              : item
          )
        );
      }
      
      toast({
        title: "Invoice generated",
        description: `Invoice ${invoiceNumber} has been generated successfully.`,
      });
      
      // Navigate to the new invoice
      navigate(`/invoice/${newInvoice.id}`);
      
    } catch (error: any) {
      toast({
        title: "Error generating invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Get frequency display text
  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return frequency;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <AppHeader userProfile={userProfile} />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Recurring Invoices</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              asChild
            >
              <Link to="/invoices">
                <ExternalLink className="h-5 w-5 mr-2" />
                View Invoices
              </Link>
            </Button>
            
            <Button onClick={createNewRecurringInvoice}>
              <Plus className="h-5 w-5 mr-2" />
              Create Recurring Invoice
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Recurring Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">Loading recurring invoices...</div>
            ) : recurringInvoices.length === 0 ? (
              <div className="text-center py-8">
                <Repeat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No recurring invoices yet</h3>
                <p className="text-gray-500 mb-4">Create your first recurring invoice to get started</p>
                <Button onClick={createNewRecurringInvoice}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Recurring Invoice
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurringInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.title}</TableCell>
                        <TableCell>{invoice.client_name}</TableCell>
                        <TableCell>{getFrequencyText(invoice.frequency)}</TableCell>
                        <TableCell>{invoice.next_date ? format(new Date(invoice.next_date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>
                          {invoice.total_amount !== undefined 
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.total_amount) 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={invoice.is_active ? 'default' : 'secondary'}>
                            {invoice.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => generateInvoice(invoice)}
                              disabled={!invoice.is_active}
                              title={invoice.is_active ? "Generate invoice now" : "Activate to generate invoice"}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleActiveStatus(invoice.id, invoice.is_active)}
                            >
                              {invoice.is_active ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => editRecurringInvoice(invoice.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this recurring invoice. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteRecurringInvoice(invoice.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
    </div>
  );
};

export default RecurringInvoicesList;
