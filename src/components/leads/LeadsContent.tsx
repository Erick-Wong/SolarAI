import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiating' | 'won' | 'lost';
  source?: string;
  estimated_system_size?: number;
  estimated_value?: number;
  notes?: string;
  created_at: string;
}

const statusColors = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  qualified: 'bg-purple-500',
  proposal_sent: 'bg-orange-500',
  negotiating: 'bg-indigo-500',
  won: 'bg-green-500',
  lost: 'bg-red-500'
};

const statusLabels = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  negotiating: 'Negotiating',
  won: 'Won',
  lost: 'Lost'
};

export function LeadsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    status: "new" as Lead['status'],
    source: "",
    estimated_system_size: "",
    estimated_value: "",
    notes: ""
  });

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching leads",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const leadData = {
        ...formData,
        user_id: user.id,
        estimated_system_size: formData.estimated_system_size ? parseFloat(formData.estimated_system_size) : null,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null
      };

      if (editingLead) {
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', editingLead.id);

        if (error) throw error;
        toast({ title: "Lead updated successfully" });
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([leadData]);

        if (error) throw error;
        toast({ title: "Lead created successfully" });
      }

      setIsDialogOpen(false);
      setEditingLead(null);
      resetForm();
      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error saving lead",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone || "",
      address: lead.address || "",
      city: lead.city || "",
      state: lead.state || "",
      zip_code: lead.zip_code || "",
      status: lead.status,
      source: lead.source || "",
      estimated_system_size: lead.estimated_system_size?.toString() || "",
      estimated_value: lead.estimated_value?.toString() || "",
      notes: lead.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Lead deleted successfully" });
      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error deleting lead",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      status: "new",
      source: "",
      estimated_system_size: "",
      estimated_value: "",
      notes: ""
    });
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = `${lead.first_name} ${lead.last_name} ${lead.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-solar rounded-xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-gradient-solar hover:shadow-solar transition-smooth">
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
              <DialogDescription>
                {editingLead ? "Update lead information" : "Enter the details for the new lead"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">Zip Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: Lead['status']) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    placeholder="e.g., Website, Referral, Ad"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated_system_size">Est. System Size (kW)</Label>
                  <Input
                    id="estimated_system_size"
                    type="number"
                    step="0.01"
                    value={formData.estimated_system_size}
                    onChange={(e) => setFormData({...formData, estimated_system_size: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_value">Est. Value ($)</Label>
                  <Input
                    id="estimated_value"
                    type="number"
                    step="0.01"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({...formData, estimated_value: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-gradient-solar hover:shadow-solar transition-smooth">
                  {editingLead ? "Update Lead" : "Create Lead"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{lead.first_name} {lead.last_name}</CardTitle>
                  <CardDescription>{lead.email}</CardDescription>
                </div>
                <Badge className={`${statusColors[lead.status]} text-white`}>
                  {statusLabels[lead.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.phone && (
                <p className="text-sm text-muted-foreground">📞 {lead.phone}</p>
              )}
              {lead.address && (
                <p className="text-sm text-muted-foreground">📍 {lead.address}</p>
              )}
              {lead.estimated_value && (
                <p className="text-sm font-medium text-success">
                  💰 ${lead.estimated_value.toLocaleString()}
                </p>
              )}
              {lead.estimated_system_size && (
                <p className="text-sm text-muted-foreground">
                  ⚡ {lead.estimated_system_size} kW
                </p>
              )}
              {lead.source && (
                <p className="text-sm text-muted-foreground">🎯 {lead.source}</p>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(lead)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(lead.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No leads found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "No leads match your current filters" 
                : "Get started by adding your first lead"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-solar hover:shadow-solar transition-smooth">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Lead
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}