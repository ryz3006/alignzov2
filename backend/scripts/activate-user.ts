import { PrismaClient, User, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function findOrCreateSuperAdminRole(): Promise<Role> {
  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN' },
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
      },
    });
    console.log('Created SUPER_ADMIN role:', superAdminRole.id);
  }
  return superAdminRole;
}

async function assignSuperAdminRole(userId: string, roleId: string) {
    await prisma.userRole.create({
        data: {
        userId: userId,
        roleId: roleId,
        isActive: true,
        },
    });
    console.log(`Assigned SUPER_ADMIN role to user ${userId}`);
}


async function activateUser() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();

    const email = 'riyas.siddikk@6dtech.co.in';
    
    console.log(`Looking for user with email: ${email}`);
    
    let user = await prisma.user.findUnique({
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
      
      const organization = await prisma.organization.findFirst({
        where: { domain: '6dtech.co' },
      });

      let orgId: string;
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
        orgId = newOrg.id;
      } else {
        console.log('Found organization:', organization.id);
        orgId = organization.id;
      }
      
      user = await prisma.user.create({
        data: {
          email,
          firstName: 'Riyas',
          lastName: 'Siddikk',
          displayName: 'Riyas Siddikk',
          isActive: true,
          emailVerifiedAt: new Date(),
          organizationId: orgId,
        },
        include: {
            userRoles: {
                include: {
                    role: true
                }
            }
        }
      });
      console.log('Created user:', user.id);

      const superAdminRole = await findOrCreateSuperAdminRole();
      await assignSuperAdminRole(user.id, superAdminRole.id);

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
      
      if (user.userRoles.length === 0) {
        console.log('User has no roles. Assigning SUPER_ADMIN role...');
        const superAdminRole = await findOrCreateSuperAdminRole();
        await assignSuperAdminRole(user.id, superAdminRole.id);
      }
    }
    
    // Ensure the user has the FULL_ACCESS access level
    const superAdminAccess = await prisma.userAccessLevel.findFirst({
        where: {
            userId: user.id,
            level: 'FULL_ACCESS'
        }
    });

    if (!superAdminAccess) {
        console.log('User does not have FULL_ACCESS. Assigning...');
        await prisma.userAccessLevel.create({
            data: {
                userId: user.id,
                level: 'FULL_ACCESS'
            }
        });
        console.log('Assigned FULL_ACCESS to user.');
    } else {
        console.log('User already has FULL_ACCESS.');
    }

    console.log('Script completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateUser();
