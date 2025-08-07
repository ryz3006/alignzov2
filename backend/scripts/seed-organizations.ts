import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOrganizations() {
  try {
    console.log('🌱 Seeding organizations...');

    // Create 6D Technologies organization
    const organization = await prisma.organization.upsert({
      where: { domain: '6dtech.co.in' },
      update: {},
      create: {
        name: '6D Technologies',
        domain: '6dtech.co.in',
        logo: null,
        settings: {},
        isActive: true,
      },
    });

    console.log(`✅ Organization created: ${organization.name} (${organization.domain})`);

    // Update existing users with @6dtech.co.in emails to be part of this organization
    const usersToUpdate = await prisma.user.findMany({
      where: {
        email: {
          endsWith: '@6dtech.co.in',
        },
        organizationId: null,
      },
    });

    if (usersToUpdate.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: {
            in: usersToUpdate.map(user => user.id),
          },
        },
        data: {
          organizationId: organization.id,
        },
      });

      console.log(`✅ Updated ${usersToUpdate.length} users to be part of ${organization.name}`);
    }

    console.log('🎉 Organization seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding organizations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedOrganizations(); 