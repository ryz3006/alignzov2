import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateOrg() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();

    const email = 'riyas.siddikk@6dtech.co.in';
    const correctDomain = '6dtech.co.in';
    const duplicateDomain = '6dtech.co';
    
    console.log(`Looking for organizations with domains: ${correctDomain} and ${duplicateDomain}`);
    
    const [correctOrg, duplicateOrg] = await Promise.all([
      prisma.organization.findFirst({
        where: { domain: correctDomain }
      }),
      prisma.organization.findFirst({
        where: { domain: duplicateDomain }
      })
    ]);

    console.log('\nCorrect organization:', correctOrg ? `${correctOrg.name} (${correctOrg.domain})` : 'Not found');
    console.log('Duplicate organization:', duplicateOrg ? `${duplicateOrg.name} (${duplicateOrg.domain})` : 'Not found');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    console.log('\nUser details:');
    console.log(`Email: ${user?.email}`);
    console.log(`Current Organization: ${user?.organization?.name || 'None'} (${user?.organization?.domain || 'None'})`);

    if (correctOrg && duplicateOrg) {
      console.log('\nFound both organizations. Cleaning up...');
      
      // Check if duplicate org has any users
      const duplicateUsers = await prisma.user.findMany({
        where: { organizationId: duplicateOrg.id }
      });

      if (duplicateUsers.length > 0) {
        console.log(`Duplicate org has ${duplicateUsers.length} users. Moving them to correct org...`);
        
        // Move users to correct organization
        await prisma.user.updateMany({
          where: { organizationId: duplicateOrg.id },
          data: { organizationId: correctOrg.id }
        });
      }

      // Delete the duplicate organization
      console.log('Deleting duplicate organization...');
      await prisma.organization.delete({
        where: { id: duplicateOrg.id }
      });
      
      console.log('Duplicate organization deleted successfully!');
    }

    // Ensure user is assigned to correct organization
    if (user && correctOrg && user.organizationId !== correctOrg.id) {
      console.log('\nReassigning user to correct organization...');
      await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: correctOrg.id }
      });
      console.log('User reassigned successfully!');
    }

    // Final check
    const finalUser = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    console.log('\nFinal user status:');
    console.log(`Email: ${finalUser?.email}`);
    console.log(`Organization: ${finalUser?.organization?.name || 'None'} (${finalUser?.organization?.domain || 'None'})`);
    
    console.log('\nScript completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateOrg(); 