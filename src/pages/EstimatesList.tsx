
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
  ArrowRightLeft
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface EstimateListItem {
  id: string;
  estimate_number: string;
  client_name: string;
  date: string;
  due_date: string;
  total_amount?: number;
  status: string;
}

const EstimatesList = () => {
  const { user, signOut } = useAuth();
  const [estimates, setEstimates] = useState<EstimateListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();

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
    const fetchEstimates = async () => {
      try {
        if (!user) return;
        
        setIsLoading(true);
        
        // Fetch estimates with products to calculate totals
        const { data: estimatesData, error: estimatesError } = await supabase
          .from('estimates')
          .select(`
            id,
            estimate_number,
            client_name,
            date,
            due_date,
            status
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
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
              ...estimate,
              total_amount: total,
              status: estimate.status || 'draft'
            };
          })
        );
        
        setEstimates(estimatesWithTotals);
        
      } catch (error: any) {
        toast({
          title: "Error fetching estimates",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEstimates();
  }, [user]);

  const createNewEstimate = () => {
    navigate('/create-estimate');
  };

  const editEstimate = (id: string) => {
    navigate(`/edit-estimate/${id}`);
  };

  const convertToInvoice = async (estimate: EstimateListItem) => {
    try {
      if (!user) return;
      
      // Fetch the full estimate details
      const { data: estimateData, error: estimateError } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', estimate.id)
        .single();
        
      if (estimateError) throw estimateError;
      
      // Fetch estimate products
      const { data: products, error: productsError } = await supabase
        .from('estimate_products')
        .select('*')
        .eq('estimate_id', estimate.id);
        
      if (productsError) throw productsError;
      
      // Create new invoice based on the estimate
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: estimateData.estimate_number, // Use the same number for simplicity
          client_name: estimateData.client_name,
          client_email: estimateData.client_email,
          client_address: estimateData.client_address,
          your_company: estimateData.your_company,
          your_email: estimateData.your_email,
          your_address: estimateData.your_address,
          date: estimateData.date,
          due_date: estimateData.due_date,
          notes: estimateData.notes,
          status: 'unpaid'
        })
        .select()
        .single();
        
      if (invoiceError) throw invoiceError;
      
      // Insert the products for the new invoice
      const invoiceProducts = products.map((product) => ({
        invoice_id: invoiceData.id,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        tax: product.tax,
        discount: product.discount
      }));
      
      const { error: productInsertError } = await supabase
        .from('invoice_products')
        .insert(invoiceProducts);
        
      if (productInsertError) throw productInsertError;
      
      // Update the estimate status to 'converted'
      const { error: updateError } = await supabase
        .from('estimates')
        .update({ status: 'converted' })
        .eq('id', estimate.id);
        
      if (updateError) throw updateError;
      
      toast({
        title: "Estimate converted to invoice",
        description: "You can now view and edit the invoice.",
      });
      
      // Navigate to the new invoice
      navigate(`/invoice/${invoiceData.id}`);
      
    } catch (error: any) {
      toast({
        title: "Error converting estimate",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-primary text-white p-4 mb-8">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-6 w-6" />
            <h1 className="text-xl font-bold">Invoicing Genius</h1>
          </div>
          
          <div className="flex items-center gap-4">
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
            <FileBarChart className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">My Estimates</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              asChild
            >
              <Link to="/invoices">
                <FileText className="h-5 w-5 mr-2" />
                View Invoices
              </Link>
            </Button>
            
            <Button onClick={createNewEstimate}>
              <Plus className="h-5 w-5 mr-2" />
              Create New Estimate
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">Loading estimates...</div>
            ) : estimates.length === 0 ? (
              <div className="text-center py-8">
                <FileBarChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No estimates yet</h3>
                <p className="text-gray-500 mb-4">Create your first estimate to get started</p>
                <Button onClick={createNewEstimate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Estimate
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estimate #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estimates.map((estimate) => (
                      <TableRow key={estimate.id}>
                        <TableCell className="font-medium">{estimate.estimate_number}</TableCell>
                        <TableCell>{estimate.client_name}</TableCell>
                        <TableCell>{estimate.date ? format(new Date(estimate.date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>{estimate.due_date ? format(new Date(estimate.due_date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>
                          {estimate.total_amount !== undefined 
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(estimate.total_amount) 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            estimate.status === 'approved' ? 'default' : 
                            estimate.status === 'converted' ? 'outline' :
                            estimate.status === 'sent' ? 'secondary' : 'destructive'
                          }>
                            {estimate.status === 'draft' ? 'Draft' : 
                             estimate.status === 'sent' ? 'Sent' :
                             estimate.status === 'approved' ? 'Approved' :
                             estimate.status === 'converted' ? 'Converted' : estimate.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {estimate.status !== 'converted' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => editEstimate(estimate.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  asChild
                                >
                                  <Link to={`/estimate/${estimate.id}`}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => convertToInvoice(estimate)}
                                  title="Convert to Invoice"
                                >
                                  <ArrowRightLeft className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {estimate.status === 'converted' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                              >
                                <Link to={`/estimate/${estimate.id}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
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
    </div>
  );
};

export default EstimatesList;
