export type TemplateTask = {
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
}

export type ProjectTemplate = {
  id: string
  name: string
  description: string
  tasks: TemplateTask[]
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'software-dev',
    name: 'Software Development',
    description: 'A standard sprint template for building features and fixing bugs.',
    tasks: [
      { title: 'Project Kickoff', description: 'Define goals and milestones.', status: 'TODO', priority: 'HIGH' },
      { title: 'Setup Environment', description: 'Install dependencies and configure DB.', status: 'IN_PROGRESS', priority: 'MEDIUM' },
      { title: 'Design Database Schema', description: 'Map out the data relations.', status: 'TODO', priority: 'HIGH' },
      { title: 'Implement Auth Flow', description: 'Secure the application.', status: 'TODO', priority: 'MEDIUM' },
      { title: 'CI/CD Configuration', description: 'Automate deployments.', status: 'TODO', priority: 'LOW' },
    ]
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    description: 'Plan and execute a successful product launch.',
    tasks: [
      { title: 'Define Target Audience', description: 'Who are we selling to?', status: 'TODO', priority: 'HIGH' },
      { title: 'Create Ad Copy', description: 'Draft catchy headlines.', status: 'IN_PROGRESS', priority: 'MEDIUM' },
      { title: 'Setup Social Media Ads', description: 'Launch campaigns on FB/IG.', status: 'TODO', priority: 'HIGH' },
      { title: 'Draft Press Release', description: 'Prepare for media outreach.', status: 'TODO', priority: 'LOW' },
      { title: 'Analyze Results', description: 'Measure ROI and engagement.', status: 'TODO', priority: 'MEDIUM' },
    ]
  },
  {
    id: 'hr-onboarding',
    name: 'HR & Onboarding',
    description: 'Ensure a smooth experience for new hires.',
    tasks: [
      { title: 'Send Offer Letter', description: 'Formalize the agreement.', status: 'TODO', priority: 'HIGH' },
      { title: 'Background Check', description: 'Verify credentials.', status: 'IN_PROGRESS', priority: 'MEDIUM' },
      { title: 'Setup Hardware', description: 'Order laptop and equipment.', status: 'TODO', priority: 'HIGH' },
      { title: 'First Day Introduction', description: 'Meeting the team.', status: 'TODO', priority: 'LOW' },
      { title: 'Training Sessions', description: 'Technical and culture deep-dives.', status: 'TODO', priority: 'MEDIUM' },
    ]
  }
]
