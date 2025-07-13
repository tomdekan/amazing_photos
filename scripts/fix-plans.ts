import { PrismaClient } from '../src/generated/prisma';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function fixPlans() {
  console.log('Disabling old plans and keeping only the correct ones...');
  
  // Disable all plans except the ones with real Stripe price IDs
  await prisma.plan.updateMany({
    where: {
      stripePriceId: {
        notIn: ['price_1RkUmSEkjAitURtIo2JsK8z8', 'price_1RkUmiEkjAitURtIsxLo7oOe']
      }
    },
    data: {
      isActive: false
    }
  });
  
  console.log('✅ Disabled old plans');
  
  // Ensure the correct plans are active
  await prisma.plan.updateMany({
    where: {
      stripePriceId: {
        in: ['price_1RkUmSEkjAitURtIo2JsK8z8', 'price_1RkUmiEkjAitURtIsxLo7oOe']
      }
    },
    data: {
      isActive: true
    }
  });
  
  console.log('✅ Enabled correct plans');
  
  // Verify the active plans
  const activePlans = await prisma.plan.findMany({
    where: { isActive: true },
    select: {
      name: true,
      stripePriceId: true,
      price: true,
      generations: true,
    }
  });
  
  console.log('\nActive plans in database:');
  activePlans.forEach(plan => {
    console.log(`- ${plan.name}: ${plan.stripePriceId} ($${plan.price / 100}) - ${plan.generations} generations`);
  });
}

fixPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });