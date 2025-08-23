import 'leaflet/dist/leaflet.css';
import {
  Globe,
  MapPin,
  Layers,
  Compass,
  Ruler,
  ZoomIn,
  ZoomOut,
  Target,
  Filter,
  Download,
  Activity,
  Grid,
  Search,
  Settings,
  Info,
  Maximize2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useState,
  useRef,
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useEffect
} from 'react';
import { DataField } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Map, LatLngBounds } from 'leaflet';

// Dynamically import Map components
const MapContainer = lazy(() =>
  import('react-leaflet').then((mod) => ({ default: mod.MapContainer }))
);
const TileLayer = lazy(() =>
  import('react-leaflet').then((mod) => ({ default: mod.TileLayer }))
);
const Popup = lazy(() =>
  import('react-leaflet').then((mod) => ({ default: mod.Popup }))
);
const Circle = lazy(() =>
  import('react-leaflet').then((mod) => ({ default: mod.Circle }))
);
const Polygon = lazy(() =>
  import('react-leaflet').then((mod) => ({ default: mod.Polygon }))
);

interface SpatialAnalysisProps {
  data: {
    fields: DataField[];
    rows: Record<string, any>[];
  };
}

interface Coordinate {
  lat: number;
  lng: number;
  row: Record<string, any>;
  id: string;
  isOutlier?: boolean;
  clusterIndex?: number;
}

type Cluster = {
  id: string;
  coordinates: Coordinate[];
  center: { lat: number; lng: number };
  radius: number;
  color: string;
};

interface SpatialMetrics {
  pointCount: number;
  validCount: number;
  invalidCount: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  center: { lat: number; lng: number };
  spread: { lat: number; lng: number };
  maxDistanceKm: number;
  averageDistanceKm: number;
  medianDistanceKm: number;
  outliers: Coordinate[];
  density: number; // points per square km
  convexHullArea?: number;
}

interface FilterOptions {
  showOutliers: boolean;
  showCenter: boolean;
  showBounds: boolean;
  minDistance?: number;
  maxDistance?: number;
  colorRange?: [number, number];
  sizeRange?: [number, number];
}

// Enhanced modules export
export const modules = [
  {
    id: 'spatial',
    name: 'Spatial Analysis',
    icon: Globe,
    description: 'Advanced geographic analysis with interactive maps, clustering, and spatial metrics',
    available: (data: { fields: DataField[] }) =>
      data.fields.some((f) => {
        const n = f.name.toLowerCase();
        return (
          n.includes('location') ||
          n.includes('lat') ||
          n.includes('lon') ||
          n.includes('lng') ||
          n.includes('address') ||
          n.includes('geo') ||
          n.includes('coordinate') ||
          n.includes('position')
        );
      })
  }
];

// --- Enhanced helper functions ---
const parseCoordinate = (v: unknown): number => {
  if (v == null) return NaN;
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  let s = String(v).trim();

  // quick numeric (allow commas/spaces)
  const plain = s.replace(/[,\u00A0\s]+/g, '');
  if (/^-?\d+(\.\d+)?$/.test(plain)) return parseFloat(plain);

  // decimal with hemisphere letter, e.g., "17.3850 N" or "-77.21W"
  const decHem = plain.match(/^(-?\d+(?:\.\d+)?)([NnSsEeWw])$/);
  if (decHem) {
    const val = parseFloat(decHem[1]);
    const hem = decHem[2].toUpperCase();
    const sign = (hem === 'S' || hem === 'W') ? -1 : 1;
    return sign * Math.abs(val);
  }

  // DMS: 17°23'45" N  or  77 12 30 W
  const dms = s.match(
    /^\s*(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)?\D*(\d+(?:\.\d+)?)?\D*([NnSsEeWw])?\s*$/
  );
  if (dms) {
    const deg = parseFloat(dms[1]);
    const min = dms[2] ? parseFloat(dms[2]) : 0;
    const sec = dms[3] ? parseFloat(dms[3]) : 0;
    const hem = dms[4]?.toUpperCase();
    let dec = deg + min / 60 + sec / 3600;
    if (hem === 'S' || hem === 'W') dec = -dec;
    return dec;
  }

  return NaN;
};

const resolveRowKey = (row: Record<string, any>, fieldName: string) => {
  if (!row || !fieldName) return undefined;
  if (fieldName in row) return fieldName;
  
  const target = fieldName.trim().toLowerCase();
  const keys = Object.keys(row);
  
  // Try exact match
  let k = keys.find((key) => key.toLowerCase() === target);
  if (k) return k;
  
  // Try trimmed match
  k = keys.find((key) => key.trim().toLowerCase() === target);
  if (k) return k;
  
  // Try contains match
  k = keys.find((key) => key.trim().toLowerCase().includes(target));
  return k;
};

const getRowValue = (row: Record<string, any>, fieldName: string) => {
  const key = resolveRowKey(row, fieldName);
  return key ? row[key] : undefined;
};

// Enhanced haversine distance calculation
const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Enhanced quantiles calculation
const quantiles = (arr: number[], qs: number[]): number[] => {
  if (!arr.length) return qs.map(() => NaN);
  const sorted = [...arr].sort((x, y) => x - y);
  return qs.map((q) => {
    const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))));
    return sorted[index];
  });
};

// Calculate convex hull area (simplified)
const calculateConvexHullArea = (coordinates: Coordinate[]): number => {
  if (coordinates.length < 3) return 0;
  
  // Simple convex hull approximation using bounding box
  const lats = coordinates.map(c => c.lat);
  const lngs = coordinates.map(c => c.lng);
  
  const latRange = Math.max(...lats) - Math.min(...lats);
  const lngRange = Math.max(...lngs) - Math.min(...lngs);
  
  // Convert to approximate km² (rough calculation)
  const latKm = latRange * 111; // 1 degree lat ≈ 111 km
  const lngKm = lngRange * 111 * Math.cos((Math.max(...lats) + Math.min(...lats)) / 2 * Math.PI / 180);
  
  return latKm * lngKm;
};

