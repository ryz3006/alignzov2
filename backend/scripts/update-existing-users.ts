import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingUsers() {
  try {
    console.log('🔄 Updating existing users...');

    // Get the 6D Technologies organization
    const organization = await prisma.organization.findFirst({
      where: { domain: '6dtech.co.in' },
    });

    if (!organization) {
      console.log('❌ 6D Technologies organization not found. Please run the organization seed first.');
      return;
    }

    // Update users with @6dtech.co.in emails
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
      
      // List the updated users
      usersToUpdate.forEach(user => {
        console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
      });
    } else {
      console.log('ℹ️ No users found that need to be updated');
    }

    // Also update any other users that might exist (for testing purposes)
    const allUsersWithoutOrg = await prisma.user.findMany({
      where: {
        organizationId: null,
      },
    });

    if (allUsersWithoutOrg.length > 0) {
      console.log(`ℹ️ Found ${allUsersWithoutOrg.length} users without organization assignment:`);
      allUsersWithoutOrg.forEach(user => {
        console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
      });
    }

    console.log('🎉 User update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingUsers(); 