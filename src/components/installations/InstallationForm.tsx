import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
}

interface InstallationFormProps {
  onSuccess: () => void;
}

export function InstallationForm({ onSuccess }: InstallationFormProps) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    installation_address: '',
    scheduled_date: '',
    system_size: '',
    total_value: '',
    installer_notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name')
        .eq('user_id', user?.id)
        .order('first_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers.",
        variant: "destructive",
      });
    }
  };

  const generateInstallationNumber = () => {
    const timestamp = Date.now();
    return `INS-${timestamp.toString().slice(-6)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.customer_id) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('installations')
        .insert({
          customer_id: formData.customer_id,
          installation_address: formData.installation_address,
          scheduled_date: formData.scheduled_date,
          system_size: formData.system_size ? parseFloat(formData.system_size) : null,
          total_value: formData.total_value ? parseFloat(formData.total_value) : null,
          installer_notes: formData.installer_notes,
          installation_number: generateInstallationNumber(),
          user_id: user.id,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Installation scheduled successfully.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating installation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create installation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer">Customer *</Label>
        <Select
          value={formData.customer_id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.length > 0 ? (
              customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.first_name} {customer.last_name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-customers" disabled>
                No customers available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {customers.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Please create customers first before scheduling installations.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Installation Address *</Label>
        <Input
          id="address"
          value={formData.installation_address}
          onChange={(e) => setFormData(prev => ({ ...prev, installation_address: e.target.value }))}
          placeholder="Enter installation address"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Scheduled Date *</Label>
        <Input
          id="date"
          type="date"
          value={formData.scheduled_date}
          onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="systemSize">System Size (kW)</Label>
          <Input
            id="systemSize"
            type="number"
            step="0.1"
            value={formData.system_size}
            onChange={(e) => setFormData(prev => ({ ...prev, system_size: e.target.value }))}
            placeholder="Enter system size"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalValue">Total Value ($)</Label>
          <Input
            id="totalValue"
            type="number"
            step="0.01"
            value={formData.total_value}
            onChange={(e) => setFormData(prev => ({ ...prev, total_value: e.target.value }))}
            placeholder="Enter total value"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Installation Notes</Label>
        <Textarea
          id="notes"
          value={formData.installer_notes}
          onChange={(e) => setFormData(prev => ({ ...prev, installer_notes: e.target.value }))}
          placeholder="Special instructions for installation..."
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !formData.customer_id} className="flex-1">
          {loading ? 'Creating...' : 'Schedule Installation'}
        </Button>
      </div>
    </form>
  );
}