// Enhanced clustering algorithm using DBSCAN-like approach
const performClustering = (coordinates: Coordinate[], maxDistance: number): Cluster[] => {
  if (coordinates.length < 2) return [];
  
  const visited = new Set<string>();
  const clusters: Cluster[] = [];
  const noise: Coordinate[] = [];
  
  const getNeighbors = (point: Coordinate, points: Coordinate[], distance: number) => {
    return points.filter(p => 
      p.id !== point.id && 
      haversineKm(point.lat, point.lng, p.lat, p.lng) * 1000 <= distance
    );
  };
  
  for (const point of coordinates) {
    if (visited.has(point.id)) continue;
    
    const neighbors = getNeighbors(point, coordinates, maxDistance);
    
    if (neighbors.length < 1) {
      noise.push(point);
      continue;
    }
    
    visited.add(point.id);
    const clusterPoints = [point];
    const queue = [...neighbors];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (!visited.has(current.id)) {
        visited.add(current.id);
        clusterPoints.push(current);
        
        const currentNeighbors = getNeighbors(current, coordinates, maxDistance);
        queue.push(...currentNeighbors.filter(n => !visited.has(n.id)));
      }
    }
    
    // Calculate cluster center and properties
    const centerLat = clusterPoints.reduce((s, p) => s + p.lat, 0) / clusterPoints.length;
    const centerLng = clusterPoints.reduce((s, p) => s + p.lng, 0) / clusterPoints.length;
    
    const maxDistanceFromCenter = Math.max(
      ...clusterPoints.map(p => haversineKm(centerLat, centerLng, p.lat, p.lng) * 1000)
    );
    
    clusters.push({
      id: `cluster-${clusters.length}`,
      coordinates: clusterPoints.map(p => ({ ...p, clusterIndex: clusters.length })),
      center: { lat: centerLat, lng: centerLng },
      radius: Math.max(100, maxDistanceFromCenter),
      color: `hsl(${(clusters.length * 137.5) % 360}, 70%, 50%)`
    });
  }
  
  return clusters;
};

