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
  FileText, 
  ExternalLink, 
  Edit, 
  ReceiptText,
  User,
  LogOut,
  Settings,
  FileBarChart,
  Download
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface InvoiceListItem {
  id: string;
  invoice_number: string;
  client_name: string;
  date: string;
  due_date: string;
  total_amount?: number;
  status: string;
}

const InvoicesList = () => {
  const { user, signOut } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isAppInstalled) {
      setShowInstallButton(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Installation",
        description: "To install, use your browser's 'Add to Home Screen' or 'Install' option in the menu.",
      });
      return;
    }

    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
    
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
    
    if (outcome === 'accepted') {
      toast({
        title: "Installation Successful",
        description: "The app was successfully installed on your device.",
      });
    }
  };

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
    const fetchInvoices = async () => {
      try {
        if (!user) return;
        
        setIsLoading(true);
        
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            client_name,
            date,
            due_date,
            status
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (invoicesError) throw invoicesError;
        
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
              ...invoice,
              total_amount: total,
              status: invoice.status || 'unpaid'
            };
          })
        );
        
        setInvoices(invoicesWithTotals);
        
      } catch (error: any) {
        toast({
          title: "Error fetching invoices",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoices();
  }, [user]);

  const createNewInvoice = () => {
    navigate('/create-invoice');
  };

  const editInvoice = (id: string) => {
    navigate(`/edit-invoice/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-primary text-white p-4 mb-8">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ReceiptText className="h-6 w-6" />
            <h1 className="text-xl font-bold">Invoicing Genius</h1>
          </Link>
          
          <div className="flex items-center gap-4">
            {showInstallButton && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleInstallClick}
                className="bg-white text-primary hover:bg-gray-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-white hover:text-white hover:bg-primary/80"
            >
              <Link to="/profile" className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <span className="hidden md:inline">Profile Settings</span>
              </Link>
            </Button>
            
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span className="text-sm hidden md:inline">{userProfile?.full_name || user?.email}</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-white hover:text-white hover:bg-primary/80"
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">My Invoices</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              asChild
            >
              <Link to="/estimates">
                <FileBarChart className="h-5 w-5 mr-2" />
                View Estimates
              </Link>
            </Button>
            
            <Button onClick={createNewInvoice}>
              <Plus className="h-5 w-5 mr-2" />
              Create New Invoice
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
                <p className="text-gray-500 mb-4">Create your first invoice to get started</p>
                <Button onClick={createNewInvoice}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
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
                        <TableCell>{invoice.client_name}</TableCell>
                        <TableCell>{invoice.date ? format(new Date(invoice.date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>{invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>
                          {invoice.total_amount !== undefined 
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.total_amount) 
                            : 'N/A'}
                        </TableCell>
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
                              onClick={() => editInvoice(invoice.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                            >
                              <Link to={`/invoice/${invoice.id}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
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

export default InvoicesList;
