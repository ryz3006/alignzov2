import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignUserToOrganization() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();

    const email = 'riyas.siddikk@6dtech.co.in';
    const domain = '6dtech.co';
    
    console.log(`Looking for user: ${email}`);
    console.log(`Looking for organization with domain: ${domain}`);
    
    const [user, organization] = await Promise.all([
      prisma.user.findUnique({
        where: { email }
      }),
      prisma.organization.findFirst({
        where: { domain }
      })
    ]);

    if (!user) {
      console.error('User not found');
      return;
    }

    if (!organization) {
      console.error('Organization not found');
      return;
    }

    console.log('User found:', user.id, user.email);
    console.log('Organization found:', organization.id, organization.name);
    
    if (user.organizationId === organization.id) {
      console.log('User is already assigned to this organization');
    } else {
      console.log('Assigning user to organization...');
      
      await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id }
      });
      
      console.log('User assigned to organization successfully!');
    }
    
    console.log('Script completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignUserToOrganization(); 