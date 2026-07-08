import React, { useEffect, useState } from 'react';
import { Cpu, Check, ArrowRight, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';

export const AIInsights: React.FC = () => {
  const token = useFleetStore((state) => state.token);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appliedRoutes, setAppliedRoutes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8000/api/insights', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setInsights(data);
        }
      } catch (err) {
        console.error('Error loading AI insights:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [token]);

  const handleApplyRoute = (vehicleNum: string) => {
    setAppliedRoutes(prev => ({ ...prev, [vehicleNum]: true }));
  };

  if (loading || !insights) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-fp-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-500 font-medium text-sm">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-stone-200 flex items-center gap-2 select-none">
            <Sparkles className="w-6 h-6 text-fp-accent" />
            AI Insights
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Predictive delay models and route optimization suggestions
          </p>
        </div>
        
        <div className="text-right text-[10px] text-stone-500 font-medium select-none">
          <p>Model: <span className="text-stone-300">{insights.model_version}</span></p>
          <p>Last run: <span className="text-stone-300">{new Date(insights.last_inference).toLocaleTimeString()}</span></p>
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-lg bg-fp-surface border border-fp-border space-y-2 text-xs leading-relaxed text-stone-500">
        <div className="flex items-center gap-2 text-fp-info font-medium">
          <Cpu className="w-4 h-4" />
          About this feature
        </div>
        <p>
          This screen interfaces with a simulated telemetry forecasting model. In production, it connects to a Python ML pipeline running XGBoost or LSTM models trained on historical dispatches, consuming velocity, weather, and geofence data to forecast ETA deviations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Delay Predictions */}
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-2 select-none">
            <ShieldAlert className="w-4 h-4 text-fp-warning" />
            Delay Predictions
          </h3>

          <div className="space-y-4">
            {insights.predictions.map((pred: any, idx: number) => {
              const isDelayed = pred.prediction.toLowerCase().includes('delay') || pred.prediction.toLowerCase().includes('refuel');
              return (
                <div key={idx} className="cyber-card p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-stone-500 font-medium select-none">Shipment</span>
                      <p className="font-medium text-stone-300">{pred.shipment_id}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-medium uppercase ${
                      isDelayed ? 'bg-fp-warning/10 text-fp-warning border border-fp-warning/20' : 
                      'bg-fp-success/10 text-fp-success border border-fp-success/20'
                    }`}>
                      {pred.prediction}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-fp-bg p-2.5 rounded-lg border border-fp-border">
                    <div>
                      <p className="text-[10px] text-stone-600 font-medium select-none">Vehicle</p>
                      <p className="font-medium text-fp-info">{pred.vehicle_number} ({pred.driver})</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-600 font-medium select-none">ETA Impact</p>
                      <p className={`font-medium ${isDelayed ? 'text-fp-warning' : 'text-fp-success'}`}>{pred.delay_duration}</p>
                    </div>
                  </div>

                  <p className="text-stone-500 text-xs leading-relaxed">{pred.reason}</p>

                  <div className="flex justify-between items-center text-[10px] border-t border-fp-border pt-3">
                    <span className="text-stone-500 font-medium select-none">Confidence</span>
                    <span className="font-medium text-stone-300">{pred.confidence}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Route Optimization */}
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-2 select-none">
            <Navigation className="w-4 h-4 text-fp-accent" />
            Route Suggestions
          </h3>

          <div className="space-y-4">
            {insights.recommendations.map((rec: any, idx: number) => {
              const isApplied = appliedRoutes[rec.vehicle];
              return (
                <div key={idx} className="cyber-card p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 rounded text-[9px] font-medium uppercase bg-fp-muted/10 text-fp-muted border border-fp-muted/20">
                        {rec.type}
                      </span>
                      <span className="font-medium text-fp-info text-xs">{rec.vehicle}</span>
                    </div>

                    <p className="text-stone-300 text-xs font-medium leading-normal">{rec.description}</p>
                    <p className="text-stone-500 text-xs leading-normal">
                      <strong>Expected benefit:</strong> {rec.benefit}
                    </p>
                  </div>

                  <div className="border-t border-fp-border pt-4 flex justify-end">
                    {isApplied ? (
                      <div className="text-xs text-fp-success font-medium flex items-center gap-1.5 py-1 px-3 bg-fp-success/8 border border-fp-success/20 rounded-lg">
                        <Check className="w-4 h-4" />
                        Route applied
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApplyRoute(rec.vehicle)}
                        className="text-xs font-medium flex items-center gap-1.5 py-1.5 px-4 bg-fp-accent hover:bg-fp-accent-light text-stone-950 rounded-lg transition-colors"
                      >
                        Apply Route
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AIInsights;
