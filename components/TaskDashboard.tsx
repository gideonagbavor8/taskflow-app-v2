"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckSquare, Plus, Menu, Bell, AlertCircle, Mail, Sun, Moon, FolderKanban } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

// Sub-components
import { Sidebar } from "./dashboard/Sidebar"
import { DashboardStats } from "./dashboard/DashboardStats"
import { TaskCard } from "./dashboard/TaskCard"
import { CreateTaskForm } from "./dashboard/CreateTaskForm"
import { Checkbox } from "@/components/ui/checkbox"

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

  const { data: tasks = [], mutate } = useSWR<Task[]>("/api/tasks", fetcher)
  const { data: preferences, mutate: mutatePrefs } = useSWR("/api/user/preferences", fetcher)

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

        if (diffInMs > 0 && diffInHours < 1) {
          urgent.push({ id: task.id, title: task.title, type: "CRITICAL" })
          if (notificationPermission === "granted" && diffInHours > 0.98) {
            new Notification("Task Due Soon!", {
              body: `${task.title} is due in less than an hour.`,
              icon: "/favicon.ico"
            })
          }
        } else if (diffInMs > 0 && diffInHours < 24) {
          urgent.push({ id: task.id, title: task.title, type: "URGENT" })
        }
      });
      setActiveReminders(urgent)
    }

    checkTasks()
    const interval = setInterval(checkTasks, 60000)
    return () => clearInterval(interval)
  }, [tasks, notificationPermission])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="mb-4 size-8 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      mutate()
    } catch (error) { console.error(error) }
  }

  const handlePriorityChange = async (taskId: string, newPriority: TaskPriority) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      })
      mutate()
    } catch (error) { console.error(error) }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure?")) return
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
      mutate()
    } catch (error) { console.error(error) }
  }

  const saveEdit = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      })
      setEditingTask(null)
      mutate()
    } catch (error) { console.error(error) }
  }

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, dueDate: newTask.dueDate || null }),
      })
      setNewTask({ title: "", description: "", priority: "MEDIUM", dueDate: "" })
      setShowCreateForm(false)
      mutate()
    } catch (error) { console.error(error) }
  }

  const handleAIEnhance = async () => {
    if (!newTask.title.trim()) return
    setIsEnhancing(true)
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "enhance", taskInput: `${newTask.title} ${newTask.description}` }),
      })
      const resp = await res.json()
      if (resp.success && resp.data) {
        setNewTask(prev => ({ ...prev, ...resp.data }))
      }
    } catch (error) { console.error(error) } finally { setIsEnhancing(false) }
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
    } catch (error) { console.error(error) }
  }

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === "All") return true
    if (activeFilter === "Completed") return task.status === "DONE"
    if (activeFilter === "Today") return task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString()
    if (activeFilter === "Upcoming") return task.dueDate && new Date(task.dueDate) > new Date() && task.status !== "DONE"
    return true
  })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        darkMode={darkMode}
        toggleDarkMode={() => { setDarkMode(!darkMode); document.documentElement.classList.toggle("dark"); }}
        session={session}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="size-5" />
              </Button>
              <h1 className="text-xl font-bold sm:text-2xl">{activeTab === "Tasks" ? "My Tasks" : activeTab}</h1>
            </div>
            {activeTab === "Tasks" && (
              <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-teal-600" onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">New Task</span>
              </Button>
            )}
          </div>

          {activeReminders.map((reminder) => (
            <div key={reminder.id} className={`mt-4 flex items-center justify-between rounded-lg border px-4 py-2 text-sm animate-pulse ${reminder.type === "CRITICAL" ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
              <div className="flex items-center gap-2">
                {reminder.type === "CRITICAL" ? <AlertCircle className="size-4" /> : <Bell className="size-4" />}
                <span>{reminder.type === "CRITICAL" ? "Critical" : "Upcoming"}: <strong>{reminder.title}</strong></span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("Tasks")}>View</Button>
            </div>
          ))}

          {notificationPermission === "default" && (
            <div className="mt-4 p-4 rounded-lg bg-cyan-50 border text-cyan-800 flex items-center justify-between">
              <span className="text-sm">Enable desktop notifications for reminders.</span>
              <Button size="sm" onClick={requestPermission} className="bg-cyan-600">Enable</Button>
            </div>
          )}

          {activeTab === "Tasks" && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {["All", "Today", "Upcoming", "Completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab as FilterTab)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${activeFilter === tab ? "bg-cyan-100 text-cyan-700" : "text-muted-foreground hover:bg-accent"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </header>

        {showCreateForm && (
          <CreateTaskForm
            newTask={newTask}
            setNewTask={setNewTask}
            onSave={handleCreateTask}
            onCancel={() => setShowCreateForm(false)}
            onEnhance={handleAIEnhance}
            isEnhancing={isEnhancing}
          />
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "Dashboard" && (
            <DashboardStats
              tasks={tasks}
              onNewTask={() => { setActiveTab("Tasks"); setShowCreateForm(true); }}
              onViewUpcoming={() => { setActiveTab("Tasks"); setActiveFilter("Upcoming"); }}
            />
          )}

          {activeTab === "Tasks" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  editingTask={editingTask}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  editDescription={editDescription}
                  setEditDescription={setEditDescription}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => setEditingTask(null)}
                  onStartEdit={(t) => { setEditingTask(t.id); setEditTitle(t.title); setEditDescription(t.description); }}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onPriorityChange={handlePriorityChange}
                  activeReminders={activeReminders}
                  formatDate={(d) => d ? new Date(d).toLocaleDateString() : null}
                  getPriorityColor={(p) => p === "HIGH" ? "bg-red-100 text-red-700" : p === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}
                  getStatusColor={(s) => s === "DONE" ? "bg-green-100 text-green-700" : s === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}
                />
              ))}
              <Card className="border-2 border-dashed cursor-pointer hover:bg-accent" onClick={() => setShowCreateForm(true)}>
                <CardContent className="flex items-center justify-center p-5 min-h-[200px]">
                  <div className="text-center">
                    <Plus className="mx-auto size-12 text-muted-foreground" />
                    <p className="font-medium text-muted-foreground">Add New Task</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "Projects" && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FolderKanban className="size-16 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Projects View coming soon!</h2>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="max-w-2xl space-y-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Account Profile</h2>
                    <div className="p-3 bg-accent rounded-lg text-sm">{session?.user?.name || session?.user?.email}</div>
                  </div>
                  <div className="border-t pt-6">
                    <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                    <Button variant="outline" onClick={() => { setDarkMode(!darkMode); document.documentElement.classList.toggle("dark"); }}>
                      {darkMode ? <Sun className="mr-2 size-5" /> : <Moon className="mr-2 size-5" />}
                      Switch Mode
                    </Button>
                  </div>
                  <div className="border-t pt-6">
                    <h2 className="text-lg font-semibold mb-4">Notifications</h2>
                    <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="size-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Email Reminders</p>
                          <p className="text-xs text-muted-foreground">Receive updates in your inbox.</p>
                        </div>
                      </div>
                      <Checkbox checked={preferences?.emailNotifications ?? true} onCheckedChange={toggleEmailNotifications} />
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
