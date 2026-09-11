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
    update: { role: 'Employee' },
    create: {
      name: 'Demo Employee',
      email: 'demo.employee@example.com',
      role: 'Employee'
    }
  });

  await prisma.user.upsert({
    where: { email: 'it.department.staff@example.com' },
    update: {
      role: 'Department Staff',
      department: { connect: { name: 'IT' } }
    },
    create: {
      name: 'IT Department Staff',
      email: 'it.department.staff@example.com',
      role: 'Department Staff',
      department: { connect: { name: 'IT' } }
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
