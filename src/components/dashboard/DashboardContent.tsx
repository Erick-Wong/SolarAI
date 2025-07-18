import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { InstallationTracker } from "@/components/dashboard/InstallationTracker";
import { GeographicMap } from "@/components/dashboard/GeographicMap";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Users,
  Zap,
  TrendingUp,
  Target,
  Calendar,
} from "lucide-react";

export function DashboardContent() {
  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value="$3.2M"
          change="+15.3%"
          changeType="positive"
          icon={DollarSign}
        />
        <MetricCard
          title="Active Leads"
          value="1,847"
          change="+8.2%"
          changeType="positive"
          icon={Users}
        />
        <MetricCard
          title="Installations"
          value="342"
          change="+23.1%"
          changeType="positive"
          icon={Zap}
        />
        <MetricCard
          title="Conversion Rate"
          value="18.5%"
          change="+2.3%"
          changeType="positive"
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
            <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border/30">
              <div className="w-3 h-3 bg-success rounded-full shadow-lg"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Installation completed at Johnson Residence</p>
                <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border/30">
              <div className="w-3 h-3 bg-warning rounded-full shadow-lg"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">New lead from Dallas - Smith Commercial</p>
                <p className="text-xs text-muted-foreground mt-1">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border/30">
              <div className="w-3 h-3 bg-primary rounded-full shadow-lg"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Quote sent to Wilson Office - $85k system</p>
                <p className="text-xs text-muted-foreground mt-1">6 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-card rounded-xl border border-border/50 p-6 shadow-card">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button className="bg-gradient-primary hover:shadow-primary transition-smooth h-12">
              <Users className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
            <Button variant="outline" className="border-border/50 hover:bg-muted/20 h-12">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button variant="outline" className="border-border/50 hover:bg-muted/20 h-12">
              <Zap className="w-4 h-4 mr-2" />
              New Install
            </Button>
            <Button variant="outline" className="border-border/50 hover:bg-muted/20 h-12">
              <TrendingUp className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}