import { PrismaClient } from '../src/generated/prisma';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

const productionPlans = [
  {
    name: 'Basic',
    description: 'Great for personal use',
    price: 900, // $9.00 in cents
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_1RkVd5EkjAitURtIEaWCqAEO',
    features: [
      '1 AI model of a person',
      '50 AI photo generations monthly',
      'Email support',
      'Billed monthly'
    ],
    generations: 50,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Pro',
    description: 'Perfect for power users',
    price: 1500, // $15.00 in cents
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_1RkVd9EkjAitURtIxucmog3C',
    features: [
      '3 AI models of people',
      '250 AI photo generations monthly',
      'Priority email support',
      'Billed monthly'
    ],
    generations: 250,
    isActive: true,
    sortOrder: 2,
  },
];

const developmentPlans = [
  {
    name: 'Basic',
    description: 'Great for personal use',
    price: 900,
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_1RkmULEkjAitURtI27sU2M7N',
    features: [
      '1 AI model of a person',
      '50 AI photo generations monthly',
      'Email support',
      'Billed monthly'
    ],
    generations: 50,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Pro',
    description: 'Perfect for power users',
    price: 1500,
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_1RkmUXEkjAitURtIeSg1D5w8',
    features: [
      '3 AI models of people',
      '250 AI photo generations monthly',
      'Priority email support',
      'Billed monthly'
    ],
    generations: 250,
    isActive: true,
    sortOrder: 2,
  },
];

async function seedPlans() {
  const isProduction = process.env.NODE_ENV === 'production';
  const plansToSeed = isProduction ? productionPlans : developmentPlans;

  console.log(`Seeding plans for ${isProduction ? 'production' : 'development'} environment...`);

  for (const plan of plansToSeed) {
    await prisma.plan.upsert({
      where: { stripePriceId: plan.stripePriceId },
      update: { ...plan },
      create: { ...plan },
    });
    console.log(`✅ Upserted plan: ${plan.name} (${plan.stripePriceId})`);
  }

  console.log('✅ Plans seeded successfully!');
}

seedPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
