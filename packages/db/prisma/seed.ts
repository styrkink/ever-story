import { PrismaClient, Region, SubscriptionTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: {
      email: 'parent@example.com',
      passwordHash: 'hashed_password_placeholder', // Should be properly hashed bcrypt password in real app
      region: Region.US,
      subscriptionTier: SubscriptionTier.PREMIUM,
      coppaVerifiedAt: new Date(),
    },
  });

  // Create test child
  const child = await prisma.child.create({
    data: {
      userId: user.id,
      name: 'Alice',
      birthDate: new Date('2018-05-15'),
      interests: ['dragons', 'space', 'magic'],
      petName: 'Barnaby',
      petType: 'Owl',
    },
  });

  // Create test subscription
  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      tier: SubscriptionTier.PREMIUM,
      storiesUsedThisMonth: 0,
      currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    },
  });

  // Create test story
  const story = await prisma.story.create({
    data: {
      userId: user.id,
      childId: child.id,
      theme: 'A dragon goes to space',
      artStyle: 'Watercolor',
      moral: 'Teamwork makes the dream work',
      ageGroup: '5-7',
      status: 'DONE',
    },
  });

  // Create test story pages
  await prisma.storyPage.createMany({
    data: [
      {
        storyId: story.id,
        pageNum: 1,
        text: 'Once upon a time, there was a little dragon who looked up at the stars.',
      },
      {
        storyId: story.id,
        pageNum: 2,
        text: 'He built a shiny silver rocket to fly to the moon.',
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
