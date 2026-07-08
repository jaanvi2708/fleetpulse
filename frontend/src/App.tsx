import React, { useState, useCallback } from 'react';
import { useFleetStore } from './store/fleetStore';
import { useWebSocket } from './hooks/useWebSocket';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Fleet } from './pages/Fleet';
import { Shipments } from './pages/Shipments';
import { LiveMapPage } from './pages/LiveMapPage';
import { Analytics } from './pages/Analytics';
import { Alerts } from './pages/Alerts';
import { AIInsights } from './pages/AIInsights';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { X, ShieldAlert, AlertTriangle, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  severity: string;
}

export const App: React.FC = () => {
  const isAuthenticated = useFleetStore((state) => state.isAuthenticated);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast dispatcher for WebSocket alerts
  const showToast = useCallback((message: string, severity: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, severity }]);
    
    // Auto-remove toast after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  // Bind WebSocket stream
  const { connected: wsConnected } = useWebSocket(isAuthenticated ? showToast : undefined);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Render Page Content based on selected sidebar tab
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setCurrentTab={setCurrentTab} />;
      case 'fleet':
        return <Fleet />;
      case 'shipments':
        return <Shipments />;
      case 'map':
        return <LiveMapPage />;
      case 'analytics':
        return <Analytics />;
      case 'alerts':
        return <Alerts />;
      case 'insights':
        return <AIInsights />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} />;
    }
  };

  // 1. Unauthenticated State
  if (!isAuthenticated) {
    return authView === 'login' ? (
      <Login onRegisterRedirect={() => setAuthView('register')} />
    ) : (
      <Register onLoginRedirect={() => setAuthView('login')} />
    );
  }

  // 2. Authenticated Dashboard Layout
  return (
    <div className="min-h-screen bg-fp-bg text-stone-300 flex font-sans">
      
      {/* Sidebar Navigation */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        wsConnected={wsConnected} 
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      {/* Main Command Workspace */}
      <main className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'pl-[88px]' : 'pl-[212px]'} py-6 pr-6 pl-6 min-h-screen`}>
        <div className="max-w-[1400px] mx-auto">
          {renderTabContent()}
        </div>
      </main>

      {/* Alert Toast Stack */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-80 max-w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-card border text-xs flex gap-3 items-start backdrop-blur-sm ${
              toast.severity === 'Critical'
                ? 'bg-fp-danger/10 border-fp-danger/30 text-stone-200'
                : toast.severity === 'Warning'
                ? 'bg-fp-warning/10 border-fp-warning/30 text-stone-200'
                : 'bg-fp-surface border-fp-border text-stone-300'
            }`}
          >
            {/* Severity Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.severity === 'Critical' ? (
                <ShieldAlert className="w-4 h-4 text-fp-danger" />
              ) : toast.severity === 'Warning' ? (
                <AlertTriangle className="w-4 h-4 text-fp-warning" />
              ) : (
                <Info className="w-4 h-4 text-fp-info" />
              )}
            </div>
            
            {/* Description */}
            <div className="flex-1">
              <p className="font-semibold uppercase tracking-wide text-[10px] text-stone-500 select-none">
                {toast.severity} Alert
              </p>
              <p className="mt-1 leading-relaxed font-medium">{toast.message}</p>
            </div>
            
            {/* Close trigger */}
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-0.5 rounded hover:bg-fp-surface transition-colors text-stone-500 hover:text-stone-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default App;
