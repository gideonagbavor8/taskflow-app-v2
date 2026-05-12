"use client"

import { Task, TaskStatus } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Clock, AlertCircle, MoreVertical, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface KanbanBoardProps {
  tasks: any[]
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onTaskClick: (task: any) => void
  onDelete: (taskId: string) => void
  formatDate: (date: string | null) => string | null
}

export default function KanbanBoard({ tasks, onStatusChange, onTaskClick, onDelete, formatDate }: KanbanBoardProps) {
  const columns: { title: string; status: TaskStatus; color: string }[] = [
    { title: "To Do", status: "TODO", color: "bg-gray-100 dark:bg-gray-800/50" },
    { title: "In Progress", status: "IN_PROGRESS", color: "bg-blue-50 dark:bg-blue-950/20" },
    { title: "Completed", status: "DONE", color: "bg-green-50 dark:bg-green-950/20" },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "MEDIUM": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      case "LOW": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  return (
    <div className="flex flex-1 gap-6 p-6 overflow-x-auto min-h-0">
      {columns.map((column) => (
        <div key={column.status} className={`flex flex-col w-80 shrink-0 rounded-xl ${column.color} p-4 border border-border/50`}>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              {column.title}
              <span className="bg-background px-2 py-0.5 rounded-full text-[10px] border border-border">
                {tasks.filter(t => t.status === column.status).length}
              </span>
            </h3>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
            {tasks
              .filter((t) => t.status === column.status)
              .map((task) => (
                <Card 
                  key={task.id} 
                  className="group cursor-pointer hover:shadow-md transition-all border-border/60 hover:border-cyan-500/50"
                  onClick={() => onTaskClick(task)}
                >
                  <CardContent className="p-4 space-y-3 min-w-0 overflow-hidden">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <h4 className="text-sm font-semibold leading-tight group-hover:text-cyan-600 transition-colors break-words flex-1 min-w-0">
                        {task.title}
                      </h4>
                        <Checkbox 
                          checked={task.status === "DONE"} 
                          onCheckedChange={() => onStatusChange(task.id, task.status === "DONE" ? "TODO" : "DONE")}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0"
                        />
                      </div>
                      
                      <div className="flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity opacity-100 mb-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            onTaskClick(task)
                          }}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(task.id)
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 font-bold ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>

                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                          <Clock className="size-3" />
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>

                    {task.project && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <div className="size-1.5 rounded-full" style={{ backgroundColor: task.project.color || '#0891b2' }} />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{task.project.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
