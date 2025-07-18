import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-background">
        <div className="text-center">
          <img 
            src="/lovable-uploads/1d033ddb-7190-490e-80aa-5af0e180310c.png" 
            alt="Energy Edge Logo" 
            className="w-24 h-24 object-contain mx-auto mb-4 animate-pulse"
          />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!user) {
    return null;
  }

  return (
    <DashboardLayout 
      title="Energy Edge Dashboard" 
      description="Monitor your solar energy solutions business"
    >
      <DashboardContent />
    </DashboardLayout>
  );
};
export default Index;
