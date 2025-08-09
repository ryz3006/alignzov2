import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
const envPath = path.join(__dirname, '../../configs/development.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function standardizePermissions() {
  console.log('🔄 Starting permission standardization...');

  try {
    // Step 1: Create new standardized permissions
    console.log('📝 Creating standardized permissions...');
    
    const standardizedPermissions = [
      // User management permissions
      { name: 'users.create', displayName: 'Create Users', resource: 'users', action: 'create' },
      { name: 'users.read', displayName: 'View Users', resource: 'users', action: 'read' },
      { name: 'users.update', displayName: 'Edit Users', resource: 'users', action: 'update' },
      { name: 'users.delete', displayName: 'Delete Users', resource: 'users', action: 'delete' },
      { name: 'users.assign_role', displayName: 'Assign Roles to Users', resource: 'users', action: 'assign_role' },
      { name: 'users.remove_role', displayName: 'Remove Roles from Users', resource: 'users', action: 'remove_role' },
      { name: 'users.assign_manager', displayName: 'Assign Managers to Users', resource: 'users', action: 'assign_manager' },
      { name: 'users.remove_manager', displayName: 'Remove Managers from Users', resource: 'users', action: 'remove_manager' },
      
      // Role management permissions
      { name: 'roles.create', displayName: 'Create Roles', resource: 'roles', action: 'create' },
      { name: 'roles.read', displayName: 'View Roles', resource: 'roles', action: 'read' },
      { name: 'roles.update', displayName: 'Edit Roles', resource: 'roles', action: 'update' },
      { name: 'roles.delete', displayName: 'Delete Roles', resource: 'roles', action: 'delete' },
      { name: 'roles.manage', displayName: 'Manage Roles', resource: 'roles', action: 'manage' },
      
      // Permission management permissions
      { name: 'permissions.create', displayName: 'Create Permissions', resource: 'permissions', action: 'create' },
      { name: 'permissions.read', displayName: 'View Permissions', resource: 'permissions', action: 'read' },
      { name: 'permissions.update', displayName: 'Edit Permissions', resource: 'permissions', action: 'update' },
      { name: 'permissions.delete', displayName: 'Delete Permissions', resource: 'permissions', action: 'delete' },
      { name: 'permissions.manage', displayName: 'Manage Permissions', resource: 'permissions', action: 'manage' },
    ];

    // Create new permissions
    for (const permissionData of standardizedPermissions) {
      const existingPermission = await prisma.permission.findUnique({
        where: { name: permissionData.name },
      });

      if (!existingPermission) {
        await prisma.permission.create({
          data: permissionData,
        });
        console.log(`✅ Created permission: ${permissionData.name}`);
      } else {
        console.log(`⏭️  Permission already exists: ${permissionData.name}`);
      }
    }

    // Step 2: Map old API permissions to new standardized permissions
    console.log('🔄 Mapping old API permissions to new standardized permissions...');
    
    const permissionMapping = {
      'users.api.create': 'users.create',
      'users.api.read': 'users.read',
      'users.api.update': 'users.update',
      'users.api.delete': 'users.delete',
      'users.api.search': 'users.read', // Search is covered by read permission
      'users.api.assign_manager': 'users.assign_manager',
      'users.api.remove_manager': 'users.remove_manager',
      'users.api.assign_role': 'users.assign_role',
      'users.api.remove_role': 'users.remove_role',
    };

    // Step 3: Update role permissions
    console.log('🔄 Updating role permissions...');
    
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    for (const role of roles) {
      console.log(`📋 Processing role: ${role.name}`);
      
      for (const rolePermission of role.rolePermissions) {
        const oldPermissionName = rolePermission.permission.name;
        const newPermissionName = permissionMapping[oldPermissionName];
        
        if (newPermissionName && newPermissionName !== oldPermissionName) {
          // Find the new permission
          const newPermission = await prisma.permission.findUnique({
            where: { name: newPermissionName },
          });
          
          if (newPermission) {
            // Check if the new permission is already assigned to this role
            const existingNewPermission = await prisma.rolePermission.findFirst({
              where: {
                roleId: role.id,
                permissionId: newPermission.id,
              },
            });
            
            if (!existingNewPermission) {
              // Create new role permission
              await prisma.rolePermission.create({
                data: {
                  roleId: role.id,
                  permissionId: newPermission.id,
                },
              });
              console.log(`  ✅ Mapped ${oldPermissionName} → ${newPermissionName}`);
            } else {
              console.log(`  ⏭️  New permission already assigned: ${newPermissionName}`);
            }
            
            // Remove old role permission
            await prisma.rolePermission.delete({
              where: {
                id: rolePermission.id,
              },
            });
            console.log(`  🗑️  Removed old permission: ${oldPermissionName}`);
          }
        }
      }
    }

    // Step 4: Clean up old API permissions
    console.log('🧹 Cleaning up old API permissions...');
    
    const oldApiPermissions = [
      'users.api.create',
      'users.api.read',
      'users.api.update',
      'users.api.delete',
      'users.api.search',
      'users.api.assign_manager',
      'users.api.remove_manager',
      'users.api.assign_role',
      'users.api.remove_role',
    ];

    for (const oldPermissionName of oldApiPermissions) {
      const oldPermission = await prisma.permission.findUnique({
        where: { name: oldPermissionName },
        include: {
          rolePermissions: true,
          userPermissions: true,
        },
      });

      if (oldPermission) {
        // Only delete if no role or user permissions are using it
        if (oldPermission.rolePermissions.length === 0 && oldPermission.userPermissions.length === 0) {
          await prisma.permission.delete({
            where: { name: oldPermissionName },
          });
          console.log(`🗑️  Deleted unused permission: ${oldPermissionName}`);
        } else {
          console.log(`⚠️  Skipped permission with active assignments: ${oldPermissionName}`);
        }
      }
    }

    // Step 5: Update role assignments for common roles
    console.log('🔄 Updating role assignments...');
    
    // SUPER_ADMIN should have all permissions
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });
    
    if (superAdminRole) {
      const allPermissions = await prisma.permission.findMany();
      
      for (const permission of allPermissions) {
        const existingAssignment = await prisma.rolePermission.findFirst({
          where: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        });
        
        if (!existingAssignment) {
          await prisma.rolePermission.create({
            data: {
              roleId: superAdminRole.id,
              permissionId: permission.id,
            },
          });
          console.log(`✅ Assigned ${permission.name} to SUPER_ADMIN`);
        }
      }
    }

    // ADMIN should have most permissions except system-level ones
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });
    
    if (adminRole) {
      const adminPermissions = await prisma.permission.findMany({
        where: {
          NOT: {
            resource: 'system',
          },
        },
      });
      
      for (const permission of adminPermissions) {
        const existingAssignment = await prisma.rolePermission.findFirst({
          where: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        });
        
        if (!existingAssignment) {
          await prisma.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          });
          console.log(`✅ Assigned ${permission.name} to ADMIN`);
        }
      }
    }

    // MANAGER should have limited permissions
    const managerRole = await prisma.role.findUnique({
      where: { name: 'MANAGER' },
    });
    
    if (managerRole) {
      const managerPermissions = [
        'users.read',
        'users.create',
        'users.update',
        'users.assign_role',
        'roles.read',
        'permissions.read',
        'projects.read',
        'projects.create',
        'projects.update',
        'teams.read',
        'teams.create',
        'teams.update',
        'work_logs.read',
        'work_logs.create',
        'work_logs.update',
        'work_logs.approve',
        'time_sessions.read',
        'time_sessions.create',
        'time_sessions.update',
        'time_sessions.approve',
      ];
      
      for (const permissionName of managerPermissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName },
        });
        
        if (permission) {
          const existingAssignment = await prisma.rolePermission.findFirst({
            where: {
              roleId: managerRole.id,
              permissionId: permission.id,
            },
          });
          
          if (!existingAssignment) {
            await prisma.rolePermission.create({
              data: {
                roleId: managerRole.id,
                permissionId: permission.id,
              },
            });
            console.log(`✅ Assigned ${permission.name} to MANAGER`);
          }
        }
      }
    }

    // EMPLOYEE should have basic permissions
    const employeeRole = await prisma.role.findUnique({
      where: { name: 'EMPLOYEE' },
    });
    
    if (employeeRole) {
      const employeePermissions = [
        'users.read',
        // Intentionally exclude 'roles.read' so EMPLOYEE users cannot access Roles
        'permissions.read',
        'projects.read',
        'teams.read',
        'work_logs.read',
        'work_logs.create',
        'work_logs.update',
        'time_sessions.read',
        'time_sessions.create',
        'time_sessions.update',
      ];
      
      for (const permissionName of employeePermissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName },
        });
        
        if (permission) {
          const existingAssignment = await prisma.rolePermission.findFirst({
            where: {
              roleId: employeeRole.id,
              permissionId: permission.id,
            },
          });
          
          if (!existingAssignment) {
            await prisma.rolePermission.create({
              data: {
                roleId: employeeRole.id,
                permissionId: permission.id,
              },
            });
            console.log(`✅ Assigned ${permission.name} to EMPLOYEE`);
          }
        }
      }
    }

    console.log('✅ Permission standardization completed successfully!');
    
    // Print summary
    const totalPermissions = await prisma.permission.count();
    console.log(`📊 Total permissions after standardization: ${totalPermissions}`);
    
    const totalRolePermissions = await prisma.rolePermission.count();
    console.log(`📊 Total role-permission assignments: ${totalRolePermissions}`);

  } catch (error) {
    console.error('❌ Error during permission standardization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  standardizePermissions()
    .then(() => {
      console.log('🎉 Permission standardization script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Permission standardization script failed:', error);
      process.exit(1);
    });
}

export { standardizePermissions }; 