import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const salesData = [
  { month: "Jan", sales: 65, revenue: 320000 },
  { month: "Feb", sales: 85, revenue: 420000 },
  { month: "Mar", sales: 95, revenue: 475000 },
  { month: "Apr", sales: 75, revenue: 375000 },
  { month: "May", sales: 105, revenue: 525000 },
  { month: "Jun", sales: 125, revenue: 625000 },
];

export function SalesChart() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Monthly Sales Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="sales" fill="hsl(32 95% 44%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}