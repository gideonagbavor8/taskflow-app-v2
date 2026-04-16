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
  isStatic?: boolean
  minimal?: boolean
}

export function AlertBanner({ alerts, onDismiss, isStatic = false, minimal = false }: AlertBannerProps) {
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
    <div className={`space-y-3 ${isStatic ? "" : "mb-8 sticky top-0 z-40"}`}>
      {displayAlerts.map((alert) => {
        const config = getAlertConfig(alert.type)
        const IconComponent = config.icon

        return (
          <div
            key={alert.id}
            className={`flex items-center gap-3 rounded-xl border border-border bg-card shadow-sm transition-all animate-in fade-in slide-in-from-top-3 duration-500 ${
              minimal ? "p-2 border-l-4 mb-2" : "p-4 border-l-[6px] mb-3 shadow-md"
            } ${config.accentBorder}`}
          >
            <div className={`rounded-full bg-accent flex-shrink-0 ${config.iconColor} ${minimal ? "p-1.5" : "p-2.5"}`}>
              <IconComponent className={minimal ? "size-3.5" : "size-5"} />
            </div>
            
            <div className="flex-1 min-w-0">
              {!minimal && (
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${config.iconColor}`}>
                    {config.itemLabel}
                  </span>
                  <span className="size-1 rounded-full bg-muted" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    TaskFlow System
                  </span>
                </div>
              )}
              <p className={`font-semibold leading-relaxed text-foreground truncate ${minimal ? "text-[13px]" : "text-[14px]"}`}>
                {minimal ? alert.title : alert.message}
              </p>
            </div>

            <div className={`flex items-center gap-2 flex-shrink-0 ${minimal ? "pl-2" : "pl-4 border-l border-border"}`}>
              {alert.action && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={`font-bold uppercase tracking-widest text-cyan-600 hover:text-teal-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 underline underline-offset-4 decoration-2 transition-all active:scale-95 ${
                    minimal ? "h-7 px-2 text-[10px]" : "h-9 px-4 text-xs"
                  }`}
                  onClick={alert.action}
                >
                  {minimal ? "Go" : "Action"}
                </Button>
              )}
              {!alert.permanent && (
                <Button
                  size="icon"
                  variant="ghost"
                  className={`text-muted-foreground hover:text-foreground transition-colors ${minimal ? "size-7" : "size-9"}`}
                  onClick={() => onDismiss(alert.id)}
                >
                  <X className={minimal ? "size-3.5" : "size-5"} />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
