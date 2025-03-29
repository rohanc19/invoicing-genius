
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Estimate } from "@/types/estimate";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FileBarChart, ArrowLeft, Edit, Printer, Download, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EstimateActionButtons from "@/components/EstimateActionButtons";
import EstimateDisplay from "@/components/EstimateDisplay";
import AppHeader from "@/components/AppHeader";
import { format } from "date-fns";
import { exportEstimateToPDF } from "@/utils/estimatePdfUtils";

const EstimateView = () => {
  const navigate = useNavigate();
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
            dueDate: estimateData.due_date,
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
          
          const status = estimateData.status as Estimate['status'] || 'draft';
          
          setEstimate({
            id: estimateData.id,
            details: estimateDetails,
            products: products,
            notes: estimateData.notes || "",
            status: status,
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

  const handlePrint = () => {
    if (!estimate) return;
    exportEstimateToPDF(estimate);
  };
  
  const handleDownload = () => {
    if (!estimate) return;
    exportEstimateToPDF(estimate, true);
  };

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
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Estimate Details</CardTitle>
              <Badge variant={
                estimate.status === 'accepted' ? 'default' : 
                estimate.status === 'declined' ? 'destructive' : 
                estimate.status === 'sent' ? 'secondary' : 
                'outline'
              }>
                {estimate.status?.toUpperCase() || 'DRAFT'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <EstimateDisplay estimate={estimate} />
          </CardContent>
        </Card>
        
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/edit-estimate/${estimate.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EstimateView;
