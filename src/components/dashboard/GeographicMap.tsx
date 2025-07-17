import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, DollarSign } from "lucide-react";

const regionData = [
  {
    region: "North Texas",
    leads: 342,
    revenue: "$1.2M",
    installations: 85,
    growth: "+23%",
  },
  {
    region: "Central Texas",
    leads: 298,
    revenue: "$950K",
    installations: 67,
    growth: "+18%",
  },
  {
    region: "South Texas",
    leads: 156,
    revenue: "$580K",
    installations: 41,
    growth: "+12%",
  },
  {
    region: "East Texas",
    leads: 89,
    revenue: "$320K",
    installations: 23,
    growth: "+8%",
  },
];

export function GeographicMap() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Geographic Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {regionData.map((region, index) => (
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}