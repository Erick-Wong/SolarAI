import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { CalendarContent } from "@/components/calendar/CalendarContent";

export default function Calendar() {
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
      title="Calendar" 
      description="Schedule and manage appointments, installations, and site visits"
      showBackButton={true}
    >
      <CalendarContent />
    </DashboardLayout>
  );
}