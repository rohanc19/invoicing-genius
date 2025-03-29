
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
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link, Navigate } from "react-router-dom";
import CompanySelector from "@/components/CompanySelector";

const Index = () => {
  // Redirect to the new InvoicesList page
  return <Navigate to="/" replace />;
};

export default Index;
