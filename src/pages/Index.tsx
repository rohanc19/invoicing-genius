
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
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  
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
          
          // Pre-fill company details if available
          setDetails(prev => ({
            ...prev,
            yourCompany: data.company_name || "",
            yourEmail: data.company_email || user.email || "",
            yourAddress: data.company_address || "",
          }));
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
        <div className="flex items-center gap-2 mb-6">
          <File className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Create Invoice</h2>
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

export default Index;
