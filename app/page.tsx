"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckSquare, LayoutDashboard, FolderKanban, Settings, Plus, Menu, X, Moon, Sun } from "lucide-react"

type Priority = "Low" | "Medium" | "High"
type FilterTab = "All" | "Today" | "Upcoming" | "Completed"

interface Task {
    id: string
    title: string
    description: string
    priority: Priority
    dueDate: string
    completed: boolean
    assignees: Array<{ name: string; avatar?: string }>
}

export default function TaskDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(false)
    const [activeFilter, setActiveFilter] = useState<FilterTab>("All")

    const tasks: Task[] = [
        {
            id: "1",
            title: "Design System Updates",
            description:
                "Update the design system documentation with new component variants and accessibility guidelines for the team.",
            priority: "High",
            dueDate: "Dec 28",
            completed: false,
            assignees: [
                { name: "Sarah Johnson", avatar: "/diverse-woman-portrait.png" },
                { name: "Mike Chen", avatar: "/man.jpg" },
            ],
        },
        {
            id: "2",
            title: "API Integration",
            description: "Integrate the new REST API endpoints for user authentication and data synchronization.",
            priority: "High",
            dueDate: "Dec 26",
            completed: false,
            assignees: [{ name: "Alex Rivera", avatar: "/diverse-group.png" }],
        },
        {
            id: "3",
            title: "User Testing Session",
            description: "Conduct user testing sessions with 5 participants to gather feedback on the new onboarding flow.",
            priority: "Medium",
            dueDate: "Dec 30",
            completed: false,
            assignees: [
                { name: "Emma Davis", avatar: "/professional-woman.png" },
                { name: "James Wilson", avatar: "/man-professional.png" },
                { name: "Olivia Brown", avatar: "/woman-business.png" },
            ],
        },
        {
            id: "4",
            title: "Code Review",
            description: "Review pull requests for the authentication module and provide detailed feedback.",
            priority: "Medium",
            dueDate: "Dec 27",
            completed: true,
            assignees: [{ name: "Lucas Martinez", avatar: "/developer-working.png" }],
        },
        {
            id: "5",
            title: "Update Documentation",
            description: "Update project documentation with latest API changes and deployment instructions.",
            priority: "Low",
            dueDate: "Jan 2",
            completed: false,
            assignees: [{ name: "Sophia Anderson", avatar: "/woman-tech.png" }],
        },
        {
            id: "6",
            title: "Performance Optimization",
            description: "Analyze and optimize database queries to reduce page load times by at least 30%.",
            priority: "High",
            dueDate: "Dec 29",
            completed: false,
            assignees: [
                { name: "Ryan Taylor", avatar: "/diverse-engineers-meeting.png" },
                { name: "Mia Thomas", avatar: "/woman-engineer.png" },
            ],
        },
    ]

    const getPriorityColor = (priority: Priority) => {
        switch (priority) {
            case "High":
                return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
            case "Medium":
                return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
            case "Low":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
        }
    }

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
        document.documentElement.classList.toggle("dark")
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

                    {/* Dark Mode Toggle */}
                    <div className="border-t border-border p-4">
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
                        <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700">
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

                {/* Task Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {tasks.map((task) => (
                            <Card key={task.id} className="group hover:shadow-lg transition-shadow duration-200">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <Checkbox checked={task.completed} className="mt-1" onCheckedChange={() => { }} />
                                        <div className="flex-1 space-y-3">
                                            <h3
                                                className={`font-semibold leading-snug ${task.completed ? "text-muted-foreground line-through" : ""
                                                    }`}
                                            >
                                                {task.title}
                                            </h3>
                                            <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                                                    {task.priority}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                                            </div>
                                            <div className="flex -space-x-2">
                                                {task.assignees.map((assignee, index) => (
                                                    <Avatar key={index} className="size-8 border-2 border-background ring-1 ring-border">
                                                        <AvatarImage src={assignee.avatar || "/placeholder.svg"} alt={assignee.name} />
                                                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-600 text-xs text-white">
                                                            {assignee.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Add Task Card */}
                        <Card className="border-2 border-dashed hover:border-cyan-500 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-colors cursor-pointer">
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
                </div>
            </main>
        </div>
    )
}
