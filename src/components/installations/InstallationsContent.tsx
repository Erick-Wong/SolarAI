import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, AlertTriangle, CheckCircle, Plus, Search, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { InstallationForm } from "./InstallationForm";

interface Installation {
  id: string;
  installation_number: string;
  customer_id: string;
  installation_address: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  completed_date?: string;
  system_size: number;
  total_value: number;
  installer_notes?: string;
  customer_notes?: string;
  customers?: {
    first_name: string;
    last_name: string;
  };
}

const statusConfig = {
  scheduled: { label: "Scheduled", color: "bg-blue-500", variant: "default" as const },
  in_progress: { label: "In Progress", color: "bg-yellow-500", variant: "outline" as const },
  completed: { label: "Completed", color: "bg-green-500", variant: "secondary" as const },
  cancelled: { label: "Cancelled", color: "bg-gray-500", variant: "secondary" as const },
};

export function InstallationsContent() {
  const { user } = useAuth();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [filteredInstallations, setFilteredInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sample data for charts (would be calculated from real data)
  const chartData = [
    { month: 'Jan', installations: 12, avgTime: 4.2 },
    { month: 'Feb', installations: 15, avgTime: 3.8 },
    { month: 'Mar', installations: 18, avgTime: 4.1 },
    { month: 'Apr', installations: 22, avgTime: 3.9 },
    { month: 'May', installations: 25, avgTime: 4.0 },
    { month: 'Jun', installations: 28, avgTime: 3.7 },
  ];

  const delayReasons = [
    { name: 'Weather', value: 35, color: '#ef4444' },
    { name: 'Permits', value: 25, color: '#f97316' },
    { name: 'Equipment', value: 20, color: '#eab308' },
    { name: 'Scheduling', value: 20, color: '#3b82f6' },
  ];

  useEffect(() => {
    if (user) {
      fetchInstallations();
    }
  }, [user]);

  useEffect(() => {
    filterInstallations();
  }, [installations, searchTerm, statusFilter, dateFilter]);

  const fetchInstallations = async () => {
    try {
      const { data, error } = await supabase
        .from('installations')
        .select(`
          *,
          customers (
            first_name,
            last_name
          )
        `)
        .eq('user_id', user?.id)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setInstallations(data || []);
    } catch (error) {
      console.error('Error fetching installations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch installations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterInstallations = () => {
    let filtered = installations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(inst => 
        inst.installation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.installation_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inst.customers && `${inst.customers.first_name} ${inst.customers.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(inst => inst.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(inst => new Date(inst.scheduled_date) >= filterDate);
    }

    setFilteredInstallations(filtered);
  };

  const updateInstallationStatus = async (installationId: string, newStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('installations')
        .update({ 
          status: newStatus,
          ...(newStatus === 'completed' && { completed_date: new Date().toISOString().split('T')[0] })
        })
        .eq('id', installationId);

      if (error) throw error;

      await fetchInstallations();
      toast({
        title: "Success",
        description: "Installation status updated successfully.",
      });
    } catch (error) {
      console.error('Error updating installation:', error);
      toast({
        title: "Error",
        description: "Failed to update installation status.",
        variant: "destructive",
      });
    }
  };

  // Calculate KPIs
  const kpis = {
    totalMonth: installations.filter(inst => {
      const instDate = new Date(inst.scheduled_date);
      const now = new Date();
      return instDate.getMonth() === now.getMonth() && instDate.getFullYear() === now.getFullYear();
    }).length,
    totalYTD: installations.filter(inst => {
      const instDate = new Date(inst.scheduled_date);
      const now = new Date();
      return instDate.getFullYear() === now.getFullYear();
    }).length,
    inProgress: installations.filter(inst => inst.status === 'in_progress').length,
    completed: installations.filter(inst => inst.status === 'completed').length,
    cancelled: installations.filter(inst => inst.status === 'cancelled').length,
    avgTime: 3.9, // Would be calculated from actual data
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading installations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Installations</h1>
          <p className="text-muted-foreground">Track and manage solar panel installations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Installation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Installation</DialogTitle>
            </DialogHeader>
            <InstallationForm onSuccess={() => {
              setIsDialogOpen(false);
              fetchInstallations();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{kpis.totalMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">YTD Total</p>
                <p className="text-2xl font-bold">{kpis.totalYTD}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{kpis.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{kpis.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold">{kpis.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Time</p>
                <p className="text-2xl font-bold">{kpis.avgTime}d</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Installation Table</TabsTrigger>
          <TabsTrigger value="charts">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search installations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Installation Table */}
          <Card>
            <CardHeader>
              <CardTitle>Installation Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Address/Location</TableHead>
                    <TableHead>Install Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>System Size</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstallations.map((installation) => (
                    <TableRow key={installation.id}>
                      <TableCell className="font-medium">
                        {installation.customers 
                          ? `${installation.customers.first_name} ${installation.customers.last_name}`
                          : 'Unknown Customer'
                        }
                      </TableCell>
                      <TableCell>{installation.installation_address}</TableCell>
                      <TableCell>{new Date(installation.scheduled_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[installation.status].variant}>
                          {statusConfig[installation.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{installation.system_size}kW</TableCell>
                      <TableCell>${installation.total_value?.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {installation.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => updateInstallationStatus(installation.id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                          {installation.status === 'scheduled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateInstallationStatus(installation.id, 'in_progress')}
                            >
                              Start
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Installations per Month */}
            <Card>
              <CardHeader>
                <CardTitle>Installations per Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="installations" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Average Installation Time */}
            <Card>
              <CardHeader>
                <CardTitle>Average Installation Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgTime" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Delay Reasons */}
            <Card>
              <CardHeader>
                <CardTitle>Delay Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={delayReasons}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {delayReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Mini Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Installations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Map view coming soon</p>
                    <Button variant="outline" className="mt-2">
                      View Geographic Tab
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}