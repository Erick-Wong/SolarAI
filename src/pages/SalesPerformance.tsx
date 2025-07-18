import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SalesPerformanceContent } from "@/components/sales/SalesPerformanceContent";
import { useAuth } from "@/hooks/useAuth";

export default function SalesPerformance() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <DashboardLayout 
      title="Sales Performance" 
      description="Comprehensive sales analytics and KPI tracking"
      showBackButton={true}
    >
      <SalesPerformanceContent />
    </DashboardLayout>
  );
}