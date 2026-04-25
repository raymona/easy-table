import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deactivated = await prisma.staff.findMany({ where: { active: false } });

  if (deactivated.length === 0) {
    console.log('No deactivated staff found.');
    return;
  }

  console.log(`Found ${deactivated.length} deactivated staff:`);
  for (const s of deactivated) {
    console.log(`  - ${s.name} (${s.id})`);
  }

  await prisma.staff.updateMany({
    where: { active: false },
    data: { active: true },
  });

  console.log('All staff reactivated.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
