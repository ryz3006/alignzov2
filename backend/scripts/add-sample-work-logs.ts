import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the development config
const envPath = path.join(__dirname, '../../configs/development.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function addSampleWorkLogs() {
  console.log('📝 Adding sample work logs...');

  // Get the super admin user and projects
  const superAdmin = await prisma.user.findUnique({
    where: { email: 'riyas.siddikk@6dtech.co.in' },
  });

  const projects = await prisma.project.findMany({
    take: 2,
  });

  if (!superAdmin || projects.length === 0) {
    console.log('❌ Super admin user or projects not found');
    return;
  }

  const sampleWorkLogs = [
    {
      userId: superAdmin.id,
      projectId: projects[0].id,
      description: 'Working on backend API development for work logs module',
      duration: 14400, // 4 hours
      startTime: new Date('2024-01-15T09:00:00Z'),
      endTime: new Date('2024-01-15T13:00:00Z'),
      isBillable: true,
      hourlyRate: 50,
      tags: ['backend', 'api', 'development'],
    },
    {
      userId: superAdmin.id,
      projectId: projects[0].id,
      description: 'Frontend integration and testing of work logs functionality',
      duration: 10800, // 3 hours
      startTime: new Date('2024-01-15T14:00:00Z'),
      endTime: new Date('2024-01-15T17:00:00Z'),
      isBillable: true,
      hourlyRate: 50,
      tags: ['frontend', 'testing', 'integration'],
    },
    {
      userId: superAdmin.id,
      projectId: projects[1]?.id || projects[0].id,
      description: 'Database schema design and optimization',
      duration: 7200, // 2 hours
      startTime: new Date('2024-01-16T10:00:00Z'),
      endTime: new Date('2024-01-16T12:00:00Z'),
      isBillable: true,
      hourlyRate: 50,
      tags: ['database', 'schema', 'optimization'],
    },
    {
      userId: superAdmin.id,
      projectId: projects[0].id,
      description: 'Code review and documentation updates',
      duration: 5400, // 1.5 hours
      startTime: new Date('2024-01-16T14:00:00Z'),
      endTime: new Date('2024-01-16T15:30:00Z'),
      isBillable: false,
      tags: ['code-review', 'documentation'],
    },
    {
      userId: superAdmin.id,
      projectId: projects[1]?.id || projects[0].id,
      description: 'Team meeting and project planning',
      duration: 3600, // 1 hour
      startTime: new Date('2024-01-17T09:00:00Z'),
      endTime: new Date('2024-01-17T10:00:00Z'),
      isBillable: false,
      tags: ['meeting', 'planning'],
    },
  ];

  for (const workLogData of sampleWorkLogs) {
    await prisma.workLog.create({
      data: workLogData,
    });
  }

  console.log('✅ Sample work logs added successfully!');
  console.log(`   - Added ${sampleWorkLogs.length} work logs`);
  console.log(`   - Total hours: ${sampleWorkLogs.reduce((sum, log) => sum + log.duration, 0) / 3600}`);
}

addSampleWorkLogs()
  .catch((e) => {
    console.error('❌ Error adding sample work logs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 