import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LeadsContent } from "@/components/leads/LeadsContent";
import { useAuth } from "@/hooks/useAuth";

export default function Leads() {
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
      title="Leads Management" 
      description="Track and manage your solar leads"
      showBackButton={true}
    >
      <LeadsContent />
    </DashboardLayout>
  );
}