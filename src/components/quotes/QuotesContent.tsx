import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, FileText, Send, Download, Edit, Trash2, Eye, 
  Calculator, DollarSign, Calendar, Clock, Search, Filter 
} from "lucide-react";
import { QuoteForm } from "./QuoteForm";
import { QuotePreview } from "./QuotePreview";

interface Quote {
  id: string;
  quote_number: string;
  customer_id: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  total_amount: number;
  system_size: number;
  installation_address?: string;
  valid_until?: string;
  created_at: string;
  customers?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  quote_items?: QuoteItem[];
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  equipment_id?: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface Equipment {
  id: string;
  name: string;
  category: string;
  unit_price: number;
  description?: string;
}

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const, color: "bg-gray-500" },
  sent: { label: "Sent", variant: "default" as const, color: "bg-blue-500" },
  approved: { label: "Approved", variant: "secondary" as const, color: "bg-green-500" },
  rejected: { label: "Rejected", variant: "destructive" as const, color: "bg-red-500" },
  expired: { label: "Expired", variant: "outline" as const, color: "bg-orange-500" },
};

export function QuotesContent() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchQuotes();
      fetchCustomers();
      fetchEquipment();
    }
  }, [user]);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            email,
            phone
          ),
          quote_items (
            id,
            description,
            quantity,
            unit_price,
            total_price,
            equipment_id
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quotes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .eq('user_id', user?.id);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const generateQuoteNumber = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `Q${timestamp}${random}`;
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;

      await fetchQuotes();
      toast({
        title: "Success",
        description: "Quote deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast({
        title: "Error",
        description: "Failed to delete quote.",
        variant: "destructive",
      });
    }
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired') => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: newStatus })
        .eq('id', quoteId);

      if (error) throw error;

      await fetchQuotes();
      toast({
        title: "Success",
        description: "Quote status updated successfully.",
      });
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast({
        title: "Error",
        description: "Failed to update quote status.",
        variant: "destructive",
      });
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.customers && `${quote.customers.first_name} ${quote.customers.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (quote.installation_address && quote.installation_address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    approved: quotes.filter(q => q.status === 'approved').length,
    totalValue: quotes
      .filter(q => q.status === 'approved')
      .reduce((sum, q) => sum + q.total_amount, 0),
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading quotes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Quotes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approved Value</p>
                <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="quotes" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="quotes">All Quotes</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Quote</DialogTitle>
              </DialogHeader>
              <QuoteForm
                customers={customers}
                equipment={equipment}
                onSuccess={() => {
                  setIsCreateDialogOpen(false);
                  fetchQuotes();
                }}
                generateQuoteNumber={generateQuoteNumber}
              />
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="quotes" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search quotes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quotes Table */}
          <Card>
            <CardHeader>
              <CardTitle>Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>System Size</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.quote_number}</TableCell>
                      <TableCell>
                        {quote.customers 
                          ? `${quote.customers.first_name} ${quote.customers.last_name}`
                          : 'Unknown Customer'
                        }
                      </TableCell>
                      <TableCell>{quote.system_size}kW</TableCell>
                      <TableCell>${quote.total_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[quote.status].variant}>
                          {statusConfig[quote.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {quote.valid_until 
                          ? new Date(quote.valid_until).toLocaleDateString()
                          : 'No expiry'
                        }
                      </TableCell>
                      <TableCell>{new Date(quote.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedQuote(quote);
                              setIsPreviewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {quote.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => updateQuoteStatus(quote.id, 'sent')}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {quote.status === 'sent' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuoteStatus(quote.id, 'approved')}
                            >
                              Approve
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteQuote(quote.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Quote Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Residential Solar Package</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Standard residential installation with panels, inverter, and installation
                  </p>
                  <Button variant="outline" size="sm">Use Template</Button>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Commercial Solar Package</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Large scale commercial installation with monitoring
                  </p>
                  <Button variant="outline" size="sm">Use Template</Button>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Solar + Battery Storage</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete solar system with battery backup solution
                  </p>
                  <Button variant="outline" size="sm">Use Template</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quote Preview Dialog */}
      {selectedQuote && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Quote Preview - {selectedQuote.quote_number}</DialogTitle>
            </DialogHeader>
            <QuotePreview quote={selectedQuote} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}