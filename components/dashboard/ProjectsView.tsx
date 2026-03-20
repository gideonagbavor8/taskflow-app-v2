"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FolderKanban, Edit2, Trash2, X, Check, Palette } from "lucide-react"
import { TaskCard } from "./TaskCard"

interface Project {
  id: string
  name: string
  description: string | null
  color: string
  createdAt: string
  updatedAt: string
  taskCount: number
  completedCount: number
  tasks?: Task[]
}

interface Task {
  id: string
  title: string
  description: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate: string | null
  createdAt: string
  updatedAt: string
  projectId: string | null
  project?: {
    id: string
    name: string
    color: string
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const PROJECT_COLORS = [
  "#0891b2", // cyan
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // sky
  "#84cc16", // lime
]

export function ProjectsView() {
  const { data: projects = [], mutate } = useSWR<Project[]>("/api/projects", fetcher)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [newProject, setNewProject] = useState({ name: "", description: "", color: "#0891b2" })
  const [editProject, setEditProject] = useState({ name: "", description: "", color: "#0891b2" })

  const { data: projectData, mutate: mutateProjectTasks } = useSWR<{
    id: string
    name: string
    description: string | null
    color: string
    createdAt: string
    updatedAt: string
    tasks: Task[]
  }>(
    selectedProject ? `/api/projects/${selectedProject}` : null,
    fetcher
  )
  
  const projectTasks = projectData?.tasks || []

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      })
      setNewProject({ name: "", description: "", color: "#0891b2" })
      setShowCreateForm(false)
      mutate()
    } catch (error) {
      console.error(error)
    }
  }

  const handleUpdateProject = async (projectId: string) => {
    if (!editProject.name.trim()) return
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProject),
      })
      setEditingProject(null)
      mutate()
      if (selectedProject === projectId) {
        // Refresh project tasks if editing selected project
        mutateProjectTasks()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? Tasks will be unassigned but not deleted.")) return
    try {
      await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
      mutate()
      if (selectedProject === projectId) {
        setSelectedProject(null)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const startEdit = (project: Project) => {
    setEditingProject(project.id)
    setEditProject({
      name: project.name,
      description: project.description || "",
      color: project.color,
    })
  }

  const selectedProjectData = projects.find((p) => p.id === selectedProject)

  if (selectedProject && selectedProjectData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedProject(null)}>
              ← Back to Projects
            </Button>
            <div
              className="size-4 rounded-full"
              style={{ backgroundColor: selectedProjectData.color }}
            />
            <h2 className="text-2xl font-bold">{selectedProjectData.name}</h2>
          </div>
        </div>

        {selectedProjectData.description && (
          <p className="text-muted-foreground">{selectedProjectData.description}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projectTasks.length > 0 ? (
            projectTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                editingTask={null}
                editTitle=""
                setEditTitle={() => {}}
                editDescription=""
                setEditDescription={() => {}}
                onSaveEdit={() => {}}
                onCancelEdit={() => {}}
                onStartEdit={() => {}}
                onDelete={() => {}}
                onStatusChange={async (taskId, newStatus) => {
                  await fetch(`/api/tasks/${taskId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                  })
                  mutateProjectTasks()
                }}
                onPriorityChange={async (taskId, newPriority) => {
                  await fetch(`/api/tasks/${taskId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ priority: newPriority }),
                  })
                  mutateProjectTasks()
                }}
                activeReminders={[]}
                formatDate={(d) => (d ? new Date(d).toLocaleDateString() : null)}
                getPriorityColor={(p) =>
                  p === "HIGH"
                    ? "bg-red-100 text-red-700"
                    : p === "MEDIUM"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                }
                getStatusColor={(s) =>
                  s === "DONE"
                    ? "bg-green-100 text-green-700"
                    : s === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                }
              />
            ))
          ) : (
            <Card className="col-span-full border-2 border-dashed">
              <CardContent className="flex items-center justify-center p-12">
                <div className="text-center">
                  <FolderKanban className="mx-auto size-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tasks in this project yet</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button
          size="sm"
          className="bg-gradient-to-r from-cyan-600 to-teal-600"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus className="size-4 sm:mr-2" />
          <span className="hidden sm:inline">New Project</span>
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Create New Project</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description (optional)</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewProject({ ...newProject, color })}
                      className={`size-8 rounded-full border-2 ${
                        newProject.color === color ? "border-gray-900 scale-110" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {editingProject === project.id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-4 rounded-full"
                        style={{ backgroundColor: editProject.color }}
                      />
                      <input
                        type="text"
                        value={editProject.name}
                        onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                        className="flex-1 px-2 py-1 border rounded text-sm font-semibold"
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => handleUpdateProject(project.id)}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setEditingProject(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={editProject.description}
                    onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Description"
                    rows={2}
                  />
                  <div className="flex gap-1">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditProject({ ...editProject, color })}
                        className={`size-5 rounded-full border ${
                          editProject.color === color ? "border-gray-900 scale-110" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="size-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <h3
                        className="font-semibold text-lg cursor-pointer hover:underline"
                        onClick={() => setSelectedProject(project.id)}
                      >
                        {project.name}
                      </h3>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => startEdit(project)}
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">
                        {project.taskCount} {project.taskCount === 1 ? "task" : "tasks"}
                      </span>
                      <span className="text-green-600">
                        {project.completedCount} completed
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedProject(project.id)}
                    >
                      View Tasks
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {projects.length === 0 && !showCreateForm && (
          <Card className="col-span-full border-2 border-dashed">
            <CardContent className="flex items-center justify-center p-12">
              <div className="text-center">
                <FolderKanban className="mx-auto size-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No projects yet</p>
                <Button onClick={() => setShowCreateForm(true)}>Create Your First Project</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
