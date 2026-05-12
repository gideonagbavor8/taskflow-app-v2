"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, Mail, ToggleLeft, UserCheck, Users } from "lucide-react"

export default function NotificationPreferences() {
  const [settings, setSettings] = useState<any>({
    emailNotifications: true,
    inAppNotifications: true,
    taskAssignments: true,
    workspaceInvites: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/settings")
      if (res.ok) {
        const data = await res.json()
        if (Object.keys(data).length > 0) {
          setSettings(data)
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSuccess(false)
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      console.error("Failed to save settings", err)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSetting = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }))
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading preferences...</div>

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <div className="p-4 bg-muted/30 border-b border-border/50">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Notification Preferences</h2>
      </div>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center text-cyan-600">
                <Bell className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold">In-App Notifications</p>
                <p className="text-xs text-muted-foreground">Show alerts in the dashboard bell</p>
              </div>
            </div>
            <Checkbox 
              checked={settings.inAppNotifications} 
              onCheckedChange={() => toggleSetting('inAppNotifications')} 
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600">
                <Mail className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Get daily digests and urgent alerts</p>
              </div>
            </div>
            <Checkbox 
              checked={settings.emailNotifications} 
              onCheckedChange={() => toggleSetting('emailNotifications')} 
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Workspace Invitations</p>
                <p className="text-xs text-muted-foreground">When someone invites you to a team</p>
              </div>
            </div>
            <Checkbox 
              checked={settings.workspaceInvites} 
              onCheckedChange={() => toggleSetting('workspaceInvites')} 
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-600">
                <UserCheck className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Task Assignments</p>
                <p className="text-xs text-muted-foreground">When a task is assigned to you</p>
              </div>
            </div>
            <Checkbox 
              checked={settings.taskAssignments} 
              onCheckedChange={() => toggleSetting('taskAssignments')} 
            />
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          className={`w-full transition-all ${success ? 'bg-green-600 hover:bg-green-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : success ? "Preferences Saved!" : "Update Preferences"}
        </Button>
      </CardContent>
    </Card>
  )
}
