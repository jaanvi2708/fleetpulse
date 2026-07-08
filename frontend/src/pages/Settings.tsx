import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Monitor,
  Shield,
  Globe,
  Sliders,
  Save,
  Check,
  Moon,
  Zap,
  MapPin,
  Wifi,
  WifiOff,
  Database,
  ChevronRight,
  Lock,
  Mail,
  Loader2,
  Truck,
  Package,
  AlertTriangle,
  Activity,
  Clock,
  Fuel,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';

/* ─── helpers ─────────────────────────────────────────── */

function lsGet(key: string, fallback: string): string {
  return localStorage.getItem(`fp_pref_${key}`) ?? fallback;
}
function lsSet(key: string, value: string) {
  localStorage.setItem(`fp_pref_${key}`, value);
}
function lsBool(key: string, fallback: boolean): boolean {
  const raw = localStorage.getItem(`fp_pref_${key}`);
  return raw === null ? fallback : raw === 'true';
}
function lsSetBool(key: string, value: boolean) {
  localStorage.setItem(`fp_pref_${key}`, String(value));
}

/* ─── primitives ──────────────────────────────────────── */

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({
  icon, title, subtitle,
}) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-9 h-9 rounded-lg bg-fp-accent/10 border border-fp-accent/20 flex items-center justify-center text-fp-accent shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold text-stone-200">{title}</h3>
      <p className="text-[11px] text-stone-500">{subtitle}</p>
    </div>
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; id: string }> = ({
  checked, onChange, id,
}) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
      checked ? 'bg-fp-accent' : 'bg-fp-border-light'
    }`}
  >
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
      checked ? 'translate-x-5' : 'translate-x-0.5'
    }`} />
  </button>
);

const SettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({
  label, description, children,
}) => (
  <div className="flex items-center justify-between gap-4 py-3.5 border-b border-fp-border/40 last:border-0">
    <div className="min-w-0">
      <p className="text-xs font-semibold text-stone-300">{label}</p>
      {description && <p className="text-[10px] text-stone-500 mt-0.5 leading-relaxed">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Sel: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-fp-surface border border-fp-border rounded-md px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-fp-accent transition-colors cursor-pointer"
  >
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

/* ─── STAT PILL ───────────────────────────────────────── */
const StatPill: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color?: string }> = ({
  icon, label, value, color = 'text-stone-200',
}) => (
  <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-fp-surface border border-fp-border/50">
    <div className="flex items-center gap-1.5 text-stone-500">
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <span className={`text-lg font-extrabold tabular-nums leading-none ${color}`}>{value}</span>
  </div>
);

/* ─── MAIN PAGE ───────────────────────────────────────── */

export const Settings: React.FC = () => {
  const token       = useFleetStore((s) => s.token);
  const loginAction = useFleetStore((s) => s.login);
  const logoutAction= useFleetStore((s) => s.logout);
  const userName    = useFleetStore((s) => s.userName)  || 'Ops Commander';
  const userEmail   = useFleetStore((s) => s.userEmail) || 'admin@fleetpulse.com';

  /* live fleet data */
  const vehicles    = useFleetStore((s) => s.vehicles);
  const shipments   = useFleetStore((s) => s.shipments);
  const alerts      = useFleetStore((s) => s.alerts);
  const stats       = useFleetStore((s) => s.stats);
  const setVehicles = useFleetStore((s) => s.setVehicles);
  const setShipments= useFleetStore((s) => s.setShipments);
  const setAlerts   = useFleetStore((s) => s.setAlerts);
  const setStats    = useFleetStore((s) => s.setStats);

  /* fetch data if store is empty (e.g. landed directly on Settings) */
  const [dataLoading, setDataLoading] = useState(false);
  useEffect(() => {
    if (vehicles.length > 0) return; // already populated
    setDataLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('http://localhost:8000/api/vehicles', { headers }).then((r) => r.ok ? r.json() : []),
      fetch('http://localhost:8000/api/shipments', { headers }).then((r) => r.ok ? r.json() : []),
      fetch('http://localhost:8000/api/alerts', { headers }).then((r) => r.ok ? r.json() : []),
      fetch('http://localhost:8000/api/dashboard/stats', { headers }).then((r) => r.ok ? r.json() : null),
    ]).then(([v, s, a, st]) => {
      if (v.length) setVehicles(v);
      if (s.length) setShipments(s);
      if (a.length) setAlerts(a);
      if (st) setStats(st);
    }).catch(() => {}).finally(() => setDataLoading(false));
  }, [token]);

  /* derived counts */
  const movingCount  = vehicles.filter((v) => v.status === 'Moving').length;
  const idleCount    = vehicles.filter((v) => v.status === 'Idle').length;
  const offlineCount = vehicles.filter((v) => v.status === 'Offline').length;
  const lowFuelCount = vehicles.filter((v) => v.fuel_level < 20).length;
  const critAlerts   = alerts.filter((a) => !a.resolved && a.severity === 'Critical').length;
  const inTransit    = shipments.filter((s) => s.status === 'In Transit').length;
  const delayed      = shipments.filter((s) => s.status === 'Delayed').length;

  /* ── account form ── */
  const [profileName,     setProfileName]     = useState(userName);
  const [profileEmail,    setProfileEmail]    = useState(userEmail);
  const [profilePassword, setProfilePassword] = useState('');
  const [saving,          setSaving]          = useState(false);
  const [saved,           setSaved]           = useState(false);

  /* ── appearance (persisted) ── */
  const [accentColor, setAccentColor] = useState(() => lsGet('accentColor', 'blue'));
  const [mapStyle,    setMapStyle]    = useState(() => lsGet('mapStyle', 'dark'));
  const [compactMode, setCompactMode] = useState(() => lsBool('compactMode', false));
  const [animations,  setAnimations]  = useState(() => lsBool('animations', true));

  /* ── notifications (persisted) ── */
  const [alertSound,    setAlertSound]    = useState(() => lsBool('alertSound', true));
  const [fuelAlerts,    setFuelAlerts]    = useState(() => lsBool('fuelAlerts', true));
  const [speedAlerts,   setSpeedAlerts]   = useState(() => lsBool('speedAlerts', true));
  const [offlineAlerts, setOfflineAlerts] = useState(() => lsBool('offlineAlerts', true));
  const [emailDigest,   setEmailDigest]   = useState(() => lsBool('emailDigest', false));
  const [digestFreq,    setDigestFreq]    = useState(() => lsGet('digestFreq', 'daily'));

  /* ── system (persisted) ── */
  const [refreshRate,   setRefreshRate]   = useState(() => lsGet('refreshRate', '5'));
  const [dataRetention, setDataRetention] = useState(() => lsGet('dataRetention', '30'));
  const [gpsUnits,      setGpsUnits]      = useState(() => lsGet('gpsUnits', 'metric'));
  const [timezone,      setTimezone]      = useState(() => lsGet('timezone', 'UTC+5:30'));
  const [autoReconnect, setAutoReconnect] = useState(() => lsBool('autoReconnect', true));
  const [debugMode,     setDebugMode]     = useState(() => lsBool('debugMode', false));

  /* persist on change */
  useEffect(() => { lsSet('accentColor', accentColor); }, [accentColor]);
  useEffect(() => { lsSet('mapStyle', mapStyle); }, [mapStyle]);
  useEffect(() => { lsSetBool('compactMode', compactMode); }, [compactMode]);
  useEffect(() => { lsSetBool('animations', animations); }, [animations]);
  useEffect(() => { lsSetBool('alertSound', alertSound); }, [alertSound]);
  useEffect(() => { lsSetBool('fuelAlerts', fuelAlerts); }, [fuelAlerts]);
  useEffect(() => { lsSetBool('speedAlerts', speedAlerts); }, [speedAlerts]);
  useEffect(() => { lsSetBool('offlineAlerts', offlineAlerts); }, [offlineAlerts]);
  useEffect(() => { lsSetBool('emailDigest', emailDigest); }, [emailDigest]);
  useEffect(() => { lsSet('digestFreq', digestFreq); }, [digestFreq]);
  useEffect(() => { lsSet('refreshRate', refreshRate); }, [refreshRate]);
  useEffect(() => { lsSet('dataRetention', dataRetention); }, [dataRetention]);
  useEffect(() => { lsSet('gpsUnits', gpsUnits); }, [gpsUnits]);
  useEffect(() => { lsSet('timezone', timezone); }, [timezone]);
  useEffect(() => { lsSetBool('autoReconnect', autoReconnect); }, [autoReconnect]);
  useEffect(() => { lsSetBool('debugMode', debugMode); }, [debugMode]);

  /* ws status ping */
  const [wsAlive, setWsAlive] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/fleet');
      ws.onopen  = () => { setWsAlive(true);  ws.close(); };
      ws.onerror = () => { setWsAlive(false); };
    } catch { setWsAlive(false); }
  }, []);

  /* uptime clock */
  const [uptime, setUptime] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setUptime((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const fmtUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaved(false);
    try {
      const payload: Record<string, string> = { full_name: profileName, email: profileEmail };
      if (profilePassword.trim()) payload.password = profilePassword;
      const res = await fetch('http://localhost:8000/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        loginAction(token || '', data.email, data.full_name);
        setSaved(true);
        setProfilePassword('');
        setTimeout(() => setSaved(false), 3000);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to update profile');
      }
    } catch { alert('Network error – please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── HEADER ── */}
      <div>
        <h2 className="text-[26px] font-extrabold text-stone-200 uppercase tracking-tight leading-none flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-fp-accent" />
          Settings
        </h2>
        <p className="text-stone-500 text-[12px] mt-1.5">
          Account · Display · Alerts · System — all preferences persist automatically.
        </p>
      </div>

      {/* ══════════════════════════════════
          LIVE FLEET SNAPSHOT
      ══════════════════════════════════ */}
      <div className="cyber-card p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            icon={<Activity className="w-4 h-4" />}
            title="Live Fleet Snapshot"
            subtitle="Real-time counts pulled from the active data stream"
          />
          <div className="flex items-center gap-2 shrink-0 self-start mt-0.5">
            {dataLoading && (
              <span className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
              </span>
            )}
            <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              wsAlive === true  ? 'bg-fp-success/15 border-fp-success/20 text-fp-success' :
              wsAlive === false ? 'bg-fp-danger/10 border-fp-danger/20 text-fp-danger' :
                                  'bg-fp-surface border-fp-border text-stone-500'
            }`}>
              {wsAlive === null
                ? <><RefreshCw className="w-3 h-3 animate-spin" /> Checking…</>
                : wsAlive
                ? <><Wifi className="w-3 h-3" /> WS Live</>
                : <><WifiOff className="w-3 h-3" /> WS Offline</>
              }
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatPill icon={<Truck className="w-3 h-3" />} label="Moving" value={movingCount} color="text-fp-success" />
          <StatPill icon={<Truck className="w-3 h-3" />} label="Idle" value={idleCount} color="text-fp-info" />
          <StatPill icon={<Truck className="w-3 h-3" />} label="Offline" value={offlineCount} color="text-stone-500" />
          <StatPill icon={<Fuel className="w-3 h-3" />} label="Low Fuel" value={lowFuelCount} color={lowFuelCount > 0 ? 'text-fp-danger' : 'text-stone-400'} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill icon={<Package className="w-3 h-3" />} label="In Transit" value={inTransit} color="text-fp-accent-light" />
          <StatPill icon={<AlertTriangle className="w-3 h-3" />} label="Delayed" value={delayed} color={delayed > 0 ? 'text-fp-warning' : 'text-stone-400'} />
          <StatPill icon={<Shield className="w-3 h-3" />} label="Critical Alerts" value={critAlerts} color={critAlerts > 0 ? 'text-fp-danger' : 'text-stone-400'} />
          <StatPill icon={<Activity className="w-3 h-3" />} label="Avg Speed" value={`${stats.average_speed} km/h`} color="text-stone-200" />
        </div>

        {/* uptime + session info */}
        <div className="mt-4 flex flex-wrap gap-4 pt-3.5 border-t border-fp-border/40 text-[10px] text-stone-500 font-medium">
          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Session Uptime: <span className="text-stone-300 font-mono">{fmtUptime(uptime)}</span></span>
          <span className="flex items-center gap-1.5"><Database className="w-3 h-3" /> Vehicles tracked: <span className="text-stone-300">{vehicles.length}</span></span>
          <span className="flex items-center gap-1.5"><Package className="w-3 h-3" /> Shipments tracked: <span className="text-stone-300">{shipments.length}</span></span>
          <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> On-time rate: <span className="text-stone-300">{stats.on_time_percentage}%</span></span>
        </div>
      </div>

      {/* ─── ACCOUNT ─── */}
      <div className="cyber-card p-6">
        <SectionHeader icon={<User className="w-4 h-4" />} title="Account" subtitle="Update your name, email, and password" />

        {/* avatar row */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-fp-surface border border-fp-border/40">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-fp-accent to-fp-accent-light flex items-center justify-center text-xl font-extrabold text-stone-950 select-none shadow-soft">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-100 truncate">{userName}</p>
            <p className="text-[11px] text-stone-500 truncate">{userEmail}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-fp-accent/15 border border-fp-accent/20 text-fp-accent-light">
              <Shield className="w-2.5 h-2.5" /> Admin
            </span>
          </div>
          <button
            onClick={logoutAction}
            id="logout-btn"
            className="flex items-center gap-1.5 text-[10px] font-bold text-fp-danger hover:text-stone-200 px-3 py-1.5 rounded-lg border border-fp-danger/20 hover:border-fp-danger/40 bg-fp-danger/10 hover:bg-fp-danger/20 transition-all select-none"
          >
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3" /> Full Name
              </label>
              <input type="text" required value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-fp-surface border border-fp-border rounded-lg px-3 py-2 text-xs font-medium text-stone-200 focus:outline-none focus:border-fp-accent transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Email Address
              </label>
              <input type="email" required value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full bg-fp-surface border border-fp-border rounded-lg px-3 py-2 text-xs font-medium text-stone-200 focus:outline-none focus:border-fp-accent transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> New Password
              <span className="normal-case text-stone-600 font-normal">(leave blank to keep current)</span>
            </label>
            <input type="password" placeholder="••••••••" value={profilePassword}
              onChange={(e) => setProfilePassword(e.target.value)}
              className="w-full sm:w-72 bg-fp-surface border border-fp-border rounded-lg px-3 py-2 text-xs font-medium text-stone-200 focus:outline-none focus:border-fp-accent transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving} id="save-profile-btn"
              className="flex items-center gap-2 py-2 px-5 bg-fp-accent hover:bg-fp-accent-light disabled:opacity-50 text-stone-950 font-bold text-xs rounded-lg transition-all shadow-soft select-none"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Account
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-fp-success text-xs font-semibold">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ─── APPEARANCE ─── */}
      <div className="cyber-card p-6">
        <SectionHeader icon={<Monitor className="w-4 h-4" />} title="Appearance" subtitle="Customize how the dashboard looks and feels" />

        <SettingRow label="Accent Color" description="Primary highlight color used across the UI">
          <Sel value={accentColor} onChange={setAccentColor} options={[
            { value: 'blue',   label: '🌿 Muted Sage'  },
            { value: 'green',  label: '🔵 Steel Blue' },
            { value: 'purple', label: '🟤 Warm Taupe' },
            { value: 'orange', label: '🟠 Muted Terracotta' },
          ]} />
        </SettingRow>

        <SettingRow label="Map Style" description="Base tile style for the live tracking map">
          <Sel value={mapStyle} onChange={setMapStyle} options={[
            { value: 'dark',      label: '🌑 Dark (default)' },
            { value: 'satellite', label: '🛰️ Satellite'       },
            { value: 'terrain',   label: '🗺️ Terrain'         },
            { value: 'light',     label: '☀️ Light'            },
          ]} />
        </SettingRow>

        <SettingRow label="Compact Mode" description="Reduce padding and font sizes to fit more data">
          <Toggle id="toggle-compact" checked={compactMode} onChange={setCompactMode} />
        </SettingRow>

        <SettingRow label="UI Animations" description="Smooth transitions, pulse effects, and loading states">
          <Toggle id="toggle-animations" checked={animations} onChange={setAnimations} />
        </SettingRow>

        <SettingRow label="Theme">
          <div className="flex items-center gap-2">
            <Moon className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-xs text-stone-500 font-medium">Dark (always on)</span>
          </div>
        </SettingRow>
      </div>

      {/* ─── NOTIFICATIONS ─── */}
      <div className="cyber-card p-6">
        <SectionHeader icon={<Bell className="w-4 h-4" />} title="Notifications" subtitle="Control which alerts fire and how they're delivered" />

        {/* live alert summary */}
        {critAlerts > 0 && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-fp-danger/5 border border-fp-danger/25 text-xs text-fp-danger font-semibold animate-in fade-in duration-200">
            <AlertTriangle className="w-3.5 h-3.5 text-fp-danger shrink-0" />
            {critAlerts} unresolved critical alert{critAlerts > 1 ? 's' : ''} currently active in your fleet.
          </div>
        )}
        {lowFuelCount > 0 && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-fp-warning/5 border border-fp-warning/25 text-xs text-fp-warning font-semibold animate-in fade-in duration-200">
            <Fuel className="w-3.5 h-3.5 text-fp-warning shrink-0" />
            {lowFuelCount} vehicle{lowFuelCount > 1 ? 's' : ''} below 20% fuel — low fuel alerts are {fuelAlerts ? 'ON' : 'OFF'}.
          </div>
        )}

        <SettingRow label="Alert Sound" description="Play an audio cue when a critical alert fires">
          <Toggle id="toggle-alert-sound" checked={alertSound} onChange={setAlertSound} />
        </SettingRow>
        <SettingRow label="Low Fuel Alerts" description="Notify when any vehicle drops below 20%">
          <Toggle id="toggle-fuel-alerts" checked={fuelAlerts} onChange={setFuelAlerts} />
        </SettingRow>
        <SettingRow label="Speed Violation Alerts" description="Notify when a vehicle exceeds the set speed limit">
          <Toggle id="toggle-speed-alerts" checked={speedAlerts} onChange={setSpeedAlerts} />
        </SettingRow>
        <SettingRow label="Vehicle Offline Alerts" description="Notify when a vehicle loses connection">
          <Toggle id="toggle-offline-alerts" checked={offlineAlerts} onChange={setOfflineAlerts} />
        </SettingRow>
        <SettingRow label="Email Digest" description="Receive a periodic fleet summary to your inbox">
          <Toggle id="toggle-email-digest" checked={emailDigest} onChange={setEmailDigest} />
        </SettingRow>
        {emailDigest && (
          <SettingRow label="Digest Frequency">
            <Sel value={digestFreq} onChange={setDigestFreq} options={[
              { value: 'hourly',  label: 'Hourly'  },
              { value: 'daily',   label: 'Daily'   },
              { value: 'weekly',  label: 'Weekly'  },
            ]} />
          </SettingRow>
        )}
      </div>

      {/* ─── SYSTEM ─── */}
      <div className="cyber-card p-6">
        <SectionHeader icon={<Sliders className="w-4 h-4" />} title="System" subtitle="Data, connectivity, and regional preferences" />

        <SettingRow label="Live Data Refresh Rate" description="How often vehicle positions are polled from the server">
          <Sel value={refreshRate} onChange={setRefreshRate} options={[
            { value: '2',  label: 'Every 2 s'  },
            { value: '5',  label: 'Every 5 s'  },
            { value: '10', label: 'Every 10 s' },
            { value: '30', label: 'Every 30 s' },
          ]} />
        </SettingRow>
        <SettingRow label="Data Retention" description="How long historical trip logs are kept on-device">
          <Sel value={dataRetention} onChange={setDataRetention} options={[
            { value: '7',   label: '7 days'  },
            { value: '30',  label: '30 days' },
            { value: '90',  label: '90 days' },
            { value: '365', label: '1 year'  },
          ]} />
        </SettingRow>
        <SettingRow label="Distance & Speed Units">
          <Sel value={gpsUnits} onChange={setGpsUnits} options={[
            { value: 'metric',   label: 'Metric (km/h)'  },
            { value: 'imperial', label: 'Imperial (mph)' },
          ]} />
        </SettingRow>
        <SettingRow label="Timezone">
          <Sel value={timezone} onChange={setTimezone} options={[
            { value: 'UTC',      label: 'UTC'            },
            { value: 'UTC+5:30', label: 'IST (UTC+5:30)' },
            { value: 'UTC+1',    label: 'CET (UTC+1)'    },
            { value: 'UTC-5',    label: 'EST (UTC−5)'    },
            { value: 'UTC-8',    label: 'PST (UTC−8)'    },
          ]} />
        </SettingRow>
        <SettingRow label="Auto-Reconnect WebSocket" description="Re-establish the live data stream on disconnect">
          <Toggle id="toggle-auto-reconnect" checked={autoReconnect} onChange={setAutoReconnect} />
        </SettingRow>
        <SettingRow label="Debug Mode" description="Log raw telemetry payloads to the browser console">
          <Toggle id="toggle-debug-mode" checked={debugMode} onChange={setDebugMode} />
        </SettingRow>
      </div>

      {/* ─── RESOURCES ─── */}
      <div className="cyber-card p-6">
        <SectionHeader icon={<Globe className="w-4 h-4" />} title="Resources" subtitle="Useful links and system information" />

        {[
          { icon: <Database className="w-3.5 h-3.5" />, label: 'API Documentation',    sub: 'Browse the FleetPulse REST API reference'   },
          { icon: <Wifi className="w-3.5 h-3.5" />,     label: 'WebSocket Status',      sub: `Backend WS is ${wsAlive ? '✅ reachable' : wsAlive === false ? '❌ unreachable' : '⏳ checking…'}` },
          { icon: <MapPin className="w-3.5 h-3.5" />,   label: 'GPS Calibration Guide', sub: 'Troubleshoot vehicle position accuracy'      },
          { icon: <Zap className="w-3.5 h-3.5" />,      label: "What's New",            sub: 'FleetPulse v2.1.0 — Release notes'           },
        ].map((item) => (
          <button key={item.label}
            className="w-full flex items-center justify-between gap-4 py-3.5 border-b border-fp-border/40 last:border-0 text-left group hover:bg-fp-surface/30 -mx-6 px-6 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-stone-500 group-hover:text-fp-accent transition-colors">{item.icon}</span>
              <div>
                <p className="text-xs font-semibold text-stone-300 group-hover:text-stone-100 transition-colors">{item.label}</p>
                <p className="text-[10px] text-stone-600">{item.sub}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-stone-400 transition-colors" />
          </button>
        ))}
      </div>

      {/* ── VERSION FOOTER ── */}
      <p className="text-center text-[10px] text-stone-700 pb-2 select-none">
        FleetPulse v2.1.0 · © 2026 · {vehicles.length} vehicles · {shipments.length} shipments · All systems nominal
      </p>
    </div>
  );
};

export default Settings;
