import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Target, 
  Zap,
  Filter,
  Calendar,
  MapPin,
  Star,
  Map,
  BarChart3
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";

interface SalesKPI {
  totalSales: number;
  totalRevenue: number;
  conversionRate: number;
  averageDealSize: number;
  salesCycleLength: number;
  quotaAttainment: number;
  installationsScheduled: number;
  installationsCompleted: number;
}

interface FunnelData {
  leads: number;
  qualified: number;
  quoted: number;
  closedWon: number;
  installed: number;
}

interface TopRep {
  name: string;
  deals: number;
  revenue: number;
  callsMade: number;
  quotesSent: number;
}

export function SalesPerformanceContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<SalesKPI>({
    totalSales: 0,
    totalRevenue: 0,
    conversionRate: 0,
    averageDealSize: 0,
    salesCycleLength: 0,
    quotaAttainment: 0,
    installationsScheduled: 0,
    installationsCompleted: 0
  });
  const [funnelData, setFunnelData] = useState<FunnelData>({
    leads: 0,
    qualified: 0,
    quoted: 0,
    closedWon: 0,
    installed: 0
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date())
  });
  const [regionFilter, setRegionFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");

  const [topReps, setTopReps] = useState<TopRep[]>([]);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchSalesData();
    }
  }, [user, dateRange, regionFilter, sourceFilter, repFilter]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      
      // Fetch leads data
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user!.id);

      if (leadsError) throw leadsError;

      // Fetch customers data
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user!.id);

      if (customersError) throw customersError;

      // Fetch quotes data
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user!.id);

      if (quotesError) throw quotesError;

      // Fetch installations data
      const { data: installationsData, error: installationsError } = await supabase
        .from('installations')
        .select('*')
        .eq('user_id', user!.id);

      if (installationsError) throw installationsError;

      // Calculate KPIs
      const totalLeads = leadsData?.length || 0;
      const wonLeads = leadsData?.filter(lead => lead.status === 'won').length || 0;
      const qualifiedLeads = leadsData?.filter(lead => ['qualified', 'proposal_sent', 'negotiating', 'won'].includes(lead.status)).length || 0;
      const quotedLeads = leadsData?.filter(lead => ['proposal_sent', 'negotiating', 'won'].includes(lead.status)).length || 0;
      
      const totalRevenue = quotesData?.reduce((sum, quote) => sum + (quote.total_amount || 0), 0) || 0;
      const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
      const averageDealSize = wonLeads > 0 ? totalRevenue / wonLeads : 0;
      
      const scheduledInstallations = installationsData?.filter(inst => inst.status === 'scheduled').length || 0;
      const completedInstallations = installationsData?.filter(inst => inst.status === 'completed').length || 0;

      setKpis({
        totalSales: wonLeads,
        totalRevenue,
        conversionRate,
        averageDealSize,
        salesCycleLength: 28, // Mock data - would calculate from actual dates
        quotaAttainment: 85, // Mock data - would come from sales targets
        installationsScheduled: scheduledInstallations,
        installationsCompleted: completedInstallations
      });

      setFunnelData({
        leads: totalLeads,
        qualified: qualifiedLeads,
        quoted: quotedLeads,
        closedWon: wonLeads,
        installed: completedInstallations
      });

    } catch (error: any) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesTrends = async () => {
    try {
      // Get quotes by month for the last 6 months
      const { data: quotes } = await supabase
        .from('quotes')
        .select('total_amount, created_at, status')
        .eq('user_id', user!.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      // Group by month
      const monthlyData: { [key: string]: { sales: number; revenue: number } } = {};
      
      quotes?.forEach(quote => {
        const date = new Date(quote.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { sales: 0, revenue: 0 };
        }
        
        monthlyData[monthKey].sales += 1;
        monthlyData[monthKey].revenue += quote.total_amount || 0;
      });

      const trends = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        sales: data.sales,
        revenue: data.revenue
      }));

      setSalesTrends(trends);
    } catch (error) {
      console.error('Error fetching sales trends:', error);
    }
  };

  const fetchTopReps = async () => {
    try {
      // Since we don't have a reps table, we'll create mock data based on real user
      const { data: quotes } = await supabase
        .from('quotes')
        .select('total_amount, status')
        .eq('user_id', user!.id)
        .eq('status', 'approved');

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user!.id)
        .single();

      const totalDeals = quotes?.length || 0;
      const totalRevenue = quotes?.reduce((sum, quote) => sum + (quote.total_amount || 0), 0) || 0;

      const userName = profile ? `${profile.first_name || 'User'} ${profile.last_name || ''}`.trim() : 'Current User';

      setTopReps([
        {
          name: userName,
          deals: totalDeals,
          revenue: totalRevenue,
          callsMade: totalDeals * 5, // Estimated
          quotesSent: totalDeals * 2 // Estimated
        }
      ]);
    } catch (error) {
      console.error('Error fetching top reps:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFunnelPercentage = (current: number, total: number) => {
    return total > 0 ? Math.round((current / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading sales performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Region</label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="north">North Territory</SelectItem>
                  <SelectItem value="south">South Territory</SelectItem>
                  <SelectItem value="east">East Territory</SelectItem>
                  <SelectItem value="west">West Territory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Lead Source</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="advertising">Advertising</SelectItem>
                  <SelectItem value="door-to-door">Door-to-Door</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Sales Rep</label>
              <Select value={repFilter} onValueChange={setRepFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Reps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reps</SelectItem>
                  <SelectItem value="sarah">Sarah Johnson</SelectItem>
                  <SelectItem value="mike">Mike Chen</SelectItem>
                  <SelectItem value="emily">Emily Rodriguez</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Sales Performance Overview
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Core KPIs */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Core KPIs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Sales (This Month)"
                value={kpis.totalSales}
                change="+15.3%"
                changeType="positive"
                icon={DollarSign}
              />
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(kpis.totalRevenue)}
                change="+12.1%"
                changeType="positive"
                icon={TrendingUp}
              />
              <MetricCard
                title="Lead-to-Customer Conversion"
                value={`${kpis.conversionRate.toFixed(1)}%`}
                change="+2.3%"
                changeType="positive"
                icon={Users}
              />
              <MetricCard
                title="Average Deal Size"
                value={formatCurrency(kpis.averageDealSize)}
                change="+8.7%"
                changeType="positive"
                icon={Target}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <MetricCard
                title="Sales Cycle Length"
                value={`${kpis.salesCycleLength} days`}
                change="-3 days"
                changeType="positive"
                icon={Clock}
              />
              <MetricCard
                title="Quota Attainment"
                value={`${kpis.quotaAttainment}%`}
                change="+5%"
                changeType="positive"
                icon={Star}
              />
              <MetricCard
                title="Installations Progress"
                value={`${kpis.installationsCompleted}/${kpis.installationsScheduled}`}
                change="On Track"
                changeType="positive"
                icon={Zap}
              />
            </div>
          </div>

          {/* Sales Funnel */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Sales Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="w-full h-20 bg-gradient-primary rounded-lg flex items-center justify-center mb-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-foreground">{funnelData.leads}</div>
                        <div className="text-xs text-primary-foreground">Leads</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">100%</div>
                  </div>

                  <div className="text-center">
                    <div className="w-full h-20 bg-blue-500 rounded-lg flex items-center justify-center mb-2" style={{height: `${Math.max(50, (funnelData.qualified/funnelData.leads) * 80)}px`}}>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{funnelData.qualified}</div>
                        <div className="text-xs text-white">Qualified</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{getFunnelPercentage(funnelData.qualified, funnelData.leads)}%</div>
                  </div>

                  <div className="text-center">
                    <div className="w-full h-20 bg-purple-500 rounded-lg flex items-center justify-center mb-2" style={{height: `${Math.max(40, (funnelData.quoted/funnelData.leads) * 80)}px`}}>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{funnelData.quoted}</div>
                        <div className="text-xs text-white">Quoted</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{getFunnelPercentage(funnelData.quoted, funnelData.leads)}%</div>
                  </div>

                  <div className="text-center">
                    <div className="w-full h-20 bg-green-500 rounded-lg flex items-center justify-center mb-2" style={{height: `${Math.max(30, (funnelData.closedWon/funnelData.leads) * 80)}px`}}>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{funnelData.closedWon}</div>
                        <div className="text-xs text-white">Closed Won</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{getFunnelPercentage(funnelData.closedWon, funnelData.leads)}%</div>
                  </div>

                  <div className="text-center">
                    <div className="w-full h-20 bg-yellow-500 rounded-lg flex items-center justify-center mb-2" style={{height: `${Math.max(20, (funnelData.installed/funnelData.leads) * 80)}px`}}>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{funnelData.installed}</div>
                        <div className="text-xs text-white">Installed</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{getFunnelPercentage(funnelData.installed, funnelData.leads)}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Sales Trends */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Monthly Sales Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesTrends.length > 0 ? (
                    salesTrends.map((trend, index) => (
                      <div key={trend.month} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">{trend.month}</div>
                          <Badge variant="secondary">{trend.sales} deals</Badge>
                        </div>
                        <div className="text-sm font-medium">{formatCurrency(trend.revenue)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No sales data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Reps */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Top Performing Reps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topReps.length > 0 ? (
                    topReps.map((rep, index) => (
                    <div key={rep.name} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{rep.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {rep.deals} deals • {rep.callsMade} calls • {rep.quotesSent} quotes
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-success">{formatCurrency(rep.revenue)}</div>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No rep data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pipeline Forecast */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pipeline Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-muted/20 rounded-lg text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{formatCurrency(1250000)}</div>
                  <div className="text-sm text-muted-foreground">Weighted Pipeline</div>
                  <div className="text-xs text-success mt-1">+18% from last month</div>
                </div>
                <div className="p-4 bg-muted/20 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-2">42</div>
                  <div className="text-sm text-muted-foreground">Open Opportunities</div>
                  <div className="text-xs text-success mt-1">+5 new this week</div>
                </div>
                <div className="p-4 bg-muted/20 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-2">78%</div>
                  <div className="text-sm text-muted-foreground">Close Probability</div>
                  <div className="text-xs text-success mt-1">Above target</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}