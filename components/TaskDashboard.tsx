"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckSquare, LayoutDashboard, FolderKanban, Settings, Plus, Menu, X, Moon, Sun, Trash2, Edit2 } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"
type TaskPriority = "LOW" | "MEDIUM" | "HIGH"
type FilterTab = "All" | "Today" | "Upcoming" | "Completed"

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
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "MEDIUM" as TaskPriority, dueDate: "" })

  const { data: tasks = [], error, isLoading, mutate } = useSWR<Task[]>("/api/tasks", fetcher)

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
    { name: "Dashboard", icon: LayoutDashboard, active: false },
    { name: "Tasks", icon: CheckSquare, active: true },
    { name: "Projects", icon: FolderKanban, active: false },
    { name: "Settings", icon: Settings, active: false },
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
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${item.active
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
              <h1 className="text-2xl font-bold">My Tasks</h1>
            </div>
            <Button
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="mr-2 size-4" />
              New Task
            </Button>
          </div>

          {/* Filter Tabs */}
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
                <textarea
                  placeholder="Description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  rows={2}
                />
                <div className="flex gap-2">
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <Button onClick={handleCreateTask} className="bg-gradient-to-r from-cyan-600 to-teal-600">
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Task Grid */}
        <div className="flex-1 overflow-y-auto p-6">
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
        </div>
      </main>
    </div>
  )
}

