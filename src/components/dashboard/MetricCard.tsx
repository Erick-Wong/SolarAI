import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  className,
}: MetricCardProps) {
  const changeColors = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className={cn("bg-gradient-card border-border/50 hover:shadow-primary transition-smooth", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <div className="flex items-baseline gap-3">
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
              {change && (
                <span className={cn("text-sm font-semibold px-2 py-1 rounded-full", 
                  changeType === "positive" ? "text-success bg-success/10" :
                  changeType === "negative" ? "text-destructive bg-destructive/10" :
                  "text-muted-foreground bg-muted/10"
                )}>
                  {change}
                </span>
              )}
            </div>
          </div>
          <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary">
            <Icon className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}