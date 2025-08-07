import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrganizations() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();

    console.log('Checking all organizations...');
    
    const organizations = await prisma.organization.findMany({
      where: {
        isActive: true
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    console.log(`Found ${organizations.length} active organizations:`);
    
    organizations.forEach((org, index) => {
      console.log(`${index + 1}. ID: ${org.id}`);
      console.log(`   Name: ${org.name}`);
      console.log(`   Domain: ${org.domain}`);
      console.log(`   Users: ${org._count.users}`);
      console.log(`   Created: ${org.createdAt}`);
      console.log('   ---');
    });

    // Check for user
    const user = await prisma.user.findUnique({
      where: { email: 'riyas.siddikk@6dtech.co.in' },
      include: { organization: true }
    });

    if (user) {
      console.log('\nUser details:');
      console.log(`Email: ${user.email}`);
      console.log(`Organization ID: ${user.organizationId}`);
      console.log(`Organization: ${user.organization?.name || 'None'}`);
      console.log(`Organization Domain: ${user.organization?.domain || 'None'}`);
    } else {
      console.log('\nUser not found');
    }
    
    console.log('\nScript completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrganizations(); 