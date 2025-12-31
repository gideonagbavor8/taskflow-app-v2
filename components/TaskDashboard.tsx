"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckSquare, LayoutDashboard, FolderKanban, Settings, Plus, Menu, X, Moon, Sun, Trash2, Edit2, Sparkles, Wand2, Bell, AlertCircle, AlertTriangle, Mail } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"
type TaskPriority = "LOW" | "MEDIUM" | "HIGH"
type FilterTab = "All" | "Today" | "Upcoming" | "Completed"
type ActiveTab = "Dashboard" | "Tasks" | "Projects" | "Settings"

interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function TaskDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All")
  const [activeTab, setActiveTab] = useState<ActiveTab>("Tasks")
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "MEDIUM" as TaskPriority, dueDate: "" })
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [activeReminders, setActiveReminders] = useState<{ id: string; title: string; type: "CRITICAL" | "URGENT" }[]>([])
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  const { data: tasks = [], error, isLoading, mutate } = useSWR<Task[]>("/api/tasks", fetcher)
  const { data: preferences, mutate: mutatePrefs } = useSWR("/api/user/preferences", fetcher)

  // Request Notification Permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
    }
  }

  const toggleEmailNotifications = async () => {
    try {
      const newValue = !preferences?.emailNotifications
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications: newValue }),
      })
      mutatePrefs()
    } catch (error) {
      console.error("Error updating preferences:", error)
    }
  }

  // Background Reminder Checker
  useEffect(() => {
    const checkTasks = () => {
      const now = new Date().getTime()
      const urgent: typeof activeReminders = []

      tasks.forEach((task) => {
        if (task.status === "DONE" || !task.dueDate) return

        const dueTime = new Date(task.dueDate).getTime()
        const diffInMs = dueTime - now
        const diffInHours = diffInMs / (1000 * 60 * 60)

        // Critical: < 1 hour
        if (diffInMs > 0 && diffInHours < 1) {
          urgent.push({ id: task.id, title: task.title, type: "CRITICAL" })

          // Browser Push Notification (only once per task check if possible)
          if (notificationPermission === "granted" && diffInHours > 0.98) { // Only if just entering critical range
            new Notification("Task Due Soon!", {
              body: `${task.title} is due in less than an hour.`,
              icon: "/favicon.ico"
            })
          }
        }
        // Urgent: < 24 hours
        else if (diffInMs > 0 && diffInHours < 24) {
          urgent.push({ id: task.id, title: task.title, type: "URGENT" })
        }
      });

      setActiveReminders(urgent)
    }

    checkTasks()
    const interval = setInterval(checkTasks, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [tasks, notificationPermission])

  // Redirect if not authenticated
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block size-8 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
      case "MEDIUM":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
      case "LOW":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "DONE":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
      case "TODO":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      mutate()
    } catch (error) {
      console.error("Error updating task status:", error)
    }
  }

  const handlePriorityChange = async (taskId: string, newPriority: TaskPriority) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      })
      mutate()
    } catch (error) {
      console.error("Error updating task priority:", error)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })
      mutate()
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const startEdit = (task: Task) => {
    setEditingTask(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description)
  }

  const saveEdit = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
        }),
      })
      setEditingTask(null)
      mutate()
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const cancelEdit = () => {
    setEditingTask(null)
    setEditTitle("")
    setEditDescription("")
  }

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          dueDate: newTask.dueDate || null,
        }),
      })
      setNewTask({ title: "", description: "", priority: "MEDIUM", dueDate: "" })
      setShowCreateForm(false)
      mutate()
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const handleAIEnhance = async () => {
    if (!newTask.title.trim()) return

    setIsEnhancing(true)
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "enhance",
          taskInput: `${newTask.title} ${newTask.description}`
        }),
      })

      const responseData = await res.json()

      if (responseData.success && responseData.data) {
        const { title, description, priority } = responseData.data
        setNewTask(prev => ({
          ...prev,
          title: title || prev.title,
          description: description || prev.description,
          priority: (priority as TaskPriority) || prev.priority
        }))
      }
    } catch (error) {
      console.error("AI Enhance failed:", error)
    } finally {
      setIsEnhancing(false)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === "All") return true
    if (activeFilter === "Completed") return task.status === "DONE"
    if (activeFilter === "Today") {
      const today = new Date().toDateString()
      return task.dueDate && new Date(task.dueDate).toDateString() === today
    }
    if (activeFilter === "Upcoming") {
      return task.dueDate && new Date(task.dueDate) > new Date() && task.status !== "DONE"
    }
    return true
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Tasks", icon: CheckSquare },
    { name: "Projects", icon: FolderKanban },
    { name: "Settings", icon: Settings },
  ]

  const filterTabs: FilterTab[] = ["All", "Today", "Upcoming", "Completed"]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600">
                <CheckSquare className="size-5 text-white" />
              </div>
              <span className="text-lg font-semibold">TaskFlow</span>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="size-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setActiveTab(item.name as ActiveTab)
                  setSidebarOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === item.name
                  ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                <item.icon className="size-5" />
                {item.name}
              </button>
            ))}
          </nav>

          {/* User Info & Actions */}
          <div className="border-t border-border p-4 space-y-2">
            <div className="px-3 py-2 text-sm">
              <p className="font-medium">{session?.user?.name || session?.user?.email}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
            <Button variant="outline" className="w-full justify-start bg-transparent" onClick={toggleDarkMode}>
              {darkMode ? (
                <>
                  <Sun className="mr-2 size-5" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="mr-2 size-5" />
                  Dark Mode
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent text-red-600 hover:text-red-700 dark:text-red-400"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="size-5" />
              </Button>
              <h1 className="text-xl font-bold sm:text-2xl">
                {activeTab === "Tasks" ? "My Tasks" : activeTab}
              </h1>
            </div>
            {activeTab === "Tasks" && (
              <Button
                size="sm"
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 sm:size-default"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <Plus className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">New Task</span>
                <span className="sm:hidden">Task</span>
              </Button>
            )}
          </div>

          {/* Active Reminders Banner */}
          {activeReminders.length > 0 && (
            <div className="mt-4 space-y-2">
              {activeReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-medium animate-pulse ${reminder.type === "CRITICAL"
                    ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900"
                    : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {reminder.type === "CRITICAL" ? <AlertCircle className="size-4" /> : <Bell className="size-4" />}
                    <span>
                      {reminder.type === "CRITICAL" ? "Critical" : "Upcoming"}: <strong>{reminder.title}</strong> is due {reminder.type === "CRITICAL" ? "very soon!" : "today."}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs hover:bg-black/5"
                    onClick={() => setActiveTab("Tasks")}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Notification Permission Prompt if default */}
          {notificationPermission === "default" && (
            <div className="mt-4 p-4 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-800 dark:bg-cyan-950/30 dark:border-cyan-900 dark:text-cyan-400 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Bell className="size-4" />
                <span>Stay on track! Enable desktop notifications for urgent reminders.</span>
              </div>
              <Button size="sm" onClick={requestPermission} className="bg-cyan-600 hover:bg-cyan-700 shrink-0">
                Enable
              </Button>
            </div>
          )}

          {/* Filter Tabs - Only show on Tasks tab */}
          {activeTab === "Tasks" && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeFilter === tab
                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Create Task Form */}
        {showCreateForm && (
          <div className="border-b border-border bg-card p-6">
            <Card>
              <CardContent className="p-4 space-y-4">
                <input
                  type="text"
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 -mt-2"
                    onClick={handleAIEnhance}
                    disabled={isEnhancing || !newTask.title.trim()}
                  >
                    {isEnhancing ? (
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                    ) : (
                      <Sparkles className="mr-2 size-4" />
                    )}
                    {isEnhancing ? "Magically optimizing..." : "Magic Enhance"}
                  </Button>
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  rows={2}
                />
                <div className="grid grid-cols-1 gap-3 sm:flex sm:items-center sm:gap-2">
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:w-auto"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:w-auto"
                  />
                  <div className="flex gap-2 sm:ml-auto">
                    <Button onClick={handleCreateTask} className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 sm:flex-none">
                      Create
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1 sm:flex-none">
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "Dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Tasks", value: tasks.length, color: "text-cyan-600" },
                  { label: "Completed", value: tasks.filter(t => t.status === "DONE").length, color: "text-green-600" },
                  { label: "In Progress", value: tasks.filter(t => t.status === "IN_PROGRESS").length, color: "text-blue-600" },
                  { label: "High Priority", value: tasks.filter(t => t.priority === "HIGH" && t.status !== "DONE").length, color: "text-red-600" }
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="mb-4 text-lg font-semibold">Priority Distribution</h2>
                    <div className="space-y-4">
                      {["HIGH", "MEDIUM", "LOW"].map((p) => {
                        const count = tasks.filter(t => t.priority === p).length;
                        const percent = tasks.length ? (count / tasks.length) * 100 : 0;
                        return (
                          <div key={p} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{p}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-accent">
                              <div
                                className={`h-full rounded-full ${p === "HIGH" ? "bg-red-500" : p === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2"
                        onClick={() => { setActiveTab("Tasks"); setShowCreateForm(true); }}
                      >
                        <Plus className="size-5" />
                        <span>New Task</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2"
                        onClick={() => { setActiveTab("Tasks"); setActiveFilter("Upcoming"); }}
                      >
                        <FolderKanban className="size-5" />
                        <span>Upcoming</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "Tasks" && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mb-4 inline-block size-8 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
                    <p className="text-muted-foreground">Loading tasks...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-red-600 dark:text-red-400">Error loading tasks. Please try again.</p>
                  </div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-muted-foreground">No tasks found. Create your first task!</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredTasks.map((task) => (
                    <Card key={task.id} className="group hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.status === "DONE"}
                            onCheckedChange={(checked) => {
                              handleStatusChange(task.id, checked ? "DONE" : "TODO")
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-3">
                            {editingTask === task.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm font-semibold focus:border-cyan-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                  autoFocus
                                />
                                <textarea
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-cyan-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveEdit(task.id)} className="bg-cyan-600">
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between gap-2">
                                  <h3
                                    className={`font-semibold leading-snug flex-1 ${task.status === "DONE" ? "text-muted-foreground line-through" : ""
                                      }`}
                                  >
                                    {task.title}
                                  </h3>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="size-6"
                                      onClick={() => startEdit(task)}
                                    >
                                      <Edit2 className="size-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="size-6 text-red-600 hover:text-red-700"
                                      onClick={() => handleDelete(task.id)}
                                    >
                                      <Trash2 className="size-3" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex gap-2 flex-wrap">
                                    <Badge variant="secondary" className={getStatusColor(task.status)}>
                                      {task.status.replace("_", " ")}
                                    </Badge>
                                    <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                                      {task.priority}
                                    </Badge>
                                    {activeReminders.find(r => r.id === task.id)?.type === "CRITICAL" && (
                                      <Badge className="bg-red-600 text-white animate-pulse">CRITICAL</Badge>
                                    )}
                                    {activeReminders.find(r => r.id === task.id)?.type === "URGENT" && (
                                      <Badge variant="outline" className="text-amber-600 border-amber-600">DUE SOON</Badge>
                                    )}
                                  </div>
                                  {task.dueDate && (
                                    <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <select
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                                    className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs focus:border-cyan-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                  >
                                    <option value="TODO">Todo</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="DONE">Done</option>
                                  </select>
                                  <select
                                    value={task.priority}
                                    onChange={(e) => handlePriorityChange(task.id, e.target.value as TaskPriority)}
                                    className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs focus:border-cyan-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                  >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                  </select>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Add Task Card */}
                  <Card
                    className="border-2 border-dashed hover:border-cyan-500 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-colors cursor-pointer"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <CardContent className="flex items-center justify-center p-5 h-full min-h-[240px]">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-950">
                          <Plus className="size-6 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <p className="font-medium text-muted-foreground">Add New Task</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {activeTab === "Projects" && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FolderKanban className="size-16 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Projects View coming soon!</h2>
              <p className="text-muted-foreground max-w-md">We are working on a feature to group your tasks into dedicated projects for better organization.</p>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="max-w-2xl space-y-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Account Profile</h2>
                    <p className="text-sm text-muted-foreground mb-4">Update your personal information and profile settings.</p>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Logged in as</label>
                        <div className="p-3 bg-accent rounded-lg text-sm">
                          {session?.user?.name || session?.user?.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h2 className="text-lg font-semibold mb-1">Appearance</h2>
                    <p className="text-sm text-muted-foreground mb-4">Customize how TaskFlow looks for you.</p>
                    <Button variant="outline" onClick={toggleDarkMode} className="w-full sm:w-auto">
                      {darkMode ? <Sun className="mr-2 size-5" /> : <Moon className="mr-2 size-5" />}
                      Switch to {darkMode ? "Light" : "Dark"} Mode
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <h2 className="text-lg font-semibold mb-1">Notifications</h2>
                    <p className="text-sm text-muted-foreground mb-4">Manage how you receive updates about your tasks.</p>
                    <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Mail className="size-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Email Reminders</p>
                          <p className="text-xs text-muted-foreground">Receive a summary of upcoming tasks in your inbox.</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={preferences?.emailNotifications ?? true}
                        onCheckedChange={toggleEmailNotifications}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

