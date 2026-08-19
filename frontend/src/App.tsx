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
import { Chatbot } from './components/Chatbot';
import { X, ShieldAlert, AlertTriangle, Info, Menu, Radio } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  severity: string;
}

export const App: React.FC = () => {
  const isAuthenticated = useFleetStore((state) => state.isAuthenticated);
  const userName = useFleetStore((state) => state.userName) || 'Ops Commander';
  const userRole = useFleetStore((state) => state.userRole) || 'user';
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Role-based tab access control
  const allowedTabs: Record<string, string[]> = {
    admin:  ['dashboard', 'fleet', 'shipments', 'map', 'analytics', 'alerts', 'insights', 'reports', 'settings'],
    driver: ['dashboard', 'fleet', 'shipments', 'map', 'alerts', 'reports', 'settings'],
    user:   ['dashboard', 'shipments', 'map', 'alerts', 'reports', 'settings'],
  };
  const permitted = allowedTabs[userRole] || allowedTabs['user'];

  // Render Page Content based on selected sidebar tab
  const renderTabContent = () => {
    // Guard: redirect to dashboard if role not allowed
    if (!permitted.includes(currentTab)) {
      return <Dashboard setCurrentTab={setCurrentTab} />;
    }
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

  const tabTitleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    fleet: 'Fleet Status',
    shipments: 'Shipments',
    map: 'Live Map',
    analytics: 'Analytics',
    alerts: 'Alerts',
    insights: 'AI Insights',
    reports: 'Reports',
    settings: 'Settings'
  };
  const activeTitle = tabTitleMap[currentTab] || currentTab;

  // 2. Authenticated Dashboard Layout
  return (
    <div className="min-h-screen bg-fp-bg text-stone-300 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Header Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-fp-sidebar border-b border-fp-border z-[9980] flex items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-white/[0.03] transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-1.5 select-none">
          <Radio className="w-3.5 h-3.5 text-fp-accent animate-pulse" />
          <span className="font-bold text-stone-200 text-xs tracking-wide">FleetPulse</span>
          <span className="text-[9px] bg-fp-accent/15 border border-fp-accent/25 text-fp-accent px-1.5 py-0.5 rounded uppercase font-semibold">
            {activeTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Live status dot */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-fp-success animate-pulse' : 'bg-fp-danger'}`} />
            <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider hidden xs:inline">
              {wsConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* User Profile avatar */}
          <div 
            onClick={() => setCurrentTab('settings')}
            className="w-7 h-7 rounded-full bg-fp-accent/15 border border-fp-border flex items-center justify-center text-[10px] font-bold text-stone-300 select-none cursor-pointer hover:border-fp-accent transition-colors shrink-0"
            title="Account Settings"
          >
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        wsConnected={wsConnected} 
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      
      {/* Main Command Workspace */}
      <main className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'md:pl-[88px]' : 'md:pl-[212px]'} px-4 md:px-6 pt-20 md:pt-6 pb-6 min-h-screen`}>
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

      {/* PulseAI Chatbot Guide */}
      <Chatbot setCurrentTab={setCurrentTab} />
    </div>
  );
};
export default App;
