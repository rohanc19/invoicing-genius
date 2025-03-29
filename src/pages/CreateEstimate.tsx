import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, FileText, ReceiptText } from "lucide-react";
import ProductList from "@/components/ProductList";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { EstimateDetails, EstimateProduct } from "@/types/estimate";
import { Product } from "@/types/invoice";

const CreateEstimate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { toast: uiToast } = useToast();

  const [estimateDetails, setEstimateDetails] = useState<EstimateDetails>({
    estimateNumber: `EST-${Math.floor(100000 + Math.random() * 900000)}`,
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(new Date().setDate(new Date().getDate() + 14)), 'yyyy-MM-dd'),
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    yourCompany: "",
    yourEmail: "",
    yourAddress: ""
  });

  const [products, setProducts] = useState<Product[]>([
    {
      id: uuidv4(),
      name: "",
      quantity: 1,
      price: 0,
      tax: 0,
      discount: 0
    }
  ]);

  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<string>("draft");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    if (isEditMode && id) {
      fetchEstimate(id);
    }
    
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
          setEstimateDetails(prevState => ({
            ...prevState,
            yourCompany: data.company_name || "",
            yourEmail: data.company_email || user.email || "",
            yourAddress: data.company_address || ""
          }));
        }
      } catch (error: any) {
        toast.error("Error fetching profile", {
          description: error.message,
        });
      }
    };
    
    fetchUserProfile();
  }, [user, id, isEditMode]);

  const fetchEstimate = async (estimateId: string) => {
    try {
      setIsLoading(true);
      
      const { data: estimateData, error: estimateError } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', estimateId)
        .single();
      
      if (estimateError) throw estimateError;
      
      if (estimateData) {
        setEstimateDetails({
          estimateNumber: estimateData.estimate_number,
          date: format(new Date(estimateData.date), 'yyyy-MM-dd'),
          dueDate: estimateData.due_date ? format(new Date(estimateData.due_date), 'yyyy-MM-dd') : '',
          clientName: estimateData.client_name,
          clientEmail: estimateData.client_email || '',
          clientAddress: estimateData.client_address || '',
          yourCompany: estimateData.your_company || '',
          yourEmail: estimateData.your_email || '',
          yourAddress: estimateData.your_address || ''
        });
        
        setNotes(estimateData.notes || '');
        setStatus(estimateData.status || 'draft');
        
        const { data: productsData, error: productsError } = await supabase
          .from('estimate_products')
          .select('*')
          .eq('estimate_id', estimateId);
        
        if (productsError) throw productsError;
        
        if (productsData && productsData.length > 0) {
          setProducts(productsData.map(product => ({
            id: product.id,
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            tax: product.tax,
            discount: product.discount
          })));
        }
      }
    } catch (error: any) {
      toast.error("Error loading estimate", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEstimateDetails(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      if (!user) {
        toast.error("You must be logged in to create an estimate");
        return;
      }
      
      setIsLoading(true);
      
      const estimateData = {
        user_id: user.id,
        estimate_number: estimateDetails.estimateNumber,
        client_name: estimateDetails.clientName,
        client_email: estimateDetails.clientEmail,
        client_address: estimateDetails.clientAddress,
        your_company: estimateDetails.yourCompany,
        your_email: estimateDetails.yourEmail,
        your_address: estimateDetails.yourAddress,
        date: estimateDetails.date,
        due_date: estimateDetails.dueDate,
        notes: notes,
        status: status
      };
      
      let estimateId;
      
      if (isEditMode && id) {
        const { data, error } = await supabase
          .from('estimates')
          .update(estimateData)
          .eq('id', id)
          .select('id')
          .single();
          
        if (error) throw error;
        estimateId = data.id;
        
        const { error: deleteError } = await supabase
          .from('estimate_products')
          .delete()
          .eq('estimate_id', id);
          
        if (deleteError) throw deleteError;
      } else {
        const { data, error } = await supabase
          .from('estimates')
          .insert([estimateData])
          .select('id')
          .single();
          
        if (error) throw error;
        estimateId = data.id;
      }
      
      const productsToInsert = products.map(product => ({
        estimate_id: estimateId,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        tax: product.tax,
        discount: product.discount
      }));
      
      const { error: productsError } = await supabase
        .from('estimate_products')
        .insert(productsToInsert);
        
      if (productsError) throw productsError;
      
      toast.success(isEditMode ? "Estimate updated successfully" : "Estimate created successfully");
      setHasChanges(false);
      
      navigate(`/estimate/${estimateId}`);
      
    } catch (error: any) {
      toast.error("Error saving estimate", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    try {
      if (!user || !id) {
        toast.error("You must be logged in and have a saved estimate to convert it");
        return;
      }
      
      setIsLoading(true);
      
      const invoiceData = {
        user_id: user.id,
        invoice_number: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        client_name: estimateDetails.clientName,
        client_email: estimateDetails.clientEmail,
        client_address: estimateDetails.clientAddress,
        your_company: estimateDetails.yourCompany,
        your_email: estimateDetails.yourEmail,
        your_address: estimateDetails.yourAddress,
        date: estimateDetails.date,
        due_date: estimateDetails.dueDate,
        notes: notes,
        status: 'unpaid'
      };
      
      const { data: invoiceData2, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select('id')
        .single();
        
      if (invoiceError) throw invoiceError;
      
      const invoiceId = invoiceData2.id;
      
      const invoiceProducts = products.map(product => ({
        invoice_id: invoiceId,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        tax: product.tax,
        discount: product.discount
      }));
      
      const { error: productsError } = await supabase
        .from('invoice_products')
        .insert(invoiceProducts);
        
      if (productsError) throw productsError;
      
      const { error: updateError } = await supabase
        .from('estimates')
        .update({ status: 'converted' })
        .eq('id', id);
        
      if (updateError) throw updateError;
      
      toast.success("Estimate converted to invoice successfully");
      
      navigate(`/invoice/${invoiceId}`);
      
    } catch (error: any) {
      toast.error("Error converting estimate to invoice", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-primary text-white p-4 mb-8">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-white hover:bg-primary/80"
              onClick={() => navigate('/estimates')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Estimates
            </Button>
            <h1 className="text-xl font-bold">
              {isEditMode ? "Edit Estimate" : "Create New Estimate"}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Estimate
            </Button>
            
            {isEditMode && (
              <Button 
                variant="secondary"
                onClick={handleConvertToInvoice}
                disabled={isLoading || status === 'converted'}
              >
                <ReceiptText className="h-4 w-4 mr-2" />
                Convert to Invoice
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Estimate Details</CardTitle>
            <CardDescription>
              Enter the details for your estimate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="estimateNumber">Estimate Number</Label>
                  <Input
                    id="estimateNumber"
                    name="estimateNumber"
                    value={estimateDetails.estimateNumber}
                    onChange={handleInputChange}
                    placeholder="EST-000000"
                  />
                </div>
                
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={estimateDetails.date}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={estimateDetails.dueDate}
                    onChange={handleInputChange}
                  />
                </div>
                
                {isEditMode && (
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="converted" disabled={status === 'converted'}>
                          Converted to Invoice
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    name="clientName"
                    value={estimateDetails.clientName}
                    onChange={handleInputChange}
                    placeholder="Client Name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    name="clientEmail"
                    type="email"
                    value={estimateDetails.clientEmail}
                    onChange={handleInputChange}
                    placeholder="client@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientAddress">Client Address</Label>
                  <Textarea
                    id="clientAddress"
                    name="clientAddress"
                    value={estimateDetails.clientAddress}
                    onChange={handleInputChange}
                    placeholder="Client Address"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="yourCompany">Your Company</Label>
                <Input
                  id="yourCompany"
                  name="yourCompany"
                  value={estimateDetails.yourCompany}
                  onChange={handleInputChange}
                  placeholder="Your Company"
                />
              </div>
              
              <div>
                <Label htmlFor="yourEmail">Your Email</Label>
                <Input
                  id="yourEmail"
                  name="yourEmail"
                  type="email"
                  value={estimateDetails.yourEmail}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="yourAddress">Your Address</Label>
                <Textarea
                  id="yourAddress"
                  name="yourAddress"
                  value={estimateDetails.yourAddress}
                  onChange={handleInputChange}
                  placeholder="Your Address"
                  rows={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Products / Services</CardTitle>
            <CardDescription>
              Add products or services to your estimate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductList products={products} onUpdateProducts={handleUpdateProducts} />
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>
              Add any additional notes to your estimate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Enter any additional notes or payment instructions..."
              rows={4}
            />
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              variant="outline"
              onClick={() => navigate('/estimates')}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              {isEditMode && (
                <Button 
                  variant="outline"
                  onClick={handleConvertToInvoice}
                  disabled={isLoading || status === 'converted'}
                >
                  <ReceiptText className="h-4 w-4 mr-2" />
                  Convert to Invoice
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Update Estimate" : "Create Estimate"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CreateEstimate;
