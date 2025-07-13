import { PrismaClient } from '../src/generated/prisma';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkPlans() {
  console.log('Current plans in database:');
  
  const allPlans = await prisma.plan.findMany({
    select: {
      id: true,
      name: true,
      stripePriceId: true,
      price: true,
      generations: true,
      isActive: true,
    }
  });
  
  allPlans.forEach(plan => {
    console.log(`- ID: ${plan.id}`);
    console.log(`  Name: ${plan.name}`);
    console.log(`  Price ID: ${plan.stripePriceId}`);
    console.log(`  Price: $${plan.price / 100}`);
    console.log(`  Generations: ${plan.generations}`);
    console.log(`  Active: ${plan.isActive}`);
    console.log('');
  });
}

checkPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });