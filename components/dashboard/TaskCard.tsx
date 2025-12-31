"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"

interface TaskCardProps {
    task: any
    editingTask: string | null
    editTitle: string
    setEditTitle: (val: string) => void
    editDescription: string
    setEditDescription: (val: string) => void
    onSaveEdit: (id: string) => void
    onCancelEdit: () => void
    onStartEdit: (task: any) => void
    onDelete: (id: string) => void
    onStatusChange: (id: string, status: any) => void
    onPriorityChange: (id: string, priority: any) => void
    activeReminders: any[]
    formatDate: (date: string | null) => string | null
    getPriorityColor: (priority: any) => string
    getStatusColor: (status: any) => string
}

export function TaskCard({
    task,
    editingTask,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    onSaveEdit,
    onCancelEdit,
    onStartEdit,
    onDelete,
    onStatusChange,
    onPriorityChange,
    activeReminders,
    formatDate,
    getPriorityColor,
    getStatusColor
}: TaskCardProps) {
    const isEditing = editingTask === task.id
    const reminder = activeReminders.find(r => r.id === task.id)

    return (
        <Card className="group hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-5">
                <div className="flex items-start gap-3">
                    <Checkbox
                        checked={task.status === "DONE"}
                        onCheckedChange={(checked) => {
                            onStatusChange(task.id, checked ? "DONE" : "TODO")
                        }}
                        className="mt-1"
                    />
                    <div className="flex-1 space-y-3">
                        {isEditing ? (
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
                                    <Button size="sm" onClick={() => onSaveEdit(task.id)} className="bg-cyan-600">
                                        Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={onCancelEdit}>
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
                                            onClick={() => onStartEdit(task)}
                                        >
                                            <Edit2 className="size-3" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="size-6 text-red-600 hover:text-red-700"
                                            onClick={() => onDelete(task.id)}
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
                                        {reminder?.type === "CRITICAL" && (
                                            <Badge className="bg-red-600 text-white animate-pulse">CRITICAL</Badge>
                                        )}
                                        {reminder?.type === "URGENT" && (
                                            <Badge variant="outline" className="text-amber-600 border-amber-600">DUE SOON</Badge>
                                        )}
                                    </div>
                                    {task.dueDate && (
                                        <span className="text-xs text-muted-foreground text-right">{formatDate(task.dueDate)}</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        value={task.status}
                                        onChange={(e) => onStatusChange(task.id, e.target.value)}
                                        className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs focus:border-cyan-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="TODO">Todo</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="DONE">Done</option>
                                    </select>
                                    <select
                                        value={task.priority}
                                        onChange={(e) => onPriorityChange(task.id, e.target.value)}
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
    )
}
