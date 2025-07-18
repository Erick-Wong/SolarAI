import { DashboardLayout } from "@/components/DashboardLayout";
import { SettingsContent } from "@/components/settings/SettingsContent";

const Settings = () => {
  return (
    <DashboardLayout
      title="Account Settings"
      description="Manage your account preferences and security settings"
    >
      <SettingsContent />
    </DashboardLayout>
  );
};

export default Settings;