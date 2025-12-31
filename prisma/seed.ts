import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a sample user
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
    },
  })

  // Create 5 sample tasks
  const tasks = [
    {
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the TaskFlow application including API endpoints and user guide.',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      dueDate: new Date('2025-12-30'),
      userId: user.id,
    },
    {
      title: 'Review pull requests',
      description: 'Review and provide feedback on pending pull requests from the team.',
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
      dueDate: new Date('2025-12-28'),
      userId: user.id,
    },
    {
      title: 'Update dependencies',
      description: 'Check and update npm packages to their latest versions.',
      status: 'TODO' as const,
      priority: 'LOW' as const,
      dueDate: null,
      userId: user.id,
    },
    {
      title: 'Implement user authentication',
      description: 'Add JWT-based authentication system with login and registration.',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      dueDate: new Date('2025-12-25'),
      userId: user.id,
    },
    {
      title: 'Write unit tests',
      description: 'Create unit tests for core functionality to improve code coverage.',
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      dueDate: new Date('2025-12-31'),
      userId: user.id,
    },
  ]

  // Delete existing tasks for this user to avoid duplicates
  await prisma.task.deleteMany({
    where: { userId: user.id },
  })

  // Create all tasks
  for (const task of tasks) {
    await prisma.task.create({
      data: task,
    })
  }

  console.log('✅ Seed data created successfully!')
  console.log(`   User: ${user.email}`)
  console.log(`   Tasks: ${tasks.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

