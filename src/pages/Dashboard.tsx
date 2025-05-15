import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  ReceiptText,
  LogOut,
  User,
  Settings,
  FileText,
  FileBarChart,
  DollarSign,
  Clock,
  Users,
  Plus,
  Repeat
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import AppHeader from "@/components/AppHeader";

const Dashboard = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalEstimates: 0,
    totalClients: 0,
    totalRevenue: 0,
    unpaidInvoices: 0,
    overdueInvoices: 0
  });
  const [invoiceStatusData, setInvoiceStatusData] = useState<any[]>([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);
  const navigate = useNavigate();

  // Fetch user profile
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
        toast({
          title: "Error fetching profile",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchUserProfile();
  }, [user]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user) return;

        setIsLoading(true);

        // Fetch total invoices
        const { count: invoiceCount, error: invoiceError } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (invoiceError) throw invoiceError;

        // Fetch total estimates
        const { count: estimateCount, error: estimateError } = await supabase
          .from('estimates')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (estimateError) throw estimateError;

        // Fetch total clients
        const { count: clientCount, error: clientError } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (clientError) throw clientError;

        // Fetch invoice status data
        const { data: invoiceStatusRaw, error: statusError } = await supabase
          .from('invoices')
          .select('status')
          .eq('user_id', user.id);

        if (statusError) throw statusError;

        // Count invoices by status
        const statusCounts: Record<string, number> = {};
        invoiceStatusRaw?.forEach(invoice => {
          const status = invoice.status || 'unpaid';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
        setInvoiceStatusData(statusData);

        // Calculate unpaid and overdue invoices
        const unpaidCount = statusCounts['unpaid'] || 0;

        const today = new Date();
        const { data: overdueInvoices, error: overdueError } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'unpaid')
          .lt('due_date', today.toISOString());

        if (overdueError) throw overdueError;

        // Fetch monthly revenue data (last 6 months)
        const monthlyData = [];
        let totalRevenue = 0;

        for (let i = 0; i < 6; i++) {
          const monthDate = subMonths(new Date(), i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);

          const { data: monthInvoices, error: monthError } = await supabase
            .from('invoices')
            .select('id, status')
            .eq('user_id', user.id)
            .eq('status', 'paid')
            .gte('date', monthStart.toISOString())
            .lte('date', monthEnd.toISOString());

          if (monthError) throw monthError;

          let monthRevenue = 0;

          // For each invoice, get its products and calculate total
          for (const invoice of monthInvoices || []) {
            const { data: products, error: productsError } = await supabase
              .from('invoice_products')
              .select('*')
              .eq('invoice_id', invoice.id);

            if (productsError) throw productsError;

            const invoiceTotal = (products || []).reduce((sum, product) => {
              const lineTotal = product.quantity * product.price;
              const lineTax = lineTotal * (product.tax / 100);
              const lineDiscount = lineTotal * (product.discount / 100);
              return sum + lineTotal + lineTax - lineDiscount;
            }, 0);

            monthRevenue += invoiceTotal;
            totalRevenue += invoiceTotal;
          }

          monthlyData.push({
            name: format(monthDate, 'MMM'),
            revenue: monthRevenue
          });
        }

        // Reverse to show oldest to newest
        setMonthlyRevenueData(monthlyData.reverse());

        // Update stats
        setStats({
          totalInvoices: invoiceCount || 0,
          totalEstimates: estimateCount || 0,
          totalClients: clientCount || 0,
          totalRevenue,
          unpaidInvoices: unpaidCount,
          overdueInvoices: overdueInvoices?.length || 0
        });

      } catch (error: any) {
        toast({
          title: "Error fetching dashboard data",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AppHeader userProfile={userProfile} />

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Dashboard</h2>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              asChild
            >
              <Link to="/invoices">
                <FileText className="h-5 w-5 mr-2" />
                View Invoices
              </Link>
            </Button>

            <Button
              variant="outline"
              asChild
            >
              <Link to="/estimates">
                <FileBarChart className="h-5 w-5 mr-2" />
                View Estimates
              </Link>
            </Button>

            <Button
              variant="outline"
              asChild
            >
              <Link to="/recurring-invoices">
                <Repeat className="h-5 w-5 mr-2" />
                Recurring Invoices
              </Link>
            </Button>

            <Button
              variant="outline"
              asChild
            >
              <Link to="/reports">
                <BarChart className="h-5 w-5 mr-2" />
                Reports
              </Link>
            </Button>

            <Button onClick={() => navigate('/create-invoice')}>
              <Plus className="h-5 w-5 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">Loading dashboard data...</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-primary mr-2" />
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalRevenue)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-amber-500 mr-2" />
                    <div className="text-2xl font-bold">{stats.unpaidInvoices}</div>
                    {stats.overdueInvoices > 0 && (
                      <span className="ml-2 text-sm text-red-500">({stats.overdueInvoices} overdue)</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-indigo-500 mr-2" />
                    <div className="text-2xl font-bold">{stats.totalClients}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                  <CardDescription>Revenue from paid invoices over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) =>
                            new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              notation: 'compact',
                              maximumFractionDigits: 1
                            }).format(value)
                          }
                        />
                        <Tooltip
                          formatter={(value) =>
                            new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(Number(value))
                          }
                        />
                        <Bar dataKey="revenue" fill="#4f46e5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Invoice Status</CardTitle>
                  <CardDescription>Distribution of invoices by status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={invoiceStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {invoiceStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Invoices']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => navigate('/create-invoice')}>
                    <FileText className="h-4 w-4 mr-2" />
                    New Invoice
                  </Button>
                  <Button onClick={() => navigate('/create-estimate')}>
                    <FileBarChart className="h-4 w-4 mr-2" />
                    New Estimate
                  </Button>
                  {stats.unpaidInvoices > 0 && (
                    <Button variant="outline" onClick={() => navigate('/invoices')}>
                      <Clock className="h-4 w-4 mr-2" />
                      View Unpaid Invoices
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
