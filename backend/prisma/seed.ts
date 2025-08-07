import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the development config
const envPath = path.join(__dirname, '../../configs/development.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create system roles
  console.log('📋 Creating system roles...');
  
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      displayName: 'Super Administrator',
      description: 'Full system access with all permissions',
      level: 'FULL_ACCESS',
      isSystem: true,
      isActive: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      displayName: 'Administrator',
      description: 'Organization-level administrator',
      level: 'FULL_ACCESS',
      isSystem: true,
      isActive: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: {
      name: 'MANAGER',
      displayName: 'Manager',
      description: 'Team and project manager',
      level: 'TEAM',
      isSystem: true,
      isActive: true,
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      name: 'EMPLOYEE',
      displayName: 'Employee',
      description: 'Regular employee with basic access',
      level: 'INDIVIDUAL',
      isSystem: true,
      isActive: true,
    },
  });

  console.log('✅ System roles created');

  // Define permissions - Extended to include all resources with CRUD operations
  const permissions = [
    // User Management Permissions (8 permissions)
    { name: 'users.create', displayName: 'Create Users', resource: 'users', action: 'create' },
    { name: 'users.read', displayName: 'View Users', resource: 'users', action: 'read' },
    { name: 'users.update', displayName: 'Edit Users', resource: 'users', action: 'update' },
    { name: 'users.delete', displayName: 'Delete Users', resource: 'users', action: 'delete' },
    { name: 'users.assign_role', displayName: 'Assign Roles to Users', resource: 'users', action: 'assign_role' },
    { name: 'users.remove_role', displayName: 'Remove Roles from Users', resource: 'users', action: 'remove_role' },
    { name: 'users.assign_manager', displayName: 'Assign Managers to Users', resource: 'users', action: 'assign_manager' },
    { name: 'users.remove_manager', displayName: 'Remove Managers from Users', resource: 'users', action: 'remove_manager' },
    
    // Role Management Permissions (5 permissions)
    { name: 'roles.create', displayName: 'Create Roles', resource: 'roles', action: 'create' },
    { name: 'roles.read', displayName: 'View Roles', resource: 'roles', action: 'read' },
    { name: 'roles.update', displayName: 'Edit Roles', resource: 'roles', action: 'update' },
    { name: 'roles.delete', displayName: 'Delete Roles', resource: 'roles', action: 'delete' },
    { name: 'roles.manage', displayName: 'Manage Role Permissions', resource: 'roles', action: 'manage' },
    
    // Permission Management Permissions (5 permissions)
    { name: 'permissions.create', displayName: 'Create Permissions', resource: 'permissions', action: 'create' },
    { name: 'permissions.read', displayName: 'View Permissions', resource: 'permissions', action: 'read' },
    { name: 'permissions.update', displayName: 'Edit Permissions', resource: 'permissions', action: 'update' },
    { name: 'permissions.delete', displayName: 'Delete Permissions', resource: 'permissions', action: 'delete' },
    { name: 'permissions.manage', displayName: 'Manage Permission Assignments', resource: 'permissions', action: 'manage' },

    // Organization Management Permissions (4 permissions)
    { name: 'organizations.create', displayName: 'Create Organizations', resource: 'organizations', action: 'create' },
    { name: 'organizations.read', displayName: 'View Organizations', resource: 'organizations', action: 'read' },
    { name: 'organizations.update', displayName: 'Edit Organizations', resource: 'organizations', action: 'update' },
    { name: 'organizations.delete', displayName: 'Delete Organizations', resource: 'organizations', action: 'delete' },

    // Project Management Permissions (4 permissions)
    { name: 'projects.create', displayName: 'Create Projects', resource: 'projects', action: 'create' },
    { name: 'projects.read', displayName: 'View Projects', resource: 'projects', action: 'read' },
    { name: 'projects.update', displayName: 'Edit Projects', resource: 'projects', action: 'update' },
    { name: 'projects.delete', displayName: 'Delete Projects', resource: 'projects', action: 'delete' },

    // Team Management Permissions (4 permissions)
    { name: 'teams.create', displayName: 'Create Teams', resource: 'teams', action: 'create' },
    { name: 'teams.read', displayName: 'View Teams', resource: 'teams', action: 'read' },
    { name: 'teams.update', displayName: 'Edit Teams', resource: 'teams', action: 'update' },
    { name: 'teams.delete', displayName: 'Delete Teams', resource: 'teams', action: 'delete' },

    // Time Session Management Permissions (4 permissions)
    { name: 'time_sessions.create', displayName: 'Create Time Sessions', resource: 'time_sessions', action: 'create' },
    { name: 'time_sessions.read', displayName: 'View Time Sessions', resource: 'time_sessions', action: 'read' },
    { name: 'time_sessions.update', displayName: 'Edit Time Sessions', resource: 'time_sessions', action: 'update' },
    { name: 'time_sessions.delete', displayName: 'Delete Time Sessions', resource: 'time_sessions', action: 'delete' },

    // Work Log Management Permissions (4 permissions)
    { name: 'work_logs.create', displayName: 'Create Work Logs', resource: 'work_logs', action: 'create' },
    { name: 'work_logs.read', displayName: 'View Work Logs', resource: 'work_logs', action: 'read' },
    { name: 'work_logs.update', displayName: 'Edit Work Logs', resource: 'work_logs', action: 'update' },
    { name: 'work_logs.delete', displayName: 'Delete Work Logs', resource: 'work_logs', action: 'delete' },

    // Analytics Permissions (4 permissions)
    { name: 'analytics.create', displayName: 'Create Analytics', resource: 'analytics', action: 'create' },
    { name: 'analytics.read', displayName: 'View Analytics', resource: 'analytics', action: 'read' },
    { name: 'analytics.update', displayName: 'Edit Analytics', resource: 'analytics', action: 'update' },
    { name: 'analytics.delete', displayName: 'Delete Analytics', resource: 'analytics', action: 'delete' },
    
    // Settings Management Permissions (4 permissions)
    { name: 'settings.create', displayName: 'Create Settings', resource: 'settings', action: 'create' },
    { name: 'settings.read', displayName: 'View Settings', resource: 'settings', action: 'read' },
    { name: 'settings.update', displayName: 'Edit Settings', resource: 'settings', action: 'update' },
    { name: 'settings.delete', displayName: 'Delete Settings', resource: 'settings', action: 'delete' },
  ];

  for (const permissionData of permissions) {
    await prisma.permission.upsert({
      where: { name: permissionData.name },
      update: {},
      create: {
        name: permissionData.name,
        displayName: permissionData.displayName,
        description: `${permissionData.displayName} permission`,
        resource: permissionData.resource,
        action: permissionData.action,
        isSystem: true,
      },
    });
  }

  console.log('✅ System permissions created');

  // Assign all permissions to SUPER_ADMIN role
  console.log('🔗 Assigning permissions to SUPER_ADMIN role...');
  
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Permissions assigned to SUPER_ADMIN role');

  // Create a default organization first
  console.log('🏢 Creating default organization...');
  
  const defaultOrg = await prisma.organization.upsert({
    where: { domain: '6dtech.co.in' },
    update: {},
    create: {
      name: '6D Technologies',
      domain: '6dtech.co.in',
      settings: {
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
        currency: 'INR',
        workingHours: {
          start: '09:00',
          end: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
      },
      isActive: true,
    },
  });

  console.log('✅ Default organization created');

  // Create super admin user
  console.log('👤 Creating super admin user...');
  
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'riyas.siddikk@6dtech.co.in' },
    update: {
      firstName: 'Riyas',
      lastName: 'Siddikk',
      displayName: 'Riyas Siddikk',
      isActive: true,
      emailVerifiedAt: new Date(),
      organizationId: defaultOrg.id, // Add organization assignment
    },
    create: {
      email: 'riyas.siddikk@6dtech.co.in',
      firstName: 'Riyas',
      lastName: 'Siddikk',
      displayName: 'Riyas Siddikk',
      title: 'Super Administrator',
      department: 'IT',
      isActive: true,
      emailVerifiedAt: new Date(),
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      organizationId: defaultOrg.id, // Add organization assignment
    },
  });

  console.log('✅ Super admin user created');

  // Create operations user
  console.log('👤 Creating operations user...');
  
  const operationsUser = await prisma.user.upsert({
    where: { email: 'operations@6dtech.co.in' },
    update: {
      firstName: 'Operations',
      lastName: 'User',
      displayName: 'Operations User',
      isActive: true,
      emailVerifiedAt: new Date(),
      organizationId: defaultOrg.id,
    },
    create: {
      email: 'operations@6dtech.co.in',
      firstName: 'Operations',
      lastName: 'User',
      displayName: 'Operations User',
      title: 'Operations Manager',
      department: 'Operations',
      isActive: true,
      emailVerifiedAt: new Date(),
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      organizationId: defaultOrg.id,
    },
  });

  console.log('✅ Operations user created');

  // Assign ADMIN role to operations user
  console.log('🎭 Assigning ADMIN role to operations user...');
  
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: operationsUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: operationsUser.id,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log('✅ ADMIN role assigned to operations user');

  // Assign SUPER_ADMIN role to the user
  console.log('🎭 Assigning SUPER_ADMIN role to user...');
  
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  console.log('✅ SUPER_ADMIN role assigned to user');

  // Create some sample projects
  console.log('📁 Creating sample projects...');
  
  const sampleProjects = [
    {
      name: 'Alignzo Platform Development',
      description: 'Development of the Alignzo enterprise productivity platform',
      code: 'ALZ-001',
      status: 'ACTIVE' as const,
      priority: 'HIGH' as const,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      budget: 500000,
      currency: 'INR',
      clientName: 'Internal',
    },
    {
      name: 'Website Redesign',
      description: 'Redesign of the company website',
      code: 'WEB-001',
      status: 'PLANNING' as const,
      priority: 'MEDIUM' as const,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-06-30'),
      budget: 100000,
      currency: 'INR',
      clientName: 'Internal',
    },
  ];

  for (const projectData of sampleProjects) {
    await prisma.project.upsert({
      where: {
        organizationId_code: {
          organizationId: defaultOrg.id,
          code: projectData.code,
        },
      },
      update: {},
      create: {
        ...projectData,
        organizationId: defaultOrg.id,
        ownerId: superAdminUser.id,
      },
    });
  }

  console.log('✅ Sample projects created');

  // Create a default team
  console.log('👥 Creating default team...');
  
  // First check if team exists
  const existingTeam = await prisma.team.findFirst({
    where: {
      organizationId: defaultOrg.id,
      name: 'Development Team',
    },
  });

  const defaultTeam = existingTeam || await prisma.team.create({
    data: {
      organizationId: defaultOrg.id,
      name: 'Development Team',
      description: 'Core development team for Alignzo platform',
      leaderId: superAdminUser.id,
      isActive: true,
    },
  });

  console.log('✅ Default team created');

  // Add super admin to the team
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: defaultTeam.id,
        userId: superAdminUser.id,
      },
    },
    update: {},
    create: {
      teamId: defaultTeam.id,
      userId: superAdminUser.id,
      role: 'lead',
      isActive: true,
    },
  });

  console.log('✅ Super admin added to default team');

  // Create system settings
  console.log('⚙️ Creating system settings...');
  
  const systemSettings = [
    {
      key: 'app.name',
      value: 'Alignzo',
      description: 'Application name',
      category: 'general',
      isPublic: true,
    },
    {
      key: 'app.version',
      value: '2.0.0',
      description: 'Application version',
      category: 'general',
      isPublic: true,
    },
    {
      key: 'auth.google.enabled',
      value: true,
      description: 'Enable Google OAuth authentication',
      category: 'authentication',
      isPublic: false,
    },
    {
      key: 'auth.email.enabled',
      value: false,
      description: 'Enable email/password authentication',
      category: 'authentication',
      isPublic: false,
    },
    {
      key: 'features.time_tracking',
      value: true,
      description: 'Enable time tracking feature',
      category: 'features',
      isPublic: true,
    },
    {
      key: 'features.projects',
      value: true,
      description: 'Enable project management feature',
      category: 'features',
      isPublic: true,
    },
    {
      key: 'features.teams',
      value: true,
      description: 'Enable team management feature',
      category: 'features',
      isPublic: true,
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        ...setting,
        updatedBy: superAdminUser.id,
      },
    });
  }

  console.log('✅ System settings created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Created ${permissions.length} system permissions (standardized)`);
  console.log(`   - Created 4 system roles (SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE)`);
  console.log(`   - Created super admin user: riyas.siddikk@6dtech.co.in`);
  console.log(`   - Created operations user: operations@6dtech.co.in`);
  console.log(`   - Created default organization: 6D Technologies`);
  console.log(`   - Created 2 sample projects`);
  console.log(`   - Created default development team`);
  console.log(`   - Created ${systemSettings.length} system settings`);
  console.log('');
  console.log('🔑 User Credentials:');
  console.log('   Super Admin: riyas.siddikk@6dtech.co.in (SUPER_ADMIN role)');
  console.log('   Operations: operations@6dtech.co.in (ADMIN role)');
  console.log('');
  console.log('🚀 You can now log in using Google OAuth with these emails!');
  console.log('');
  console.log('🔐 Permission System:');
  console.log('   - User Management: 8 permissions');
  console.log('   - Role Management: 5 permissions');
  console.log('   - Permission Management: 5 permissions');
  console.log('   - Organization Management: 4 permissions');
  console.log('   - Project Management: 4 permissions');
  console.log('   - Team Management: 4 permissions');
  console.log('   - Time Session Management: 4 permissions');
  console.log('   - Work Log Management: 4 permissions');
  console.log('   - Analytics Management: 4 permissions');
  console.log('   - Settings Management: 4 permissions');
  console.log('   - Total: 46 comprehensive permissions');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 