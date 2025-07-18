import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface QuickActionDialogsProps {
  leadDialogOpen: boolean;
  setLeadDialogOpen: (open: boolean) => void;
  installDialogOpen: boolean;
  setInstallDialogOpen: (open: boolean) => void;
}

export function QuickActionDialogs({
  leadDialogOpen,
  setLeadDialogOpen,
  installDialogOpen,
  setInstallDialogOpen
}: QuickActionDialogsProps) {
  const { user } = useAuth();
  const [leadForm, setLeadForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    source: '',
    notes: ''
  });
  
  const [installForm, setInstallForm] = useState({
    customer_id: '',
    installation_address: '',
    scheduled_date: '',
    system_size: '',
    total_value: '',
    installer_notes: ''
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('leads')
        .insert({
          ...leadForm,
          user_id: user.id,
          status: 'new'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead created successfully",
      });

      setLeadDialogOpen(false);
      setLeadForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        source: '',
        notes: ''
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInstallationNumber = () => {
    const timestamp = Date.now();
    return `INS-${timestamp.toString().slice(-6)}`;
  };

  const handleInstallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !installForm.customer_id) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('installations')
        .insert({
          customer_id: installForm.customer_id,
          installation_address: installForm.installation_address,
          scheduled_date: installForm.scheduled_date,
          system_size: parseFloat(installForm.system_size),
          total_value: parseFloat(installForm.total_value),
          installer_notes: installForm.installer_notes,
          installation_number: generateInstallationNumber(),
          user_id: user.id,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Installation created successfully",
      });

      setInstallDialogOpen(false);
      setInstallForm({
        customer_id: '',
        installation_address: '',
        scheduled_date: '',
        system_size: '',
        total_value: '',
        installer_notes: ''
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create installation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Add Lead Dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLeadSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={leadForm.first_name}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={leadForm.last_name}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, last_name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={leadForm.phone}
                onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Lead Source</Label>
              <Select value={leadForm.source} onValueChange={(value) => setLeadForm(prev => ({ ...prev, source: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="advertising">Advertising</SelectItem>
                  <SelectItem value="door-to-door">Door-to-Door</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={leadForm.notes}
                onChange={(e) => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this lead..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setLeadDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Installation Dialog */}
      <Dialog open={installDialogOpen} onOpenChange={(open) => {
        setInstallDialogOpen(open);
        if (open) fetchCustomers();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule New Installation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInstallSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select value={installForm.customer_id} onValueChange={(value) => setInstallForm(prev => ({ ...prev, customer_id: value }))}>
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
            <div className="space-y-2">
              <Label htmlFor="installation_address">Installation Address *</Label>
              <Input
                id="installation_address"
                value={installForm.installation_address}
                onChange={(e) => setInstallForm(prev => ({ ...prev, installation_address: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Scheduled Date *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={installForm.scheduled_date}
                onChange={(e) => setInstallForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="system_size">System Size (kW)</Label>
                <Input
                  id="system_size"
                  type="number"
                  step="0.1"
                  value={installForm.system_size}
                  onChange={(e) => setInstallForm(prev => ({ ...prev, system_size: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_value">Total Value ($)</Label>
                <Input
                  id="total_value"
                  type="number"
                  step="0.01"
                  value={installForm.total_value}
                  onChange={(e) => setInstallForm(prev => ({ ...prev, total_value: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="installer_notes">Installation Notes</Label>
              <Textarea
                id="installer_notes"
                value={installForm.installer_notes}
                onChange={(e) => setInstallForm(prev => ({ ...prev, installer_notes: e.target.value }))}
                placeholder="Special instructions for installation..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setInstallDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !installForm.customer_id}>
                {loading ? 'Scheduling...' : 'Schedule Installation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}