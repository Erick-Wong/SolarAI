import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from "recharts";
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Clock, Star, 
  Calendar, MapPin, Target, Zap, Filter, Download
} from "lucide-react";
import { DateRange } from "react-day-picker";

// Sample data - would be fetched from database
const kpiData = {
  totalSales: { current: 1250000, previous: 1100000, trend: 13.6 },
  totalInstallations: { current: 145, previous: 128, trend: 13.3 },
  avgDealSize: { current: 8620, previous: 8200, trend: 5.1 },
  conversionRate: { current: 24.5, previous: 22.1, trend: 10.9 },
  salesCycleLength: { current: 32, previous: 35, trend: -8.6 },
  customerSat: { current: 4.6, previous: 4.4, trend: 4.5 },
};

const salesInstallData = [
  { month: 'Jan', sales: 820000, installations: 95, salesCount: 115 },
  { month: 'Feb', sales: 940000, installations: 108, salesCount: 132 },
  { month: 'Mar', sales: 1100000, installations: 125, salesCount: 148 },
  { month: 'Apr', sales: 980000, installations: 118, salesCount: 135 },
  { month: 'May', sales: 1250000, installations: 145, salesCount: 165 },
  { month: 'Jun', sales: 1400000, installations: 162, salesCount: 185 },
];

const topPerformersData = [
  { name: 'Sarah Lopez', revenue: 450000, deals: 28, avgInstallTime: 3.2, conversionRate: 32 },
  { name: 'Mike Chen', revenue: 380000, deals: 24, avgInstallTime: 3.8, conversionRate: 28 },
  { name: 'Jessica Park', revenue: 360000, deals: 22, avgInstallTime: 3.5, conversionRate: 30 },
  { name: 'David Smith', revenue: 340000, deals: 21, avgInstallTime: 4.1, conversionRate: 25 },
  { name: 'Emily Johnson', revenue: 320000, deals: 19, avgInstallTime: 3.9, conversionRate: 27 },
];

const regionData = [
  { region: 'North Dallas', sales: 520000, leads: 420, conversions: 118, rate: 28.1 },
  { region: 'South Dallas', sales: 380000, leads: 350, conversions: 89, rate: 25.4 },
  { region: 'Fort Worth', sales: 290000, leads: 280, conversions: 65, rate: 23.2 },
  { region: 'Plano', sales: 350000, leads: 310, conversions: 78, rate: 25.2 },
  { region: 'Arlington', sales: 210000, leads: 240, conversions: 52, rate: 21.7 },
];

const funnelData = [
  { name: 'Leads', value: 1600, fill: '#8884d8' },
  { name: 'Qualified', value: 1200, fill: '#82ca9d' },
  { name: 'Quoted', value: 800, fill: '#ffc658' },
  { name: 'Closed', value: 480, fill: '#ff7c7c' },
  { name: 'Installed', value: 420, fill: '#8dd1e1' },
];

const delayReasons = [
  { name: 'Weather', value: 35, color: '#ef4444' },
  { name: 'Permits', value: 28, color: '#f97316' },
  { name: 'Equipment', value: 22, color: '#eab308' },
  { name: 'Scheduling', value: 15, color: '#3b82f6' },
];

const installDurationData = [
  { duration: '1-2 days', count: 45 },
  { duration: '3-4 days', count: 85 },
  { duration: '5-6 days', count: 120 },
  { duration: '7-8 days', count: 65 },
  { duration: '9+ days', count: 25 },
];

const forecastData = [
  { month: 'Jul', actual: 1400000, forecast: 1500000, installations: 162, forecastInstalls: 175 },
  { month: 'Aug', actual: null, forecast: 1650000, installations: null, forecastInstalls: 190 },
  { month: 'Sep', actual: null, forecast: 1800000, installations: null, forecastInstalls: 210 },
  { month: 'Oct', actual: null, forecast: 1750000, installations: null, forecastInstalls: 200 },
];

interface KPICardProps {
  title: string;
  current: number | string;
  previous?: number;
  trend?: number;
  icon: React.ComponentType<any>;
  format?: 'currency' | 'number' | 'percentage' | 'days' | 'rating';
}

