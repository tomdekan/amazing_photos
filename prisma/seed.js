const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create pricing plans
  await prisma.plan.upsert({
    where: { stripePriceId: 'price_personal_6' },
    update: {},
    create: {
      name: 'Personal',
      description: 'Perfect for personal use and social media',
      price: 600, // $6.00 in cents
      currency: 'usd',
      interval: 'month',
      stripePriceId: 'price_personal_6',
      features: [
        '50 AI photo generations per month',
        'Basic photo styles (casual, professional, social media)',
        'Standard processing speed',
        'Email support',
        'Access to mobile app'
      ],
      generations: 50,
      isActive: true,
      sortOrder: 1
    }
  });

  await prisma.plan.upsert({
    where: { stripePriceId: 'price_creator_9' },
    update: {},
    create: {
      name: 'Creator',
      description: 'For creators who need photos frequently',
      price: 900, // $9.00 in cents
      currency: 'usd',
      interval: 'month',
      stripePriceId: 'price_creator_9',
      features: [
        '150 AI photo generations per month',
        'Premium photo styles (artistic, themed, custom backgrounds)',
        'Priority processing (faster generation)',
        'Advanced editing options',
        'Priority email support',
        'Early access to new features',
        'Bulk generation capabilities'
      ],
      generations: 150,
      isActive: true,
      sortOrder: 2
    }
  });

  console.log('Pricing plans seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });