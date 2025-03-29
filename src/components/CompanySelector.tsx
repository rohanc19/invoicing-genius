
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Building, ChevronDown } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

interface CompanyProfile {
  company_name: string;
  company_email: string;
  company_address: string;
}

interface CompanySelectorProps {
  onCompanySelect: (companyDetails: CompanyProfile) => void;
  currentCompany: CompanyProfile;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ 
  onCompanySelect, 
  currentCompany 
}) => {
  const { user } = useAuth();
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("company_name, company_email, company_address")
          .eq("id", user.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setCompanyProfile(data);
          
          // Auto-select the company if we have one and no current company is selected
          if (data.company_name && !currentCompany.company_name) {
            onCompanySelect({
              company_name: data.company_name,
              company_email: data.company_email || "",
              company_address: data.company_address || "",
            });
          }
        }
      } catch (error: any) {
        console.error("Error fetching company profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompanyProfile();
  }, [user, onCompanySelect, currentCompany]);

  const handleSelectCompany = () => {
    if (!companyProfile || !companyProfile.company_name) {
      toast({
        title: "No company profile found",
        description: "Please set up your company profile first.",
        variant: "destructive",
      });
      return;
    }
    
    onCompanySelect({
      company_name: companyProfile.company_name,
      company_email: companyProfile.company_email || "",
      company_address: companyProfile.company_address || "",
    });
    
    toast({
      title: "Company selected",
      description: `Using ${companyProfile.company_name} for this invoice.`,
    });
  };

  if (isLoading) {
    return <div>Loading company profile...</div>;
  }

  return (
    <div className="space-y-2">
      {currentCompany.company_name ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selected Company</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">Edit Company Profile</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="p-3 border rounded-md bg-muted/50">
            <div className="font-medium">{currentCompany.company_name}</div>
            {currentCompany.company_email && <div className="text-sm text-muted-foreground">{currentCompany.company_email}</div>}
            {currentCompany.company_address && <div className="text-sm text-muted-foreground">{currentCompany.company_address}</div>}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleSelectCompany} 
            variant="outline" 
            className="w-full"
            disabled={!companyProfile || !companyProfile.company_name}
          >
            <Building className="mr-2 h-4 w-4" />
            {companyProfile?.company_name 
              ? `Use ${companyProfile.company_name}` 
              : "No company profile set"}
          </Button>
          <div className="text-sm text-muted-foreground text-center">
            <Link to="/profile" className="underline hover:text-primary">
              {companyProfile?.company_name ? "Edit profile" : "Set up your company profile"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySelector;
