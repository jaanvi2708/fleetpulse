import React, { useEffect, useState } from 'react';
import { Search, AlertTriangle, CheckSquare, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';

export const Alerts: React.FC = () => {
  const token = useFleetStore((state) => state.token);
  const alerts = useFleetStore((state) => state.alerts);
  const setAlerts = useFleetStore((state) => state.setAlerts);
  const markAlertResolved = useFleetStore((state) => state.markAlertResolved);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [severityFilterOpen, setSeverityFilterOpen] = useState(false);
  const [selectedSeverityTemp, setSelectedSeverityTemp] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Unresolved');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [selectedStatusTemp, setSelectedStatusTemp] = useState('Unresolved');
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
        }
      } catch (err) {
        console.error('Error fetching alerts:', err);
      }
    };
    fetchAlerts();
  }, [token, setAlerts]);

  const handleResolve = async (alertId: number) => {
    setResolvingId(alertId);
    try {
      const res = await fetch(`http://localhost:8000/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        markAlertResolved(alertId);
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = 
      (alert.vehicle_number && alert.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.alert_type.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSeverity = severityFilter === 'All' || alert.severity === severityFilter;
    
    const matchesStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'Resolved' && alert.resolved) ||
      (statusFilter === 'Unresolved' && !alert.resolved);
      
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-stone-200">
          Alerts
        </h2>
        <p className="text-stone-500 text-xs mt-1">
          Monitor and resolve fleet safety alerts
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-fp-card p-4 border border-fp-border rounded-lg select-none">
        
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-fp-bg border border-fp-border rounded-lg py-2 pl-10 pr-4 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-fp-accent/50"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          
          {/* Severity Filter Custom Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setSelectedSeverityTemp(severityFilter);
                setSeverityFilterOpen(!severityFilterOpen);
                setStatusFilterOpen(false);
              }}
              className="w-full sm:w-auto bg-fp-bg border border-fp-border rounded-lg py-2 px-3 text-xs text-stone-300 hover:border-fp-accent/40 hover:text-stone-200 transition-colors flex items-center justify-between sm:justify-start gap-2 select-none"
            >
              <span>Severity: {severityFilter === 'All' ? 'All' : severityFilter}</span>
              <span className="text-[10px] text-stone-600">▼</span>
            </button>

            {severityFilterOpen && (
              <>
                <div 
                  onClick={() => setSeverityFilterOpen(false)} 
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
                />
                <div className="fixed md:absolute md:top-full md:right-0 mt-2 z-50 w-[240px] md:w-[180px] bg-fp-sidebar border border-fp-border rounded-xl p-3 shadow-card animate-in fade-in zoom-in-95 duration-150
                  left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0
                ">
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-2.5 select-none border-b border-fp-border/40 pb-1">Filter Severity</p>
                  <div className="space-y-1.5">
                    {['All', 'Critical', 'Warning', 'Info'].map((severity) => {
                      const label = severity === 'All' ? 'All Severities' : severity;
                      const isSelected = selectedSeverityTemp === severity;
                      return (
                        <button
                          key={severity}
                          onClick={() => setSelectedSeverityTemp(severity)}
                          className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all ${
                            isSelected 
                              ? 'bg-fp-accent/15 border border-fp-accent/25 text-fp-accent-light' 
                              : 'text-stone-400 hover:bg-white/[0.02] hover:text-stone-200 border border-transparent'
                          }`}
                        >
                          <span>{label}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-fp-accent" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-2 border-t border-fp-border/40 flex justify-end">
                    <button
                      onClick={() => {
                        setSeverityFilter(selectedSeverityTemp);
                        setSeverityFilterOpen(false);
                      }}
                      className="w-full md:w-auto px-4 py-1.5 bg-fp-accent hover:bg-fp-accent-light text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-soft"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Status Filter Custom Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setSelectedStatusTemp(statusFilter);
                setStatusFilterOpen(!statusFilterOpen);
                setSeverityFilterOpen(false);
              }}
              className="w-full sm:w-auto bg-fp-bg border border-fp-border rounded-lg py-2 px-3 text-xs text-stone-300 hover:border-fp-accent/40 hover:text-stone-200 transition-colors flex items-center justify-between sm:justify-start gap-2 select-none"
            >
              <span>State: {statusFilter === 'All' ? 'All' : statusFilter}</span>
              <span className="text-[10px] text-stone-600">▼</span>
            </button>

            {statusFilterOpen && (
              <>
                <div 
                  onClick={() => setStatusFilterOpen(false)} 
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
                />
                <div className="fixed md:absolute md:top-full md:right-0 mt-2 z-50 w-[240px] md:w-[180px] bg-fp-sidebar border border-fp-border rounded-xl p-3 shadow-card animate-in fade-in zoom-in-95 duration-150
                  left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0
                ">
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-2.5 select-none border-b border-fp-border/40 pb-1">Filter State</p>
                  <div className="space-y-1.5">
                    {['All', 'Unresolved', 'Resolved'].map((status) => {
                      const label = status === 'All' ? 'All States' : status;
                      const isSelected = selectedStatusTemp === status;
                      return (
                        <button
                          key={status}
                          onClick={() => setSelectedStatusTemp(status)}
                          className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all ${
                            isSelected 
                              ? 'bg-fp-accent/15 border border-fp-accent/25 text-fp-accent-light' 
                              : 'text-stone-400 hover:bg-white/[0.02] hover:text-stone-200 border border-transparent'
                          }`}
                        >
                          <span>{label}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-fp-accent" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-2 border-t border-fp-border/40 flex justify-end">
                    <button
                      onClick={() => {
                        setStatusFilter(selectedStatusTemp);
                        setStatusFilterOpen(false);
                      }}
                      className="w-full md:w-auto px-4 py-1.5 bg-fp-accent hover:bg-fp-accent-light text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-soft"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-fp-card border border-fp-border rounded-lg overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className="bg-fp-surface border-b border-fp-border text-stone-500 font-medium uppercase tracking-wider">
                <th className="p-4">Severity</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Type</th>
                <th className="p-4">Message</th>
                <th className="p-4">Time</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fp-border/50">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500 font-medium">
                    No matching alerts found.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr 
                    key={alert.id} 
                    className={`hover:bg-fp-surface/50 transition-colors ${
                      !alert.resolved && alert.severity === 'Critical' ? 'bg-fp-danger/3' : ''
                    }`}
                  >
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-medium text-[9px] uppercase border flex items-center gap-1.5 w-fit ${
                        alert.severity === 'Critical' ? 'bg-fp-danger/10 text-fp-danger border-fp-danger/20' : 
                        alert.severity === 'Warning' ? 'bg-fp-warning/10 text-fp-warning border-fp-warning/20' : 
                        'bg-fp-info/10 text-fp-info border-fp-info/20'
                      }`}>
                        {alert.severity === 'Critical' ? <ShieldAlert className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {alert.severity}
                      </span>
                    </td>
                    
                    <td className="p-4 font-medium text-stone-400">
                      {alert.vehicle_number ? `${alert.vehicle_number}` : 'Fleet Wide'}
                    </td>
                    
                    <td className="p-4 font-medium text-stone-300">{alert.alert_type}</td>
                    
                    <td className="p-4 text-stone-500 max-w-xs truncate md:max-w-md" title={alert.message}>
                      {alert.message}
                    </td>
                    
                    <td className="p-4 text-stone-500 font-mono">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </td>
                    
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded font-medium text-[9px] uppercase border inline-flex items-center gap-1 ${
                        alert.resolved 
                          ? 'bg-fp-success/10 text-fp-success border-fp-success/20' 
                          : 'bg-fp-danger/10 text-fp-danger border-fp-danger/20'
                      }`}>
                        {alert.resolved ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Resolved
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Open
                          </>
                        )}
                      </span>
                    </td>
                    
                    <td className="p-4 text-right">
                      {!alert.resolved ? (
                        <button
                          onClick={() => handleResolve(alert.id)}
                          disabled={resolvingId === alert.id}
                          className="px-3 py-1 bg-fp-surface border border-fp-border text-stone-400 rounded font-medium hover:border-fp-accent/30 hover:text-fp-accent transition-colors flex items-center gap-1 ml-auto"
                        >
                          <CheckSquare className="w-3 h-3" />
                          {resolvingId === alert.id ? 'Resolving...' : 'Resolve'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-600 italic">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Alerts;
