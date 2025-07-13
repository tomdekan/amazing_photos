import { PrismaClient } from '../src/generated/prisma';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function updateProPlan() {
  console.log('Updating Basic Plus plan to Pro with $15 pricing...');
  
  // Update the Basic Plus plan to Pro
  const updated = await prisma.plan.updateMany({
    where: {
      stripePriceId: 'price_1RkUmiEkjAitURtIsxLo7oOe'
    },
    data: {
      name: 'Pro',
      description: 'Perfect for power users',
      price: 1500, // $15.00 in cents
      features: [
        '3 AI models access',
        '250 AI photo generations monthly',
        'Email support',
        'Billed monthly'
      ]
    }
  });
  
  console.log(`✅ Updated ${updated.count} plan(s) to Pro with $15 pricing`);
  
  // Verify the update
  const activePlans = await prisma.plan.findMany({
    where: { isActive: true },
    select: {
      name: true,
      description: true,
      stripePriceId: true,
      price: true,
      generations: true,
    },
    orderBy: {
      sortOrder: 'asc'
    }
  });
  
  console.log('\nActive plans in database:');
  activePlans.forEach(plan => {
    console.log(`- ${plan.name}: ${plan.description}`);
    console.log(`  Price ID: ${plan.stripePriceId}`);
    console.log(`  Price: $${plan.price / 100}`);
    console.log(`  Generations: ${plan.generations}`);
    console.log('');
  });
}

updateProPlan()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });