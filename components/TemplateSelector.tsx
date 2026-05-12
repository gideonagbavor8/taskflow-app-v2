"use client"

import { useState } from "react"
import { PROJECT_TEMPLATES } from "@/lib/templates"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Code, Megaphone, Users, ArrowRight, CheckCircle2 } from "lucide-react"

export default function TemplateSelector({ onSelect }: { onSelect: (templateId: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null)

  const getIcon = (id: string) => {
    switch (id) {
      case 'software-dev': return <Code className="size-6 text-blue-600" />
      case 'marketing-campaign': return <Megaphone className="size-6 text-orange-600" />
      case 'hr-onboarding': return <Users className="size-6 text-teal-600" />
      default: return <Sparkles className="size-6 text-purple-600" />
    }
  }

  const getBgColor = (id: string) => {
    switch (id) {
      case 'software-dev': return 'bg-blue-50 dark:bg-blue-950/20'
      case 'marketing-campaign': return 'bg-orange-50 dark:bg-orange-950/20'
      case 'hr-onboarding': return 'bg-teal-50 dark:bg-teal-950/20'
      default: return 'bg-purple-50'
    }
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECT_TEMPLATES.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all border-2 overflow-hidden hover:shadow-md ${selected === template.id ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-border/60 hover:border-cyan-200'}`}
            onClick={() => setSelected(template.id)}
          >
            <div className={`p-4 ${getBgColor(template.id)} border-b border-border/10 flex items-center justify-between`}>
              <div className="p-2 rounded-xl bg-white dark:bg-black/50 shadow-sm">
                {getIcon(template.id)}
              </div>
              {selected === template.id && (
                <CheckCircle2 className="size-5 text-cyan-600 animate-in zoom-in" />
              )}
            </div>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-bold text-sm">{template.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {template.description}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{template.tasks.length} Tasks</Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Ready to use</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end pt-4">
        <Button 
          disabled={!selected} 
          onClick={() => selected && onSelect(selected)}
          className="bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-500/20"
        >
          Use Template
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  )
}
