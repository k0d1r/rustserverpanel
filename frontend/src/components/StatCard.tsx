import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  color?: string; // e.g. text-primary bg-primary/20
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatCard = ({ title, value, unit, icon: Icon, color = 'text-primary', trend }: StatCardProps) => {
  return (
    <div className="glass-panel p-5 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold text-text-primary tracking-tight">
              {value}
            </h3>
            {unit && <span className="text-sm text-text-muted">{unit}</span>}
          </div>
        </div>
        <div className={clsx("p-2.5 rounded-lg transition-transform group-hover:scale-110", color.split(' ')[1] || 'bg-bg-surface')}>
          <Icon size={20} className={color.split(' ')[0] || 'text-text-primary'} />
        </div>
      </div>
      
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={clsx(trend.isPositive ? 'text-success' : 'text-error', 'font-medium')}>
            {trend.value}
          </span>
          <span className="text-text-muted">vs last hour</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
