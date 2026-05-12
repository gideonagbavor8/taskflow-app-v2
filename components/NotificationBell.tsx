"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Bell, Check, Info, AlertTriangle, XCircle, Mail, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function NotificationBell({ systemAlerts = [] }: { systemAlerts?: any[] }) {
  const { data: serverNotifications, mutate } = useSWR<any[]>("/api/notifications", fetcher, {
    refreshInterval: 5000 // Poll every 5 seconds for "real-time" feel
  })
  const [isOpen, setIsOpen] = useState(false)

  // Merge server notifications with client-side system alerts
  const notifications = [
    ...systemAlerts.map(a => ({
      ...a,
      read: false, // System alerts are always "unread" until the condition changes
      isSystem: true
    })),
    ...(serverNotifications || [])
  ]

  const unreadCount = notifications.filter(n => !n.read).length || 0

  const markAsRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      mutate()
    } catch (err) {
      console.error("Failed to mark as read", err)
    }
  }

  const getTypeIcon = (type: string, className?: string) => {
    const iconClass = className || ""
    switch (type) {
      case 'INVITE': return <Mail className={`size-4 ${iconClass || 'text-cyan-600'}`} />
      case 'SUCCESS': return <Check className={`size-4 ${iconClass || 'text-green-600'}`} />
      case 'WARNING': return <AlertTriangle className={`size-4 ${iconClass || 'text-amber-600'}`} />
      case 'ERROR': return <XCircle className={`size-4 ${iconClass || 'text-red-600'}`} />
      case 'overdue': return <Clock className={`size-4 ${iconClass || 'text-red-600'}`} />
      case 'due-soon': return <Clock className={`size-4 ${iconClass || 'text-amber-600'}`} />
      case 'high-priority': return <AlertTriangle className={`size-4 ${iconClass || 'text-red-600'}`} />
      default: return <Info className={`size-4 ${iconClass || 'text-blue-600'}`} />
    }
  }

  const timeAgo = (date: string) => {
    if (date) {
      const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
      if (seconds < 60) return 'just now'
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `${minutes}m ago`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}h ago`
      return new Date(date).toLocaleDateString()
    }
    return 'now'
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative size-10 rounded-xl hover:bg-accent/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="size-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl z-50 flex flex-col animate-in slide-in-from-top-2 border-cyan-500/20">
            <div className="flex items-center justify-between border-b border-border/50 p-4">
              <h3 className="font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAsRead()}
                  className="text-xs font-bold text-cyan-600 hover:text-cyan-700"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="size-12 rounded-full bg-accent/50 flex items-center justify-center mb-3">
                    <Bell className="size-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`group p-4 transition-all cursor-pointer border-l-4 ${
                        !n.read 
                          ? 'bg-cyan-500/5 border-cyan-500 hover:bg-cyan-500/10' 
                          : 'border-transparent hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        if (n.isSystem && n.action) {
                          n.action()
                          setIsOpen(false)
                        } else {
                          markAsRead(n.id)
                        }
                      }}
                    >
                      <div className="flex gap-3">
                          <div className={`mt-1 size-9 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                            !n.read 
                              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {getTypeIcon(n.type, !n.read ? 'text-white' : '')}
                          </div>
                        <div className="flex-1 space-y-1">
                          <p className={`text-sm leading-tight ${!n.read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-snug">{n.message}</p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium pt-1">
                            <Clock className="size-3" />
                            {n.isSystem ? 'Priority Action' : timeAgo(n.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t border-border/50 p-2 text-center">
              <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-muted-foreground">
                View all activity
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
