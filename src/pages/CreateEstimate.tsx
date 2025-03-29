
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import InvoiceHeader from "@/components/InvoiceHeader";
import ProductList from "@/components/ProductList";
import InvoiceSummary from "@/components/InvoiceSummary";
import { Card, CardContent } from "@/components/ui/card";
import CompanySelector from "@/components/CompanySelector";

// Types
import { Product } from "@/types/invoice";
import { EstimateDetails } from "@/types/estimate";

const initialEstimateDetails: EstimateDetails = {
  estimateNumber: `EST-${Math.floor(Math.random() * 1000) + 1}`,
  date: format(new Date(), "yyyy-MM-dd"),
  dueDate: format(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 15 days from now
  clientName: "",
  clientEmail: "",
  clientAddress: "",
  yourCompany: "",
  yourEmail: "",
  yourAddress: "",
};

const initialProducts: Product[] = [
  {
    id: uuidv4(),
    name: "",
    quantity: 1,
    price: 0,
    tax: 0,
    discount: 0,
  },
];

const CreateEstimate = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [estimateDetails, setEstimateDetails] = useState<EstimateDetails>(initialEstimateDetails);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [notes, setNotes] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // If ID is provided, fetch the estimate for editing
  useEffect(() => {
    const fetchEstimate = async () => {
      if (!id || !user) return;
      
      setIsLoadingEstimate(true);
      try {
        // Fetch the estimate
        const { data: estimate, error: estimateError } = await supabase
          .from("estimates")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();
        
        if (estimateError) throw estimateError;
        
        // Fetch the products for this estimate
        const { data: estimateProducts, error: productsError } = await supabase
          .from("estimate_products")
          .select("*")
          .eq("estimate_id", id);
        
        if (productsError) throw productsError;
        
        // Update state with the fetched data
        setEstimateDetails({
          estimateNumber: estimate.estimate_number,
          date: estimate.date ? format(new Date(estimate.date), "yyyy-MM-dd") : "",
          dueDate: estimate.due_date ? format(new Date(estimate.due_date), "yyyy-MM-dd") : "",
          clientName: estimate.client_name || "",
          clientEmail: estimate.client_email || "",
          clientAddress: estimate.client_address || "",
          yourCompany: estimate.your_company || "",
          yourEmail: estimate.your_email || "",
          yourAddress: estimate.your_address || "",
        });
        
        if (estimateProducts && estimateProducts.length > 0) {
          setProducts(estimateProducts.map((product: any) => ({
            id: product.id,
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            tax: product.tax || 0,
            discount: product.discount || 0,
          })));
        }
        
        setNotes(estimate.notes || "");
        setIsEditMode(true);
        
      } catch (error: any) {
        toast({
          title: "Error fetching estimate",
          description: error.message,
          variant: "destructive",
        });
        navigate("/estimates"); // Redirect back to estimates if there's an error
      } finally {
        setIsLoadingEstimate(false);
      }
    };
    
    fetchEstimate();
  }, [id, user, navigate]);

  const handleSaveEstimate = async (status: string = "draft") => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save estimates",
        variant: "destructive",
      });
      return;
    }
    
    if (!estimateDetails.clientName) {
      toast({
        title: "Client information required",
        description: "Please add client information to the estimate",
        variant: "destructive",
      });
      return;
    }
    
    if (products.some(product => !product.name || product.quantity <= 0)) {
      toast({
        title: "Invalid product data",
        description: "Please ensure all products have a name and positive quantity",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Prepare the estimate data
      const estimateData = {
        user_id: user.id,
        estimate_number: estimateDetails.estimateNumber,
        date: estimateDetails.date,
        due_date: estimateDetails.dueDate,
        client_name: estimateDetails.clientName,
        client_email: estimateDetails.clientEmail,
        client_address: estimateDetails.clientAddress,
        your_company: estimateDetails.yourCompany,
        your_email: estimateDetails.yourEmail,
        your_address: estimateDetails.yourAddress,
        notes: notes,
        status: status,
      };
      
      // For edit mode, update the existing estimate
      if (isEditMode && id) {
        // Update the estimate
        const { error: updateError } = await supabase
          .from("estimates")
          .update(estimateData)
          .eq("id", id);
        
        if (updateError) throw updateError;
        
        // Delete existing products and add the new ones
        const { error: deleteError } = await supabase
          .from("estimate_products")
          .delete()
          .eq("estimate_id", id);
        
        if (deleteError) throw deleteError;
        
        // Insert the updated products
        const productsToInsert = products.map(product => ({
          estimate_id: id,
          name: product.name,
          quantity: product.quantity,
          price: product.price,
          tax: product.tax || 0,
          discount: product.discount || 0,
        }));
        
        const { error: insertError } = await supabase
          .from("estimate_products")
          .insert(productsToInsert);
        
        if (insertError) throw insertError;
        
        toast({
          title: "Estimate updated",
          description: `Estimate ${estimateDetails.estimateNumber} has been updated.`,
        });
        
      } else {
        // Create a new estimate
        const { data: estimateResult, error: createError } = await supabase
          .from("estimates")
          .insert(estimateData)
          .select()
          .single();
        
        if (createError) throw createError;
        
        // Insert the products for this estimate
        const productsToInsert = products.map(product => ({
          estimate_id: estimateResult.id,
          name: product.name,
          quantity: product.quantity,
          price: product.price,
          tax: product.tax || 0,
          discount: product.discount || 0,
        }));
        
        const { error: productsError } = await supabase
          .from("estimate_products")
          .insert(productsToInsert);
        
        if (productsError) throw productsError;
        
        toast({
          title: "Estimate created",
          description: `Estimate ${estimateDetails.estimateNumber} has been created.`,
        });
      }
      
      // Navigate back to the estimates list
      navigate("/estimates");
      
    } catch (error: any) {
      toast({
        title: "Error saving estimate",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompanySelect = (companyDetails: { 
    company_name: string; 
    company_email: string; 
    company_address: string;
  }) => {
    setEstimateDetails(prev => ({
      ...prev,
      yourCompany: companyDetails.company_name,
      yourEmail: companyDetails.company_email,
      yourAddress: companyDetails.company_address,
    }));
  };

  if (isLoadingEstimate) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
        <p>Loading estimate data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Estimate" : "Create New Estimate"}
        </h1>
        <Button 
          variant="outline" 
          onClick={() => navigate("/estimates")}
        >
          Back to Estimates
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InvoiceHeader 
            details={{
              invoiceNumber: estimateDetails.estimateNumber,
              date: estimateDetails.date,
              dueDate: estimateDetails.dueDate,
              clientName: estimateDetails.clientName,
              clientEmail: estimateDetails.clientEmail,
              clientAddress: estimateDetails.clientAddress,
              yourCompany: estimateDetails.yourCompany,
              yourEmail: estimateDetails.yourEmail,
              yourAddress: estimateDetails.yourAddress,
            }} 
            setDetails={(details) => {
              setEstimateDetails({
                estimateNumber: details.invoiceNumber,
                date: details.date,
                dueDate: details.dueDate,
                clientName: details.clientName,
                clientEmail: details.clientEmail,
                clientAddress: details.clientAddress,
                yourCompany: details.yourCompany,
                yourEmail: details.yourEmail,
                yourAddress: details.yourAddress,
              });
            }} 
          />
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <CompanySelector 
                onCompanySelect={handleCompanySelect}
                currentCompany={{
                  company_name: estimateDetails.yourCompany,
                  company_email: estimateDetails.yourEmail,
                  company_address: estimateDetails.yourAddress
                }}
              />
            </CardContent>
          </Card>
          
          <ProductList 
            products={products} 
            setProducts={setProducts} 
          />
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter any additional notes or terms..."
                    className="min-h-[100px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <InvoiceSummary products={products} />
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={() => handleSaveEstimate("draft")}
                  disabled={isSaving || isLoading}
                >
                  {isSaving ? "Saving..." : "Save as Draft"}
                </Button>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleSaveEstimate("sent")}
                  disabled={isSaving || isLoading}
                >
                  {isSaving ? "Saving..." : "Save as Sent"}
                </Button>
                
                <Button 
                  className="w-full" 
                  variant="secondary"
                  onClick={() => navigate("/estimates")}
                  disabled={isSaving || isLoading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateEstimate;
