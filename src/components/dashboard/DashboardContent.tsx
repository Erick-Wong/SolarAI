import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { InstallationTracker } from "@/components/dashboard/InstallationTracker";
import { GeographicMap } from "@/components/dashboard/GeographicMap";
import { QuickActionDialogs } from "@/components/dashboard/QuickActionDialogs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Users,
  Zap,
  TrendingUp,
  Target,
  Calendar,
} from "lucide-react";

interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  activeLeads: number;
  leadsChange: number;
  installations: number;
  installationsChange: number;
  conversionRate: number;
  conversionChange: number;
}

interface RecentActivity {
  id: string;
  type: 'installation' | 'lead' | 'quote';
  description: string;
  time: string;
  status: 'success' | 'warning' | 'info';
}

export function DashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    revenueChange: 0,
    activeLeads: 0,
    leadsChange: 0,
    installations: 0,
    installationsChange: 0,
    conversionRate: 0,
    conversionChange: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch current month data
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1);
      const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1);
      const lastDayLastMonth = new Date(currentYear, currentMonth, 0);

      // Get approved quotes for revenue
      const { data: currentQuotes } = await supabase
        .from('quotes')
        .select('total_amount, created_at')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .gte('created_at', firstDayCurrentMonth.toISOString());

      const { data: lastMonthQuotes } = await supabase
        .from('quotes')
        .select('total_amount, created_at')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .gte('created_at', firstDayLastMonth.toISOString())
        .lte('created_at', lastDayLastMonth.toISOString());

      // Get leads data
      const { data: currentLeads } = await supabase
        .from('leads')
        .select('id, status, created_at')
        .eq('user_id', user.id)
        .in('status', ['new', 'contacted', 'qualified']);

      const { data: lastMonthLeads } = await supabase
        .from('leads')
        .select('id, status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', firstDayLastMonth.toISOString())
        .lte('created_at', lastDayLastMonth.toISOString());

      // Get installations data
      const { data: currentInstallations } = await supabase
        .from('installations')
        .select('id, status, created_at')
        .eq('user_id', user.id);

      const { data: lastMonthInstallations } = await supabase
        .from('installations')
        .select('id, status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', firstDayLastMonth.toISOString())
        .lte('created_at', lastDayLastMonth.toISOString());

      // Calculate metrics
      const totalRevenue = currentQuotes?.reduce((sum, quote) => sum + (quote.total_amount || 0), 0) || 0;
      const lastMonthRevenue = lastMonthQuotes?.reduce((sum, quote) => sum + (quote.total_amount || 0), 0) || 0;
      const revenueChange = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      const activeLeads = currentLeads?.length || 0;
      const lastMonthLeadsCount = lastMonthLeads?.length || 0;
      const leadsChange = lastMonthLeadsCount > 0 ? ((activeLeads - lastMonthLeadsCount) / lastMonthLeadsCount) * 100 : 0;

      const installations = currentInstallations?.length || 0;
      const lastMonthInstallationsCount = lastMonthInstallations?.length || 0;
      const installationsChange = lastMonthInstallationsCount > 0 ? ((installations - lastMonthInstallationsCount) / lastMonthInstallationsCount) * 100 : 0;

      // Calculate conversion rate (approved quotes / total leads)
      const { data: allLeads } = await supabase
        .from('leads')
        .select('id')
        .eq('user_id', user.id);

      const conversionRate = allLeads && allLeads.length > 0 ? ((currentQuotes?.length || 0) / allLeads.length) * 100 : 0;

      setStats({
        totalRevenue,
        revenueChange,
        activeLeads,
        leadsChange,
        installations,
        installationsChange,
        conversionRate,
        conversionChange: 0, // You could calculate this based on previous period
      });

      // Fetch recent activities
      await fetchRecentActivities();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    if (!user) return;

    try {
      const activities: RecentActivity[] = [];

      // Get recent installations
      const { data: installations } = await supabase
        .from('installations')
        .select(`
          id, status, updated_at, customers(first_name, last_name), installation_address
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(2);

      installations?.forEach(installation => {
        const customerName = installation.customers 
          ? `${installation.customers.first_name} ${installation.customers.last_name}`
          : 'Unknown Customer';
        
        activities.push({
          id: installation.id,
          type: 'installation',
          description: `Installation ${installation.status} at ${customerName}`,
          time: new Date(installation.updated_at).toLocaleString(),
          status: installation.status === 'completed' ? 'success' : 'warning'
        });
      });

      // Get recent leads
      const { data: leads } = await supabase
        .from('leads')
        .select('id, first_name, last_name, status, created_at, city')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      leads?.forEach(lead => {
        activities.push({
          id: lead.id,
          type: 'lead',
          description: `New lead from ${lead.city || 'Unknown'} - ${lead.first_name} ${lead.last_name}`,
          time: new Date(lead.created_at).toLocaleString(),
          status: 'info'
        });
      });

      // Get recent quotes
      const { data: quotes } = await supabase
        .from('quotes')
        .select(`
          id, quote_number, total_amount, status, created_at, customers(first_name, last_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      quotes?.forEach(quote => {
        const customerName = quote.customers 
          ? `${quote.customers.first_name} ${quote.customers.last_name}`
          : 'Unknown Customer';
        
        activities.push({
          id: quote.id,
          type: 'quote',
          description: `Quote ${quote.status} for ${customerName} - $${quote.total_amount?.toLocaleString()}`,
          time: new Date(quote.created_at).toLocaleString(),
          status: quote.status === 'approved' ? 'success' : 'warning'
        });
      });

      // Sort by most recent and take top 3
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivities(activities.slice(0, 3));

    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const formatValue = (value: number, type: 'currency' | 'number' | 'percentage') => {
    switch (type) {
      case 'currency':
        return `$${(value / 1000).toFixed(1)}K`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={formatValue(stats.totalRevenue, 'currency')}
          change={formatChange(stats.revenueChange)}
          changeType={stats.revenueChange >= 0 ? "positive" : "negative"}
          icon={DollarSign}
        />
        <MetricCard
          title="Active Leads"
          value={stats.activeLeads.toString()}
          change={formatChange(stats.leadsChange)}
          changeType={stats.leadsChange >= 0 ? "positive" : "negative"}
          icon={Users}
        />
        <MetricCard
          title="Installations"
          value={stats.installations.toString()}
          change={formatChange(stats.installationsChange)}
          changeType={stats.installationsChange >= 0 ? "positive" : "negative"}
          icon={Zap}
        />
        <MetricCard
          title="Conversion Rate"
          value={formatValue(stats.conversionRate, 'percentage')}
          change={formatChange(stats.conversionChange)}
          changeType={stats.conversionChange >= 0 ? "positive" : "negative"}
          icon={Target}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <SalesChart />
        <PipelineChart />
      </div>

      {/* Installation Tracking and Geographic Data */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <InstallationTracker />
        <GeographicMap />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-card rounded-xl border border-border/50 p-6 shadow-card">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Recent Activities</h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border/30">
                  <div className={`w-3 h-3 rounded-full shadow-lg ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No recent activities</p>
                <p className="text-sm">Start by adding leads or creating quotes</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-card rounded-xl border border-border/50 p-6 shadow-card">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              className="bg-gradient-primary hover:shadow-primary transition-smooth h-12"
              onClick={() => setLeadDialogOpen(true)}
            >
              <Users className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
            <Button 
              variant="outline" 
              className="border-border/50 hover:bg-muted/20 h-12"
              onClick={() => navigate('/calendar')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button 
              variant="outline" 
              className="border-border/50 hover:bg-muted/20 h-12"
              onClick={() => setInstallDialogOpen(true)}
            >
              <Zap className="w-4 h-4 mr-2" />
              New Install
            </Button>
            <Button 
              variant="outline" 
              className="border-border/50 hover:bg-muted/20 h-12"
              onClick={() => navigate('/sales-performance')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>
      </div>

      <QuickActionDialogs
        leadDialogOpen={leadDialogOpen}
        setLeadDialogOpen={setLeadDialogOpen}
        installDialogOpen={installDialogOpen}
        setInstallDialogOpen={setInstallDialogOpen}
      />
    </div>
  );
}