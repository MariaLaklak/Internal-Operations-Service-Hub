import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  for (const name of ['IT', 'Human Resources', 'Finance']) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  await prisma.user.upsert({
    where: { email: 'demo.employee@example.com' },
    update: {},
    create: {
      name: 'Demo Employee',
      email: 'demo.employee@example.com',
      role: 'Employee'
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
