import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Calendar, CheckCircle, Clock, AlertTriangle, Plus, FileText, Settings, Mail } from "lucide-react";

interface Permit {
  id: string;
  permit_type: string;
  permit_number?: string;
  status: string;
  application_date?: string;
  approval_date?: string;
  expiration_date?: string;
  issuing_authority?: string;
  notes?: string;
}

interface Milestone {
  id: string;
  milestone_type: string;
  milestone_name: string;
  scheduled_date?: string;
  completed_date?: string;
  status: string;
  assigned_to?: string;
  notes?: string;
}

interface EnhancedInstallationDetailsProps {
  installationId: string;
  onClose: () => void;
}

export function EnhancedInstallationDetails({ installationId, onClose }: EnhancedInstallationDetailsProps) {
  const { user } = useAuth();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [permitDialogOpen, setPermitDialogOpen] = useState(false);
  const [newPermit, setNewPermit] = useState({
    permit_type: '',
    permit_number: '',
    application_date: '',
    issuing_authority: '',
    notes: ''
  });

  useEffect(() => {
    fetchInstallationDetails();
  }, [installationId]);

  const fetchInstallationDetails = async () => {
    try {
      // Fetch permits
      const { data: permitsData, error: permitsError } = await supabase
        .from('permits')
        .select('*')
        .eq('installation_id', installationId)
        .eq('user_id', user?.id);

      if (permitsError) throw permitsError;

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('installation_milestones')
        .select('*')
        .eq('installation_id', installationId)
        .eq('user_id', user?.id)
        .order('created_at');

      if (milestonesError) throw milestonesError;

      setPermits(permitsData || []);
      setMilestones(milestonesData || []);
    } catch (error) {
      console.error('Error fetching installation details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch installation details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPermit = async () => {
    try {
      const { error } = await supabase
        .from('permits')
        .insert({
          installation_id: installationId,
          permit_type: newPermit.permit_type,
          permit_number: newPermit.permit_number,
          application_date: newPermit.application_date || null,
          issuing_authority: newPermit.issuing_authority,
          notes: newPermit.notes,
          user_id: user!.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Permit added successfully.",
      });

      setPermitDialogOpen(false);
      setNewPermit({
        permit_type: '',
        permit_number: '',
        application_date: '',
        issuing_authority: '',
        notes: ''
      });
      fetchInstallationDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add permit.",
        variant: "destructive",
      });
    }
  };

  const updateMilestoneStatus = async (milestoneId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'completed') {
        updates.completed_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('installation_milestones')
        .update(updates)
        .eq('id', milestoneId);

      if (error) throw error;

      // Send customer update email
      const milestone = milestones.find(m => m.id === milestoneId);
      if (milestone) {
        await sendCustomerUpdate(status, milestone.milestone_name);
      }

      toast({
        title: "Success",
        description: "Milestone updated successfully.",
      });

      fetchInstallationDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update milestone.",
        variant: "destructive",
      });
    }
  };

  const sendCustomerUpdate = async (status?: string, milestone?: string) => {
    try {
      // Get installation and customer data
      const { data: installation, error: installationError } = await supabase
        .from('installations')
        .select(`
          *,
          customers (
            email,
            first_name,
            last_name
          )
        `)
        .eq('id', installationId)
        .single();

      if (installationError) throw installationError;

      const { error } = await supabase.functions.invoke('send-installation-update', {
        body: {
          customerEmail: installation.customers.email,
          customerName: `${installation.customers.first_name} ${installation.customers.last_name}`,
          installationNumber: installation.installation_number,
          status: status || installation.status || 'in_progress',
          milestone: milestone,
          scheduledDate: installation.scheduled_date ? new Date(installation.scheduled_date).toLocaleDateString() : undefined,
          completedDate: installation.completed_date ? new Date(installation.completed_date).toLocaleDateString() : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Customer Notified",
        description: "Customer has been sent an email update about the installation progress.",
      });
    } catch (error: any) {
      console.error('Error sending customer update:', error);
      toast({
        title: "Email Error",
        description: "Failed to send customer update email.",
        variant: "destructive",
      });
    }
  };

  const updatePermitStatus = async (permitId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'approved') {
        updates.approval_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('permits')
        .update(updates)
        .eq('id', permitId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Permit status updated successfully.",
      });

      fetchInstallationDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update permit.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-500';
      case 'in_progress':
      case 'submitted':
        return 'bg-blue-500';
      case 'delayed':
      case 'rejected':
        return 'bg-red-500';
      case 'blocked':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const calculateProgress = () => {
    if (milestones.length === 0) return 0;
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completedMilestones / milestones.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">Loading installation details...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Installation Progress
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendCustomerUpdate()}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Update
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-3" />
            <div className="text-sm text-muted-foreground">
              {milestones.filter(m => m.status === 'completed').length} of {milestones.length} milestones completed
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="milestones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="permits">Permits</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Installation Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(milestone.status)}`}>
                        {milestone.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : milestone.status === 'in_progress' ? (
                          <Clock className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{milestone.milestone_name}</h4>
                        <Badge variant={milestone.status === 'completed' ? 'default' : 'outline'}>
                          {milestone.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {milestone.scheduled_date && (
                          <span>Scheduled: {new Date(milestone.scheduled_date).toLocaleDateString()}</span>
                        )}
                        {milestone.completed_date && (
                          <span className="ml-4">Completed: {new Date(milestone.completed_date).toLocaleDateString()}</span>
                        )}
                        {milestone.assigned_to && (
                          <span className="ml-4">Assigned to: {milestone.assigned_to}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {milestone.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateMilestoneStatus(milestone.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      {milestone.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateMilestoneStatus(milestone.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                      {milestone.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMilestoneStatus(milestone.id, 'delayed')}
                        >
                          Mark Delayed
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permits" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Permits
                </CardTitle>
                <Dialog open={permitDialogOpen} onOpenChange={setPermitDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Permit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Permit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="permit_type">Permit Type</Label>
                        <Select value={newPermit.permit_type} onValueChange={(value) => setNewPermit(prev => ({ ...prev, permit_type: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select permit type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="building">Building Permit</SelectItem>
                            <SelectItem value="electrical">Electrical Permit</SelectItem>
                            <SelectItem value="utility_interconnection">Utility Interconnection</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="permit_number">Permit Number</Label>
                        <Input
                          value={newPermit.permit_number}
                          onChange={(e) => setNewPermit(prev => ({ ...prev, permit_number: e.target.value }))}
                          placeholder="Enter permit number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="application_date">Application Date</Label>
                        <Input
                          type="date"
                          value={newPermit.application_date}
                          onChange={(e) => setNewPermit(prev => ({ ...prev, application_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="issuing_authority">Issuing Authority</Label>
                        <Input
                          value={newPermit.issuing_authority}
                          onChange={(e) => setNewPermit(prev => ({ ...prev, issuing_authority: e.target.value }))}
                          placeholder="e.g., City of Dallas Building Department"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          value={newPermit.notes}
                          onChange={(e) => setNewPermit(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Additional notes about this permit..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={addPermit} className="flex-1">
                          Add Permit
                        </Button>
                        <Button variant="outline" onClick={() => setPermitDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permits.length > 0 ? (
                  permits.map((permit) => (
                    <div key={permit.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{permit.permit_type.replace('_', ' ').toUpperCase()}</h4>
                        <Badge variant={permit.status === 'approved' ? 'default' : 'outline'}>
                          {permit.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {permit.permit_number && (
                          <div>Permit #: {permit.permit_number}</div>
                        )}
                        {permit.issuing_authority && (
                          <div>Authority: {permit.issuing_authority}</div>
                        )}
                        {permit.application_date && (
                          <div>Applied: {new Date(permit.application_date).toLocaleDateString()}</div>
                        )}
                        {permit.approval_date && (
                          <div>Approved: {new Date(permit.approval_date).toLocaleDateString()}</div>
                        )}
                      </div>
                      {permit.status !== 'approved' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => updatePermitStatus(permit.id, 'submitted')}
                            disabled={permit.status === 'submitted'}
                          >
                            Mark Submitted
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updatePermitStatus(permit.id, 'approved')}
                            disabled={permit.status !== 'submitted'}
                          >
                            Mark Approved
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No permits added yet</p>
                    <p className="text-sm">Add permits to track approval status</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}