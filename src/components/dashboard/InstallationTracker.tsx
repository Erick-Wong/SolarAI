import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

const installations = [
  {
    id: "INS-001",
    customer: "Johnson Residence",
    status: "Completed",
    progress: 100,
    date: "2024-01-15",
    location: "Austin, TX",
  },
  {
    id: "INS-002",
    customer: "Smith Commercial",
    status: "Installation",
    progress: 75,
    date: "2024-01-18",
    location: "Dallas, TX",
  },
  {
    id: "INS-003",
    customer: "Davis Home",
    status: "Permitting",
    progress: 45,
    date: "2024-01-22",
    location: "Houston, TX",
  },
  {
    id: "INS-004",
    customer: "Wilson Office",
    status: "Scheduled",
    progress: 25,
    date: "2024-01-25",
    location: "San Antonio, TX",
  },
];

const statusConfig = {
  Completed: { color: "bg-success", icon: CheckCircle },
  Installation: { color: "bg-warning", icon: Clock },
  Permitting: { color: "bg-accent", icon: AlertCircle },
  Scheduled: { color: "bg-muted", icon: Calendar },
};

export function InstallationTracker() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Installation Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {installations.map((installation) => {
            const StatusIcon = statusConfig[installation.status as keyof typeof statusConfig].icon;
            
            return (
              <div key={installation.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-smooth">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium text-foreground">{installation.customer}</h4>
                      <p className="text-sm text-muted-foreground">{installation.id} • {installation.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{installation.status}</Badge>
                    <span className="text-sm text-muted-foreground">{installation.date}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{installation.progress}%</span>
                  </div>
                  <Progress value={installation.progress} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}