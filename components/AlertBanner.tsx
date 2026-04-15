"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Clock, AlertTriangle, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface Alert {
  id: string
  type: "due-soon" | "overdue" | "high-priority" | "in-progress" | "blocked"
  title: string
  message: string
  taskId: string
  action?: () => void
  dismissed?: boolean
  permanent?: boolean
}

interface AlertBannerProps {
  alerts: Alert[]
  onDismiss: (alertId: string) => void
}

export function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  const [displayAlerts, setDisplayAlerts] = useState<Alert[]>(alerts)

  useEffect(() => {
    setDisplayAlerts(alerts.filter(a => !a.dismissed))
  }, [alerts])

  if (displayAlerts.length === 0) return null

  const getAlertConfig = (type: Alert["type"]) => {
    switch (type) {
      case "overdue":
        return {
          icon: AlertTriangle,
          accentBorder: "border-red-600",
          iconColor: "text-red-600",
          itemLabel: "Priority Overdue",
        }
      case "due-soon":
        return {
          icon: Clock,
          accentBorder: "border-amber-600",
          iconColor: "text-amber-600",
          itemLabel: "Upcoming Deadline",
        }
      case "high-priority":
        return {
          icon: AlertCircle,
          accentBorder: "border-rose-600",
          iconColor: "text-rose-600",
          itemLabel: "High Priority",
        }
      default:
        return {
          icon: AlertCircle,
          accentBorder: "border-slate-600",
          iconColor: "text-slate-600",
          itemLabel: "Task Alert",
        }
    }
  }

  return (
    <div className="space-y-3 mb-8 sticky top-0 z-40">
      {displayAlerts.map((alert) => {
        const config = getAlertConfig(alert.type)
        const IconComponent = config.icon

        return (
          <div
            key={alert.id}
            className={`flex items-center gap-4 p-4 rounded-xl border-l-[6px] border bg-card border-border shadow-md transition-all animate-in fade-in slide-in-from-top-3 duration-500 ${config.accentBorder}`}
          >
            <div className={`p-2.5 rounded-full bg-accent ${config.iconColor}`}>
              <IconComponent className="size-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${config.iconColor}`}>
                  {config.itemLabel}
                </span>
                <span className="size-1 rounded-full bg-muted" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  TaskFlow System
                </span>
              </div>
              <p className="text-[14px] font-semibold leading-relaxed text-foreground">
                {alert.message}
              </p>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-border flex-shrink-0">
              {alert.action && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-cyan-600 hover:text-teal-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 underline underline-offset-4 decoration-2 transition-all active:scale-95"
                  onClick={alert.action}
                >
                  Action
                </Button>
              )}
              {!alert.permanent && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-9 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => onDismiss(alert.id)}
                >
                  <X className="size-5" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
