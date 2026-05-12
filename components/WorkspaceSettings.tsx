"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Settings as SettingsIcon, Shield, Trash2, Mail } from "lucide-react"
import NotificationPreferences from "./NotificationPreferences"

export default function WorkspaceSettings() {
  const { data: session } = useSession()
  const [workspaceName, setWorkspaceName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [members, setMembers] = useState<any[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const workspaceId = session?.user?.workspaceId

  useEffect(() => {
    if (workspaceId) {
      setWorkspaceName(session?.user?.workspaceName || "")
      fetchMembers()
    }
  }, [workspaceId])

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch (err) {
      console.error("Failed to fetch members", err)
    }
  }

  const handleUpdateName = async () => {
    if (!workspaceId) return
    setIsUpdating(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      })
      if (res.ok) {
        setSuccess("Workspace name updated successfully!")
        // Note: Ideally refresh the session here to update the global workspace name
      } else {
        const data = await res.json()
        setError(data.error || "Failed to update workspace name")
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleInvite = async () => {
    if (!workspaceId || !inviteEmail) return
    setIsInviting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      })
      if (res.ok) {
        setSuccess(`Successfully invited ${inviteEmail}!`)
        setInviteEmail("")
        fetchMembers()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to invite member")
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
          <SettingsIcon className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Workspace Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your team and workspace preferences</p>
        </div>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-xl text-sm font-medium ${error ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
          {error || success}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* General Settings */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/30 border-b border-border/50">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">General Info</h2>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Workspace Name</label>
                <Input 
                  value={workspaceName} 
                  onChange={(e) => setWorkspaceName(e.target.value)} 
                  className="bg-muted/30"
                />
              </div>
              <Button 
                onClick={handleUpdateName} 
                className="w-full bg-cyan-600 hover:bg-cyan-700"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
          <NotificationPreferences />
        </div>

        {/* Members Management */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/30 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Team Members</h2>
              <Badge variant="outline" className="bg-white dark:bg-black">{members.length} Members</Badge>
            </div>
            <CardContent className="p-6 space-y-6">
              {/* Invite Form */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Enter teammate's email" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={handleInvite} 
                  variant="outline" 
                  className="border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                  disabled={isInviting || !inviteEmail}
                >
                  <UserPlus className="mr-2 size-4" />
                  {isInviting ? "Inviting..." : "Invite"}
                </Button>
              </div>

              {/* Members List */}
              <div className="divide-y divide-border/50 rounded-xl border border-border/50 overflow-hidden">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-accent flex items-center justify-center font-bold text-cyan-700">
                        {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{member.user.name || "Member"}</p>
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={`px-2 py-0 text-[10px] font-bold ${member.role === 'ADMIN' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100'}`}>
                        {member.role === 'ADMIN' && <Shield className="mr-1 size-3" />}
                        {member.role}
                      </Badge>
                      {member.userId !== session?.user?.id && (
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600">
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
