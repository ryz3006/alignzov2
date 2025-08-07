import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the development config
const envPath = path.join(__dirname, '../../configs/development.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Assigning user permissions to roles...');

  // Get all roles
  const roles = await prisma.role.findMany({
    where: { isActive: true },
  });

  // Get all user-related permissions
  const userPermissions = await prisma.permission.findMany({
    where: {
      resource: 'users',
    },
  });

  console.log(`Found ${roles.length} roles and ${userPermissions.length} user permissions`);

  // Assign permissions based on role level
  for (const role of roles) {
    console.log(`\n📋 Assigning permissions to role: ${role.displayName}`);

    let permissionsToAssign: string[] = [];

    switch (role.name) {
      case 'SUPER_ADMIN':
        // Super admin gets all permissions
        permissionsToAssign = userPermissions.map(p => p.id);
        break;

      case 'ADMIN':
        // Admin gets most permissions but not system-level ones
        permissionsToAssign = userPermissions
          .filter(p => !p.resource.includes('system'))
          .map(p => p.id);
        break;

      case 'MANAGER':
        // Manager gets read, create, update permissions
        permissionsToAssign = userPermissions
          .filter(p => 
            p.action.includes('read') ||
            p.action.includes('create') ||
            p.action.includes('update') ||
            p.action.includes('assign_role') ||
            p.action.includes('change_role') ||
            // Add role viewing permissions for managers
            (p.resource === 'roles' && p.action.includes('read'))
          )
          .map(p => p.id);
        break;

      case 'EMPLOYEE':
        // Employee gets read permissions only
        permissionsToAssign = userPermissions
          .filter(p => 
            p.action.includes('read') ||
            // Add basic role viewing permissions for employees
            (p.resource === 'roles' && p.action.includes('read'))
          )
          .map(p => p.id);
        break;

      default:
        // For custom roles, assign basic read permissions
        permissionsToAssign = userPermissions
          .filter(p => 
            p.action.includes('read') ||
            p.action.includes('ui.view')
          )
          .map(p => p.id);
        break;
    }

    console.log(`  Assigning ${permissionsToAssign.length} permissions to ${role.displayName}`);

    // Remove existing user permissions for this role
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        permission: {
          resource: 'users',
        },
      },
    });

    // Assign new permissions
    for (const permissionId of permissionsToAssign) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId,
        },
      });
    }

    console.log(`  ✅ Successfully assigned permissions to ${role.displayName}`);
  }

  console.log('\n🎉 User permissions assignment completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error assigning user permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 