
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import InvoicesList from "./pages/InvoicesList";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceView from "./pages/InvoiceView";
import EstimatesList from "./pages/EstimatesList";
import CreateEstimate from "./pages/CreateEstimate";
import EstimateView from "./pages/EstimateView";
import InstallApp from "./pages/InstallApp";
import Dashboard from "./pages/Dashboard";
import RecurringInvoicesList from "./pages/RecurringInvoicesList";
import CreateRecurringInvoice from "./pages/CreateRecurringInvoice";
import ClientPortal from "./pages/ClientPortal";
import ClientInvoiceView from "./pages/ClientInvoiceView";
import ClientPayment from "./pages/ClientPayment";
import PaymentSuccess from "./pages/PaymentSuccess";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import './i18n/i18n';
import { ProtectedRoute } from "./components/ProtectedRoute";
import OfflineNotice from "./components/OfflineNotice";
import ElectronIntegration from "./components/ElectronIntegration";
import OfflineSyncManager from "./components/OfflineSyncManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineNotice />
            <ElectronIntegration />
            <OfflineSyncManager />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/install-app" element={<InstallApp />} />

              {/* Client Portal Routes */}
              <Route path="/client" element={<ClientPortal />} />
              <Route path="/client/invoice/:id" element={<ClientInvoiceView />} />
              <Route path="/client/pay/:id" element={<ClientPayment />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
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
                {/* Recurring Invoice routes */}
                <Route path="/recurring-invoices" element={<RecurringInvoicesList />} />
                <Route path="/create-recurring-invoice" element={<CreateRecurringInvoice />} />
                <Route path="/edit-recurring-invoice/:id" element={<CreateRecurringInvoice />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
            </LanguageProvider>
        </CurrencyProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
