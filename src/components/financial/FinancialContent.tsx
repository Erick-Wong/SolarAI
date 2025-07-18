import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, CreditCard, Plus, Receipt, PiggyBank, AlertCircle } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  payment_type: string;
  payment_status: string;
  payment_date?: string;
  due_date?: string;
  payment_method?: string;
  customers: {
    first_name: string;
    last_name: string;
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  due_date: string;
  customers: {
    first_name: string;
    last_name: string;
  };
}

interface ProjectCost {
  id: string;
  amount: number;
  cost_type: string;
  description: string;
  vendor?: string;
  purchase_date?: string;
  installations: {
    installation_number: string;
  };
}

interface FinancialKPIs {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  outstandingInvoices: number;
  overduePayments: number;
}

export function FinancialContent() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<FinancialKPIs>({
    totalRevenue: 0,
    totalCosts: 0,
    netProfit: 0,
    profitMargin: 0,
    outstandingInvoices: 0,
    overduePayments: 0
  });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [costDialogOpen, setCostDialogOpen] = useState(false);

  // Form states
  const [newPayment, setNewPayment] = useState({
    customer_id: '',
    amount: '',
    payment_type: '',
    payment_method: '',
    due_date: '',
    notes: ''
  });

  const [newInvoice, setNewInvoice] = useState({
    customer_id: '',
    quote_id: '',
    subtotal: '',
    tax_amount: '',
    payment_terms: '',
    notes: ''
  });

  const [newCost, setNewCost] = useState({
    installation_id: '',
    cost_type: '',
    amount: '',
    description: '',
    vendor: '',
    purchase_date: ''
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
      fetchCustomers();
      fetchInstallations();
      fetchQuotes();
    }
  }, [user]);

  const fetchFinancialData = async () => {
    try {
      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          *,
          customers (first_name, last_name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (first_name, last_name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch project costs
      const { data: costsData } = await supabase
        .from('project_costs')
        .select(`
          *,
          installations (installation_number)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setPayments(paymentsData || []);
      setInvoices(invoicesData || []);
      setProjectCosts(costsData || []);

      // Calculate KPIs
      const totalRevenue = paymentsData?.filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalCosts = costsData?.reduce((sum, c) => sum + c.amount, 0) || 0;
      const netProfit = totalRevenue - totalCosts;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const outstandingInvoices = invoicesData?.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total_amount - i.paid_amount), 0) || 0;
      const overduePayments = paymentsData?.filter(p => p.payment_status === 'pending' && p.due_date && new Date(p.due_date) < new Date()).length || 0;

      setKpis({
        totalRevenue,
        totalCosts,
        netProfit,
        profitMargin,
        outstandingInvoices,
        overduePayments
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, first_name, last_name')
      .eq('user_id', user?.id);
    setCustomers(data || []);
  };

  const fetchInstallations = async () => {
    const { data } = await supabase
      .from('installations')
      .select('id, installation_number, customer_id')
      .eq('user_id', user?.id);
    setInstallations(data || []);
  };

  const fetchQuotes = async () => {
    const { data } = await supabase
      .from('quotes')
      .select('id, quote_number, customer_id, total_amount')
      .eq('user_id', user?.id);
    setQuotes(data || []);
  };

  const addPayment = async () => {
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          customer_id: newPayment.customer_id,
          amount: parseFloat(newPayment.amount),
          payment_type: newPayment.payment_type,
          payment_method: newPayment.payment_method,
          due_date: newPayment.due_date || null,
          notes: newPayment.notes,
          user_id: user!.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment added successfully.",
      });

      setPaymentDialogOpen(false);
      setNewPayment({
        customer_id: '',
        amount: '',
        payment_type: '',
        payment_method: '',
        due_date: '',
        notes: ''
      });
      fetchFinancialData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment.",
        variant: "destructive",
      });
    }
  };

  const generateInvoice = async () => {
    try {
      const subtotal = parseFloat(newInvoice.subtotal);
      const taxAmount = parseFloat(newInvoice.tax_amount || '0');
      const totalAmount = subtotal + taxAmount;

      // Generate invoice number
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc('generate_invoice_number');

      if (numberError) throw numberError;

      const { error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          customer_id: newInvoice.customer_id,
          quote_id: newInvoice.quote_id || null,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          payment_terms: newInvoice.payment_terms,
          notes: newInvoice.notes,
          user_id: user!.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice generated successfully.",
      });

      setInvoiceDialogOpen(false);
      setNewInvoice({
        customer_id: '',
        quote_id: '',
        subtotal: '',
        tax_amount: '',
        payment_terms: '',
        notes: ''
      });
      fetchFinancialData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invoice.",
        variant: "destructive",
      });
    }
  };

  const addProjectCost = async () => {
    try {
      const { error } = await supabase
        .from('project_costs')
        .insert({
          installation_id: newCost.installation_id,
          cost_type: newCost.cost_type,
          description: newCost.description,
          amount: parseFloat(newCost.amount),
          vendor: newCost.vendor,
          purchase_date: newCost.purchase_date || null,
          user_id: user!.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project cost added successfully.",
      });

      setCostDialogOpen(false);
      setNewCost({
        installation_id: '',
        cost_type: '',
        amount: '',
        description: '',
        vendor: '',
        purchase_date: ''
      });
      fetchFinancialData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add project cost.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'default';
      case 'pending':
      case 'sent':
        return 'secondary';
      case 'overdue':
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading financial data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          change="+12.5%"
          changeType="positive"
          icon={DollarSign}
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(kpis.netProfit)}
          change={`${kpis.profitMargin.toFixed(1)}% margin`}
          changeType={kpis.netProfit >= 0 ? "positive" : "negative"}
          icon={TrendingUp}
        />
        <MetricCard
          title="Outstanding Invoices"
          value={formatCurrency(kpis.outstandingInvoices)}
          change={`${invoices.filter(i => i.status !== 'paid').length} invoices`}
          changeType="neutral"
          icon={Receipt}
        />
        <MetricCard
          title="Overdue Payments"
          value={kpis.overduePayments.toString()}
          change="Require attention"
          changeType={kpis.overduePayments > 0 ? "negative" : "positive"}
          icon={AlertCircle}
        />
      </div>

      {/* Financial Management Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="costs">Project Costs</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Tracking</CardTitle>
                <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record New Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select value={newPayment.customer_id} onValueChange={(value) => setNewPayment(prev => ({ ...prev, customer_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.first_name} {customer.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newPayment.amount}
                            onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Type</Label>
                          <Select value={newPayment.payment_type} onValueChange={(value) => setNewPayment(prev => ({ ...prev, payment_type: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="deposit">Deposit</SelectItem>
                              <SelectItem value="progress">Progress Payment</SelectItem>
                              <SelectItem value="final">Final Payment</SelectItem>
                              <SelectItem value="milestone">Milestone Payment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Payment Method</Label>
                          <Select value={newPayment.payment_method} onValueChange={(value) => setNewPayment(prev => ({ ...prev, payment_method: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="financing">Financing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input
                            type="date"
                            value={newPayment.due_date}
                            onChange={(e) => setNewPayment(prev => ({ ...prev, due_date: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={newPayment.notes}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Payment notes..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={addPayment} className="flex-1">
                          Add Payment
                        </Button>
                        <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.customers?.first_name} {payment.customers?.last_name}
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="capitalize">{payment.payment_type}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(payment.payment_status)}>
                          {payment.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.due_date ? new Date(payment.due_date).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tabs would be implemented similarly... */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoice Management</CardTitle>
                <Button onClick={() => setInvoiceDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Invoice management coming soon</p>
                <p className="text-sm">Generate and track customer invoices</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Project Cost Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <PiggyBank className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Cost tracking interface coming soon</p>
                <p className="text-sm">Track equipment, labor, and material costs</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability">
          <Card>
            <CardHeader>
              <CardTitle>Profitability Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(kpis.totalRevenue)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(kpis.totalCosts)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Costs</div>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <div className={`text-2xl font-bold ${kpis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(kpis.netProfit)}
                  </div>
                  <div className="text-sm text-muted-foreground">Net Profit ({kpis.profitMargin.toFixed(1)}%)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}