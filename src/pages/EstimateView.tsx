import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Estimate } from "@/types/estimate";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FileBarChart, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import EstimateActionButtons from "@/components/EstimateActionButtons";
import EstimateDisplay from "@/components/EstimateDisplay";
import AppHeader from "@/components/AppHeader";

const EstimateView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<any>(null);

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
    const fetchEstimate = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch estimate details
        const { data: estimateData, error: estimateError } = await supabase
          .from('estimates')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (estimateError) throw estimateError;
        
        if (estimateData) {
          // Fetch estimate products
          const { data: productsData, error: productsError } = await supabase
            .from('estimate_products')
            .select('*')
            .eq('estimate_id', id);
            
          if (productsError) throw productsError;
          
          const estimateDetails = {
            estimateNumber: estimateData.estimate_number,
            date: estimateData.date,
            expiryDate: estimateData.expiry_date,
            clientName: estimateData.client_name,
            clientEmail: estimateData.client_email,
            clientAddress: estimateData.client_address,
            yourCompany: estimateData.your_company,
            yourEmail: estimateData.your_email,
            yourAddress: estimateData.your_address,
          };
          
          const products = productsData.map(product => ({
            id: product.id,
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            tax: product.tax || 0,
            discount: product.discount || 0,
          }));
          
          setEstimate({
            id: estimateData.id,
            details: estimateDetails,
            products: products,
            notes: estimateData.notes || "",
            status: estimateData.status || "pending",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error fetching estimate",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEstimate();
  }, [id, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading estimate...</p>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="mb-4">Estimate not found or you don't have permission to view it.</p>
        <Button asChild>
          <Link to="/estimates">Back to Estimates</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AppHeader userProfile={userProfile} />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="mr-2"
          >
            <Link to="/estimates">
              <ArrowLeft className="h-4 w-4 mr-1" /> 
              Back to Estimates
            </Link>
          </Button>
          <FileBarChart className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Estimate #{estimate.details.estimateNumber}</h2>
        </div>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <EstimateDisplay estimate={estimate} />
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <EstimateActionButtons estimate={estimate} />
        </div>
      </div>
    </div>
  );
};

export default EstimateView;
