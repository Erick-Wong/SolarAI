import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { 
  Filter,
  MapPin,
  BarChart3
} from "lucide-react";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { NorthTexasInstallationMap } from "../sales/NorthTexasInstallationMap";
import { GeographicMap } from "../sales/GeographicMap";
import { RegionalAnalytics } from "../sales/RegionalAnalytics";

export function GeographicContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date())
  });
  const [regionFilter, setRegionFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [selectedMapMetric, setSelectedMapMetric] = useState<'sales' | 'revenue' | 'installations' | 'leads' | 'conversion'>('sales');
  const [mapboxToken, setMapboxToken] = useState('');

  const handleMapMetricChange = (metric: string) => {
    setSelectedMapMetric(metric as 'sales' | 'revenue' | 'installations' | 'leads' | 'conversion');
  };

  const handleMapboxTokenChange = (token: string) => {
    setMapboxToken(token);
  };

  useEffect(() => {
    if (user) {
      // Simulate loading for now
      setLoading(false);
    }
  }, [user, dateRange, regionFilter, sourceFilter, repFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading geographic data...</p>
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

      {/* North Texas Installation Map */}
      <NorthTexasInstallationMap 
        mapboxToken={mapboxToken}
        onTokenChange={handleMapboxTokenChange}
      />

      {/* Interactive Geographic Map */}
      <GeographicMap 
        data={[]}
        selectedMetric={selectedMapMetric}
        onMetricChange={handleMapMetricChange}
      />

      {/* Regional Analytics */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Regional Analytics
        </h2>
        <RegionalAnalytics data={[]} />
      </div>
    </div>
  );
}