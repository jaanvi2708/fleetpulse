import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  color?: 'blue' | 'purple' | 'cyan' | 'amber' | 'rose' | 'green';
  trend?: 'up' | 'down';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  color = 'blue'
}) => {
  // Map original color names to muted palette
  const colorMap = {
    blue: {
      iconBg: 'bg-fp-info/10 border border-fp-info/15',
      iconColor: 'text-fp-info',
      valueColor: 'text-stone-100',
      stroke: '#8a9bae',
    },
    green: {
      iconBg: 'bg-fp-success/10 border border-fp-success/15',
      iconColor: 'text-fp-success',
      valueColor: 'text-stone-100',
      stroke: '#7c8c6e',
    },
    purple: {
      iconBg: 'bg-fp-muted/10 border border-fp-muted/15',
      iconColor: 'text-fp-muted',
      valueColor: 'text-stone-100',
      stroke: '#a0937d',
    },
    cyan: {
      iconBg: 'bg-fp-info/10 border border-fp-info/15',
      iconColor: 'text-fp-info',
      valueColor: 'text-stone-100',
      stroke: '#8a9bae',
    },
    amber: {
      iconBg: 'bg-fp-warning/10 border border-fp-warning/15',
      iconColor: 'text-fp-warning',
      valueColor: 'text-stone-100',
      stroke: '#c4956a',
    },
    rose: {
      iconBg: 'bg-fp-danger/10 border border-fp-danger/15',
      iconColor: 'text-fp-danger',
      valueColor: 'text-stone-100',
      stroke: '#b07070',
    },
  };

  const s = colorMap[color] || colorMap.blue;
  const isNegativeStat = color === 'rose';
  const subtextIsUp = !subtext.toLowerCase().includes('requiring') && !subtext.startsWith('▼');
  const isPositiveTrend = isNegativeStat ? !subtextIsUp : subtextIsUp;

  // Sparkline paths
  const upPath = "M0,28 C10,24 15,20 25,22 S38,12 50,10 S70,14 80,8 S90,4 100,6";
  const downPath = "M0,8 C10,12 20,16 30,14 S45,20 55,22 S70,18 80,24 S92,26 100,28";

  return (
    <div className="stat-card relative overflow-hidden">
      <div className="relative">
        {/* Top row: title + icon */}
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wider leading-tight">
            {title}
          </span>
          <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${s.iconColor}`} strokeWidth={1.5} />
          </div>
        </div>

        {/* Value */}
        <div className={`text-2xl font-semibold mb-1 ${s.valueColor} leading-none`}>
          {value}
        </div>

        {/* Trend + sparkline row */}
        <div className="flex items-end justify-between gap-2">
          <p className={`text-[10px] font-medium flex items-center gap-1 ${isPositiveTrend ? 'text-fp-success' : 'text-fp-danger'}`}>
            {isPositiveTrend ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 8V2M2 5l3-3 3 3" stroke="#7c8c6e" strokeWidth="1.5" strokeLinecap="round"/></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2 5l3 3 3-3" stroke="#b07070" strokeWidth="1.5" strokeLinecap="round"/></svg>
            )}
            {subtext.replace('Requiring ', '').replace('▲ ', '').replace('▼ ', '')}
          </p>

          {/* Gradient sparkline */}
          <div className="w-20 h-9 shrink-0 opacity-60">
            <svg viewBox="0 0 100 36" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.stroke} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={s.stroke} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${isPositiveTrend ? upPath : downPath} L100,36 L0,36 Z`}
                fill={`url(#sg-${color})`}
              />
              <path
                d={isPositiveTrend ? upPath : downPath}
                fill="none"
                stroke={s.stroke}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx="100" cy={isPositiveTrend ? "6" : "28"} r="2.5" fill={s.stroke} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StatCard;
