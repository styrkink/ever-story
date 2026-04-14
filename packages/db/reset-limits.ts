import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.subscription.updateMany({
    data: {
      tier: 'PREMIUM',
      storiesUsedThisMonth: 0,
    },
  });
  console.log('Subscriptions updated to PREMIUM and reset usage.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
