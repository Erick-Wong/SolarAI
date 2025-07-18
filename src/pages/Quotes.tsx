import { DashboardLayout } from "@/components/DashboardLayout";
import { QuotesContent } from "@/components/quotes/QuotesContent";

const Quotes = () => {
  return (
    <DashboardLayout
      title="Quote Management"
      description="Create, manage and track solar installation quotes"
    >
      <QuotesContent />
    </DashboardLayout>
  );
};

export default Quotes;