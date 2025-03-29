
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import InvoicesList from "./pages/InvoicesList";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceView from "./pages/InvoiceView";
import EstimatesList from "./pages/EstimatesList";
import CreateEstimate from "./pages/CreateEstimate";
import EstimateView from "./pages/EstimateView";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<InvoicesList />} />
              <Route path="/create-invoice" element={<CreateInvoice />} />
              <Route path="/edit-invoice/:id" element={<CreateInvoice />} />
              <Route path="/invoices" element={<InvoicesList />} />
              <Route path="/invoice/:id" element={<InvoiceView />} />
              <Route path="/invoice-editor" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              {/* Estimate routes */}
              <Route path="/estimates" element={<EstimatesList />} />
              <Route path="/create-estimate" element={<CreateEstimate />} />
              <Route path="/edit-estimate/:id" element={<CreateEstimate />} />
              <Route path="/estimate/:id" element={<EstimateView />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
