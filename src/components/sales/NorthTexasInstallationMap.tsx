import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Calendar, User, Clock, CheckCircle, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Installation {
  id: string;
  customer_name: string;
  installation_address: string;
  city: string;
  state: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string | null;
  completed_date: string | null;
  installer_notes: string | null;
  system_size: number | null;
  lat?: number;
  lng?: number;
}

interface NorthTexasMapProps {
  mapboxToken: string;
  onTokenChange: (token: string) => void;
}

export function NorthTexasInstallationMap({ mapboxToken, onTokenChange }: NorthTexasMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { user } = useAuth();
  
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showInProgress, setShowInProgress] = useState(true);
  const [tempToken, setTempToken] = useState('');

  // Mock installations data for North Texas area
  const mockInstallations: Installation[] = [
    {
      id: '1',
      customer_name: 'John Smith',
      installation_address: '123 Main St',
      city: 'Dallas',
      state: 'TX',
      status: 'completed',
      scheduled_date: '2024-01-15',
      completed_date: '2024-01-18',
      installer_notes: 'Installation completed successfully',
      system_size: 8.5,
      lat: 32.7767,
      lng: -96.7970
    },
    {
      id: '2',
      customer_name: 'Sarah Johnson',
      installation_address: '456 Oak Ave',
      city: 'Fort Worth',
      state: 'TX',
      status: 'in_progress',
      scheduled_date: '2024-01-20',
      completed_date: null,
      installer_notes: 'Installation in progress',
      system_size: 12.0,
      lat: 32.7555,
      lng: -97.3308
    },
    {
      id: '3',
      customer_name: 'Mike Rodriguez',
      installation_address: '789 Pine St',
      city: 'Plano',
      state: 'TX',
      status: 'completed',
      scheduled_date: '2024-01-10',
      completed_date: '2024-01-12',
      installer_notes: 'Excellent installation',
      system_size: 10.2,
      lat: 33.0198,
      lng: -96.6989
    },
    {
      id: '4',
      customer_name: 'Lisa Chen',
      installation_address: '321 Cedar Ln',
      city: 'Irving',
      state: 'TX',
      status: 'scheduled',
      scheduled_date: '2024-01-25',
      completed_date: null,
      installer_notes: null,
      system_size: 9.5,
      lat: 32.8140,
      lng: -96.9489
    },
    {
      id: '5',
      customer_name: 'David Wilson',
      installation_address: '654 Elm Dr',
      city: 'Arlington',
      state: 'TX',
      status: 'in_progress',
      scheduled_date: '2024-01-22',
      completed_date: null,
      installer_notes: 'Weather delayed start',
      system_size: 7.8,
      lat: 32.7357,
      lng: -97.1081
    },
    {
      id: '6',
      customer_name: 'Jennifer Davis',
      installation_address: '987 Maple St',
      city: 'Garland',
      state: 'TX',
      status: 'completed',
      scheduled_date: '2024-01-08',
      completed_date: '2024-01-10',
      installer_notes: 'Customer very satisfied',
      system_size: 11.5,
      lat: 32.9126,
      lng: -96.6389
    },
    {
      id: '7',
      customer_name: 'Robert Brown',
      installation_address: '147 Birch Ave',
      city: 'Mesquite',
      state: 'TX',
      status: 'scheduled',
      scheduled_date: '2024-01-28',
      completed_date: null,
      installer_notes: null,
      system_size: 8.0,
      lat: 32.7668,
      lng: -96.5992
    }
  ];

  useEffect(() => {
    // Use mock data for now
    setInstallations(mockInstallations);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map centered on North Texas
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-96.8, 32.8], // Dallas-Fort Worth center
      zoom: 9,
      maxBounds: [
        [-98.5, 32.0], // Southwest coordinates
        [-95.0, 33.8]  // Northeast coordinates
      ]
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter installations based on toggle states
    const filteredInstallations = installations.filter(installation => {
      if (installation.status === 'completed' && !showCompleted) return false;
      if ((installation.status === 'in_progress' || installation.status === 'scheduled') && !showInProgress) return false;
      return true;
    });

    // Add markers for filtered installations
    filteredInstallations.forEach((installation) => {
      if (!installation.lat || !installation.lng) return;

      const markerColor = getMarkerColor(installation.status);
      const markerIcon = getMarkerIcon(installation.status);

      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'installation-marker';
      markerEl.style.backgroundColor = markerColor;
      markerEl.style.width = '24px';
      markerEl.style.height = '24px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.border = '3px solid white';
      markerEl.style.cursor = 'pointer';
      markerEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      markerEl.style.display = 'flex';
      markerEl.style.alignItems = 'center';
      markerEl.style.justifyContent = 'center';
      markerEl.style.fontSize = '12px';
      markerEl.style.color = 'white';
      markerEl.innerHTML = markerIcon;

      // Create popup content
      const popupContent = `
        <div class="p-3 min-w-64">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full" style="background-color: ${markerColor}"></div>
            <h3 class="font-bold text-base">${installation.customer_name}</h3>
          </div>
          <div class="space-y-1 text-sm">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span>${installation.installation_address}, ${installation.city}</span>
            </div>
            ${installation.scheduled_date ? `
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>Scheduled: ${new Date(installation.scheduled_date).toLocaleDateString()}</span>
              </div>
            ` : ''}
            ${installation.completed_date ? `
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Completed: ${new Date(installation.completed_date).toLocaleDateString()}</span>
              </div>
            ` : ''}
            ${installation.system_size ? `
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>System Size: ${installation.system_size} kW</span>
              </div>
            ` : ''}
            <div class="mt-2 px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(installation.status)}">
              ${installation.status.replace('_', ' ').toUpperCase()}
            </div>
            ${installation.installer_notes ? `
              <div class="mt-2 text-xs text-gray-600 italic">
                "${installation.installer_notes}"
              </div>
            ` : ''}
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupContent);

      // Add marker to map
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([installation.lng, installation.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [installations, showCompleted, showInProgress, mapboxToken]);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981'; // Green
      case 'in_progress':
        return '#f59e0b'; // Amber
      case 'scheduled':
        return '#3b82f6'; // Blue
      default:
        return '#6b7280'; // Gray
    }
  };

  const getMarkerIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '⚡';
      case 'scheduled':
        return '📅';
      default:
        return '•';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTokenSubmit = () => {
    if (tempToken.trim()) {
      onTokenChange(tempToken.trim());
      setTempToken('');
    }
  };

  if (!mapboxToken) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            North Texas Installation Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
            <p className="text-muted-foreground mb-4">
              Enter your Mapbox public token to view the North Texas installation map.
            </p>
            <div className="max-w-md mx-auto space-y-3">
              <input
                type="text"
                placeholder="Enter Mapbox public token"
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
              <Button onClick={handleTokenSubmit} className="w-full">
                Load Map
              </Button>
              <p className="text-xs text-muted-foreground">
                Get your token at{' '}
                <a 
                  href="https://mapbox.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  mapbox.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            North Texas Installation Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <MapPin className="w-4 h-4 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground">Loading installations...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = installations.filter(i => i.status === 'completed').length;
  const inProgressCount = installations.filter(i => i.status === 'in_progress' || i.status === 'scheduled').length;

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          North Texas Installation Map
        </CardTitle>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
                id="completed-toggle"
              />
              <label htmlFor="completed-toggle" className="text-sm font-medium cursor-pointer">
                Completed ({completedCount})
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={showInProgress}
                onCheckedChange={setShowInProgress}
                id="progress-toggle"
              />
              <label htmlFor="progress-toggle" className="text-sm font-medium cursor-pointer">
                Active ({inProgressCount})
              </label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-96 rounded-lg overflow-hidden border border-border">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 border border-border shadow-lg">
            <div className="text-sm font-medium mb-2">Installation Status</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                <span className="text-xs">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs">⚡</div>
                <span className="text-xs">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">📅</div>
                <span className="text-xs">Scheduled</span>
              </div>
            </div>
          </div>

          {/* Stats Overlay */}
          <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 border border-border shadow-lg">
            <div className="text-sm font-medium mb-2">North Texas Installations</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{completedCount}</div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-600">{inProgressCount}</div>
                <div className="text-muted-foreground">Active</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Click on markers for installation details • Use controls to zoom and pan
        </div>
      </CardContent>
    </Card>
  );
}