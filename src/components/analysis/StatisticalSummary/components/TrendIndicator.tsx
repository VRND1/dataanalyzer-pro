import { TrendIndicatorProps } from '././types';
import { getTrendIcon, getTrendColor, getTrendLabel } from '../utils/trends';

export function TrendIndicator({ trend, className = '' }: TrendIndicatorProps) {
  const Icon = getTrendIcon(trend);
  
  return (
    <div className="flex items-center gap-2">
      <Icon className={`${getTrendColor(trend)} ${className}`} />
      <span className="text-sm text-black">
        {getTrendLabel(trend)}
      </span>
    </div>
  );
}