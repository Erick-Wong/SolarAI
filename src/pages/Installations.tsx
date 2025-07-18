import { DashboardLayout } from "@/components/DashboardLayout";
import { InstallationsContent } from "@/components/installations/InstallationsContent";

const Installations = () => {
  return (
    <DashboardLayout
      title="Installations"
      description="Track and manage solar panel installations"
    >
      <InstallationsContent />
    </DashboardLayout>
  );
};

export default Installations;