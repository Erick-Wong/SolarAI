import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PipelineData {
  name: string;
  value: number;
  fill: string;
}

export function PipelineChart() {
  const { user } = useAuth();
  const [pipelineData, setPipelineData] = useState<PipelineData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPipelineData();
    }
  }, [user]);

  const fetchPipelineData = async () => {
    if (!user) return;

    try {
      // Get leads by status
      const { data: leads } = await supabase
        .from('leads')
        .select('status')
        .eq('user_id', user.id);

      // Get quotes by status
      const { data: quotes } = await supabase
        .from('quotes')
        .select('status')
        .eq('user_id', user.id);

      // Count leads by status
      const newLeads = leads?.filter(lead => lead.status === 'new').length || 0;
      const contactedLeads = leads?.filter(lead => lead.status === 'contacted').length || 0;
      const qualifiedLeads = leads?.filter(lead => lead.status === 'qualified').length || 0;
      
      // Count quotes
      const quotedLeads = quotes?.filter(quote => quote.status === 'sent').length || 0;
      const negotiationQuotes = quotes?.filter(quote => quote.status === 'sent').length || 0;
      const closedWon = quotes?.filter(quote => quote.status === 'approved').length || 0;

      const pipeline = [
        { name: "New Leads", value: newLeads, fill: "#ef4444" },
        { name: "Contacted", value: contactedLeads, fill: "#f97316" },
        { name: "Qualified", value: qualifiedLeads, fill: "#eab308" },
        { name: "Quoted", value: quotedLeads, fill: "#22c55e" },
        { name: "Closed Won", value: closedWon, fill: "#3b82f6" },
      ];

      setPipelineData(pipeline);
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Sales Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            Loading pipeline data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Sales Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pipelineData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" stroke="#64748b" />
            <YAxis dataKey="name" type="category" stroke="#64748b" width={80} />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {pipelineData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}