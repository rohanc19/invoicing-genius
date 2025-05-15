
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Building, User, Save } from "lucide-react";
import { Link } from "react-router-dom";
import DataExportImport from "@/components/DataExportImport";
import AppHeader from "@/components/AppHeader";
import CurrencySelector from "@/components/CurrencySelector";
import LanguageSelector from "@/components/LanguageSelector";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";

interface ProfileData {
  full_name: string;
  company_name: string;
  company_address: string;
  company_email: string;
  company_phone: string;
  default_currency?: string;
  default_language?: string;
}

const Profile = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    company_name: "",
    company_address: "",
    company_email: "",
    company_phone: "",
    default_currency: "",
  });

  const { currency, setCurrency } = useCurrency();

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        if (data) {
          setProfileData({
            full_name: data.full_name || "",
            company_name: data.company_name || "",
            company_address: data.company_address || "",
            company_email: data.company_email || "",
            company_phone: data.company_phone || "",
            default_currency: data.default_currency || "",
          });

          // Update currency context if default currency is set
          if (data.default_currency) {
            setCurrency(data.default_currency);
          }
        }
      } catch (error) {
        console.error("Error in profile fetch:", error);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          company_name: profileData.company_name,
          company_address: profileData.company_address,
          company_email: profileData.company_email,
          company_phone: profileData.company_phone,
          default_currency: profileData.default_currency || currency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch user profile for AppHeader
  useEffect(() => {
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
          setUserProfile(data);
        }
      } catch (error: any) {
        console.error("Error fetching profile for header:", error);
      }
    };

    fetchUserProfile();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <AppHeader userProfile={userProfile} />

      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Company Profile</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/">Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              This information will appear on all your invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  <User className="h-4 w-4 inline mr-2" />
                  Your Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={profileData.full_name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">
                  <Building className="h-4 w-4 inline mr-2" />
                  Company Name
                </Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={profileData.company_name}
                  onChange={handleInputChange}
                  placeholder="ACME Inc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_address">Company Address</Label>
                <Textarea
                  id="company_address"
                  name="company_address"
                  value={profileData.company_address}
                  onChange={handleInputChange}
                  placeholder="123 Business Street, City, Country"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_email">Company Email</Label>
                <Input
                  id="company_email"
                  name="company_email"
                  type="email"
                  value={profileData.company_email}
                  onChange={handleInputChange}
                  placeholder="contact@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_phone">Company Phone</Label>
                <Input
                  id="company_phone"
                  name="company_phone"
                  value={profileData.company_phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_currency">Default Currency</Label>
                <CurrencySelector
                  value={profileData.default_currency || currency}
                  onValueChange={(value) => {
                    setProfileData(prev => ({ ...prev, default_currency: value }));
                  }}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This currency will be used for all new invoices and estimates.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={saveProfile}
              disabled={isSaving}
              className="ml-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-8">
          <DataExportImport />
        </div>
      </div>
    </div>
  );
};

export default Profile;
