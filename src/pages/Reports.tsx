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
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Download,
  Calendar,
  Filter
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
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
  Legend,
  LineChart,
  Line
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from "date-fns";
import AppHeader from "@/components/AppHeader";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { saveAs } from "file-saver";

const Reports = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Report data
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any[]>([]);
  const [topClientsData, setTopClientsData] = useState<any[]>([]);
  
  // Filters
  const [timeRange, setTimeRange] = useState<string>("last6Months");
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);
  
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
  
  // Update date range when time range changes
  useEffect(() => {
    const now = new Date();
    
    switch (timeRange) {
      case "last30Days":
        setStartDate(subMonths(now, 1));
        setEndDate(now);
        break;
      case "last3Months":
        setStartDate(subMonths(now, 3));
        setEndDate(now);
        break;
      case "last6Months":
        setStartDate(subMonths(now, 6));
        setEndDate(now);
        break;
      case "thisYear":
        setStartDate(startOfYear(now));
        setEndDate(now);
        break;
      case "lastYear":
        const lastYear = subYears(now, 1);
        setStartDate(startOfYear(lastYear));
        setEndDate(endOfYear(lastYear));
        break;
      case "custom":
        // Don't change dates for custom range
        break;
      default:
        setStartDate(subMonths(now, 6));
        setEndDate(now);
    }
  }, [timeRange]);
  
  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        if (!user) return;
        
        setIsLoading(true);
        
        // Format dates for queries
        const formattedStartDate = startDate.toISOString();
        const formattedEndDate = endDate.toISOString();
        
        // Fetch invoices in date range
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('id, invoice_number, date, due_date, status, client_name')
          .eq('user_id', user.id)
          .gte('date', formattedStartDate)
          .lte('date', formattedEndDate);
          
        if (invoicesError) throw invoicesError;
        
        // Process invoice status data
        const statusCounts: Record<string, number> = {};
        (invoices || []).forEach(invoice => {
          const status = invoice.status || 'unpaid';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
        setStatusData(statusChartData);
        
        // Process revenue data by month
        const revenueByMonth: Record<string, number> = {};
        const clientRevenue: Record<string, number> = {};
        
        // Initialize months
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const monthKey = format(currentDate, 'yyyy-MM');
          revenueByMonth[monthKey] = 0;
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        }
        
        // Calculate revenue for each invoice
        for (const invoice of invoices || []) {
          // Get invoice products
          const { data: products, error: productsError } = await supabase
            .from('invoice_products')
            .select('*')
            .eq('invoice_id', invoice.id);
            
          if (productsError) throw productsError;
          
          // Calculate invoice total
          let invoiceTotal = 0;
          for (const product of products || []) {
            const lineTotal = product.quantity * product.price;
            const lineTax = lineTotal * (product.tax / 100);
            const lineDiscount = lineTotal * (product.discount / 100);
            invoiceTotal += lineTotal + lineTax - lineDiscount;
          }
          
          // Only count paid invoices for revenue
          if (invoice.status === 'paid') {
            // Add to monthly revenue
            const monthKey = format(new Date(invoice.date), 'yyyy-MM');
            revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + invoiceTotal;
            
            // Add to client revenue
            clientRevenue[invoice.client_name] = (clientRevenue[invoice.client_name] || 0) + invoiceTotal;
          }
        }
        
        // Convert revenue by month to chart data
        const revenueChartData = Object.entries(revenueByMonth).map(([monthKey, amount]) => {
          const [year, month] = monthKey.split('-');
          return {
            name: format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMM yyyy'),
            revenue: amount
          };
        });
        
        setRevenueData(revenueChartData);
        
        // Convert client revenue to chart data and sort by revenue
        const clientChartData = Object.entries(clientRevenue)
          .map(([name, revenue]) => ({ name, revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5); // Top 5 clients
          
        setTopClientsData(clientChartData);
        
        // Fetch clients
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id);
          
        if (clientsError) throw clientsError;
        
        // Count invoices per client
        const clientInvoiceCounts: Record<string, number> = {};
        (invoices || []).forEach(invoice => {
          clientInvoiceCounts[invoice.client_name] = (clientInvoiceCounts[invoice.client_name] || 0) + 1;
        });
        
        // Create client data for chart
        const clientChartData2 = Object.entries(clientInvoiceCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10 clients by invoice count
          
        setClientData(clientChartData2);
        
      } catch (error: any) {
        toast({
          title: "Error fetching report data",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReportData();
  }, [user, startDate, endDate]);
  
  // Export report data to CSV
  const exportReportData = () => {
    try {
      // Revenue data
      let csvContent = "Monthly Revenue\n";
      csvContent += "Month,Revenue\n";
      revenueData.forEach(item => {
        csvContent += `${item.name},${item.revenue}\n`;
      });
      
      csvContent += "\nInvoice Status\n";
      csvContent += "Status,Count\n";
      statusData.forEach(item => {
        csvContent += `${item.name},${item.value}\n`;
      });
      
      csvContent += "\nTop Clients by Revenue\n";
      csvContent += "Client,Revenue\n";
      topClientsData.forEach(item => {
        csvContent += `${item.name},${item.revenue}\n`;
      });
      
      csvContent += "\nClients by Invoice Count\n";
      csvContent += "Client,Invoice Count\n";
      clientData.forEach(item => {
        csvContent += `${item.name},${item.count}\n`;
      });
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `financial-report-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.csv`);
      
      toast({
        title: "Report exported",
        description: "The report data has been exported to CSV.",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Colors for charts
  const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const STATUS_COLORS = {
    paid: '#10b981',
    unpaid: '#f59e0b',
    overdue: '#ef4444',
    draft: '#9ca3af',
    cancelled: '#6b7280'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <AppHeader userProfile={userProfile} />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChartIcon className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Financial Reports</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={exportReportData}
              disabled={isLoading}
            >
              <Download className="h-5 w-5 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
        
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Filter by:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30Days">Last 30 Days</SelectItem>
                <SelectItem value="last3Months">Last 3 Months</SelectItem>
                <SelectItem value="last6Months">Last 6 Months</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
                <SelectItem value="lastYear">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            {timeRange === 'custom' && (
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex flex-col sm:flex-row gap-2 p-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Start Date</p>
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        disabled={(date) => date > endDate || date > new Date()}
                        initialFocus
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">End Date</p>
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        disabled={(date) => date < startDate || date > new Date()}
                        initialFocus
                      />
                    </div>
                  </div>
                  <div className="border-t p-3 flex justify-end">
                    <Button size="sm" onClick={() => setDatePickerOpen(false)}>
                      Apply Range
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">Loading report data...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5 text-primary" />
                    Revenue Over Time
                  </CardTitle>
                  <CardDescription>
                    Monthly revenue from {format(startDate, 'MMM d, yyyy')} to {format(endDate, 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
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
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#4f46e5" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-primary" />
                    Invoice Status Distribution
                  </CardTitle>
                  <CardDescription>
                    Distribution of invoices by status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} 
                            />
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5 text-primary" />
                    Top Clients by Revenue
                  </CardTitle>
                  <CardDescription>
                    Your highest revenue-generating clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topClientsData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number"
                          tickFormatter={(value) => 
                            new Intl.NumberFormat('en-US', { 
                              style: 'currency', 
                              currency: 'USD',
                              notation: 'compact',
                              maximumFractionDigits: 1
                            }).format(value)
                          }
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value) => 
                            new Intl.NumberFormat('en-US', { 
                              style: 'currency', 
                              currency: 'USD' 
                            }).format(Number(value))
                          } 
                        />
                        <Bar dataKey="revenue" fill="#4f46e5">
                          {topClientsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5 text-primary" />
                    Clients by Invoice Count
                  </CardTitle>
                  <CardDescription>
                    Number of invoices per client
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={clientData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981">
                          {clientData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>
                  Key financial metrics for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</h3>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueData.reduce((sum, item) => sum + item.revenue, 0))}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Monthly Revenue</h3>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        revenueData.length > 0 
                          ? revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.length 
                          : 0
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Invoices</h3>
                    <div className="text-2xl font-bold">
                      {statusData.reduce((sum, item) => sum + item.value, 0)}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Paid Invoices</h3>
                    <div className="text-2xl font-bold text-green-600">
                      {statusData.find(item => item.name === 'paid')?.value || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
