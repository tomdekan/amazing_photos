const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('🌱 Seeding plans...');

  // Clear existing plans
  await prisma.plan.deleteMany();

  // Create plans
  const plans = [
    {
      name: 'Personal',
      description: 'Perfect for personal use and social media',
      price: 600, // $6.00 in cents
      currency: 'usd',
      interval: 'month',
      stripePriceId: 'price_personal_6_monthly', // You'll need to create this in Stripe
      features: [
        'Basic photo styles (casual, professional, social media)',
        'Standard processing speed',
        'Email support',
        'Access to mobile app'
      ],
      generations: 50,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Creator',
      description: 'For creators who need photos frequently',
      price: 900, // $9.00 in cents
      currency: 'usd',
      interval: 'month',
      stripePriceId: 'price_creator_9_monthly', // You'll need to create this in Stripe
      features: [
        'Premium photo styles (artistic, themed, custom backgrounds)',
        'Priority processing (faster generation)',
        'Advanced editing options',
        'Priority email support',
        'Early access to new features',
        'Bulk generation capabilities'
      ],
      generations: 150,
      isActive: true,
      sortOrder: 2,
    },
  ];

  for (const plan of plans) {
    const created = await prisma.plan.create({
      data: plan,
    });
    console.log(`✅ Created plan: ${created.name} - $${created.price / 100}/month`);
  }

  console.log('🎉 Plans seeded successfully!');
}

seedPlans()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });