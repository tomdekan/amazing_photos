import { PrismaClient } from '../src/generated/prisma';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

const plans = [
  {
    name: 'Basic',
    description: 'Great for personal use',
    price: 900, // $9.00 in cents
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_1RkUmSEkjAitURtIo2JsK8z8', // Basic plan price ID
    features: [
      '1 AI model access',
      '50 AI photo generations monthly',
      'Email support',
      'Billed monthly'
    ],
    generations: 50,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Basic Plus',
    description: 'More models and generations',
    price: 1200, // $12.00 in cents
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_1RkUmiEkjAitURtIsxLo7oOe', // Basic Plus plan price ID
    features: [
      '3 AI models access',
      '250 AI photo generations monthly',
      'Email support',
      'Billed monthly'
    ],
    generations: 250,
    isActive: true,
    sortOrder: 2,
  },
];

async function seedPlans() {
  console.log('Seeding plans...');
  
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { stripePriceId: plan.stripePriceId },
      update: plan,
      create: plan,
    });
    console.log(`✅ Created/updated plan: ${plan.name}`);
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