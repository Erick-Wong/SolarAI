import { useState, useEffect, useMemo } from "react";
import { Calendar as BigCalendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Eye,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'sales' | 'survey' | 'installation' | 'inspection' | 'followup';
  customer: string;
  location: string;
  assignedTo: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
}

export function CalendarContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    assignedTo: 'all',
    status: 'all'
  });

  // Mock events data
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Sales Appointment - Johnson Residence',
      start: new Date(2024, 0, 18, 10, 0),
      end: new Date(2024, 0, 18, 11, 0),
      type: 'sales',
      customer: 'John Johnson',
      location: 'Dallas, TX',
      assignedTo: 'Sarah Martinez',
      status: 'scheduled',
      notes: 'Initial consultation for 12kW system'
    },
    {
      id: '2',
      title: 'Site Survey - Chen Property',
      start: new Date(2024, 0, 19, 14, 0),
      end: new Date(2024, 0, 19, 16, 0),
      type: 'survey',
      customer: 'Lisa Chen',
      location: 'Plano, TX',
      assignedTo: 'Mike Rodriguez',
      status: 'scheduled',
      notes: 'Roof assessment and measurement'
    },
    {
      id: '3',
      title: 'Installation - Smith Home',
      start: new Date(2024, 0, 20, 8, 0),
      end: new Date(2024, 0, 20, 17, 0),
      type: 'installation',
      customer: 'Robert Smith',
      location: 'Fort Worth, TX',
      assignedTo: 'Installation Team A',
      status: 'scheduled',
      notes: '10kW solar panel installation',
      priority: 'high'
    },
    {
      id: '4',
      title: 'City Inspection - Davis Installation',
      start: new Date(2024, 0, 22, 13, 0),
      end: new Date(2024, 0, 22, 14, 0),
      type: 'inspection',
      customer: 'Jennifer Davis',
      location: 'Arlington, TX',
      assignedTo: 'City Inspector',
      status: 'scheduled',
      notes: 'Final inspection for PTO'
    },
    {
      id: '5',
      title: 'Follow-up Call - Wilson Service',
      start: new Date(2024, 0, 24, 15, 0),
      end: new Date(2024, 0, 24, 15, 30),
      type: 'followup',
      customer: 'David Wilson',
      location: 'Irving, TX',
      assignedTo: 'Sarah Martinez',
      status: 'scheduled',
      notes: '3-month post-installation check-in'
    }
  ];

  useEffect(() => {
    setEvents(mockEvents);
  }, []);

  useEffect(() => {
    let filtered = events;

    if (filters.type !== 'all') {
      filtered = filtered.filter(event => event.type === filters.type);
    }
    if (filters.assignedTo !== 'all') {
      filtered = filtered.filter(event => event.assignedTo === filters.assignedTo);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(event => event.status === filters.status);
    }

    setFilteredEvents(filtered);
  }, [events, filters]);

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '';
    
    switch (event.type) {
      case 'sales':
        backgroundColor = '#3b82f6'; // Blue
        break;
      case 'survey':
        backgroundColor = '#10b981'; // Green
        break;
      case 'installation':
        backgroundColor = '#f59e0b'; // Orange
        break;
      case 'inspection':
        backgroundColor = '#ef4444'; // Red
        break;
      case 'followup':
        backgroundColor = '#eab308'; // Yellow
        break;
      default:
        backgroundColor = '#6b7280'; // Gray
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: event.status === 'cancelled' ? 0.6 : 1,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 6px'
      }
    };
  };

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return events
      .filter(event => event.start >= now && event.start <= nextWeek)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events]);

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'sales': return '🟦';
      case 'survey': return '🟩';
      case 'installation': return '🟧';
      case 'inspection': return '🟥';
      case 'followup': return '🟨';
      default: return '⚫';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'sales': return 'Sales Appointment';
      case 'survey': return 'Site Survey';
      case 'installation': return 'Installation';
      case 'inspection': return 'Inspection';
      case 'followup': return 'Follow-up';
      default: return 'Event';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const handleAddEvent = (newEvent: Partial<CalendarEvent>) => {
    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: `${getEventTypeLabel(newEvent.type!)} - ${newEvent.customer}`,
      start: newEvent.start!,
      end: newEvent.end!,
      type: newEvent.type!,
      customer: newEvent.customer!,
      location: newEvent.location!,
      assignedTo: newEvent.assignedTo!,
      status: 'scheduled',
      notes: newEvent.notes
    };

    setEvents([...events, event]);
    setShowAddDialog(false);
    toast({
      title: "Event Added",
      description: `${event.title} has been scheduled successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('month')}
              className={view === 'month' ? 'bg-primary text-primary-foreground' : ''}
            >
              Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('week')}
              className={view === 'week' ? 'bg-primary text-primary-foreground' : ''}
            >
              Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('day')}
              className={view === 'day' ? 'bg-primary text-primary-foreground' : ''}
            >
              Day
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold min-w-48 text-center">
              {moment(date).format('MMMM YYYY')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
            </DialogHeader>
            <AddEventForm onSubmit={handleAddEvent} onCancel={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Calendar */}
        <div className="xl:col-span-3">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Calendar
                </CardTitle>
                
                {/* Filters */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="survey">Survey</SelectItem>
                        <SelectItem value="installation">Installation</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span>🟦</span>
                  <span>Sales Appointments</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🟩</span>
                  <span>Site Surveys</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🟧</span>
                  <span>Installations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🟥</span>
                  <span>Inspections</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🟨</span>
                  <span>Follow-ups</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="calendar-container" style={{ height: '600px' }}>
                <BigCalendar
                  localizer={localizer}
                  events={filteredEvents}
                  startAccessor="start"
                  endAccessor="end"
                  view={view}
                  onView={setView}
                  date={date}
                  onNavigate={setDate}
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={handleEventClick}
                  popup
                  style={{ height: '100%' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming (7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No upcoming events</p>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{event.customer}</div>
                          <div className="text-xs text-muted-foreground">
                            {moment(event.start).format('MMM D, h:mm A')}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{event.location}</span>
                          </div>
                          <Badge className={`mt-1 text-xs ${getStatusColor(event.status)}`}>
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Events</span>
                  <Badge variant="secondary">{events.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Installations</span>
                  <Badge className="bg-orange-100 text-orange-800">
                    {events.filter(e => e.type === 'installation').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sales Appts</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {events.filter(e => e.type === 'sales').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Inspections</span>
                  <Badge className="bg-red-100 text-red-800">
                    {events.filter(e => e.type === 'inspection').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">{selectedEvent && getEventTypeIcon(selectedEvent.type)}</span>
              Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Customer</Label>
                <p className="text-sm">{selectedEvent.customer}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <p className="text-sm">{getEventTypeLabel(selectedEvent.type)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Date & Time</Label>
                <p className="text-sm">
                  {moment(selectedEvent.start).format('MMMM D, YYYY h:mm A')} - {moment(selectedEvent.end).format('h:mm A')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <p className="text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedEvent.location}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Assigned To</Label>
                <p className="text-sm flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {selectedEvent.assignedTo}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge className={getStatusColor(selectedEvent.status)}>
                  {selectedEvent.status}
                </Badge>
              </div>
              {selectedEvent.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Event Form Component
function AddEventForm({ onSubmit, onCancel }: { onSubmit: (event: Partial<CalendarEvent>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    type: 'sales',
    customer: '',
    location: '',
    assignedTo: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    onSubmit({
      type: formData.type as CalendarEvent['type'],
      customer: formData.customer,
      location: formData.location,
      assignedTo: formData.assignedTo,
      start: startDateTime,
      end: endDateTime,
      notes: formData.notes
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="type">Event Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Sales Appointment</SelectItem>
            <SelectItem value="survey">Site Survey</SelectItem>
            <SelectItem value="installation">Installation</SelectItem>
            <SelectItem value="inspection">Inspection</SelectItem>
            <SelectItem value="followup">Follow-up</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="customer">Customer Name</Label>
        <Input
          id="customer"
          value={formData.customer}
          onChange={(e) => setFormData({...formData, customer: e.target.value})}
          required
        />
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          required
        />
      </div>

      <div>
        <Label htmlFor="assignedTo">Assigned To</Label>
        <Input
          id="assignedTo"
          value={formData.assignedTo}
          onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
          required
        />
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
            required
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

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">Add Event</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}