import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CustomersContent } from "@/components/customers/CustomersContent";
import { useAuth } from "@/hooks/useAuth";

export default function Customers() {
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
      title="Customer Management" 
      description="Manage your solar customers"
      showBackButton={true}
    >
      <CustomersContent />
    </DashboardLayout>
  );
}