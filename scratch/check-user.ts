import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'gideonagbavor8@gmail.com'
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log(`User ${email} NOT found in database.`)
  } else {
    console.log(`User ${email} found.`)
    console.log(`Has password: ${!!user.password}`)
    console.log(`Created at: ${user.createdAt}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
