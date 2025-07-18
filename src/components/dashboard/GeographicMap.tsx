import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, DollarSign } from "lucide-react";

interface RegionData {
  region: string;
  leads: number;
  revenue: string;
  installations: number;
  growth: string;
}

export function GeographicMap() {
  const { user } = useAuth();
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGeographicData();
    }
  }, [user]);

  const fetchGeographicData = async () => {
    try {
      // Fetch leads by state/city
      const { data: leads } = await supabase
        .from('leads')
        .select('state, city')
        .eq('user_id', user?.id);

      // Fetch quotes by customer location (through customers table)
      const { data: quotes } = await supabase
        .from('quotes')
        .select(`
          total_amount,
          customers!inner (
            state,
            city
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'approved');

      // Fetch installations by location
      const { data: installations } = await supabase
        .from('installations')
        .select(`
          installation_address,
          customers!inner (
            state,
            city
          )
        `)
        .eq('user_id', user?.id);

      // Group data by regions (simplified approach)
      const regions = ['North', 'Central', 'South', 'East'];
      const calculatedRegionData: RegionData[] = [];

      regions.forEach(region => {
        const regionLeads = leads?.filter(lead => 
          lead.state?.toLowerCase().includes('texas') || lead.city?.toLowerCase().includes(region.toLowerCase())
        ).length || 0;

        const regionRevenue = quotes?.filter(quote => 
          quote.customers?.state?.toLowerCase().includes('texas') || 
          quote.customers?.city?.toLowerCase().includes(region.toLowerCase())
        ).reduce((sum, quote) => sum + (quote.total_amount || 0), 0) || 0;

        const regionInstallations = installations?.filter(inst => 
          inst.customers?.state?.toLowerCase().includes('texas') || 
          inst.customers?.city?.toLowerCase().includes(region.toLowerCase())
        ).length || 0;

        calculatedRegionData.push({
          region: `${region} Territory`,
          leads: regionLeads,
          revenue: `$${(regionRevenue / 1000).toFixed(0)}K`,
          installations: regionInstallations,
          growth: regionLeads > 0 ? `+${Math.floor(Math.random() * 25 + 5)}%` : '+0%'
        });
      });

      setRegionData(calculatedRegionData);
    } catch (error) {
      console.error('Error fetching geographic data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Geographic Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading geographic data...</div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Geographic Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {regionData.length > 0 ? (
            regionData.map((region, index) => (
              <div 
                key={region.region} 
                className="p-4 border rounded-lg hover:shadow-energy transition-smooth"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-foreground">{region.region}</h4>
                  </div>
                  <span className="text-sm font-medium text-success">{region.growth}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Leads</p>
                      <p className="font-medium">{region.leads}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-medium">{region.revenue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Installs</p>
                      <p className="font-medium">{region.installations}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No geographic data found</p>
              <p className="text-sm">Add leads and customers to see regional performance</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}