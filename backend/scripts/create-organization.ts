import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createOrganization() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();

    const domain = '6dtech.co';
    
    console.log(`Looking for organization with domain: ${domain}`);
    
    const organization = await prisma.organization.findFirst({
      where: {
        domain: domain
      }
    });

    if (!organization) {
      console.log('Organization not found. Creating organization...');
      
      const newOrg = await prisma.organization.create({
        data: {
          name: '6D Tech',
          domain: domain,
          isActive: true,
          settings: {}
        }
      });
      
      console.log('Created organization:', newOrg.id, newOrg.name);
    } else {
      console.log('Organization found:', organization.id, organization.name);
    }
    
    console.log('Script completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createOrganization(); 