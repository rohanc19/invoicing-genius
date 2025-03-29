
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Plus } from "lucide-react";

const AddCompany = () => {
  const { user } = useAuth();
  const [companyDetails, setCompanyDetails] = useState({
    company_name: "",
    company_email: "",
    company_address: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add a company.",
        variant: "destructive",
      });
      return;
    }
    
    if (!companyDetails.company_name.trim()) {
      toast({
        title: "Company name required",
        description: "Please provide a name for your company.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, company_name")
        .eq("id", user.id)
        .single();
        
      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }
      
      // Update the user's profile with the new company
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          company_name: companyDetails.company_name,
          company_email: companyDetails.company_email,
          company_address: companyDetails.company_address
        })
        .eq("id", user.id);
        
      if (updateError) throw updateError;
      
      // Reset the form
      setCompanyDetails({
        company_name: "",
        company_email: "",
        company_address: ""
      });
      
      toast({
        title: "Company added",
        description: `${companyDetails.company_name} has been added to your profile.`,
      });
      
      // Refresh the page to show the updated company info
      window.location.reload();
      
    } catch (error: any) {
      toast({
        title: "Error adding company",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add New Company
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input 
              id="company_name" 
              name="company_name" 
              value={companyDetails.company_name}
              onChange={handleChange}
              placeholder="Your Company Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_email">Company Email</Label>
            <Input 
              id="company_email" 
              name="company_email" 
              type="email"
              value={companyDetails.company_email}
              onChange={handleChange}
              placeholder="company@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_address">Company Address</Label>
            <Input 
              id="company_address" 
              name="company_address" 
              value={companyDetails.company_address}
              onChange={handleChange}
              placeholder="Company Address"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompany;
