import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  TrendingUp, 
  Clock, 
  BarChart3,
  PieChart
} from "lucide-react";

interface RegionalData {
  region: string;
  sales: number;
  revenue: number;
  conversionRate: number;
  averageDealSize: number;
  installationTime: number;
  leadSources: {
    online: number;
    doorToDoor: number;
    referrals: number;
    events: number;
  };
  forecast: number;
}

interface RegionalAnalyticsProps {
  data: RegionalData[];
}

export function RegionalAnalytics({ data }: RegionalAnalyticsProps) {
  // Mock regional data
  const mockData: RegionalData[] = [
    {
      region: 'California',
      sales: 83,
      revenue: 2905000,
      conversionRate: 38.8,
      averageDealSize: 35000,
      installationTime: 21,
      leadSources: { online: 45, doorToDoor: 25, referrals: 20, events: 10 },
      forecast: 3200000
    },
    {
      region: 'Texas',
      sales: 57,
      revenue: 1995000,
      conversionRate: 35.2,
      averageDealSize: 35000,
      installationTime: 18,
      leadSources: { online: 35, doorToDoor: 40, referrals: 18, events: 7 },
      forecast: 2300000
    },
    {
      region: 'Florida',
      sales: 43,
      revenue: 1505000,
      conversionRate: 33.9,
      averageDealSize: 35000,
      installationTime: 25,
      leadSources: { online: 50, doorToDoor: 20, referrals: 25, events: 5 },
      forecast: 1800000
    },
    {
      region: 'New York',
      sales: 35,
      revenue: 1225000,
      conversionRate: 38.0,
      averageDealSize: 35000,
      installationTime: 32,
      leadSources: { online: 60, doorToDoor: 10, referrals: 25, events: 5 },
      forecast: 1500000
    },
    {
      region: 'Arizona',
      sales: 25,
      revenue: 875000,
      conversionRate: 36.8,
      averageDealSize: 35000,
      installationTime: 15,
      leadSources: { online: 40, doorToDoor: 35, referrals: 20, events: 5 },
      forecast: 1100000
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'online': return 'bg-blue-500';
      case 'doorToDoor': return 'bg-green-500';
      case 'referrals': return 'bg-purple-500';
      case 'events': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Regional Leaderboard */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Regional Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockData
              .sort((a, b) => b.revenue - a.revenue)
              .map((region, index) => (
                <div key={region.region} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-600' : 'bg-muted'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{region.region}</div>
                      <div className="text-sm text-muted-foreground">
                        {region.sales} deals • {region.conversionRate}% conversion
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{formatCurrency(region.revenue)}</div>
                    <div className="text-sm text-muted-foreground">
                      Avg: {formatCurrency(region.averageDealSize)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Source Breakdown */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Lead Sources by Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.slice(0, 3).map((region) => (
                <div key={region.region} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{region.region}</div>
                    <div className="text-sm text-muted-foreground">
                      {region.sales} total leads
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-4 rounded-lg overflow-hidden">
                    <div 
                      className="bg-blue-500" 
                      style={{ width: `${region.leadSources.online}%` }}
                      title={`Online: ${region.leadSources.online}%`}
                    />
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${region.leadSources.doorToDoor}%` }}
                      title={`Door-to-Door: ${region.leadSources.doorToDoor}%`}
                    />
                    <div 
                      className="bg-purple-500" 
                      style={{ width: `${region.leadSources.referrals}%` }}
                      title={`Referrals: ${region.leadSources.referrals}%`}
                    />
                    <div 
                      className="bg-orange-500" 
                      style={{ width: `${region.leadSources.events}%` }}
                      title={`Events: ${region.leadSources.events}%`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Online ({region.leadSources.online}%)</span>
                    <span>Door-to-Door ({region.leadSources.doorToDoor}%)</span>
                    <span>Referrals ({region.leadSources.referrals}%)</span>
                    <span>Events ({region.leadSources.events}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Installation Timelines */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Installation Timelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.map((region) => (
                <div key={region.region} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{region.region}</div>
                    <Badge variant={region.installationTime <= 20 ? "default" : "secondary"}>
                      {region.installationTime} days
                    </Badge>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - (region.installationTime / 40) * 100)} 
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {region.installationTime <= 20 ? 'Excellent' : 
                     region.installationTime <= 30 ? 'Good' : 'Needs Improvement'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Forecasting */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Regional Revenue Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {mockData.map((region) => (
              <div key={region.region} className="p-4 bg-muted/20 rounded-lg text-center">
                <div className="font-medium mb-2">{region.region}</div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatCurrency(region.forecast)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {((region.forecast / region.revenue - 1) * 100).toFixed(1)}% growth
                </div>
                <div className="mt-2">
                  <Progress 
                    value={(region.forecast / Math.max(...mockData.map(d => d.forecast))) * 100} 
                    className="h-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}