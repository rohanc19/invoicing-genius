
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { InvoiceDetails, Product, Invoice } from "../types/invoice";
import InvoiceHeader from "../components/InvoiceHeader";
import ProductList from "../components/ProductList";
import InvoiceSummary from "../components/InvoiceSummary";
import ActionButtons from "../components/ActionButtons";
import { 
  File, 
  ReceiptText,
  LogOut,
  User,
  Settings,
  Save,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import CompanySelector from "@/components/CompanySelector";
import AddCompany from "@/components/AddCompany";

const CreateInvoice = () => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  
  // Invoice details state
  const [details, setDetails] = useState<InvoiceDetails>({
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0], // Due in 14 days
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
  
  // Fetch invoice if editing
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id || !user) return;
      
      try {
        // Fetch invoice details
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (invoiceError) throw invoiceError;
        
        if (invoiceData) {
          setDetails({
            invoiceNumber: invoiceData.invoice_number,
            date: invoiceData.date ? new Date(invoiceData.date).toISOString().split('T')[0] : "",
            dueDate: invoiceData.due_date ? new Date(invoiceData.due_date).toISOString().split('T')[0] : "",
            clientName: invoiceData.client_name || "",
            clientEmail: invoiceData.client_email || "",
            clientAddress: invoiceData.client_address || "",
            yourCompany: invoiceData.your_company || "",
            yourEmail: invoiceData.your_email || "",
            yourAddress: invoiceData.your_address || "",
          });
          
          setNotes(invoiceData.notes || "");
          setIsDraft(invoiceData.is_draft || false);
          
          // Fetch invoice products
          const { data: productsData, error: productsError } = await supabase
            .from('invoice_products')
            .select('*')
            .eq('invoice_id', id);
            
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
          title: "Error fetching invoice",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    
    fetchInvoice();
  }, [id, user]);

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
  };
  
  // Save as draft
  const saveAsDraft = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to save invoices",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      let invoiceId: string;
      
      // If editing an existing invoice
      if (id) {
        // Update invoice
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update({
            invoice_number: details.invoiceNumber,
            client_name: details.clientName,
            client_email: details.clientEmail,
            client_address: details.clientAddress,
            your_company: details.yourCompany,
            your_email: details.yourEmail,
            your_address: details.yourAddress,
            date: details.date,
            due_date: details.dueDate,
            notes: notes,
            is_draft: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
          
        if (invoiceError) throw invoiceError;
        
        invoiceId = id;
        
        // Delete existing products
        const { error: deleteError } = await supabase
          .from('invoice_products')
          .delete()
          .eq('invoice_id', id);
          
        if (deleteError) throw deleteError;
      } else {
        // Insert invoice
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            user_id: user.id,
            invoice_number: details.invoiceNumber,
            client_name: details.clientName,
            client_email: details.clientEmail,
            client_address: details.clientAddress,
            your_company: details.yourCompany,
            your_email: details.yourEmail,
            your_address: details.yourAddress,
            date: details.date,
            due_date: details.dueDate,
            notes: notes,
            is_draft: true
          })
          .select()
          .single();
          
        if (invoiceError) throw invoiceError;
        
        invoiceId = invoiceData.id;
      }
      
      // Insert products
      const productsToInsert = products.map(product => ({
        invoice_id: invoiceId,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        tax: product.tax,
        discount: product.discount,
      }));
      
      const { error: productsError } = await supabase
        .from('invoice_products')
        .insert(productsToInsert);
        
      if (productsError) throw productsError;
      
      toast({
        title: "Draft saved",
        description: `Invoice ${details.invoiceNumber} has been saved as a draft`,
      });
      
      // Navigate to invoice list
      navigate('/');
      
    } catch (error: any) {
      toast({
        title: "Error saving draft",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Compute if form is valid
  const isFormValid = 
    details.yourCompany.trim() !== "" && 
    details.clientName.trim() !== "" && 
    products.length > 0 && 
    products.every(product => product.name.trim() !== "" && product.quantity > 0);

  // Create invoice object
  const invoice: Invoice = {
    details,
    products,
    notes,
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
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> 
              Back
            </Button>
            <File className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">{id ? "Edit Invoice" : "Create Invoice"}</h2>
          </div>
          
          <Button 
            variant="outline" 
            onClick={saveAsDraft}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : isDraft ? "Update Draft" : "Save as Draft"}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <CompanySelector 
              onCompanySelect={handleCompanySelect} 
              currentCompany={{
                company_name: details.yourCompany,
                company_email: details.yourEmail,
                company_address: details.yourAddress
              }}
            />
          </div>
          <div>
            <AddCompany />
          </div>
        </div>
        
        <InvoiceHeader details={details} setDetails={setDetails} />
        
        <ProductList products={products} setProducts={setProducts} />
        
        <InvoiceSummary 
          products={products}
          notes={notes}
          setNotes={setNotes}
        />
        
        <ActionButtons invoice={invoice} disabled={!isFormValid} />
      </div>
    </div>
  );
};

export default CreateInvoice;
