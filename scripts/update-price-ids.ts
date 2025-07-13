import { PrismaClient } from '../src/generated/prisma';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function updatePriceIds() {
  console.log('Updating plan price IDs...');
  
  // Update Basic plan
  const basicPlan = await prisma.plan.findFirst({
    where: { name: 'Basic' }
  });
  
  if (basicPlan) {
    await prisma.plan.update({
      where: { id: basicPlan.id },
      data: {
        stripePriceId: 'price_1RkUmSEkjAitURtIo2JsK8z8',
        price: 900,
        currency: 'usd',
        generations: 50,
        features: [
          '1 AI model access',
          '50 AI photo generations monthly',
          'Email support',
          'Billed monthly'
        ]
      }
    });
    console.log(`✅ Updated Basic plan with price ID: price_1RkUmSEkjAitURtIo2JsK8z8`);
  }
  
  // Update Basic Plus plan (might be named Pro or Creator)
  const proPlan = await prisma.plan.findFirst({
    where: { 
      OR: [
        { name: 'Basic Plus' },
        { name: 'Pro' },
        { name: 'Creator' }
      ]
    }
  });
  
  if (proPlan) {
    await prisma.plan.update({
      where: { id: proPlan.id },
      data: {
        name: 'Basic Plus',
        description: 'More models and generations',
        stripePriceId: 'price_1RkUmiEkjAitURtIsxLo7oOe',
        price: 1200,
        currency: 'usd',
        generations: 250,
        features: [
          '3 AI models access',
          '250 AI photo generations monthly',
          'Email support',
          'Billed monthly'
        ]
      }
    });
    console.log(`✅ Updated ${proPlan.name} plan with price ID: price_1RkUmiEkjAitURtIsxLo7oOe`);
  }
  
  // If Basic Plus doesn't exist, create it
  if (!proPlan) {
    await prisma.plan.create({
      data: {
        name: 'Basic Plus',
        description: 'More models and generations',
        price: 1200,
        currency: 'usd',
        interval: 'month',
        stripePriceId: 'price_1RkUmiEkjAitURtIsxLo7oOe',
        features: [
          '3 AI models access',
          '250 AI photo generations monthly',
          'Email support',
          'Billed monthly'
        ],
        generations: 250,
        isActive: true,
        sortOrder: 2,
      }
    });
    console.log(`✅ Created Basic Plus plan with price ID: price_1RkUmiEkjAitURtIsxLo7oOe`);
  }
  
  // Verify the plans
  const allPlans = await prisma.plan.findMany({
    select: {
      name: true,
      stripePriceId: true,
      price: true,
      generations: true,
    }
  });
  
  console.log('\nCurrent plans in database:');
  allPlans.forEach(plan => {
    console.log(`- ${plan.name}: ${plan.stripePriceId} ($${plan.price / 100}) - ${plan.generations} generations`);
  });
}

updatePriceIds()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });