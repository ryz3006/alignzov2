import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the development config
const envPath = path.join(__dirname, '../../configs/development.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting permission cleanup...');

  // Define the permissions to keep (18 standardized permissions)
  const keepPermissions = [
    // User Management Permissions (8 permissions)
    'users.create',
    'users.read', 
    'users.update',
    'users.delete',
    'users.assign_role',
    'users.remove_role',
    'users.assign_manager',
    'users.remove_manager',
    
    // Role Management Permissions (5 permissions)
    'roles.create',
    'roles.read',
    'roles.update',
    'roles.delete',
    'roles.manage',
    
    // Permission Management Permissions (5 permissions)
    'permissions.create',
    'permissions.read',
    'permissions.update',
    'permissions.delete',
    'permissions.manage',
  ];

  // Get all existing permissions
  const allPermissions = await prisma.permission.findMany();
  console.log(`📊 Found ${allPermissions.length} existing permissions`);

  // Find permissions to remove
  const permissionsToRemove = allPermissions.filter(
    permission => !keepPermissions.includes(permission.name)
  );

  console.log(`🗑️  Found ${permissionsToRemove.length} permissions to remove:`);
  permissionsToRemove.forEach(p => console.log(`   - ${p.name}`));

  if (permissionsToRemove.length === 0) {
    console.log('✅ No permissions to remove. System is already clean.');
    return;
  }

  // Remove role-permission associations for permissions being deleted
  console.log('🔗 Removing role-permission associations...');
  for (const permission of permissionsToRemove) {
    await prisma.rolePermission.deleteMany({
      where: { permissionId: permission.id }
    });
  }

  // Remove user-permission associations for permissions being deleted
  console.log('👤 Removing user-permission associations...');
  for (const permission of permissionsToRemove) {
    await prisma.userPermission.deleteMany({
      where: { permissionId: permission.id }
    });
  }

  // Delete the permissions
  console.log('🗑️  Deleting old permissions...');
  for (const permission of permissionsToRemove) {
    await prisma.permission.delete({
      where: { id: permission.id }
    });
  }

  // Verify the cleanup
  const remainingPermissions = await prisma.permission.findMany();
  console.log(`✅ Cleanup completed. ${remainingPermissions.length} permissions remaining:`);
  
  remainingPermissions.forEach(p => {
    console.log(`   - ${p.name} (${p.resource}.${p.action})`);
  });

  console.log('');
  console.log('🎉 Permission cleanup completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Removed ${permissionsToRemove.length} old permissions`);
  console.log(`   - Kept ${remainingPermissions.length} standardized permissions`);
  console.log(`   - Removed all associated role and user permissions`);
}

main()
  .catch((e) => {
    console.error('❌ Error during permission cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 