import { DashboardLayout } from "@/components/DashboardLayout";
import { AnalyticsContent } from "@/components/analytics/AnalyticsContent";

const Analytics = () => {
  return (
    <DashboardLayout
      title="Analytics"
      description="Performance insights and business analytics"
    >
      <AnalyticsContent />
    </DashboardLayout>
  );
};

export default Analytics;