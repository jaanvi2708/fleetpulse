import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Map, 
  Navigation, 
  BarChart3, 
  AlertTriangle, 
  Cpu, 
  LogOut, 
  Radio,
  ChevronLeft,
  ChevronRight,
  FileText,
  Settings
} from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  wsConnected: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab, 
  setCurrentTab, 
  wsConnected,
  isCollapsed,
  setIsCollapsed
}) => {
  const logout = useFleetStore((state) => state.logout);
  const userName = useFleetStore((state) => state.userName) || 'Ops Commander';
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fleet', label: 'Fleet Status', icon: Truck },
    { id: 'shipments', label: 'Shipments', icon: Navigation },
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'insights', label: 'AI Insights', icon: Cpu },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`bg-fp-sidebar border-r border-fp-border flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-[196px]'}`}>
      
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3 w-6 h-6 rounded-full border border-fp-border bg-fp-sidebar hover:bg-fp-card flex items-center justify-center text-stone-500 hover:text-stone-300 shadow-soft transition-colors z-50 select-none"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <div className="flex flex-col flex-1 py-5 overflow-hidden">
        {/* Brand Header */}
        <div className={`flex items-center gap-3 px-4 mb-6 select-none ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="relative shrink-0 w-8 h-8 flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-fp-accent/15 border border-fp-accent/25 flex items-center justify-center">
              <Radio className="w-4 h-4 text-fp-accent" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold tracking-wide leading-none text-stone-200">
                FleetPulse
              </h1>
              <span className="text-[9px] text-stone-500 uppercase tracking-widest font-medium">
                Fleet Operations
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 select-none w-full ${
                  isCollapsed ? 'justify-center px-0' : 'px-3'
                } ${
                  isActive
                    ? 'nav-item-active'
                    : 'text-stone-500 hover:text-stone-300 hover:bg-white/[0.03]'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-fp-accent-light' : 'text-stone-600'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* System Status */}
        {!isCollapsed && (
          <div className="px-3 mb-4 mt-2">
            <div className="sidebar-card p-3">
              <p className="text-[9px] text-stone-500 font-semibold uppercase tracking-widest mb-2">System Status</p>
              <div className="flex items-center gap-2.5">
                <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                  <div className="absolute w-10 h-10 rounded-full border border-fp-accent/15"></div>
                  <div className="absolute w-7 h-7 rounded-full border border-fp-accent/25"></div>
                  <div className="w-4 h-4 rounded-full bg-fp-accent/15 border border-fp-accent/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-fp-accent"></div>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-fp-accent">Operational</p>
                  <div className="mt-1 space-y-0.5">
                    <p className="flex items-center gap-1.5 text-[9px] text-stone-500">
                      <span className="w-1 h-1 rounded-full bg-fp-accent"></span>
                      Telemetry
                      <span className="text-fp-accent font-semibold">Running</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-[9px] text-stone-500">
                      <span className={`w-1 h-1 rounded-full ${wsConnected ? 'bg-fp-success' : 'bg-fp-danger'}`}></span>
                      Data Stream
                      <span className={`${wsConnected ? 'text-fp-success' : 'text-fp-danger'} font-semibold`}>{wsConnected ? 'Live' : 'Offline'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`border-t border-fp-border bg-fp-sidebar ${isCollapsed ? 'p-3' : 'p-3'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-fp-accent/15 border border-fp-border flex items-center justify-center text-[11px] font-semibold text-stone-300 shrink-0 select-none">
              {userName.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-stone-300 truncate">{userName}</p>
                <p className="text-[9px] text-stone-600">Administrator</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={logout}
              title="Logout"
              className="shrink-0 p-1.5 rounded-lg text-stone-500 hover:text-fp-danger hover:bg-fp-danger/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
export default Navbar;
