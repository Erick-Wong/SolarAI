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
    <div className="space-y-6">
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
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Installation completed at Johnson Residence</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New lead from Dallas - Smith Commercial</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Quote sent to Wilson Office - $85k system</p>
                <p className="text-xs text-muted-foreground">6 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button className="bg-gradient-solar hover:shadow-solar transition-smooth">
              <Users className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button variant="outline">
              <Zap className="w-4 h-4 mr-2" />
              New Install
            </Button>
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}