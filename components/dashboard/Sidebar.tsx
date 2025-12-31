"use client"

import { Button } from "@/components/ui/button"
import { CheckSquare, LayoutDashboard, FolderKanban, Settings, X, Moon, Sun } from "lucide-react"
import { signOut } from "next-auth/react"

interface SidebarProps {
    activeTab: string
    setActiveTab: (tab: any) => void
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    darkMode: boolean
    toggleDarkMode: () => void
    session: any
}

export function Sidebar({
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    darkMode,
    toggleDarkMode,
    session
}: SidebarProps) {
    const navItems = [
        { name: "Dashboard", icon: LayoutDashboard },
        { name: "Tasks", icon: CheckSquare },
        { name: "Projects", icon: FolderKanban },
        { name: "Settings", icon: Settings },
    ]

    return (
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
                                setActiveTab(item.name)
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
                        <p className="font-medium truncate">{session?.user?.name || session?.user?.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
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
    )
}
