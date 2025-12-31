"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FolderKanban } from "lucide-react"

interface DashboardStatsProps {
    tasks: any[]
    onNewTask: () => void
    onViewUpcoming: () => void
}

export function DashboardStats({ tasks, onNewTask, onViewUpcoming }: DashboardStatsProps) {
    const stats = [
        { label: "Total Tasks", value: tasks.length, color: "text-cyan-600" },
        { label: "Completed", value: tasks.filter(t => t.status === "DONE").length, color: "text-green-600" },
        { label: "In Progress", value: tasks.filter(t => t.status === "IN_PROGRESS").length, color: "text-blue-600" },
        { label: "High Priority", value: tasks.filter(t => t.priority === "HIGH" && t.status !== "DONE").length, color: "text-red-600" }
    ]

    const priorities = ["HIGH", "MEDIUM", "LOW"]

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
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
                            {priorities.map((p) => {
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
                                onClick={onNewTask}
                            >
                                <Plus className="size-5" />
                                <span>New Task</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-20 flex-col gap-2"
                                onClick={onViewUpcoming}
                            >
                                <FolderKanban className="size-5" />
                                <span>Upcoming</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
