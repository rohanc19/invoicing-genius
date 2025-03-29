import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { EstimateDetails, Product, Estimate } from "../types/estimate";
import EstimateHeader from "../components/EstimateHeader";
import ProductList from "../components/ProductList";
import EstimateSummary from "../components/EstimateSummary";
import EstimateActionButtons from "../components/EstimateActionButtons";
import { 
  FileBarChart, 
  Save,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import CompanySelector from "@/components/CompanySelector";
import AppHeader from "@/components/AppHeader";

const CreateEstimate = () => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  
  // Estimate details state
  const [details, setDetails] = useState<EstimateDetails>({
    estimateNumber: `EST-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0], // Expires in 30 days
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
  
  // Fetch estimate if editing
  useEffect(() => {
    const fetchEstimate = async () => {
      if (!id || !user) return;
      
      try {
        // Fetch estimate details
        const { data: estimateData, error: estimateError } = await supabase
          .from('estimates')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (estimateError) throw estimateError;
        
        if (estimateData) {
          setDetails({
            estimateNumber: estimateData.estimate_number,
            date: estimateData.date ? new Date(estimateData.date).toISOString().split('T')[0] : "",
            expiryDate: estimateData.expiry_date ? new Date(estimateData.expiry_date).toISOString().split('T')[0] : "",
            clientName: estimateData.client_name || "",
            clientEmail: estimateData.client_email || "",
            clientAddress: estimateData.client_address || "",
            yourCompany: estimateData.your_company || "",
            yourEmail: estimateData.your_email || "",
            yourAddress: estimateData.your_address || "",
          });
          
          setNotes(estimateData.notes || "");
          setIsDraft(estimateData.is_draft || false);
          
          // Fetch estimate products
          const { data: productsData, error: productsError } = await supabase
            .from('estimate_products')
            .select('*')
            .eq('estimate_id', id);
            
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
          title: "Error fetching estimate",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    
    fetchEstimate();
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
        description: "You must be logged in to save estimates",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      let estimateId: string;
      
      // If editing an existing estimate
      if (id) {
        // Update estimate
        const { error: estimateError } = await supabase
          .from('estimates')
          .update({
            estimate_number: details.estimateNumber,
            client_name: details.clientName,
            client_email: details.clientEmail,
            client_address: details.clientAddress,
            your_company: details.yourCompany,
            your_email: details.yourEmail,
            your_address: details.yourAddress,
            date: details.date,
            expiry_date: details.expiryDate,
            notes: notes,
            is_draft: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
          
        if (estimateError) throw estimateError;
        
        estimateId = id;
        
        // Delete existing products
        const { error: deleteError } = await supabase
          .from('estimate_products')
          .delete()
          .eq('estimate_id', id);
          
        if (deleteError) throw deleteError;
      } else {
        // Insert estimate
        const { data: estimateData, error: estimateError } = await supabase
          .from('estimates')
          .insert({
            user_id: user.id,
            estimate_number: details.estimateNumber,
            client_name: details.clientName,
            client_email: details.clientEmail,
            client_address: details.clientAddress,
            your_company: details.yourCompany,
            your_email: details.yourEmail,
            your_address: details.yourAddress,
            date: details.date,
            expiry_date: details.expiryDate,
            notes: notes,
            is_draft: true
          })
          .select()
          .single();
          
        if (estimateError) throw estimateError;
        
        estimateId = estimateData.id;
      }
      
      // Insert products
      const productsToInsert = products.map(product => ({
        estimate_id: estimateId,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        tax: product.tax,
        discount: product.discount,
      }));
      
      const { error: productsError } = await supabase
        .from('estimate_products')
        .insert(productsToInsert);
        
      if (productsError) throw productsError;
      
      toast({
        title: "Draft saved",
        description: `Estimate ${details.estimateNumber} has been saved as a draft`,
      });
      
      // Navigate to estimate list
      navigate('/estimates');
      
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

  // Create estimate object
  const estimate: Estimate = {
    details,
    products,
    notes,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AppHeader userProfile={userProfile} />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/estimates')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> 
              Back
            </Button>
            <FileBarChart className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">{id ? "Edit Estimate" : "Create Estimate"}</h2>
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
        </div>
        
        <EstimateHeader details={details} setDetails={setDetails} />
        
        <ProductList products={products} setProducts={setProducts} />
        
        <EstimateSummary 
          products={products}
          notes={notes}
          setNotes={setNotes}
        />
        
        <EstimateActionButtons estimate={estimate} />
      </div>
    </div>
  );
};

export default CreateEstimate;
