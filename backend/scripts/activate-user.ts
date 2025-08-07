import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateUser() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();

    const email = 'riyas.siddikk@6dtech.co.in';
    
    console.log(`Looking for user with email: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      console.log('User not found. Creating new user...');
      
      // First, let's check if there's an organization for 6dtech.co domain
      const organization = await prisma.organization.findFirst({
        where: {
          domain: '6dtech.co'
        }
      });

      if (!organization) {
        console.log('Organization not found for domain 6dtech.co. Creating organization...');
        
        const newOrg = await prisma.organization.create({
          data: {
            name: '6D Tech',
            domain: '6dtech.co',
            isActive: true,
            settings: {}
          }
        });
        
        console.log('Created organization:', newOrg.id);
        
        // Create user with the new organization
        const newUser = await prisma.user.create({
          data: {
            email,
            firstName: 'Riyas',
            lastName: 'Siddikk',
            displayName: 'Riyas Siddikk',
            isActive: true,
            emailVerifiedAt: new Date(),
            organizationId: newOrg.id
          },
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        });
        
        console.log('Created user:', newUser.id);
        
        // Check if SUPER_ADMIN role exists, if not create it
        let superAdminRole = await prisma.role.findFirst({
          where: { name: 'SUPER_ADMIN' }
        });
        
        if (!superAdminRole) {
          console.log('SUPER_ADMIN role not found. Creating...');
          superAdminRole = await prisma.role.create({
            data: {
              name: 'SUPER_ADMIN',
              displayName: 'Super Administrator',
              description: 'Super Administrator with full system access',
              isActive: true,
              isSystem: true,
              level: 'FULL_ACCESS'
            }
          });
          console.log('Created SUPER_ADMIN role:', superAdminRole.id);
        }
        
        // Assign SUPER_ADMIN role to user
        await prisma.userRole.create({
          data: {
            userId: newUser.id,
            roleId: superAdminRole.id,
            isActive: true
          }
        });
        
        console.log('Assigned SUPER_ADMIN role to user');
        
      } else {
        console.log('Found organization:', organization.id);
        
        // Create user with existing organization
        const newUser = await prisma.user.create({
          data: {
            email,
            firstName: 'Riyas',
            lastName: 'Siddikk',
            displayName: 'Riyas Siddikk',
            isActive: true,
            emailVerifiedAt: new Date(),
            organizationId: organization.id
          },
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        });
        
        console.log('Created user:', newUser.id);
        
        // Check if SUPER_ADMIN role exists, if not create it
        let superAdminRole = await prisma.role.findFirst({
          where: { name: 'SUPER_ADMIN' }
        });
        
        if (!superAdminRole) {
          console.log('SUPER_ADMIN role not found. Creating...');
          superAdminRole = await prisma.role.create({
            data: {
              name: 'SUPER_ADMIN',
              displayName: 'Super Administrator',
              description: 'Super Administrator with full system access',
              isActive: true,
              isSystem: true,
              level: 'FULL_ACCESS'
            }
          });
          console.log('Created SUPER_ADMIN role:', superAdminRole.id);
        }
        
        // Assign SUPER_ADMIN role to user
        await prisma.userRole.create({
          data: {
            userId: newUser.id,
            roleId: superAdminRole.id,
            isActive: true
          }
        });
        
        console.log('Assigned SUPER_ADMIN role to user');
      }
      
    } else {
      console.log('User found:', user.id);
      console.log('Current isActive status:', user.isActive);
      console.log('Current roles:', user.userRoles.map(ur => ur.role.name));
      
      if (!user.isActive) {
        console.log('Activating user account...');
        await prisma.user.update({
          where: { id: user.id },
          data: { isActive: true }
        });
        console.log('User account activated successfully!');
      } else {
        console.log('User account is already active');
      }
      
      // Check if user has roles
      if (user.userRoles.length === 0) {
        console.log('User has no roles. Assigning SUPER_ADMIN role...');
        
        // Check if SUPER_ADMIN role exists
        let superAdminRole = await prisma.role.findFirst({
          where: { name: 'SUPER_ADMIN' }
        });
        
        if (!superAdminRole) {
          console.log('SUPER_ADMIN role not found. Creating...');
          superAdminRole = await prisma.role.create({
            data: {
              name: 'SUPER_ADMIN',
              displayName: 'Super Administrator',
              description: 'Super Administrator with full system access',
              isActive: true,
              isSystem: true,
              level: 'FULL_ACCESS'
            }
          });
          console.log('Created SUPER_ADMIN role:', superAdminRole.id);
        }
        
        // Assign SUPER_ADMIN role to user
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: superAdminRole.id,
            isActive: true
          }
        });
        
        console.log('Assigned SUPER_ADMIN role to user');
      }
    }
    
    console.log('Script completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateUser(); 