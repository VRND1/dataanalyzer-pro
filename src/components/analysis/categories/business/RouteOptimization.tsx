import { Card } from '@/components/ui/card';
import type { DataField, DataRow } from '@/types/data';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Navigation, Clock, Route, TrendingUp, Database } from 'lucide-react';

// Enhanced Map component with better visualization
const Map = ({ waypoints, optimizedRoute, routeStats }: { 
  waypoints: any[], 
  optimizedRoute: any[],
  routeStats: any 
}) => (
  <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg relative border">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-2" />
        <p className="text-lg font-medium text-gray-800">Interactive Route Map</p>
        <p className="text-sm text-gray-600 mb-2">
          {waypoints.length} waypoints
        </p>
        {optimizedRoute.length > 0 && routeStats && (
          <div className="bg-white/80 rounded-lg p-3 mt-2 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="text-center">
                <Clock className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                <p className="font-medium">{routeStats.totalTime}</p>
                <p className="text-gray-500">Est. Time</p>
              </div>
              <div className="text-center">
                <Route className="w-4 h-4 mx-auto mb-1 text-green-600" />
                <p className="font-medium">{routeStats.totalDistance}</p>
                <p className="text-gray-500">Distance</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    
    {/* Simulated waypoint markers */}
    {waypoints.map((point, index) => (
      <div 
        key={point.id}
        className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"
        style={{
          left: `${20 + (index * 15) % 60}%`,
          top: `${30 + (index * 20) % 40}%`
        }}
        title={point.name}
      />
    ))}
  </div>
);

interface Waypoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  priority?: number;
  timeWindow?: { start: string; end: string };
  originalData: DataRow;
}

interface RouteStats {
  totalDistance: string;
  totalTime: string;
  fuelCost: string;
  co2Savings: string;
  efficiency: number;
}

interface RouteOptimizationProps {
  data: {
    fields: DataField[];
    rows?: DataRow[]; // Assuming rows might be provided for easier access
  };
}

export function RouteOptimization({ data }: RouteOptimizationProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<Waypoint[]>([]);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [optimizationMethod, setOptimizationMethod] = useState('time');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [vehicleType, setVehicleType] = useState('car');
  const [includeReturn, setIncludeReturn] = useState(true);

  useEffect(() => {
    if (data && data.fields && data.fields.length > 0) {
      const { fields } = data;
      
      const findField = (names: string[]) => fields.find(f => names.includes(f.name.toLowerCase()));

      const latField = findField(['lat', 'latitude']);
      const lngField = findField(['lng', 'longitude']);
      const addressField = findField(['address']);
      const nameField = findField(['name', 'label', 'title']);
      const priorityField = findField(['priority']);
      const timeWindowStartField = findField(['timewindowstart', 'tw_start', 'start_time']);
      const timeWindowEndField = findField(['timewindowend', 'tw_end', 'end_time']);

      let newWaypoints: Waypoint[] = [];

      // Check if we have fields to construct waypoints from
      if (latField && lngField) {
        const numWaypoints = latField.value.length;
        for (let i = 0; i < numWaypoints; i++) {
          const originalData: DataRow = {};
          for (const field of fields) {
            originalData[field.name] = field.value[i];
          }

          const waypoint: Waypoint = {
            id: `${Date.now()}-${i}`,
            name: nameField?.value[i] as string || `Waypoint ${i + 1}`,
            address: addressField?.value[i] as string || 'N/A',
            lat: parseFloat(latField.value[i]),
            lng: parseFloat(lngField.value[i]),
            priority: priorityField ? parseInt(priorityField.value[i], 10) : undefined,
            timeWindow: (timeWindowStartField?.value[i] && timeWindowEndField?.value[i]) ? {
              start: timeWindowStartField.value[i],
              end: timeWindowEndField.value[i]
            } : undefined,
            originalData
          };
          newWaypoints.push(waypoint);
        }
      } else if (addressField) {
        // Fallback for geocoding if only address is present
        newWaypoints = addressField.value.map((address, i) => {
          const originalData: DataRow = {};
          for (const field of fields) {
            originalData[field.name] = field.value[i];
          }
          return {
            id: `${Date.now()}-${i}`,
            name: nameField?.value[i] as string || `Waypoint ${i + 1}`,
            address: address as string,
            // Placeholder lat/lng, in a real app you'd geocode this
            lat: 40.7128 + (Math.random() * 0.1 - 0.05),
            lng: -74.0060 + (Math.random() * 0.1 - 0.05),
            priority: priorityField ? parseInt(priorityField.value[i], 10) : undefined,
            timeWindow: (timeWindowStartField?.value[i] && timeWindowEndField?.value[i]) ? {
              start: timeWindowStartField.value[i],
              end: timeWindowEndField.value[i]
            } : undefined,
            originalData
          }});
      }
      
      if (newWaypoints.length > 0) {
        setWaypoints(newWaypoints);
        // Clear previous optimization results
        setOptimizedRoute([]);
        setRouteStats(null);
      } else {
        setWaypoints([]);
        setOptimizedRoute([]);
        setRouteStats(null);
      }
    } else {
      setWaypoints([]);
      setOptimizedRoute([]);
      setRouteStats(null);
    }
  }, [data]);

  // Haversine formula for accurate distance calculation
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate total route distance
  const calculateRouteDistance = (route: Waypoint[]): number => {
    if (route.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += calculateDistance(
        route[i].lat, route[i].lng,
        route[i + 1].lat, route[i + 1].lng
      );
    }
    
    // Add return to start if selected
    if (includeReturn && route.length > 0) {
      totalDistance += calculateDistance(
        route[route.length - 1].lat, route[route.length - 1].lng,
        route[0].lat, route[0].lng
      );
    }
    
    return totalDistance;
  };

  // Nearest Neighbor Algorithm for TSP approximation
  const nearestNeighborTSP = (points: Waypoint[], startIndex: number = 0): Waypoint[] => {
    if (points.length <= 1) return points;
    
    const unvisited = [...points];
    const route = [unvisited.splice(startIndex, 1)[0]];
    
    while (unvisited.length > 0) {
      const current = route[route.length - 1];
      let nearestIndex = 0;
      let shortestDistance = calculateDistance(
        current.lat, current.lng,
        unvisited[0].lat, unvisited[0].lng
      );
      
      for (let i = 1; i < unvisited.length; i++) {
        const distance = calculateDistance(
          current.lat, current.lng,
          unvisited[i].lat, unvisited[i].lng
        );
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestIndex = i;
        }
      }
      
      route.push(unvisited.splice(nearestIndex, 1)[0]);
    }
    
    return route;
  };

  // 2-opt improvement algorithm
  const twoOptImprovement = (route: Waypoint[]): Waypoint[] => {
    if (route.length <= 3) return route;
    
    let improved = true;
    let bestRoute = [...route];
    let bestDistance = calculateRouteDistance(bestRoute);
    
    while (improved) {
      improved = false;
      
      for (let i = 1; i < route.length - 2; i++) {
        for (let j = i + 1; j < route.length; j++) {
          if (j - i === 1) continue; // Skip adjacent
          
          const newRoute = [...bestRoute];
          // Reverse the segment between i and j
          const segment = newRoute.slice(i, j + 1).reverse();
          newRoute.splice(i, j - i + 1, ...segment);
          
          const newDistance = calculateRouteDistance(newRoute);
          if (newDistance < bestDistance) {
            bestRoute = newRoute;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }
    
    return bestRoute;
  };

  // Priority-based sorting
  const prioritySort = (points: Waypoint[]): Waypoint[] => {
    return [...points].sort((a, b) => (a.priority || 999) - (b.priority || 999));
  };

  const optimizeRoute = () => {
    if (waypoints.length < 2) {
      alert('You need at least 2 waypoints to optimize a route');
      return;
    }
    
    setIsOptimizing(true);
    
    // Simulate API processing time
    setTimeout(() => {
      let optimizedOrder: Waypoint[] = [];
      
      switch (optimizationMethod) {
        case 'distance':
          // Use Nearest Neighbor + 2-opt for shortest distance
          optimizedOrder = nearestNeighborTSP(waypoints);
          optimizedOrder = twoOptImprovement(optimizedOrder);
          break;
          
        case 'time':
          // Prioritize by time windows and use nearest neighbor
          const timeOptimized = waypoints.filter(wp => wp.timeWindow);
          const others = waypoints.filter(wp => !wp.timeWindow);
          optimizedOrder = [
            ...timeOptimized.sort((a, b) => a.timeWindow!.start.localeCompare(b.timeWindow!.start)),
            ...nearestNeighborTSP(others)
          ];
          break;
          
        case 'priority':
          optimizedOrder = prioritySort(waypoints);
          break;
          
        case 'balanced':
          // Hybrid approach: priority first, then distance optimization
          const prioritized = prioritySort(waypoints);
          optimizedOrder = twoOptImprovement(prioritized);
          break;
          
        default:
          optimizedOrder = nearestNeighborTSP(waypoints);
      }
      
      const totalDistance = calculateRouteDistance(optimizedOrder);
      const originalDistance = calculateRouteDistance(waypoints);
      const efficiency = originalDistance > 0 ? ((originalDistance - totalDistance) / originalDistance * 100) : 0;
      
      // Calculate realistic stats
      const avgSpeed = vehicleType === 'truck' ? 60 : vehicleType === 'van' ? 70 : 80; // km/h
      const totalTime = totalDistance / avgSpeed;
      const fuelEfficiency = vehicleType === 'truck' ? 8 : vehicleType === 'van' ? 12 : 15; // km/L
      const fuelNeeded = totalDistance / fuelEfficiency;
      const fuelPrice = 1.5; // per liter
      const co2PerLiter = 2.3; // kg CO2 per liter
      
      setOptimizedRoute(optimizedOrder);
      setRouteStats({
        totalDistance: `${totalDistance.toFixed(1)} km`,
        totalTime: `${Math.floor(totalTime)}h ${Math.round((totalTime % 1) * 60)}m`,
        fuelCost: `$${(fuelNeeded * fuelPrice).toFixed(2)}`,
        co2Savings: efficiency > 0 ? `${(efficiency * totalDistance * co2PerLiter / 100).toFixed(1)} kg` : '0 kg',
        efficiency: Math.max(0, efficiency)
      });
      
      setIsOptimizing(false);
    }, 2000);
  };

  const clearRoute = () => {
    setOptimizedRoute([]);
    setRouteStats(null);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Navigation className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Advanced Route Optimization</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Map waypoints={waypoints} optimizedRoute={optimizedRoute} routeStats={routeStats} />
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="optimizationMethod" className="text-gray-700">Optimization Strategy</Label>
              <Select value={optimizationMethod} onValueChange={setOptimizationMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Shortest Distance (TSP)</SelectItem>
                  <SelectItem value="time">Time Windows Priority</SelectItem>
                  <SelectItem value="priority">Priority Based</SelectItem>
                  <SelectItem value="balanced">Balanced Optimization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="vehicleType" className="text-gray-700">Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end space-x-2">
              <Button 
                onClick={optimizeRoute} 
                disabled={isOptimizing || waypoints.length < 2}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
              </Button>
              <Button 
                variant="outline" 
                onClick={clearRoute}
                disabled={optimizedRoute.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>
          
          <div className="mt-3 flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={includeReturn}
                onChange={(e) => setIncludeReturn(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-700">Include return to start</span>
            </label>
          </div>
        </div>
        
        <div>
          <div className="border rounded-lg divide-y">
            <h4 className="p-3 font-medium text-gray-900 bg-gray-50 flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-600" />
              Input Data Fields ({data.fields?.length || 0})
            </h4>
            {(!data.fields || data.fields.length === 0) ? (
              <p className="p-3 text-sm text-gray-500">No data fields loaded.</p>
            ) : (
              <ul className="max-h-96 overflow-y-auto">
                {data.fields.map((field) => (
                  <li key={field.name} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{field.name}</p>
                      <p className="text-sm text-gray-500 capitalize">Type: {field.type}</p>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{field.value.length} rows</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {optimizedRoute.length > 0 && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Route className="w-4 h-4" />
              Optimized Route Order
            </h4>
            <ol className="space-y-3">
              {optimizedRoute.map((point, index) => (
                <li key={point.id} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 w-6 h-6 bg-blue-600 text-white rounded-full text-sm flex items-center justify-center font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-grow overflow-hidden">
                      <p className="font-medium text-gray-900 truncate" title={point.name}>{point.name}</p>
                      <p className="text-sm text-gray-500 truncate" title={point.address}>{point.address}</p>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          {Object.entries(point.originalData).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-semibold text-gray-600 w-24 flex-shrink-0 truncate" title={key}>{key}:</span>
                              <span className="text-gray-800 truncate" title={String(value)}>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          
          {routeStats && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Route Analytics
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Distance</p>
                  <p className="text-lg font-bold text-blue-900">{routeStats.totalDistance}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Est. Time</p>
                  <p className="text-lg font-bold text-green-900">{routeStats.totalTime}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">Fuel Cost</p>
                  <p className="text-lg font-bold text-yellow-900">{routeStats.fuelCost}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">CO₂ Savings</p>
                  <p className="text-lg font-bold text-purple-900">{routeStats.co2Savings}</p>
                </div>
              </div>
              {routeStats.efficiency > 0 && (
                <div className="mt-3 p-3 bg-green-100 rounded-lg">
                  <p className="text-sm text-green-700">
                    Route optimization improved efficiency by <span className="font-bold">{routeStats.efficiency.toFixed(1)}%</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm text-gray-600">
          Analyzing {data.fields.length} data fields with advanced algorithms including TSP optimization, 2-opt improvement, and priority-based routing.
        </p>
      </div>
    </Card>
  );
} 