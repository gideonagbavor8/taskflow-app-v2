"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Plus } from "lucide-react"

interface CreateTaskFormProps {
    newTask: any
    setNewTask: (task: any) => void
    onSave: () => void
    onCancel: () => void
    onEnhance: () => void
    isEnhancing: boolean
}

export function CreateTaskForm({
    newTask,
    setNewTask,
    onSave,
    onCancel,
    onEnhance,
    isEnhancing
}: CreateTaskFormProps) {
    return (
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
                            onClick={onEnhance}
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
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
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
                            <Button onClick={onSave} className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 sm:flex-none">
                                Create
                            </Button>
                            <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
