import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Installation {
  id: string;
  installation_number: string;
  customer_id: string;
  installation_address: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  customers?: {
    first_name: string;
    last_name: string;
  };
}

const statusConfig = {
  completed: { color: "bg-success", icon: CheckCircle, progress: 100 },
  in_progress: { color: "bg-warning", icon: Clock, progress: 75 },
  scheduled: { color: "bg-accent", icon: AlertCircle, progress: 25 },
  cancelled: { color: "bg-muted", icon: Calendar, progress: 0 },
};

export function InstallationTracker() {
  const { user } = useAuth();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInstallations();
    }
  }, [user]);

  const fetchInstallations = async () => {
    try {
      const { data, error } = await supabase
        .from('installations')
        .select(`
          *,
          customers (
            first_name,
            last_name
          )
        `)
        .eq('user_id', user?.id)
        .order('scheduled_date', { ascending: false })
        .limit(4);

      if (error) throw error;
      setInstallations(data || []);
    } catch (error) {
      console.error('Error fetching installations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Installation Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading installations...</div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Installation Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {installations.length > 0 ? (
            installations.map((installation) => {
              const config = statusConfig[installation.status];
              const StatusIcon = config.icon;
              const customerName = installation.customers 
                ? `${installation.customers.first_name} ${installation.customers.last_name}`
                : 'Unknown Customer';
              
              return (
                <div key={installation.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-smooth">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <StatusIcon className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-medium text-foreground">{customerName}</h4>
                        <p className="text-sm text-muted-foreground">{installation.installation_number} • {installation.installation_address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{installation.status.replace('_', ' ')}</Badge>
                      <span className="text-sm text-muted-foreground">{new Date(installation.scheduled_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{config.progress}%</span>
                    </div>
                    <Progress value={config.progress} className="h-2" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No installations found</p>
              <p className="text-sm">Create your first installation to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}