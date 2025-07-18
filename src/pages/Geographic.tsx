import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { GeographicContent } from "@/components/geographic/GeographicContent";

export default function Geographic() {
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
      title="Geographic" 
      description="Geographic analytics and installation mapping"
      showBackButton={true}
    >
      <GeographicContent />
    </DashboardLayout>
  );
}