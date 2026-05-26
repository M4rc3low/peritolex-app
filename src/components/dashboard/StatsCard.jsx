import React from 'react';
import { cn } from '@/lib/utils';

export default function StatsCard({ title, value, icon: Icon, trend, trendLabel, variant = "default" }) {
  return (
    <div className={cn(
      "bg-card rounded-xl p-5 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300",
      variant === "accent" && "border-accent/30 bg-accent/5"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1.5">{value}</p>
        </div>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          variant === "accent" ? "bg-accent/20" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            variant === "accent" ? "text-accent" : "text-primary"
          )} />
        </div>
      </div>
      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center gap-1.5 mt-3">
          {trend !== undefined && (
            <span className={cn(
              "text-xs font-semibold",
              trend > 0 ? "text-green-600" : "text-destructive"
            )}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
          {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
