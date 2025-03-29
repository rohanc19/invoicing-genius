
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  Download, 
  Send, 
  CheckCircle,
  ArrowRightLeft,
  AlertTriangle,
} from "lucide-react";

// Utils
import { 
  calculateSubtotal, 
  calculateTotalDiscount, 
  calculateTotalTax, 
  calculateTotal,
  formatCurrency
} from "@/utils/calculations";

const EstimateView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [estimate, setEstimate] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const fetchEstimate = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch the estimate
        const { data: estimateData, error: estimateError } = await supabase
          .from("estimates")
          .select()
          .eq("id", id)
          .eq("user_id", user.id)
          .single();
        
        if (estimateError) throw estimateError;
        if (!estimateData) {
          toast({
            title: "Estimate not found",
            description: "The requested estimate could not be found.",
            variant: "destructive",
          });
          navigate("/estimates");
          return;
        }
        
        // Fetch the products for this estimate
        const { data: productsData, error: productsError } = await supabase
          .from("estimate_products")
          .select()
          .eq("estimate_id", id);
        
        if (productsError) throw productsError;
        
        setEstimate(estimateData);
        setProducts(productsData || []);
        
      } catch (error: any) {
        toast({
          title: "Error loading estimate",
          description: error.message,
          variant: "destructive",
        });
        navigate("/estimates");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEstimate();
  }, [id, user, navigate]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id || !user) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("estimates")
        .update({ status: newStatus })
        .eq("id", id)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      // Update the local state
      setEstimate({ ...estimate, status: newStatus });
      
      toast({
        title: "Status updated",
        description: `Estimate status updated to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!id || !user || !estimate) return;
    
    setIsProcessing(true);
    try {
      // Create a new invoice based on the estimate
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          invoice_number: estimate.estimate_number, // Use the same number for simplicity
          client_name: estimate.client_name,
          client_email: estimate.client_email,
          client_address: estimate.client_address,
          your_company: estimate.your_company,
          your_email: estimate.your_email,
          your_address: estimate.your_address,
          date: estimate.date,
          due_date: estimate.due_date,
          notes: estimate.notes,
          status: "unpaid"
        })
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      // Insert the products for the new invoice
      const invoiceProducts = products.map(product => ({
        invoice_id: invoiceData.id,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        tax: product.tax,
        discount: product.discount
      }));
      
      const { error: productInsertError } = await supabase
        .from("invoice_products")
        .insert(invoiceProducts);
      
      if (productInsertError) throw productInsertError;
      
      // Update the estimate status to 'converted'
      const { error: updateError } = await supabase
        .from("estimates")
        .update({ status: "converted" })
        .eq("id", id);
      
      if (updateError) throw updateError;
      
      // Update the local state
      setEstimate({ ...estimate, status: "converted" });
      
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
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
        <p>Loading estimate...</p>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
        <p>Estimate not found</p>
      </div>
    );
  }

  // Map products to the format expected by the calculation utilities
  const calculationProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    quantity: product.quantity,
    price: product.price,
    tax: product.tax || 0,
    discount: product.discount || 0,
  }));

  const subtotal = calculateSubtotal(calculationProducts);
  const totalDiscount = calculateTotalDiscount(calculationProducts);
  const totalTax = calculateTotalTax(calculationProducts);
  const total = calculateTotal(calculationProducts);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "converted":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="container mx-auto p-4 pb-20 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/estimates")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Estimates
          </Button>
          
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Estimate {estimate.estimate_number}</h1>
            <Badge 
              className={`ml-3 ${getStatusBadgeStyle(estimate.status)}`} 
              variant="outline"
            >
              {estimate.status === "draft" ? "Draft" : 
               estimate.status === "sent" ? "Sent" :
               estimate.status === "approved" ? "Approved" :
               estimate.status === "converted" ? "Converted to Invoice" : estimate.status}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {estimate.status !== "converted" && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/edit-estimate/${id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              
              {estimate.status === "draft" && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus("sent")}
                  disabled={isProcessing}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Mark as Sent
                </Button>
              )}
              
              {estimate.status === "sent" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleUpdateStatus("approved")}
                  disabled={isProcessing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Approved
                </Button>
              )}
              
              {(estimate.status === "draft" || estimate.status === "sent" || estimate.status === "approved") && (
                <Button
                  size="sm"
                  onClick={handleConvertToInvoice}
                  disabled={isProcessing}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Convert to Invoice
                </Button>
              )}
            </>
          )}
          
          {estimate.status === "converted" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/invoices")}
            >
              View Invoices
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        <div className="lg:col-span-8 space-y-6">
          <Card className="print:shadow-none">
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-xl">Estimate Details</CardTitle>
                  <CardDescription>
                    {estimate.date ? format(new Date(estimate.date), "MMMM dd, yyyy") : "No date"} -
                    Est. #{estimate.estimate_number}
                  </CardDescription>
                </div>
                {estimate.due_date && (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Due Date</div>
                    <div className="font-medium">
                      {format(new Date(estimate.due_date), "MMMM dd, yyyy")}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">From</h3>
                  <div className="font-medium">{estimate.your_company || "Your Business"}</div>
                  {estimate.your_email && <div>{estimate.your_email}</div>}
                  {estimate.your_address && <div className="whitespace-pre-line text-sm text-muted-foreground">{estimate.your_address}</div>}
                </div>
                
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">To</h3>
                  <div className="font-medium">{estimate.client_name}</div>
                  {estimate.client_email && <div>{estimate.client_email}</div>}
                  {estimate.client_address && <div className="whitespace-pre-line text-sm text-muted-foreground">{estimate.client_address}</div>}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const lineTotal = product.quantity * product.price;
                      const discountAmount = lineTotal * (product.discount / 100);
                      const afterDiscount = lineTotal - discountAmount;
                      const taxAmount = afterDiscount * (product.tax / 100);
                      const finalAmount = afterDiscount + taxAmount;
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell className="text-right">{product.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                          <TableCell className="text-right">
                            {product.discount > 0 ? `${product.discount}%` : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.tax > 0 ? `${product.tax}%` : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(finalAmount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {estimate.notes && (
            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line">{estimate.notes}</div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="lg:col-span-4 space-y-6">
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-{formatCurrency(totalDiscount)}</span>
                  </div>
                )}
                {totalTax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(totalTax)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {estimate.status !== "converted" && (
            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {estimate.status === "draft" && (
                    <Button 
                      className="w-full" 
                      onClick={() => handleUpdateStatus("sent")}
                      disabled={isProcessing}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Mark as Sent
                    </Button>
                  )}
                  
                  {estimate.status === "sent" && (
                    <Button 
                      className="w-full" 
                      variant="secondary"
                      onClick={() => handleUpdateStatus("approved")}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Approved
                    </Button>
                  )}
                  
                  {(estimate.status === "draft" || estimate.status === "sent" || estimate.status === "approved") && (
                    <Button 
                      className="w-full" 
                      onClick={handleConvertToInvoice}
                      disabled={isProcessing}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Convert to Invoice
                    </Button>
                  )}
                  
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate(`/edit-estimate/${id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Estimate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {estimate.status === "converted" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Converted to Invoice</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This estimate has been converted to an invoice. View your invoices to find it.
                    </p>
                    <Button 
                      className="mt-3" 
                      size="sm"
                      asChild
                    >
                      <Link to="/invoices">View Invoices</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstimateView;
