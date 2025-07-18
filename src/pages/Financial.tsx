import { DashboardLayout } from "@/components/DashboardLayout";
import { FinancialContent } from "@/components/financial/FinancialContent";

const Financial = () => {
  return (
    <DashboardLayout
      title="Financial Management"
      description="Track payments, invoicing, and project profitability"
    >
      <FinancialContent />
    </DashboardLayout>
  );
};

export default Financial;