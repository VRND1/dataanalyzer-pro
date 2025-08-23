import React from 'react';
import { Bell, AlertTriangle, TrendingDown, Target, X } from 'lucide-react';
import { DataField } from '@/types/data';
import { calculateFieldStats } from '@/utils/analysis/statistics/calculations';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  read?: boolean;
}

interface AlertSystemProps {
  data: {
    fields: DataField[];
  };
  thresholds?: Record<string, number>;
  isVisible?: boolean;
  onClose?: () => void;
}

export function AlertSystem({ data, thresholds = {}, isVisible = false, onClose }: AlertSystemProps) {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (isInitialized || !data.fields.length || isProcessing) return;
    setIsProcessing(true);
    setIsInitialized(true);

    const newAlerts: Alert[] = [];
    const numericFields = data.fields.filter(f => f.type === 'number');

    for (const field of numericFields) {
      const values = Array.isArray(field.value) ? field.value : [field.value];
      const numericValues = values.filter(v => typeof v === 'number');
      if (numericValues.length === 0) continue;
      
      const currentValue = numericValues[numericValues.length - 1];
      const stats = calculateFieldStats(field);

      // Check for threshold violations
      const fieldThreshold = thresholds[field.name] || stats.mean + stats.standardDeviation;
      if (currentValue > fieldThreshold) {
        newAlerts.push({
          id: `${field.name}-${Date.now()}`,
          type: 'critical',
          title: `${field.name} Exceeded Threshold`,
          message: `Current value (${currentValue.toFixed(2)}) exceeds threshold (${fieldThreshold.toFixed(2)})`,
          metric: field.name,
          value: currentValue,
          threshold: fieldThreshold,
          timestamp: new Date()
        });
      } else if (currentValue > stats.mean + stats.standardDeviation * 0.5) {
        newAlerts.push({
          id: `${field.name}-${Date.now()}`,
          type: 'warning',
          title: `${field.name} Approaching Threshold`,
          message: `Current value (${currentValue.toFixed(2)}) is approaching threshold (${fieldThreshold.toFixed(2)})`,
          metric: field.name,
          value: currentValue,
          threshold: fieldThreshold,
          timestamp: new Date()
        });
      }

      // Check for anomalies
      if (Math.abs(currentValue - stats.mean) > 2 * stats.standardDeviation) {
        newAlerts.push({
          id: `${field.name}-anomaly-${Date.now()}`,
          type: 'warning',
          title: `Anomaly Detected in ${field.name}`,
          message: `Current value deviates significantly from the normal range`,
          metric: field.name,
          value: currentValue,
          threshold: stats.mean + (2 * stats.standardDeviation),
          timestamp: new Date()
        });
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev]);
    }
    setIsProcessing(false);
  }, [data.fields, thresholds, isInitialized, isProcessing]);

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // If not visible, don't render anything
  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute right-0 mt-2 w-80 glass-effect rounded-xl shadow-lg py-2 z-50">
      <div className="px-4 py-2 border-b border-white/10 flex justify-between items-center">
        <h3 className="text-sm font-medium text-white">Notifications</h3>
        {onClose && (
          <button 
            className="text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`px-4 py-3 border-b border-white/10 ${
                alert.type === 'critical' ? 'bg-red-500/10' : 
                alert.type === 'warning' ? 'bg-yellow-500/10' : 
                'bg-blue-500/10'
              }`}
            >
              <div className="flex items-start gap-3">
                {alert.type === 'critical' ? (
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                ) : alert.type === 'warning' ? (
                  <TrendingDown className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Target className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-black">{alert.title}</h4>
                  <p className="text-xs text-black mt-1">{alert.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-black">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="flex gap-2">
                      {!alert.read && (
                        <button 
                          onClick={() => markAsRead(alert.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark as read
                        </button>
                      )}
                      <button 
                        onClick={() => dismissAlert(alert.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center">
            <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}