// Main component
export function SpatialAnalysisPanel({ data }: SpatialAnalysisProps) {
  // State management
  const [mapType, setMapType] = useState<'points' | 'heatmap' | 'clusters' | 'density'>('points');
  const [radius, setRadius] = useState<number>(800);
  const [latField, setLatField] = useState<string>('');
  const [lngField, setLngField] = useState<string>('');
  const [colorField, setColorField] = useState<string>('none');
  const [sizeField, setSizeField] = useState<string>('none');
  const [clusterDistance, setClusterDistance] = useState<number>(100);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTileLayer, setSelectedTileLayer] = useState<string>('osm');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [mapKey, setMapKey] = useState<string>('');
  
  // Filter options
  const [filters, setFilters] = useState<FilterOptions>({
    showOutliers: true,
    showCenter: true,
    showBounds: false
  });
  
  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [maxPoints, setMaxPoints] = useState<number>(10000);
  
  const mapRef = useRef<Map | null>(null);
  
  // Auto-detect coordinate fields with better patterns
  useEffect(() => {
    if (!latField || !lngField) {
      // const fieldNames = data.fields.map(f => f.name.toLowerCase());
      
      // console.log('Available fields:', data.fields.map(f => f.name));
      // console.log('Current latField:', latField, 'lngField:', lngField);
      
      const latPatterns = ['lat', 'latitude', 'geo_lat', 'y', 'coord_y', 'location_lat'];
      const lngPatterns = ['lng', 'lon', 'long', 'longitude', 'geo_lng', 'x', 'coord_x', 'location_lng'];
      
      const findField = (patterns: string[]) => {
        for (const pattern of patterns) {
          const field = data.fields.find(f => 
            f.name.toLowerCase().includes(pattern) ||
            f.name.toLowerCase() === pattern
          );
          if (field) return field.name;
        }
        return '';
      };
      
      if (!latField) {
        const detected = findField(latPatterns);
        // console.log('Detected latitude field:', detected);
        if (detected) setLatField(detected);
      }
      
      if (!lngField) {
        const detected = findField(lngPatterns);
        // console.log('Detected longitude field:', detected);
        if (detected) setLngField(detected);
      }
    }
  }, [data.fields, latField, lngField]);
  
  // Sanity check for coordinate parsing (commented out for production)
  // useEffect(() => {
  //   if (!latField || !lngField) return;
  //   const sample = data.rows.slice(0, 5).map((r) => {
  //     const kLat = resolveRowKey(r, latField);
  //     const kLng = resolveRowKey(r, lngField);
  //     const rawLat = kLat ? r[kLat] : undefined;
  //     const rawLng = kLng ? r[kLng] : undefined;
  //     return {
  //       kLat, kLng,
  //       rawLat, rawLng,
  //       parsedLat: parseCoordinate(rawLat),
  //       parsedLng: parseCoordinate(rawLng),
  //     };
  //   });
  //   console.log('Spatial parse sample', { latField, lngField, sample });
  // }, [latField, lngField, data.rows]);
  
  // Enhanced coordinate validation
  const validateCoordinates = useCallback((lat: number, lng: number): boolean => {
    return (
      Number.isFinite(lat) && 
      Number.isFinite(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !(lat === 0 && lng === 0) // Exclude null island
    );
  }, []);
  
  // Process and validate coordinates with enhanced error handling
  const processedData = useMemo(() => {
    if (!latField || !lngField || !data?.rows?.length) {
      return { valid: [], invalid: [], errors: [] };
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const valid: Coordinate[] = [];
      const invalid: any[] = [];
      const errors: string[] = [];
      
      // Limit processing for performance
      const rowsToProcess = data.rows.slice(0, maxPoints);
      
      rowsToProcess.forEach((row, index) => {
        try {
          const latValue = getRowValue(row, latField);
          const lngValue = getRowValue(row, lngField);
          
          const lat = parseCoordinate(latValue);
          const lng = parseCoordinate(lngValue);
          
                     // Debug logging for the first few rows (commented out for production)
           // if (index < 3) {
           //   console.log(`Debug Row ${index}:`, {
           //     latField,
           //     lngField,
           //     latValue,
           //     lngValue,
           //     lat,
           //     lng,
           //     isValid: validateCoordinates(lat, lng),
           //     rowKeys: Object.keys(row)
           //   });
           // }
          
          if (validateCoordinates(lat, lng)) {
            valid.push({
              lat,
              lng,
              row,
              id: `point-${index}`,
              isOutlier: false
            });
          } else {
            invalid.push({ 
              row, 
              latValue, 
              lngValue, 
              lat, 
              lng, 
              reason: 'Invalid coordinates' 
            });
          }
        } catch (err) {
          errors.push(`Row ${index}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          invalid.push({ row, reason: 'Processing error' });
        }
      });
      
      // Filter by search term if provided
      const filtered = searchTerm 
        ? valid.filter(coord => {
            const searchLower = searchTerm.toLowerCase();
            return Object.values(coord.row).some(value => 
              String(value).toLowerCase().includes(searchLower)
            );
          })
        : valid;
      
      setIsLoading(false);
      return { valid: filtered, invalid, errors };
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown processing error');
      setIsLoading(false);
      return { valid: [], invalid: [], errors: [String(err)] };
    }
  }, [data?.rows, latField, lngField, validateCoordinates, searchTerm, maxPoints]);
  
  // Enhanced spatial metrics calculation
  const metrics = useMemo((): SpatialMetrics | null => {
    if (!processedData.valid.length) return null;
    
    const coords = processedData.valid;
    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    
    const bounds = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };
    
    const centerLat = lats.reduce((s, v) => s + v, 0) / lats.length;
    const centerLng = lngs.reduce((s, v) => s + v, 0) / lngs.length;
    
    // Calculate distances from center
    const distances = coords.map(c => haversineKm(centerLat, centerLng, c.lat, c.lng));
    const sortedDistances = [...distances].sort((a, b) => a - b);
    
    // Outlier detection using IQR method
    const [q1, q3] = quantiles(sortedDistances, [0.25, 0.75]);
    const iqr = q3 - q1;
    const outlierThreshold = q3 + 1.5 * iqr;
    
    const outliers: Coordinate[] = [];
    coords.forEach((coord, i) => {
      if (distances[i] > outlierThreshold) {
        coord.isOutlier = true;
        outliers.push(coord);
      }
    });
    
    // Calculate area and density
    const area = calculateConvexHullArea(coords);
    const density = area > 0 ? coords.length / area : 0;
    
    return {
      pointCount: coords.length,
      validCount: coords.length,
      invalidCount: processedData.invalid.length,
      bounds,
      center: { lat: centerLat, lng: centerLng },
      spread: { 
        lat: bounds.maxLat - bounds.minLat, 
        lng: bounds.maxLng - bounds.minLng 
      },
      maxDistanceKm: Math.max(...distances),
      averageDistanceKm: distances.reduce((s, v) => s + v, 0) / distances.length,
      medianDistanceKm: sortedDistances[Math.floor(sortedDistances.length / 2)],
      outliers,
      density,
      convexHullArea: area
    };
  }, [processedData]);
  
  // Enhanced clustering
  const clusters = useMemo<Cluster[]>(() => {
    if (!metrics || mapType !== 'clusters' || !processedData.valid.length) return [];
    return performClustering(processedData.valid, clusterDistance);
  }, [metrics, processedData.valid, mapType, clusterDistance]);
  
  // Color and size scaling with better algorithms
  const { getColor, getSizeMeters, legends } = useMemo(() => {
    const validCoords = processedData.valid;
    
    const colorValues = colorField !== 'none' 
      ? validCoords.map(c => parseCoordinate(getRowValue(c.row, colorField))).filter(Number.isFinite)
      : [];
    
    const sizeValues = sizeField !== 'none' 
      ? validCoords.map(c => parseCoordinate(getRowValue(c.row, sizeField))).filter(Number.isFinite)
      : [];
    
    const colorQuartiles = colorValues.length 
      ? quantiles(colorValues, [0, 0.25, 0.5, 0.75, 1]) 
      : [];
    
    const sizeQuartiles = sizeValues.length 
      ? quantiles(sizeValues, [0, 0.25, 0.5, 0.75, 1]) 
      : [];
    
    const getColor = (value: unknown): string => {
      if (colorField === 'none') return '#3b82f6';
      
      const num = parseCoordinate(value);
      if (!Number.isFinite(num) || !colorQuartiles.length) return '#3b82f6';
      
      const [min, , , , max] = colorQuartiles;
      const normalized = min === max ? 0.5 : (num - min) / (max - min);
      const clamped = Math.max(0, Math.min(1, normalized));
      
      // Use a better color scale (viridis-inspired)
      if (clamped < 0.25) return `hsl(240, 70%, ${30 + clamped * 40}%)`;
      if (clamped < 0.5) return `hsl(180, 70%, ${40 + (clamped - 0.25) * 40}%)`;
      if (clamped < 0.75) return `hsl(120, 70%, ${50 + (clamped - 0.5) * 30}%)`;
      return `hsl(60, 70%, ${60 + (clamped - 0.75) * 30}%)`;
    };
    
    const getSizeMeters = (value: unknown): number => {
      if (sizeField === 'none') return 100;
      
      const num = parseCoordinate(value);
      if (!Number.isFinite(num) || !sizeQuartiles.length) return 100;
      
      const [min, , , , max] = sizeQuartiles;
      const normalized = min === max ? 0.5 : (num - min) / (max - min);
      const clamped = Math.max(0, Math.min(1, normalized));
      
      return 50 + clamped * 200; // 50m to 250m
    };
    
    return {
      getColor,
      getSizeMeters,
      legends: {
        color: colorField === 'none' ? null : {
          label: colorField,
          min: colorQuartiles[0],
          q1: colorQuartiles[1],
          median: colorQuartiles[2],
          q3: colorQuartiles[3],
          max: colorQuartiles[4]
        },
        size: sizeField === 'none' ? null : {
          label: sizeField,
          min: sizeQuartiles[0],
          q1: sizeQuartiles[1],
          median: sizeQuartiles[2],
          q3: sizeQuartiles[3],
          max: sizeQuartiles[4]
        }
      }
    };
  }, [processedData.valid, colorField, sizeField]);
  
  // Update map key for re-rendering
  useEffect(() => {
    setMapKey(`${latField}-${lngField}-${mapType}-${Date.now()}`);
  }, [latField, lngField, mapType]);
  
  // Auto-fit to data bounds
  const fitToData = useCallback(() => {
    if (!mapRef.current || !metrics) return;
    
    try {
      const padding = 0.1;
      const bounds = new LatLngBounds(
        [metrics.bounds.minLat - padding, metrics.bounds.minLng - padding],
        [metrics.bounds.maxLat + padding, metrics.bounds.maxLng + padding]
      );
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    } catch (err) {
      console.warn('Failed to fit bounds:', err);
    }
  }, [metrics]);
  
  // Enhanced export functions
  const exportEnhancedJSON = () => {
    if (!metrics) return;
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '2.0',
        fields: { latField, lngField, colorField, sizeField }
      },
      metrics,
      clusters: mapType === 'clusters' ? clusters : [],
      coordinates: processedData.valid,
      configuration: {
        mapType,
        radius,
        clusterDistance,
        filters,
        maxPoints
      },
      statistics: {
        totalRows: data.rows.length,
        validCoordinates: processedData.valid.length,
        invalidCoordinates: processedData.invalid.length,
        processingErrors: processedData.errors.length
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spatial-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const exportGeoJSON = () => {
    if (!processedData.valid.length) return;
    
    const features = processedData.valid.map(coord => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [coord.lng, coord.lat]
      },
      properties: {
        id: coord.id,
        isOutlier: coord.isOutlier,
        clusterIndex: coord.clusterIndex,
        ...coord.row
      }
    }));
    
    const geoJSON = {
      type: 'FeatureCollection',
      features
    };
    
    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spatial-data-${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Tile layer options
  const tileLayerOptions = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
    }
  };
  
  // Component render
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 p-4">
        {/* Left sidebar - Controls */}
        <div className="xl:col-span-1 space-y-4">
          {/* Field Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5" />
                Field Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Latitude Field *</label>
                <Select value={latField} onValueChange={setLatField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select latitude field" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.fields.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        <div className="flex items-center gap-2">
                          {f.name}
                          {f.name.toLowerCase().includes('lat') && (
                            <Badge variant="secondary" className="text-xs">Auto-detected</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Longitude Field *</label>
                <Select value={lngField} onValueChange={setLngField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select longitude field" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.fields.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        <div className="flex items-center gap-2">
                          {f.name}
                          {(f.name.toLowerCase().includes('lng') || f.name.toLowerCase().includes('lon')) && (
                            <Badge variant="secondary" className="text-xs">Auto-detected</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Color By</label>
                <Select value={colorField} onValueChange={setColorField}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {data.fields.map((f) => (
                      <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Size By</label>
                <Select value={sizeField} onValueChange={setSizeField}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {data.fields.map((f) => (
                      <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Visualization Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="w-5 h-5" />
                Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={mapType} onValueChange={(v) => setMapType(v as any)} className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="points" className="flex items-center gap-1 text-xs">
                    <MapPin className="w-3 h-3" /> Points
                  </TabsTrigger>
                  <TabsTrigger value="heatmap" className="flex items-center gap-1 text-xs">
                    <Activity className="w-3 h-3" /> Heat
                  </TabsTrigger>
                </TabsList>
                <TabsList className="grid grid-cols-2 w-full mt-2">
                  <TabsTrigger value="clusters" className="flex items-center gap-1 text-xs">
                    <Compass className="w-3 h-3" /> Clusters
                  </TabsTrigger>
                  <TabsTrigger value="density" className="flex items-center gap-1 text-xs">
                    <Grid className="w-3 h-3" /> Density
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {mapType === 'heatmap' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Heat Radius: {radius}m
                  </label>
                  <Slider 
                    value={[radius]} 
                    onValueChange={([val]) => setRadius(val)} 
                    min={100} 
                    max={2000} 
                    step={50} 
                    className="w-full" 
                  />
                </div>
              )}
              
              {mapType === 'clusters' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cluster Distance: {clusterDistance}m
                  </label>
                  <Slider 
                    value={[clusterDistance]} 
                    onValueChange={([val]) => setClusterDistance(val)} 
                    min={50} 
                    max={1000} 
                    step={25} 
                    className="w-full" 
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">Map Style</label>
                <Select value={selectedTileLayer} onValueChange={setSelectedTileLayer}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="osm">Street Map</SelectItem>
                    <SelectItem value="satellite">Satellite</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Filters and Display Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="w-5 h-5" />
                Filters & Display
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Show Outliers</label>
                  <Switch 
                    checked={filters.showOutliers} 
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, showOutliers: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Show Center Point</label>
                  <Switch 
                    checked={filters.showCenter} 
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, showCenter: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Show Bounds</label>
                  <Switch 
                    checked={filters.showBounds} 
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, showBounds: checked }))}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Search Data</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search coordinates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Advanced
                </Button>
                <Button variant="outline" size="sm" onClick={fitToData} disabled={!metrics}>
                  <Target className="w-4 h-4 mr-1" />
                  Fit View
                </Button>
              </div>
              
              {showAdvanced && (
                <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Max Points: {maxPoints.toLocaleString()}
                    </label>
                    <Slider 
                      value={[maxPoints]} 
                      onValueChange={([val]) => setMaxPoints(val)} 
                      min={100} 
                      max={50000} 
                      step={100} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Auto Refresh</label>
                    <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Metrics Display */}
          {metrics && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ruler className="w-5 h-5" />
                  Spatial Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-blue-600">Valid Points</div>
                        <div className="font-bold text-blue-800">{metrics.validCount.toLocaleString()}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Successfully processed coordinates</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-xs text-green-600">Coverage</div>
                        <div className="font-bold text-green-800">{metrics.maxDistanceKm.toFixed(0)} km</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximum distance from center point</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-xs text-orange-600">Outliers</div>
                        <div className="font-bold text-orange-800">{metrics.outliers.length}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Points significantly distant from center</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-xs text-purple-600">Density</div>
                        <div className="font-bold text-purple-800">{metrics.density.toFixed(1)}/km²</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Points per square kilometer</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {metrics.invalidCount > 0 && (
                  <Alert className="mt-3">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {metrics.invalidCount} invalid coordinates were excluded from analysis.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Color and Size Legends */}
                {(legends.color || legends.size) && (
                  <div className="mt-4 space-y-3 p-3 border rounded-lg bg-gray-50">
                    <div className="text-sm font-medium text-gray-700">Legends</div>
                    
                    {legends.color && (
                      <div className="text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="font-medium">{legends.color.label}</span>
                        </div>
                        <div className="text-gray-600 text-[10px]">
                          Min: {legends.color.min?.toFixed?.(2)} | 
                          Median: {legends.color.median?.toFixed?.(2)} | 
                          Max: {legends.color.max?.toFixed?.(2)}
                        </div>
                      </div>
                    )}
                    
                    {legends.size && (
                      <div className="text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full border border-gray-400"></div>
                          <span className="font-medium">{legends.size.label}</span>
                        </div>
                        <div className="text-gray-600 text-[10px]">
                          Min: {legends.size.min?.toFixed?.(2)} | 
                          Median: {legends.size.median?.toFixed?.(2)} | 
                          Max: {legends.size.max?.toFixed?.(2)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {mapType === 'clusters' && clusters.length > 0 && (
                  <div className="mt-4 p-3 border rounded-lg bg-gray-50">
                    <div className="text-sm font-medium text-gray-700 mb-2">Cluster Summary</div>
                    <div className="text-xs text-gray-600">
                      <div>Total Clusters: {clusters.length}</div>
                      <div>Avg Size: {(clusters.reduce((s, c) => s + c.coordinates.length, 0) / clusters.length).toFixed(1)} points</div>
                      <div>Largest: {Math.max(...clusters.map(c => c.coordinates.length))} points</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Export Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="w-5 h-5" />
                Export Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={exportEnhancedJSON} disabled={!metrics}>
                  <Download className="w-4 h-4 mr-1" />
                  JSON
                </Button>
                <Button variant="outline" size="sm" onClick={exportGeoJSON} disabled={!processedData.valid.length}>
                  <Download className="w-4 h-4 mr-1" />
                  GeoJSON
                </Button>
              </div>
              {mapType === 'clusters' && clusters.length > 0 && (
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => {
                  const csvContent = [
                    ['cluster_id', 'size', 'center_lat', 'center_lng', 'radius_m'].join(','),
                    ...clusters.map((c, i) => [
                      i + 1,
                      c.coordinates.length,
                      c.center.lat.toFixed(6),
                      c.center.lng.toFixed(6),
                      c.radius.toFixed(0)
                    ].join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'spatial-clusters.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  <Download className="w-4 h-4 mr-1" />
                  Clusters CSV
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Main map area */}
        <div className="xl:col-span-3">
          <Card className="h-full">
            <CardContent className="p-0 h-[800px] relative">
              {error && (
                <Alert className="absolute top-4 left-4 right-4 z-10">
                  <Info className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>Processing coordinates...</span>
                  </div>
                </div>
              )}
              
              {!latField || !lngField ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <Globe className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Configure Geographic Fields</h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    Select latitude and longitude fields from your dataset to begin spatial analysis. 
                    The system will automatically detect common field naming patterns.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-700 mb-2">Available Fields:</div>
                      <div className="space-y-1">
                        {data.fields.slice(0, 8).map((f) => (
                          <div key={f.name} className="text-sm text-gray-600 flex items-center gap-2">
                            {f.name.toLowerCase().includes('lat') || f.name.toLowerCase().includes('lng') || 
                             f.name.toLowerCase().includes('lon') ? (
                              <Badge variant="secondary" className="text-xs">Geo</Badge>
                            ) : null}
                            {f.name}
                          </div>
                        ))}
                        {data.fields.length > 8 && (
                          <div className="text-xs text-gray-400">...and {data.fields.length - 8} more</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-700 mb-2">Requirements:</div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>• Latitude: -90 to 90</div>
                        <div>• Longitude: -180 to 180</div>
                        <div>• Numeric values</div>
                        <div>• Non-zero coordinates</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !metrics ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No Valid Coordinates Found</h3>
                  <p className="text-gray-500 max-w-md mb-4">
                    The selected fields don't contain valid geographic coordinates. 
                    Please check that your data contains proper latitude and longitude values.
                  </p>
                  
                  {processedData.invalid.length > 0 && (
                    <Alert className="max-w-md">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Found {processedData.invalid.length} invalid coordinates out of {data.rows.length} total rows.
                        Common issues: null values, out of range, or non-numeric data.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Suspense fallback={
                  <div className="h-full flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span>Loading interactive map...</span>
                    </div>
                  </div>
                }>
                  <MapContainer
                    key={mapKey}
                    center={[metrics.center.lat, metrics.center.lng]}
                    zoom={6}
                    scrollWheelZoom={true}
                    className="h-full w-full rounded-b-lg"
                    whenCreated={(map: Map) => {
                      if (mapRef.current) {
                        mapRef.current.remove();
                      }
                      mapRef.current = map;
                      setTimeout(() => fitToData(), 100);
                    }}
                  >
                    <TileLayer
                      url={tileLayerOptions[selectedTileLayer as keyof typeof tileLayerOptions].url}
                      attribution={tileLayerOptions[selectedTileLayer as keyof typeof tileLayerOptions].attribution}
                    />
                    
                    {/* Render different visualization types */}
                    {mapType === 'points' &&
                      processedData.valid
                        .filter(coord => filters.showOutliers || !coord.isOutlier)
                        .map((coord) => {
                          const sizeM = getSizeMeters(getRowValue(coord.row, sizeField));
                          const color = coord.isOutlier ? '#ff4444' : getColor(getRowValue(coord.row, colorField));
                          
                          return (
                            <Circle
                              key={coord.id}
                              center={[coord.lat, coord.lng]}
                              radius={sizeM}
                              fillColor={color}
                              color={coord.isOutlier ? '#ff0000' : 'white'}
                              fillOpacity={0.7}
                              weight={coord.isOutlier ? 3 : 1}
                            >
                              <Popup>
                                <div className="text-sm max-w-xs">
                                  <div className="font-bold mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Coordinates
                                    {coord.isOutlier && <Badge variant="destructive">Outlier</Badge>}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div>
                                      <div className="text-xs text-gray-600">Latitude</div>
                                      <div className="font-mono">{coord.lat.toFixed(6)}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-600">Longitude</div>
                                      <div className="font-mono">{coord.lng.toFixed(6)}</div>
                                    </div>
                                  </div>
                                  
                                  {colorField !== 'none' && (
                                    <div className="mb-2">
                                      <div className="text-xs text-gray-600">{colorField}</div>
                                      <div>{String(getRowValue(coord.row, colorField))}</div>
                                    </div>
                                  )}
                                  
                                  {sizeField !== 'none' && (
                                    <div className="mb-2">
                                      <div className="text-xs text-gray-600">{sizeField}</div>
                                      <div>{String(getRowValue(coord.row, sizeField))}</div>
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-gray-500 pt-2 border-t">
                                    Distance from center: {haversineKm(metrics.center.lat, metrics.center.lng, coord.lat, coord.lng).toFixed(2)} km
                                  </div>
                                </div>
                              </Popup>
                            </Circle>
                          );
                        })}
                    
                    {mapType === 'heatmap' &&
                      processedData.valid.map((coord) => (
                        <Circle
                          key={coord.id}
                          center={[coord.lat, coord.lng]}
                          radius={radius}
                          fillColor="red"
                          color="red"
                          fillOpacity={0.15}
                          weight={0}
                        />
                      ))}
                    
                    {mapType === 'clusters' &&
                      clusters.map((cluster, clusterIdx) => (
                        <div key={cluster.id}>
                          <Circle
                            center={[cluster.center.lat, cluster.center.lng]}
                            radius={cluster.radius}
                            fillColor={cluster.color}
                            color="white"
                            fillOpacity={0.6}
                            weight={3}
                          >
                            <Popup>
                              <div className="text-sm">
                                <div className="font-bold mb-2 flex items-center gap-2">
                                  <Compass className="w-4 h-4" />
                                  Cluster {clusterIdx + 1}
                                </div>
                                <div className="space-y-1">
                                  <div>Points: <strong>{cluster.coordinates.length}</strong></div>
                                  <div>Center: <span className="font-mono text-xs">{cluster.center.lat.toFixed(4)}, {cluster.center.lng.toFixed(4)}</span></div>
                                  <div>Radius: <strong>{cluster.radius.toFixed(0)}m</strong></div>
                                </div>
                              </div>
                            </Popup>
                          </Circle>
                          
                          {cluster.coordinates.map((point, pointIdx) => (
                            <Circle
                              key={`${cluster.id}-${pointIdx}`}
                              center={[point.lat, point.lng]}
                              radius={30}
                              fillColor={cluster.color}
                              color="white"
                              fillOpacity={0.8}
                              weight={1}
                            />
                          ))}
                        </div>
                      ))}
                    
                    {mapType === 'density' &&
                      processedData.valid.map((coord) => {
                        const localDensity = processedData.valid.filter(c => 
                          haversineKm(coord.lat, coord.lng, c.lat, c.lng) <= 1
                        ).length;
                        
                        const opacity = Math.min(1, localDensity / 10);
                        const size = Math.max(50, Math.min(200, localDensity * 20));
                        
                        return (
                          <Circle
                            key={coord.id}
                            center={[coord.lat, coord.lng]}
                            radius={size}
                            fillColor={`hsl(${240 - opacity * 240}, 70%, 50%)`}
                            color="transparent"
                            fillOpacity={opacity * 0.5}
                            weight={0}
                          />
                        );
                      })}
                    
                    {/* Center point marker */}
                    {filters.showCenter && (
                      <Circle
                        center={[metrics.center.lat, metrics.center.lng]}
                        radius={150}
                        fillColor="red"
                        color="white"
                        fillOpacity={1}
                        weight={3}
                      >
                        <Popup>
                          <div className="text-sm">
                            <div className="font-bold mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Geographic Center
                            </div>
                            <div className="space-y-1 font-mono text-xs">
                              <div>Lat: {metrics.center.lat.toFixed(6)}</div>
                              <div>Lng: {metrics.center.lng.toFixed(6)}</div>
                            </div>
                          </div>
                        </Popup>
                      </Circle>
                    )}
                    
                    {/* Bounds rectangle */}
                    {filters.showBounds && (
                      <Polygon
                        positions={[
                          [metrics.bounds.minLat, metrics.bounds.minLng],
                          [metrics.bounds.minLat, metrics.bounds.maxLng],
                          [metrics.bounds.maxLat, metrics.bounds.maxLng],
                          [metrics.bounds.maxLat, metrics.bounds.minLng]
                        ]}
                        fillColor="transparent"
                        color="blue"
                        weight={2}
                        dashArray="5, 5"
                      >
                        <Popup>
                          <div className="text-sm">
                            <div className="font-bold mb-2">Data Bounds</div>
                            <div className="space-y-1 text-xs">
                              <div>Lat Range: {(metrics.bounds.maxLat - metrics.bounds.minLat).toFixed(4)}°</div>
                              <div>Lng Range: {(metrics.bounds.maxLng - metrics.bounds.minLng).toFixed(4)}°</div>
                              <div>Area: ~{metrics.convexHullArea?.toFixed(0)} km²</div>
                            </div>
                          </div>
                        </Popup>
                      </Polygon>
                    )}
                  </MapContainer>
                </Suspense>
              )}
              
              {/* Map controls overlay */}
              {latField && lngField && metrics && (
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (mapRef.current) {
                          mapRef.current.flyTo([metrics.center.lat, metrics.center.lng], 8);
                        }
                      }}
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      <Target className="w-4 h-4 mr-1" />
                      Center
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={fitToData}
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      <Maximize2 className="w-4 h-4 mr-1" />
                      Fit All
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => mapRef.current?.zoomIn()}
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => mapRef.current?.zoomOut()}
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Status indicator */}
              {metrics && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">
                        {processedData.valid.length.toLocaleString()} points
                      </span>
                    </div>
                    {searchTerm && (
                      <div className="text-gray-600 mt-1">
                        Filtered by: "{searchTerm}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Export the component
export const SpatialAnalysis = {
  render: (props: SpatialAnalysisProps) => <SpatialAnalysisPanel {...props} />
};

// Additional utility functions for external use
export const spatialUtils = {
  haversineDistance: haversineKm,
  validateCoordinates: (lat: number, lng: number) => {
    return (
      Number.isFinite(lat) && 
      Number.isFinite(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !(lat === 0 && lng === 0)
    );
  },
  calculateBounds: (coordinates: Coordinate[]) => {
    if (!coordinates.length) return null;
    
    const lats = coordinates.map(c => c.lat);
    const lngs = coordinates.map(c => c.lng);
    
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      center: {
        lat: lats.reduce((s, v) => s + v, 0) / lats.length,
        lng: lngs.reduce((s, v) => s + v, 0) / lngs.length
      }
    };
  },
  detectOutliers: (coordinates: Coordinate[], method: 'iqr' | 'zscore' = 'iqr') => {
    if (coordinates.length < 4) return [];
    
    const center = spatialUtils.calculateBounds(coordinates)?.center;
    if (!center) return [];
    
    const distances = coordinates.map(c => haversineKm(center.lat, center.lng, c.lat, c.lng));
    
    if (method === 'iqr') {
      const sorted = [...distances].sort((a, b) => a - b);
      const [q1, q3] = quantiles(sorted, [0.25, 0.75]);
      const iqr = q3 - q1;
      const threshold = q3 + 1.5 * iqr;
      
      return coordinates.filter((_, i) => distances[i] > threshold);
    } else {
      // Z-score method
      const mean = distances.reduce((s, v) => s + v, 0) / distances.length;
      const std = Math.sqrt(distances.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / distances.length);
      const threshold = 2; // 2 standard deviations
      
      return coordinates.filter((_, i) => Math.abs((distances[i] - mean) / std) > threshold);
    }
  }
};

// Performance monitoring hook
export const useSpatialPerformance = () => {
  const [metrics, setMetrics] = useState({
    processingTime: 0,
    renderTime: 0,
    memoryUsage: 0
  });
  
  const startTimer = useCallback(() => {
    return performance.now();
  }, []);
  
  const endTimer = useCallback((startTime: number, operation: 'processing' | 'render') => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setMetrics(prev => ({
      ...prev,
      [operation + 'Time']: duration
    }));
    
    return duration;
  }, []);
  
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
      }));
    }
  }, []);
  
  return { metrics, startTimer, endTimer, measureMemory };
};

// Data validation and cleaning utilities
export const dataValidationUtils = {
  cleanCoordinateData: (data: any[], latField: string, lngField: string) => {
    const cleaned = [];
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const lat = parseCoordinate(row[latField]);
        const lng = parseCoordinate(row[lngField]);
        
        if (spatialUtils.validateCoordinates(lat, lng)) {
          cleaned.push({
            ...row,
            [latField]: lat,
            [lngField]: lng,
            _originalIndex: i
          });
        } else {
          errors.push({
            index: i,
            error: 'Invalid coordinates',
            lat,
            lng
          });
        }
      } catch (err) {
        errors.push({
          index: i,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
    
    return { cleaned, errors };
  },
  
  suggestFields: (fields: DataField[]) => {
    const suggestions = {
      latitude: null as string | null,
      longitude: null as string | null,
      confidence: 0
    };
    
    const latPatterns = ['lat', 'latitude', 'y', 'geo_lat', 'coord_y'];
    const lngPatterns = ['lng', 'lon', 'long', 'longitude', 'x', 'geo_lng', 'coord_x'];
    
    for (const field of fields) {
      const name = field.name.toLowerCase();
      
      for (let i = 0; i < latPatterns.length; i++) {
        if (name.includes(latPatterns[i])) {
          suggestions.latitude = field.name;
          suggestions.confidence = Math.max(suggestions.confidence, (latPatterns.length - i) / latPatterns.length);
          break;
        }
      }
      
      for (let i = 0; i < lngPatterns.length; i++) {
        if (name.includes(lngPatterns[i])) {
          suggestions.longitude = field.name;
          suggestions.confidence = Math.max(suggestions.confidence, (lngPatterns.length - i) / lngPatterns.length);
          break;
        }
      }
    }
    
    return suggestions;
  }
};

// Advanced clustering algorithms
export const clusteringAlgorithms = {
  dbscan: (coordinates: Coordinate[], epsilon: number, minPoints: number = 3) => {
    const clusters: Cluster[] = [];
    const visited = new Set<string>();
    const noise: Coordinate[] = [];
    
    const getNeighbors = (point: Coordinate) => {
      return coordinates.filter(p => 
        p.id !== point.id && 
        haversineKm(point.lat, point.lng, p.lat, p.lng) * 1000 <= epsilon
      );
    };
    
    for (const point of coordinates) {
      if (visited.has(point.id)) continue;
      
      const neighbors = getNeighbors(point);
      
      if (neighbors.length < minPoints) {
        noise.push(point);
        continue;
      }
      
      const cluster: Coordinate[] = [point];
      visited.add(point.id);
      
      const queue = [...neighbors];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        
        if (!visited.has(current.id)) {
          visited.add(current.id);
          cluster.push(current);
          
          const currentNeighbors = getNeighbors(current);
          if (currentNeighbors.length >= minPoints) {
            queue.push(...currentNeighbors.filter(n => !visited.has(n.id)));
          }
        }
      }
      
      const centerLat = cluster.reduce((s, p) => s + p.lat, 0) / cluster.length;
      const centerLng = cluster.reduce((s, p) => s + p.lng, 0) / cluster.length;
      const maxRadius = Math.max(...cluster.map(p => haversineKm(centerLat, centerLng, p.lat, p.lng) * 1000));
      
      clusters.push({
        id: `cluster-${clusters.length}`,
        coordinates: cluster,
        center: { lat: centerLat, lng: centerLng },
        radius: Math.max(100, maxRadius),
        color: `hsl(${(clusters.length * 137.5) % 360}, 70%, 50%)`
      });
    }
    
    return { clusters, noise };
  },
  
  kmeans: (coordinates: Coordinate[], k: number, maxIterations: number = 100) => {
    if (coordinates.length < k) return [];
    
    // Initialize centroids randomly
    const centroids = coordinates.slice(0, k).map((coord, i) => ({
      lat: coord.lat,
      lng: coord.lng,
      id: `centroid-${i}`
    }));
    
    let iterations = 0;
    let converged = false;
    
    while (!converged && iterations < maxIterations) {
      const clusters: Coordinate[][] = Array(k).fill(null).map(() => []);
      
      // Assign points to nearest centroid
      for (const point of coordinates) {
        let minDistance = Infinity;
        let nearestCluster = 0;
        
        for (let i = 0; i < centroids.length; i++) {
          const distance = haversineKm(point.lat, point.lng, centroids[i].lat, centroids[i].lng);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = i;
          }
        }
        
        clusters[nearestCluster].push(point);
      }
      
      // Update centroids
      converged = true;
      for (let i = 0; i < centroids.length; i++) {
        if (clusters[i].length > 0) {
          const newLat = clusters[i].reduce((s, p) => s + p.lat, 0) / clusters[i].length;
          const newLng = clusters[i].reduce((s, p) => s + p.lng, 0) / clusters[i].length;
          
          if (Math.abs(newLat - centroids[i].lat) > 0.0001 || Math.abs(newLng - centroids[i].lng) > 0.0001) {
            converged = false;
          }
          
          centroids[i].lat = newLat;
          centroids[i].lng = newLng;
        }
      }
      
      iterations++;
    }
    
    // Convert to Cluster format
    return centroids.map((centroid, i) => {
      const clusterCoords = coordinates.filter(coord => {
        let minDistance = Infinity;
        let nearestCluster = 0;
        
        for (let j = 0; j < centroids.length; j++) {
          const distance = haversineKm(coord.lat, coord.lng, centroids[j].lat, centroids[j].lng);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = j;
          }
        }
        
        return nearestCluster === i;
      });
      
      const maxRadius = clusterCoords.length > 0 
        ? Math.max(...clusterCoords.map(p => haversineKm(centroid.lat, centroid.lng, p.lat, p.lng) * 1000))
        : 100;
      
      return {
        id: `kmeans-cluster-${i}`,
        coordinates: clusterCoords,
        center: { lat: centroid.lat, lng: centroid.lng },
        radius: Math.max(100, maxRadius),
        color: `hsl(${(i * 137.5) % 360}, 70%, 50%)`
      };
    }).filter(cluster => cluster.coordinates.length > 0);
  }
};

export default SpatialAnalysisPanel;