function KPICard({ title, current, previous, trend, icon: Icon, format = 'number' }: KPICardProps) {
  const formatValue = (value: number | string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return `$${(value / 1000).toFixed(0)}K`;
      case 'percentage':
        return `${value}%`;
      case 'days':
        return `${value} days`;
      case 'rating':
        return `${value}/5.0`;
      default:
        return value.toLocaleString();
    }
  };

  const isPositive = trend && trend > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{formatValue(current)}</p>
            {trend && (
              <div className={`flex items-center mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <TrendIcon className="h-4 w-4 mr-1" />
                <span>{Math.abs(trend)}% vs last period</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsContent() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [repFilter, setRepFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
              className="w-[300px]"
            />
            <Select value={repFilter} onValueChange={setRepFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sales Rep" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reps</SelectItem>
                <SelectItem value="sarah">Sarah Lopez</SelectItem>
                <SelectItem value="mike">Mike Chen</SelectItem>
                <SelectItem value="jessica">Jessica Park</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="north">North Dallas</SelectItem>
                <SelectItem value="south">South Dallas</SelectItem>
                <SelectItem value="fortworth">Fort Worth</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Product Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="battery">Battery Systems</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Sales (YTD)"
          current={kpiData.totalSales.current}
          previous={kpiData.totalSales.previous}
          trend={kpiData.totalSales.trend}
          icon={DollarSign}
          format="currency"
        />
        <KPICard
          title="Total Installations"
          current={kpiData.totalInstallations.current}
          previous={kpiData.totalInstallations.previous}
          trend={kpiData.totalInstallations.trend}
          icon={Zap}
        />
        <KPICard
          title="Avg Deal Size"
          current={kpiData.avgDealSize.current}
          previous={kpiData.avgDealSize.previous}
          trend={kpiData.avgDealSize.trend}
          icon={Target}
          format="currency"
        />
        <KPICard
          title="Conversion Rate"
          current={kpiData.conversionRate.current}
          previous={kpiData.conversionRate.previous}
          trend={kpiData.conversionRate.trend}
          icon={TrendingUp}
          format="percentage"
        />
        <KPICard
          title="Sales Cycle"
          current={kpiData.salesCycleLength.current}
          previous={kpiData.salesCycleLength.previous}
          trend={kpiData.salesCycleLength.trend}
          icon={Clock}
          format="days"
        />
        <KPICard
          title="Customer Satisfaction"
          current={kpiData.customerSat.current}
          previous={kpiData.customerSat.previous}
          trend={kpiData.customerSat.trend}
          icon={Star}
          format="rating"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="teams">Teams & Reps</TabsTrigger>
          <TabsTrigger value="regions">Regional Analysis</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales vs Installations Over Time */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sales & Installations Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesInstallData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'sales' ? `$${(value as number / 1000).toFixed(0)}K` : value,
                        name === 'sales' ? 'Sales Revenue' : 'Installations'
                      ]}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="sales" stroke="hsl(142 71% 45%)" strokeWidth={3} />
                    <Line yAxisId="right" type="monotone" dataKey="installations" stroke="hsl(217 71% 53%)" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sales Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Funnel Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart layout="horizontal" data={funnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Installation Duration Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Installation Duration Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={installDurationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="duration" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(142 71% 45%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Delay Reasons */}
          <Card>
            <CardHeader>
              <CardTitle>Project Delay Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={delayReasons}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {delayReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  {delayReasons.map((reason) => (
                    <div key={reason.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: reason.color }}
                        ></div>
                        <span className="font-medium">{reason.name}</span>
                      </div>
                      <span className="text-muted-foreground">{reason.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams & Reps Tab */}
        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Sales Reps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformersData.map((rep, index) => (
                  <div key={rep.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{rep.name}</p>
                        <p className="text-sm text-muted-foreground">{rep.deals} deals closed</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-8 text-right">
                      <div>
                        <p className="text-lg font-bold">${(rep.revenue / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{rep.avgInstallTime}d</p>
                        <p className="text-xs text-muted-foreground">Avg Install</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{rep.conversionRate}%</p>
                        <p className="text-xs text-muted-foreground">Conversion</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Analysis Tab */}
        <TabsContent value="regions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${(value as number / 1000).toFixed(0)}K`, 'Sales']} />
                    <Bar dataKey="sales" fill="hsl(142 71% 45%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionData.map((region) => (
                    <div key={region.region} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{region.region}</span>
                        <span className="text-sm text-muted-foreground">{region.rate}% conversion</span>
                      </div>
                      <Progress value={region.rate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{region.leads} leads</span>
                        <span>{region.conversions} conversions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Forecasting Tab */}
        <TabsContent value="forecasting" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `$${(value as number / 1000).toFixed(0)}K`,
                        name === 'actual' ? 'Actual' : 'Forecast'
                      ]}
                    />
                    <Line type="monotone" dataKey="actual" stroke="hsl(142 71% 45%)" strokeWidth={3} />
                    <Line 
                      type="monotone" 
                      dataKey="forecast" 
                      stroke="hsl(217 71% 53%)" 
                      strokeWidth={3} 
                      strokeDasharray="5 5" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Installation Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="installations" fill="hsl(142 71% 45%)" name="Actual" />
                    <Bar dataKey="forecastInstalls" fill="hsl(217 71% 53%)" name="Forecast" opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Forecast Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Next 30 Days</p>
                  <p className="text-2xl font-bold">$1.2M</p>
                  <p className="text-xs text-green-600">+15% vs last month</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Next 60 Days</p>
                  <p className="text-2xl font-bold">$2.8M</p>
                  <p className="text-xs text-green-600">+22% vs last period</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Q4 Projection</p>
                  <p className="text-2xl font-bold">$8.5M</p>
                  <p className="text-xs text-green-600">On track to exceed goal</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}