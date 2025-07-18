import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Layers, ZoomIn, ZoomOut } from "lucide-react";

interface GeographicData {
  region: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  sales: number;
  revenue: number;
  installations: number;
  leads: number;
  conversionRate: number;
}

interface GeographicMapProps {
  data: GeographicData[];
  selectedMetric: 'sales' | 'revenue' | 'installations' | 'leads' | 'conversion';
  onMetricChange: (metric: string) => void;
}

export function GeographicMap({ data, selectedMetric, onMetricChange }: GeographicMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Mock data for demonstration
  const mockData: GeographicData[] = [
    { region: 'California', state: 'CA', city: 'Los Angeles', lat: 34.0522, lng: -118.2437, sales: 45, revenue: 1575000, installations: 42, leads: 120, conversionRate: 37.5 },
    { region: 'California', state: 'CA', city: 'San Francisco', lat: 37.7749, lng: -122.4194, sales: 38, revenue: 1330000, installations: 35, leads: 95, conversionRate: 40.0 },
    { region: 'Texas', state: 'TX', city: 'Austin', lat: 30.2672, lng: -97.7431, sales: 32, revenue: 1120000, installations: 30, leads: 85, conversionRate: 37.6 },
    { region: 'Florida', state: 'FL', city: 'Miami', lat: 25.7617, lng: -80.1918, sales: 28, revenue: 980000, installations: 26, leads: 78, conversionRate: 35.9 },
    { region: 'New York', state: 'NY', city: 'New York', lat: 40.7128, lng: -74.0060, sales: 35, revenue: 1225000, installations: 32, leads: 92, conversionRate: 38.0 },
    { region: 'Arizona', state: 'AZ', city: 'Phoenix', lat: 33.4484, lng: -112.0740, sales: 25, revenue: 875000, installations: 23, leads: 68, conversionRate: 36.8 }
  ];

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 4,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers for each location
    mockData.forEach((location) => {
      const markerSize = getMarkerSize(location[selectedMetric]);
      const markerColor = getMarkerColor(location[selectedMetric], selectedMetric);
      
      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'marker';
      markerEl.style.backgroundColor = markerColor;
      markerEl.style.width = `${markerSize}px`;
      markerEl.style.height = `${markerSize}px`;
      markerEl.style.borderRadius = '50%';
      markerEl.style.border = '2px solid white';
      markerEl.style.cursor = 'pointer';
      markerEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3">
          <h3 class="font-bold text-lg mb-2">${location.city}, ${location.state}</h3>
          <div class="space-y-1 text-sm">
            <div><strong>Sales:</strong> ${location.sales} deals</div>
            <div><strong>Revenue:</strong> $${(location.revenue / 1000).toFixed(0)}K</div>
            <div><strong>Installations:</strong> ${location.installations}</div>
            <div><strong>Leads:</strong> ${location.leads}</div>
            <div><strong>Conversion Rate:</strong> ${location.conversionRate}%</div>
          </div>
        </div>
      `);

      // Add marker to map
      new mapboxgl.Marker(markerEl)
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, selectedMetric]);

  const getMarkerSize = (value: number) => {
    // Normalize size between 20-60px based on metric value
    const minSize = 20;
    const maxSize = 60;
    const maxValue = Math.max(...mockData.map(d => d[selectedMetric] as number));
    return minSize + ((value / maxValue) * (maxSize - minSize));
  };

  const getMarkerColor = (value: number, metric: string) => {
    const intensity = value / Math.max(...mockData.map(d => d[metric] as number));
    
    switch (metric) {
      case 'sales':
        return `hsl(142, 76%, ${Math.max(30, 80 - intensity * 50)}%)`;
      case 'revenue':
        return `hsl(217, 91%, ${Math.max(30, 80 - intensity * 50)}%)`;
      case 'installations':
        return `hsl(47, 96%, ${Math.max(30, 80 - intensity * 50)}%)`;
      case 'leads':
        return `hsl(262, 83%, ${Math.max(30, 80 - intensity * 50)}%)`;
      case 'conversion':
        return `hsl(346, 87%, ${Math.max(30, 80 - intensity * 50)}%)`;
      default:
        return '#3b82f6';
    }
  };

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setShowTokenInput(false);
    }
  };

  if (!mapboxToken) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Geographic Sales Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Map className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
            <p className="text-muted-foreground mb-4">
              Enter your Mapbox public token to view the interactive geographic sales map.
            </p>
            <div className="max-w-md mx-auto space-y-3">
              <input
                type="text"
                placeholder="Enter Mapbox public token"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
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

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5" />
          Geographic Sales Map
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { key: 'sales', label: 'Sales Volume', color: 'bg-green-500' },
            { key: 'revenue', label: 'Revenue', color: 'bg-blue-500' },
            { key: 'installations', label: 'Installations', color: 'bg-yellow-500' },
            { key: 'leads', label: 'Lead Density', color: 'bg-purple-500' },
            { key: 'conversion', label: 'Conversion Rate', color: 'bg-red-500' }
          ].map((metric) => (
            <Button
              key={metric.key}
              variant={selectedMetric === metric.key ? "default" : "outline"}
              size="sm"
              onClick={() => onMetricChange(metric.key)}
              className="text-xs"
            >
              <div className={`w-2 h-2 rounded-full ${metric.color} mr-2`} />
              {metric.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-96 rounded-lg overflow-hidden border border-border">
          <div ref={mapContainer} className="absolute inset-0" />
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
            <div className="text-sm font-medium mb-2 capitalize">{selectedMetric} Heatmap</div>
            <div className="text-xs text-muted-foreground">
              Click markers for details • Larger markers = higher values
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}