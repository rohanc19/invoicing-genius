import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Product } from "../types/invoice";
import { RecurringInvoiceDetails, RecurringFrequency } from "../types/recurring-invoice";
import ProductList from "../components/ProductList";
import { 
  Repeat, 
  ArrowLeft,
  Save,
  Calendar,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import CompanySelector from "@/components/CompanySelector";
import ClientSelector from "@/components/ClientSelector";
import AppHeader from "@/components/AppHeader";
import { validateRecurringInvoice } from "@/schemas/recurring-invoice.schema";
import { addDays, addWeeks, addMonths, addYears, format } from "date-fns";

const CreateRecurringInvoice = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});
  
  // Recurring invoice details state
  const [details, setDetails] = useState<RecurringInvoiceDetails>({
    title: "",
    frequency: "monthly",
    startDate: new Date().toISOString().split('T')[0],
    nextDate: new Date().toISOString().split('T')[0],
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    yourCompany: "",
    yourEmail: "",
    yourAddress: "",
  });

  // Products state
  const [products, setProducts] = useState<Product[]>([
    {
      id: uuidv4(),
      name: "",
      quantity: 1,
      price: 0,
      tax: 0,
      discount: 0,
    },
  ]);

  // Notes state
  const [notes, setNotes] = useState<string>("");
  
  // Active state
  const [isActive, setIsActive] = useState(true);

  // Fetch user profile data
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
          
          // Pre-fill company details if available
          if (!id) {
            setDetails(prev => ({
              ...prev,
              yourCompany: data.company_name || "",
              yourEmail: data.company_email || "",
              yourAddress: data.company_address || "",
            }));
          }
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
  }, [user, id]);
  
  // Fetch recurring invoice if editing
  useEffect(() => {
    const fetchRecurringInvoice = async () => {
      if (!id || !user) return;
      
      try {
        // Fetch recurring invoice details
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('recurring_invoices')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (invoiceError) throw invoiceError;
        
        if (invoiceData) {
          setDetails({
            title: invoiceData.title,
            frequency: invoiceData.frequency as RecurringFrequency,
            startDate: invoiceData.start_date ? new Date(invoiceData.start_date).toISOString().split('T')[0] : "",
            endDate: invoiceData.end_date ? new Date(invoiceData.end_date).toISOString().split('T')[0] : undefined,
            nextDate: invoiceData.next_date ? new Date(invoiceData.next_date).toISOString().split('T')[0] : "",
            clientName: invoiceData.client_name || "",
            clientEmail: invoiceData.client_email || "",
            clientAddress: invoiceData.client_address || "",
            yourCompany: invoiceData.your_company || "",
            yourEmail: invoiceData.your_email || "",
            yourAddress: invoiceData.your_address || "",
          });
          
          setNotes(invoiceData.notes || "");
          setIsActive(invoiceData.is_active);
          
          // Fetch recurring invoice products
          const { data: productsData, error: productsError } = await supabase
            .from('recurring_invoice_products')
            .select('*')
            .eq('recurring_invoice_id', id);
            
          if (productsError) throw productsError;
          
          if (productsData && productsData.length > 0) {
            setProducts(productsData.map(product => ({
              id: product.id,
              name: product.name,
              quantity: product.quantity,
              price: product.price,
              tax: product.tax || 0,
              discount: product.discount || 0,
            })));
          }
        }
      } catch (error: any) {
        toast({
          title: "Error fetching recurring invoice",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    
    fetchRecurringInvoice();
  }, [id, user]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors.details && errors.details[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.details) {
          delete newErrors.details[name];
        }
        return newErrors;
      });
    }
  };

  // Handle frequency change
  const handleFrequencyChange = (value: string) => {
    setDetails(prev => ({
      ...prev,
      frequency: value as RecurringFrequency
    }));
    
    // Update next date based on frequency
    updateNextDate(value as RecurringFrequency);
    
    // Clear error for frequency field
    if (errors.details && errors.details.frequency) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.details) {
          delete newErrors.details.frequency;
        }
        return newErrors;
      });
    }
  };

  // Update next date based on frequency
  const updateNextDate = (frequency: RecurringFrequency) => {
    const startDate = new Date(details.startDate);
    let nextDate;
    
    switch (frequency) {
      case 'weekly':
        nextDate = addWeeks(startDate, 1);
        break;
      case 'monthly':
        nextDate = addMonths(startDate, 1);
        break;
      case 'quarterly':
        nextDate = addMonths(startDate, 3);
        break;
      case 'yearly':
        nextDate = addYears(startDate, 1);
        break;
      default:
        nextDate = addMonths(startDate, 1);
    }
    
    setDetails(prev => ({
      ...prev,
      nextDate: nextDate.toISOString().split('T')[0]
    }));
  };

  // Handle start date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setDetails(prev => ({
      ...prev,
      startDate: value
    }));
    
    // Update next date based on new start date
    const startDate = new Date(value);
    let nextDate;
    
    switch (details.frequency) {
      case 'weekly':
        nextDate = addWeeks(startDate, 1);
        break;
      case 'monthly':
        nextDate = addMonths(startDate, 1);
        break;
      case 'quarterly':
        nextDate = addMonths(startDate, 3);
        break;
      case 'yearly':
        nextDate = addYears(startDate, 1);
        break;
      default:
        nextDate = addMonths(startDate, 1);
    }
    
    setDetails(prev => ({
      ...prev,
      nextDate: nextDate.toISOString().split('T')[0]
    }));
    
    // Clear error for start date field
    if (errors.details && errors.details.startDate) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.details) {
          delete newErrors.details.startDate;
        }
        return newErrors;
      });
    }
  };

  // Handle company selection
  const handleCompanySelect = (companyDetails: { 
    company_name: string; 
    company_email: string; 
    company_address: string;
  }) => {
    setDetails(prev => ({
      ...prev,
      yourCompany: companyDetails.company_name,
      yourEmail: companyDetails.company_email,
      yourAddress: companyDetails.company_address,
    }));
    
    // Clear errors for company fields
    if (errors.details) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.details) {
          delete newErrors.details.yourCompany;
          delete newErrors.details.yourEmail;
          delete newErrors.details.yourAddress;
        }
        return newErrors;
      });
    }
  };

  // Handle client selection
  const handleClientSelect = (clientDetails: { 
    client_name: string; 
    client_email: string; 
    client_address: string;
  }) => {
    setDetails(prev => ({
      ...prev,
      clientName: clientDetails.client_name,
      clientEmail: clientDetails.client_email || "",
      clientAddress: clientDetails.client_address || "",
    }));
    
    // Clear errors for client fields
    if (errors.details) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.details) {
          delete newErrors.details.clientName;
          delete newErrors.details.clientEmail;
          delete newErrors.details.clientAddress;
        }
        return newErrors;
      });
    }
  };

  // Save recurring invoice
  const saveRecurringInvoice = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to save recurring invoices",
        variant: "destructive",
      });
      return;
    }
    
    // Validate form
    const recurringInvoice = {
      details,
      products,
      notes,
      isActive
    };
    
    const validation = validateRecurringInvoice(recurringInvoice);
    
    if (!validation.success) {
      setErrors(validation.errors || {});
      
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      
      return;
    }
    
    try {
      setIsSaving(true);
      
      let recurringInvoiceId: string;
      
      // If editing an existing recurring invoice
      if (id) {
        // Update recurring invoice
        const { error: invoiceError } = await supabase
          .from('recurring_invoices')
          .update({
            title: details.title,
            frequency: details.frequency,
            start_date: details.startDate,
            end_date: details.endDate,
            next_date: details.nextDate,
            client_name: details.clientName,
            client_email: details.clientEmail,
            client_address: details.clientAddress,
            your_company: details.yourCompany,
            your_email: details.yourEmail,
            your_address: details.yourAddress,
            notes: notes,
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
          
        if (invoiceError) throw invoiceError;
        
        recurringInvoiceId = id;
        
        // Delete existing products
        const { error: deleteError } = await supabase
          .from('recurring_invoice_products')
          .delete()
          .eq('recurring_invoice_id', id);
          
        if (deleteError) throw deleteError;
      } else {
        // Insert recurring invoice
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('recurring_invoices')
          .insert({
            user_id: user.id,
            title: details.title,
            frequency: details.frequency,
            start_date: details.startDate,
            end_date: details.endDate,
            next_date: details.nextDate,
            client_name: details.clientName,
            client_email: details.clientEmail,
            client_address: details.clientAddress,
            your_company: details.yourCompany,
            your_email: details.yourEmail,
            your_address: details.yourAddress,
            notes: notes,
            is_active: isActive
          })
          .select()
          .single();
          
        if (invoiceError) throw invoiceError;
        
        recurringInvoiceId = invoiceData.id;
      }
      
      // Insert products
      const productsToInsert = products.map(product => ({
        recurring_invoice_id: recurringInvoiceId,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        tax: product.tax,
        discount: product.discount,
      }));
      
      const { error: productsError } = await supabase
        .from('recurring_invoice_products')
        .insert(productsToInsert);
        
      if (productsError) throw productsError;
      
      toast({
        title: id ? "Recurring invoice updated" : "Recurring invoice created",
        description: `Recurring invoice has been ${id ? 'updated' : 'created'} successfully`,
      });
      
      // Navigate to recurring invoices list
      navigate('/recurring-invoices');
      
    } catch (error: any) {
      toast({
        title: "Error saving recurring invoice",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <AppHeader userProfile={userProfile} />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/recurring-invoices')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> 
              Back
            </Button>
            <Repeat className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">{id ? "Edit Recurring Invoice" : "Create Recurring Invoice"}</h2>
          </div>
          
          <Button 
            onClick={saveRecurringInvoice}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : id ? "Update" : "Save"}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={details.title}
                      onChange={handleInputChange}
                      placeholder="Monthly Service Fee"
                    />
                    {errors.details?.title && (
                      <p className="text-sm text-destructive mt-1">{errors.details.title}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={details.frequency}
                      onValueChange={handleFrequencyChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.details?.frequency && (
                      <p className="text-sm text-destructive mt-1">{errors.details.frequency}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          className="pl-8"
                          value={details.startDate}
                          onChange={handleStartDateChange}
                        />
                      </div>
                      {errors.details?.startDate && (
                        <p className="text-sm text-destructive mt-1">{errors.details.startDate}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="endDate">End Date (Optional)</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          className="pl-8"
                          value={details.endDate || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="nextDate">Next Invoice Date</Label>
                    <div className="relative">
                      <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nextDate"
                        name="nextDate"
                        type="date"
                        className="pl-8"
                        value={details.nextDate}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Next invoice will be generated on {format(new Date(details.nextDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <Label>Your Company</Label>
                    <CompanySelector 
                      onCompanySelect={handleCompanySelect} 
                      currentCompany={{
                        company_name: details.yourCompany,
                        company_email: details.yourEmail,
                        company_address: details.yourAddress
                      }}
                    />
                    {errors.details?.yourCompany && (
                      <p className="text-sm text-destructive mt-1">{errors.details.yourCompany}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Client</Label>
                    <ClientSelector 
                      onClientSelect={handleClientSelect}
                      currentClient={{
                        client_name: details.clientName,
                        client_email: details.clientEmail,
                        client_address: details.clientAddress
                      }}
                    />
                    {errors.details?.clientName && (
                      <p className="text-sm text-destructive mt-1">{errors.details.clientName}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <ProductList products={products} setProducts={setProducts} />
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes & Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={notes}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes or terms..."
                  className="min-h-[120px]"
                />
              </div>
              
              <div>
                <Label>Status</Label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={() => setIsActive(!isActive)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm">
                    Active (will generate invoices automatically)
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  When active, this recurring invoice will automatically generate new invoices based on the frequency.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateRecurringInvoice;
