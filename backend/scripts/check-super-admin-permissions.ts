import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the development config
const envPath = path.join(__dirname, '../../configs/development.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function checkSuperAdminPermissions() {
  console.log('🔍 Checking SUPER_ADMIN role permissions...');

  try {
    // Find SUPER_ADMIN role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!superAdminRole) {
      console.log('❌ SUPER_ADMIN role not found');
      return;
    }

    console.log(`✅ SUPER_ADMIN role found: ${superAdminRole.displayName}`);
    console.log(`📊 Total permissions assigned: ${superAdminRole.rolePermissions.length}`);

    // Check for roles.read permission specifically
    const rolesReadPermission = superAdminRole.rolePermissions.find(
      rp => rp.permission.name === 'roles.read'
    );

    if (rolesReadPermission) {
      console.log('✅ roles.read permission is assigned to SUPER_ADMIN');
    } else {
      console.log('❌ roles.read permission is NOT assigned to SUPER_ADMIN');
    }

    // List all permissions
    console.log('\n📋 All permissions assigned to SUPER_ADMIN:');
    superAdminRole.rolePermissions.forEach((rp, index) => {
      console.log(`${index + 1}. ${rp.permission.name} (${rp.permission.displayName})`);
    });

    // Check if all expected permissions are present
    const expectedPermissions = [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'users.assign_role', 'users.remove_role', 'users.assign_manager', 'users.remove_manager',
      'roles.create', 'roles.read', 'roles.update', 'roles.delete', 'roles.manage',
      'permissions.create', 'permissions.read', 'permissions.update', 'permissions.delete', 'permissions.manage',
      'organizations.create', 'organizations.read', 'organizations.update', 'organizations.delete',
      'projects.create', 'projects.read', 'projects.update', 'projects.delete',
      'teams.create', 'teams.read', 'teams.update', 'teams.delete',
      'time_sessions.create', 'time_sessions.read', 'time_sessions.update', 'time_sessions.delete',
      'work_logs.create', 'work_logs.read', 'work_logs.update', 'work_logs.delete',
      'analytics.create', 'analytics.read', 'analytics.update', 'analytics.delete'
    ];

    console.log('\n🔍 Checking for missing permissions:');
    const assignedPermissionNames = superAdminRole.rolePermissions.map(rp => rp.permission.name);
    const missingPermissions = expectedPermissions.filter(perm => !assignedPermissionNames.includes(perm));

    if (missingPermissions.length === 0) {
      console.log('✅ All expected permissions are assigned');
    } else {
      console.log('❌ Missing permissions:');
      missingPermissions.forEach(perm => console.log(`   - ${perm}`));
    }

  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdminPermissions(); 