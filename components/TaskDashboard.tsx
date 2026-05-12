"use client"

import { useState, useEffect, useMemo } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { type Alert } from "@/components/AlertBanner"
import { CheckSquare, LayoutDashboard, FolderKanban, Settings, Plus, Menu, X, Moon, Sun, Trash2, Edit2, Sparkles, Wand2, MessageSquare, Calendar, PartyPopper, LogOut, Clock, HelpCircle, Search } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import KanbanBoard from "./KanbanBoard"
import WorkspaceSettings from "./WorkspaceSettings"
import NotificationBell from "./NotificationBell"
import TemplateSelector from "./TemplateSelector"
import TaskAttachments from "./TaskAttachments"
import { useRouter } from "next/navigation"

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

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
})

export default function TaskDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All")
  const [activeTab, setActiveTab] = useState<ActiveTab>("Tasks")
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "MEDIUM" as TaskPriority, dueDate: "" })
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [scrolled, setScrolled] = useState(false)
  const [showHelpPing, setShowHelpPing] = useState(false)
  const [showInactivityModal, setShowInactivityModal] = useState(false)
  const [inactivityCountdown, setInactivityCountdown] = useState(60)
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<Task[]>("/api/tasks", fetcher)
  const tasks = Array.isArray(data) ? data : []

  // Stats for gamification
  const stats = useMemo(() => {
    if (!Array.isArray(tasks)) return { completed: 0, pending: 0, total: 0 }
    const completed = tasks.filter(t => t.status === "DONE").length
    const total = tasks.length
    return { completed, pending: total - completed, total }
  }, [tasks])

  // Redirect if not authenticated safely using useEffect
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Theme Persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setDarkMode(true)
      document.documentElement.classList.add("dark")
    } else if (savedTheme === "light") {
      setDarkMode(false)
      document.documentElement.classList.remove("dark")
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      // Default to system preference if no saved theme
      setDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  // Generate alerts from tasks (Grouped and Derived via useMemo)
  const alerts = useMemo(() => {
    const newAlerts: Alert[] = []
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    if (!Array.isArray(tasks)) return []

    const overdueTasks = tasks.filter(t => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now)
    const dueSoonTasks = tasks.filter(t => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= tomorrow)
    const highPriorityTasks = tasks.filter(t => t.status !== "DONE" && t.priority === "HIGH")

    const addedTaskIds = new Set<string>()

    // 1. Overdue Tasks (Individual) - Highest Priority
    overdueTasks.forEach(task => {
      newAlerts.push({
        id: `overdue-${task.id}`,
        type: "overdue",
        title: task.title,
        message: `Task "${task.title}" is past the deadline.`,
        taskId: task.id,
        action: () => {
          setActiveTab("Tasks")
          setTimeout(() => {
            document.getElementById(`task-${task.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      })
      addedTaskIds.add(task.id)
    })

    // 2. Due Soon Tasks (Individual)
    dueSoonTasks.forEach(task => {
      if (!dismissedAlerts.has(`due-soon-${task.id}`) && !addedTaskIds.has(task.id)) {
        newAlerts.push({
          id: `due-soon-${task.id}`,
          type: "due-soon",
          title: task.title,
          message: `Task "${task.title}" is due soon.`,
          taskId: task.id,
          action: () => {
            setActiveTab("Tasks")
            setTimeout(() => {
              document.getElementById(`task-${task.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
          }
        })
        addedTaskIds.add(task.id)
      }
    })

    // 3. High Priority Tasks (Individual)
    highPriorityTasks.forEach(task => {
      if (!dismissedAlerts.has(`high-priority-${task.id}`) && !addedTaskIds.has(task.id)) {
        newAlerts.push({
          id: `high-priority-${task.id}`,
          type: "high-priority",
          title: task.title,
          message: `High priority task: "${task.title}"`,
          taskId: task.id,
          action: () => {
            setActiveTab("Tasks")
            setTimeout(() => {
              document.getElementById(`task-${task.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
          }
        })
        addedTaskIds.add(task.id)
      }
    })

    return newAlerts
  }, [tasks, dismissedAlerts])

  // Set up polling to refresh alerts frequently
  useEffect(() => {
    const pollInterval = setInterval(() => {
      mutate()
    }, 30000) // Refresh every 30 seconds to keep alerts fresh

    return () => clearInterval(pollInterval)
  }, [mutate])

  // Hourly Help Alert
  useEffect(() => {
    const ONE_HOUR = 60 * 60 * 1000
    const interval = setInterval(() => {
      setShowHelpPing(true)
      // Play a subtle animation for 10 seconds every hour
      setTimeout(() => setShowHelpPing(false), 10000)
    }, ONE_HOUR)

    return () => clearInterval(interval)
  }, [])

  // Inactivity / Session Timeout Logic
  useEffect(() => {
    const INACTIVITY_LIMIT = 15 * 60 * 1000 // 15 minutes
    let inactivityTimer: NodeJS.Timeout
    let countdownInterval: NodeJS.Timeout

    const handleSignOut = () => {
      signOut({ callbackUrl: "/login" })
    }

    const resetInactivityTimer = () => {
      setShowInactivityModal(false)
      setInactivityCountdown(60)
      if (inactivityTimer) clearTimeout(inactivityTimer)
      if (countdownInterval) clearInterval(countdownInterval)

      inactivityTimer = setTimeout(() => {
        setShowInactivityModal(true)
        // Start countdown
        countdownInterval = setInterval(() => {
          setInactivityCountdown((prev) => {
            if (prev <= 1) {
              handleSignOut()
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }, INACTIVITY_LIMIT)
    }

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach(event => window.addEventListener(event, resetInactivityTimer))

    resetInactivityTimer()

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      if (countdownInterval) clearInterval(countdownInterval)
      activityEvents.forEach(event => window.removeEventListener(event, resetInactivityTimer))
    }
  }, [])

  // Responsive Check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Show loading spinner while Auth is initializing
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
    return null
  }

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]))
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
    const newMode = !darkMode
    setDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      if (newStatus === "DONE") {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
      }
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

  const handleDueDateChange = async (taskId: string, newDate: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: newDate || null }),
      })
      mutate()
    } catch (error) {
      console.error("Error updating task due date:", error)
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

  const filteredTasks = Array.isArray(tasks) ? tasks.filter((task) => {
    const now = new Date()
    
    // Check Category Filter
    let matchesCategory = false
    if (activeFilter === "All") matchesCategory = true
    else if (activeFilter === "Completed") matchesCategory = task.status === "DONE"
    else if (activeFilter === "Today") {
      const today = new Date().toDateString()
      matchesCategory = !!(task.dueDate && new Date(task.dueDate).toDateString() === today)
    }
    else if (activeFilter === "Upcoming") {
      matchesCategory = !!(task.dueDate && new Date(task.dueDate) > now && task.status !== "DONE")
    }

    if (!matchesCategory) return false

    // Check Search Filter
    const searchLower = searchQuery.toLowerCase()
    return (
      task.title.toLowerCase().includes(searchLower) || 
      (task.description?.toLowerCase() || "").includes(searchLower)
    )
  }) : []

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
        <div className="flex h-full flex-col overflow-y-auto custom-scrollbar">
          {/* Logo & Workspace */}
          <div className="flex flex-col border-b border-border px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white shadow-sm border border-border/50 overflow-hidden">
                  <img src="/logo.png" alt="TaskFlow Logo" className="size-full object-cover" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-teal-600">TaskFlow</span>
              </div>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            
            {/* Workspace Switcher Placeholder */}
            <div className="flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-2 text-sm border border-border">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="font-medium truncate">{session?.user?.workspaceName || "Personal Workspace"}</span>
            </div>
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

          {/* Footer Section */}
          <div className="mt-auto border-t border-border p-4 space-y-4 bg-accent/5 dark:bg-accent/5">
            <div className="p-4 rounded-2xl bg-secondary/20 dark:bg-accent/10 border border-border/40 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-8 rounded-full bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <span className="text-white text-[10px] font-black">LVL</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] font-bold text-foreground uppercase tracking-widest leading-none mb-1">Productivity</h4>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-border/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-1000" 
                        style={{ width: `${Math.min(100, (stats.completed / Math.max(1, stats.total)) * 100)}%` }} 
                      />
                    </div>
                    <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                      {Math.round((stats.completed / Math.max(1, stats.total)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                {stats.completed === 0 
                  ? "Start your first task to unlock your productivity insights." 
                  : `You've achieved a ${Math.round((stats.completed / Math.max(1, stats.total)) * 100)}% completion rate so far.`
                }
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 px-2">
                <div className="size-9 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">{(session?.user?.name || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate leading-none mb-1 text-foreground">{session?.user?.name || session?.user?.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-muted-foreground truncate leading-none">Personal Space</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 font-bold transition-all h-9"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 size-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main 
        className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar bg-background"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 10)}
      >
        {/* Header - Sticky with Glassmorphism */}
        <header className={`sticky top-0 z-30 transition-all duration-300 px-6 py-4 border-b ${
          scrolled 
            ? "bg-background/80 backdrop-blur-md border-border/60 shadow-sm" 
            : "bg-transparent border-transparent"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between w-full lg:w-auto">
              <div className="flex items-center gap-4 min-w-0">
                <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setSidebarOpen(true)}>
                  <Menu className="size-5" />
                </Button>
                <h1 className={`text-lg sm:text-xl md:text-2xl font-bold truncate transition-all ${isSearchExpanded ? 'hidden sm:block' : ''}`}>
                  {activeTab === "Tasks" ? "My Tasks" : activeTab}
                </h1>
              </div>

              {/* Search Bar - Desktop */}
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-cyan-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-accent/30 border border-border/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:bg-background focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Search - Mobile Toggle */}
              <div className={`flex md:hidden items-center transition-all ${isSearchExpanded ? 'flex-1' : ''}`}>
                {isSearchExpanded ? (
                  <div className="relative w-full animate-in slide-in-from-right-4 duration-200">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-cyan-600" />
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-accent/50 border-cyan-500/30 rounded-xl py-2 pl-10 pr-10 text-sm outline-none"
                    />
                    <button 
                      onClick={() => { setIsSearchExpanded(false); setSearchQuery(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="size-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => setIsSearchExpanded(true)}>
                    <Search className="size-5" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <NotificationBell systemAlerts={alerts} />
              <Button variant="ghost" size="icon" className="hidden lg:flex size-10 rounded-xl" onClick={toggleDarkMode}>
                {darkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>
              <div className="hidden h-6 w-px bg-border mx-2 lg:block" />
              
              {activeTab === "Tasks" && (
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setIsTemplateModalOpen(true)} 
                    variant="outline" 
                    className="hidden sm:flex border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                  >
                    <Sparkles className="size-4 mr-2" />
                    Use Template
                  </Button>
                  <Button 
                    onClick={() => setShowCreateForm(true)} 
                    className="bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-500/20 px-3 sm:px-4"
                  >
                    <Plus className="size-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Task</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Filter Tabs & View Toggles - Sub-header */}
          {activeTab === "Tasks" && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveFilter(tab)
                    }}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeFilter === tab
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center rounded-lg border border-border p-1 bg-muted/50">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${viewMode === 'list' 
                      ? 'bg-white text-cyan-700 shadow-sm dark:bg-gray-800 dark:text-cyan-400' 
                      : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    LIST
                  </button>
                  <button
                    onClick={() => setViewMode('board')}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${viewMode === 'board' 
                      ? 'bg-white text-cyan-700 shadow-sm dark:bg-gray-800 dark:text-cyan-400' 
                      : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    BOARD
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="p-6">
          {activeTab === "Dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Tasks", value: Array.isArray(tasks) ? tasks.length : 0, color: "text-cyan-600" },
                  { label: "Completed", value: Array.isArray(tasks) ? tasks.filter(t => t.status === "DONE").length : 0, color: "text-green-600" },
                  { label: "In Progress", value: Array.isArray(tasks) ? tasks.filter(t => t.status === "IN_PROGRESS").length : 0, color: "text-blue-600" },
                  { label: "Alerts", value: alerts.length, color: "text-amber-600" }
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
                        const count = Array.isArray(tasks) ? tasks.filter(t => t.priority === p).length : 0;
                        const percent = Array.isArray(tasks) && tasks.length ? (count / tasks.length) * 100 : 0;
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
            <div className="space-y-6">
              {showCreateForm && (
                <div className="mb-8 animate-in slide-in-from-top-4 duration-300 max-w-4xl mx-auto w-full">
                  <Card className="border-cyan-500/20 dark:border-cyan-900/50 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 space-y-4">
                      <input
                        type="text"
                        placeholder="What needs to be done?"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        className="w-full text-lg font-bold bg-transparent border-none focus:ring-0 placeholder:text-muted-foreground/30"
                        autoFocus
                      />
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-purple-600 hover:text-purple-700"
                          onClick={handleAIEnhance}
                          disabled={isEnhancing || !newTask.title.trim()}
                        >
                          {isEnhancing ? <Clock className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
                          {isEnhancing ? "Optimizing..." : "Magic Enhance"}
                        </Button>
                      </div>
                      <textarea
                        placeholder="Add a description..."
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-muted-foreground/20 resize-none"
                        rows={2}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Priority</label>
                            <select
                              value={newTask.priority}
                              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                            >
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Due Date</label>
                            <input
                              type="date"
                              value={newTask.dueDate}
                              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                          <Button onClick={handleCreateTask} className="bg-cyan-600 hover:bg-cyan-700 shadow-lg">Create Task</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="size-8 animate-spin rounded-full border-4 border-cyan-600 border-r-transparent" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 rounded-3xl bg-accent/5">
                  <div className="size-16 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center mb-4">
                    <CheckSquare className="size-8 text-cyan-600" />
                  </div>
                  <h3 className="text-xl font-bold">No tasks found</h3>
                  <p className="text-muted-foreground max-w-sm mb-6">Looks like you're all caught up! Create a new task to get started.</p>
                  <Button onClick={() => setShowCreateForm(true)}>Create Task</Button>
                </div>
              ) : (viewMode === 'board' && !isMobile) ? (
                <KanbanBoard tasks={filteredTasks} onStatusChange={handleStatusChange} onTaskClick={startEdit} onDelete={handleDelete} formatDate={formatDate} />
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-20">
                  {filteredTasks.map((task) => (
                    <Card key={task.id} id={`task-${task.id}`} className="group hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.status === "DONE"}
                            onCheckedChange={(checked) => {
                              handleStatusChange(task.id, checked ? "DONE" : "TODO")
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-3 min-w-0">
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
                                <div className="py-2 border-y border-border/40 my-2">
                                  <TaskAttachments taskId={task.id} />
                                </div>
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
                                    className={`font-semibold leading-snug flex-1 break-words min-w-0 ${task.status === "DONE" ? "text-muted-foreground line-through" : ""
                                      }`}
                                  >
                                    {task.title}
                                  </h3>
                                  <div className="flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity opacity-100 bg-background/50 backdrop-blur-sm rounded-lg p-0.5 border border-border/20 lg:border-none lg:bg-transparent lg:backdrop-blur-none">
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
                                <p className="line-clamp-2 text-sm text-muted-foreground break-words">{task.description}</p>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex gap-2 flex-wrap">
                                    <Badge variant="secondary" className={getStatusColor(task.status)}>
                                      {task.status.replace("_", " ")}
                                    </Badge>
                                    <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                                      {task.priority}
                                    </Badge>
                                  </div>
                                  {task.dueDate && (
                                    <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase w-12 shrink-0">Status</span>
                                    <select
                                      value={task.status}
                                      onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                                      className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-2 py-1 text-[11px] focus:border-cyan-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                                    >
                                      <option value="TODO">Todo</option>
                                      <option value="IN_PROGRESS">In Progress</option>
                                      <option value="DONE">Done</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase w-12 shrink-0">Priority</span>
                                    <select
                                      value={task.priority}
                                      onChange={(e) => handlePriorityChange(task.id, e.target.value as TaskPriority)}
                                      className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-2 py-1 text-[11px] focus:border-cyan-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                                    >
                                      <option value="LOW">Low</option>
                                      <option value="MEDIUM">Medium</option>
                                      <option value="HIGH">High</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase w-12 shrink-0">Due Date</span>
                                    <input
                                      type="date"
                                      value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
                                      onChange={(e) => handleDueDateChange(task.id, e.target.value)}
                                      className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-2 py-1 text-[11px] focus:border-cyan-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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

              {/* End of List Indicator */}
              <div className="mt-12 mb-8 flex flex-col items-center justify-center text-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <PartyPopper className="size-4 text-cyan-600" />
                  <span>All caught up!</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You've completed <span className="font-bold text-foreground">{stats.completed}</span> {stats.completed === 1 ? 'task' : 'tasks'} today.
                </p>
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLSegTBIFmQCh-wR90E393Aj_qszr_TCOPxM5NA9iH29SljmN0A/viewform?usp=dialog" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 hover:text-cyan-700 hover:underline pt-2"
                >
                  Need help?
                </a>
              </div>
            </div>
          )}
          {activeTab === "Projects" && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <FolderKanban className="size-16 text-muted-foreground/20 mb-4" />
              <h2 className="text-2xl font-bold">Projects</h2>
              <p className="text-muted-foreground">Manage your workspace projects here. Coming soon!</p>
            </div>
          )}

          {activeTab === "Settings" && <WorkspaceSettings />}
        </div>

        {/* Global Overlays */}
        {showCelebration && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/20 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-500">
              <div className="size-20 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <PartyPopper className="size-10 text-cyan-600" />
              </div>
              <h2 className="text-3xl font-black text-cyan-600">MISSION COMPLETE!</h2>
              <p className="font-bold text-muted-foreground">Keep moving forward 🚀</p>
            </div>
          </div>
        )}

        {isTemplateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-4xl rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-3">
                  <Sparkles className="size-6 text-cyan-600" />
                  <h2 className="text-xl font-bold">Select Template</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsTemplateModalOpen(false)}><X className="size-5" /></Button>
              </div>
              <div className="p-6 overflow-y-auto">
                <TemplateSelector onSelect={async (templateId) => {
                  const res = await fetch('/api/templates/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId }) })
                  if (res.ok) { setIsTemplateModalOpen(false); mutate(); }
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Pulsing Help Button */}
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
          {showHelpPing && (
            <div className="bg-cyan-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce uppercase tracking-tighter">
              Need assistance?
            </div>
          )}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSegTBIFmQCh-wR90E393Aj_qszr_TCOPxM5NA9iH29SljmN0A/viewform?usp=dialog"
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative flex size-12 items-center justify-center rounded-full bg-cyan-600 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 ${
              showHelpPing ? 'ring-4 ring-cyan-500/30' : ''
            }`}
          >
            {/* Pulsing Background Rings */}
            <span className="absolute inset-0 rounded-full bg-cyan-600 animate-ping opacity-20 pointer-events-none" />
            <span className="absolute -inset-2 rounded-full bg-cyan-600 animate-pulse opacity-10 pointer-events-none" />
            
            <HelpCircle className="size-6 transition-transform group-hover:rotate-12" />
          </a>
        </div>

        {/* Inactivity Warning Modal */}
        {showInactivityModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl animate-in fade-in duration-300">
            <Card className="w-full max-w-md border-cyan-500/20 shadow-2xl overflow-hidden text-center p-8 space-y-6">
              <div className="mx-auto size-20 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Clock className="size-10 text-cyan-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Are you still there?</h2>
                <p className="text-muted-foreground">For your security, you will be signed out due to inactivity in:</p>
              </div>
              <div className="text-5xl font-black text-cyan-600 tabular-nums">
                {inactivityCountdown}s
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  onClick={() => {
                    // This will trigger the activity listeners and reset the timer
                    window.dispatchEvent(new Event('mousedown'));
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700 h-12 text-lg shadow-lg shadow-cyan-500/20"
                >
                  I'm Still Working
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-muted-foreground"
                >
                  Sign Out Now
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

