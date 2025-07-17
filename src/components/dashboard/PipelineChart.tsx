import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const pipelineData = [
  { name: "New Leads", value: 1200, fill: "#ff6b35" },
  { name: "Contacted", value: 950, fill: "#f7931e" },
  { name: "Quoted", value: 600, fill: "#ffcc02" },
  { name: "Negotiation", value: 350, fill: "#37b24d" },
  { name: "Closed Won", value: 180, fill: "#228be6" },
];

export function PipelineChart() {
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
          {pipelineData.map((item, index) => (
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