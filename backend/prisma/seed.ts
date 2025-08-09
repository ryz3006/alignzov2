import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 1) Load standardized config.json first (if present) and map to envs
try {
  const configPath = path.join(__dirname, '..', 'config', 'config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const cfg = JSON.parse(raw);
    const b = cfg?.database || cfg?.backend?.database;
    if (b?.url) process.env.DATABASE_URL = b.url;

    const seed = cfg?.seed || cfg?.backend?.seed;
    if (seed?.adminEmail) process.env.SEED_ADMIN_EMAIL = seed.adminEmail;
    if (seed?.orgName) process.env.SEED_ORG_NAME = seed.orgName;
    if (seed?.orgDomain) process.env.SEED_ORG_DOMAIN = seed.orgDomain;
  }
} catch {}

// 2) Load environment variables from .env and legacy env as fallback
const backendEnvPath = path.join(__dirname, '..', '.env');
const legacyEnvPath = path.join(__dirname, '../../configs/development.env');
dotenv.config({ path: backendEnvPath });
dotenv.config({ path: legacyEnvPath });

// Instantiate Prisma after envs are prepared
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
      isSystem: true,
      isActive: true,
    },
  });

  console.log('✅ System roles created');

  // Cleanup legacy permissions resource entries (no UI for managing permissions directly)
  console.log('🧹 Cleaning up legacy permissions.* records...');
  const legacyPermissions = await prisma.permission.findMany({ where: { resource: 'permissions' } });
  if (legacyPermissions.length > 0) {
    const legacyIds = legacyPermissions.map(p => p.id);
    await prisma.rolePermission.deleteMany({ where: { permissionId: { in: legacyIds } } });
    await prisma.userPermission.deleteMany({ where: { permissionId: { in: legacyIds } } });
    await prisma.permission.deleteMany({ where: { id: { in: legacyIds } } });
    console.log(`✅ Removed ${legacyIds.length} legacy permissions`);
  } else {
    console.log('✅ No legacy permissions found');
  }

  // Standardized permission manifest (full CRUD for all core resources)
  const permissions = [
    // User Management (8)
    { name: 'users.create', displayName: 'Create Users', resource: 'users', action: 'create' },
    { name: 'users.read', displayName: 'View Users', resource: 'users', action: 'read' },
    { name: 'users.update', displayName: 'Edit Users', resource: 'users', action: 'update' },
    { name: 'users.delete', displayName: 'Delete Users', resource: 'users', action: 'delete' },
    { name: 'users.assign_role', displayName: 'Assign Roles', resource: 'users', action: 'assign_role' },
    { name: 'users.remove_role', displayName: 'Remove Roles', resource: 'users', action: 'remove_role' },
    { name: 'users.assign_manager', displayName: 'Assign Manager', resource: 'users', action: 'assign_manager' },
    { name: 'users.remove_manager', displayName: 'Remove Manager', resource: 'users', action: 'remove_manager' },

    // Role Management (5)
    { name: 'roles.create', displayName: 'Create Roles', resource: 'roles', action: 'create' },
    { name: 'roles.read', displayName: 'View Roles', resource: 'roles', action: 'read' },
    { name: 'roles.update', displayName: 'Edit Roles', resource: 'roles', action: 'update' },
    { name: 'roles.delete', displayName: 'Delete Roles', resource: 'roles', action: 'delete' },
    { name: 'roles.manage', displayName: 'Manage Role Permissions', resource: 'roles', action: 'manage' },

    // Permission Management (UI-less) → remove CRUD, keep role-level assign/unassign actions
    { name: 'roles.assign_permission', displayName: 'Assign Permission to Role', resource: 'roles', action: 'assign_permission' },
    { name: 'roles.unassign_permission', displayName: 'Unassign Permission from Role', resource: 'roles', action: 'unassign_permission' },

    // Organization Management (4)
    { name: 'organizations.create', displayName: 'Create Organizations', resource: 'organizations', action: 'create' },
    { name: 'organizations.read', displayName: 'View Organizations', resource: 'organizations', action: 'read' },
    { name: 'organizations.update', displayName: 'Edit Organizations', resource: 'organizations', action: 'update' },
    { name: 'organizations.delete', displayName: 'Delete Organizations', resource: 'organizations', action: 'delete' },

    // Project Management (4)
    { name: 'projects.create', displayName: 'Create Projects', resource: 'projects', action: 'create' },
    { name: 'projects.read', displayName: 'View Projects', resource: 'projects', action: 'read' },
    { name: 'projects.update', displayName: 'Edit Projects', resource: 'projects', action: 'update' },
    { name: 'projects.delete', displayName: 'Delete Projects', resource: 'projects', action: 'delete' },

    // Team Management (4)
    { name: 'teams.create', displayName: 'Create Teams', resource: 'teams', action: 'create' },
    { name: 'teams.read', displayName: 'View Teams', resource: 'teams', action: 'read' },
    { name: 'teams.update', displayName: 'Edit Teams', resource: 'teams', action: 'update' },
    { name: 'teams.delete', displayName: 'Delete Teams', resource: 'teams', action: 'delete' },

    // Time Session Management (4)
    { name: 'time_sessions.create', displayName: 'Create Time Sessions', resource: 'time_sessions', action: 'create' },
    { name: 'time_sessions.read', displayName: 'View Time Sessions', resource: 'time_sessions', action: 'read' },
    { name: 'time_sessions.update', displayName: 'Edit Time Sessions', resource: 'time_sessions', action: 'update' },
    { name: 'time_sessions.delete', displayName: 'Delete Time Sessions', resource: 'time_sessions', action: 'delete' },

    // Work Log Management (4)
    { name: 'work_logs.create', displayName: 'Create Work Logs', resource: 'work_logs', action: 'create' },
    { name: 'work_logs.read', displayName: 'View Work Logs', resource: 'work_logs', action: 'read' },
    { name: 'work_logs.update', displayName: 'Edit Work Logs', resource: 'work_logs', action: 'update' },
    { name: 'work_logs.delete', displayName: 'Delete Work Logs', resource: 'work_logs', action: 'delete' },

    // Analytics (CRUD placeholder)
    { name: 'analytics.create', displayName: 'Create Analytics', resource: 'analytics', action: 'create' },
    { name: 'analytics.read', displayName: 'View Analytics', resource: 'analytics', action: 'read' },
    { name: 'analytics.update', displayName: 'Edit Analytics', resource: 'analytics', action: 'update' },
    { name: 'analytics.delete', displayName: 'Delete Analytics', resource: 'analytics', action: 'delete' },

    // Settings (CRUD placeholder)
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

  // Ensure ADMIN has read access to core resources by default
  const defaultAdminPermissions = permissions.filter(p =>
    [
      'users.read','projects.read','teams.read','time_sessions.read','work_logs.read','settings.read','analytics.read','organizations.read','roles.read','permissions.read'
    ].includes(p.name)
  );
  for (const permission of defaultAdminPermissions) {
    const perm = await prisma.permission.findUnique({ where: { name: permission.name } });
    if (perm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: adminRole.id, permissionId: perm.id },
      });
    }
  }
  console.log('✅ Core read permissions assigned to ADMIN role');

  // Resolve seed inputs from environment
  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@alignzo.com';
  const seedOrgName = process.env.SEED_ORG_NAME || 'Alignzo';
  const seedOrgDomain = process.env.SEED_ORG_DOMAIN || (seedAdminEmail.split('@')[1] || 'alignzo.local');

  // Create a default organization first
  console.log('🏢 Creating default organization...');
  
  const defaultOrg = await prisma.organization.upsert({
    where: { domain: seedOrgDomain },
    update: {},
    create: {
      name: seedOrgName,
      domain: seedOrgDomain,
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
    where: { email: seedAdminEmail },
    update: {
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'Super Admin',
      isActive: true,
      emailVerifiedAt: new Date(),
      organizationId: defaultOrg.id, // Add organization assignment
    },
    create: {
      email: seedAdminEmail,
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'Super Admin',
      title: 'System Administrator',
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
    where: { email: `operations@${seedOrgDomain}` },
    update: {
      firstName: 'Operations',
      lastName: 'User',
      displayName: 'Operations User',
      isActive: true,
      emailVerifiedAt: new Date(),
      organizationId: defaultOrg.id,
    },
    create: {
      email: `operations@${seedOrgDomain}`,
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

  // Seed access levels: SUPER_ADMIN/ADMIN get FULL_ACCESS by default
    await prisma.userAccessLevel.upsert({
    where: { userId_level: { userId: superAdminUser.id, level: 'FULL_ACCESS' } },
    update: {},
    create: { userId: superAdminUser.id, level: 'FULL_ACCESS' },
  });
  await prisma.userAccessLevel.upsert({
    where: { userId_level: { userId: operationsUser.id, level: 'ORGANIZATION' } },
    update: {},
    create: { userId: operationsUser.id, level: 'ORGANIZATION' },
  });
  console.log('✅ Seeded default access levels for admin users');

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
  console.log(`   - Created ${permissions.length} system permissions`);
  console.log(`   - Created 4 system roles (SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE)`);
  console.log(`   - Created super admin user: ${seedAdminEmail}`);
  console.log(`   - Created operations user: operations@${seedOrgDomain}`);
  console.log(`   - Created default organization: ${seedOrgName}`);
  console.log(`   - Created 2 sample projects`);
  console.log(`   - Created default development team`);
  console.log(`   - Created ${systemSettings.length} system settings`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 