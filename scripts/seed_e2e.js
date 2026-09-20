/**
 * Sana Quranic Platform - E2E Seeding Script (Safe Version)
 * Requirements: 6 students, 3 groups, 1+ plan.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Force use of DIRECT_URL from .env to bypass IPv6 connectivity issues with db.*.supabase.co
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.gvhejkcmlqtmxvankijc:0WsW5wAfgIkbp8cl@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"
    },
  },
});

// Helper to get academic year (Egyptian: Sep -> Aug)
function currentAcademicYear(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed
  if (m >= 8) return `${y}-${y + 1}`;
  return `${y - 1}-${y}`;
}

async function main() {
  const year = currentAcademicYear();
  console.log(`Starting E2E seeding for academic year: ${year}`);

  // 1. Ensure Program exists
  const program = await prisma.program.upsert({
    where: { slug: 'hifz-standard' },
    update: { isActive: true },
    create: {
      name: 'برنامج الحفظ المكثف',
      slug: 'hifz-standard',
      description: 'حفظ القرآن الكريم بالتجويد',
      isActive: true,
    },
  });
  console.log(`Program ready: ${program.name}`);

  // 2. Ensure Teacher exists (Mariam)
  const teacherUser = await prisma.user.upsert({
    where: { username: 'teacher_mariam' },
    update: {},
    create: {
      username: 'teacher_mariam',
      passwordHash: await bcrypt.hash('Teacher@123', 10),
      role: 'teacher',
      fullName: 'مريم محمد',
      phone: '01000000001',
      isActive: true,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      bio: 'معلمة قرآن متخصصة في التجويد',
      specialty: 'حفظ وتجويد',
    },
  });
  console.log(`Teacher ready: ${teacherUser.fullName}`);

  // 3. Ensure 6 Students exist
  const students = [];
  for (let i = 1; i <= 6; i++) {
    const username = `student_test_${i}`;
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        passwordHash: await bcrypt.hash('Student@123', 10),
        role: 'student',
        fullName: `طالبة اختبار ${i}`,
        isActive: true,
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        gender: 'female',
      },
    });
    students.push(student);
  }
  console.log(`Created/Ensured 6 students`);

  // 4. Create 3 Groups for the Teacher
  const groups = [];
  const groupNames = ['حلقة الفردوس', 'حلقة الكوثر', 'حلقة النور'];
  for (let i = 0; i < 3; i++) {
    // Delete existing group with same name to avoid clutter or issues if re-run
    await prisma.group.deleteMany({
      where: { name: groupNames[i], teacherId: teacher.id, academicYear: year }
    });

    const group = await prisma.group.create({
      data: {
        name: groupNames[i],
        teacherId: teacher.id,
        programId: program.id,
        academicYear: year,
        maxStudents: 10,
        isActive: true,
        schedules: {
          create: [
            { dayOfWeek: (i + 1) % 7, startTime: '16:00', durationMins: 60 }
          ]
        }
      },
    });
    groups.push(group);
  }
  console.log(`Created 3 groups for teacher`);

  // 5. Enroll Students (4 in first group, 2 in second group)
  const startDate = new Date();
  startDate.setMonth(8); // September
  startDate.setDate(1);

  // Group 1: 4 students
  for (let i = 0; i < 4; i++) {
    await prisma.enrollment.upsert({
      where: {
        studentId_academicYear: {
          studentId: students[i].id,
          academicYear: year,
        }
      },
      update: {
        groupId: groups[0].id,
        programId: program.id,
        status: 'active',
      },
      create: {
        studentId: students[i].id,
        groupId: groups[0].id,
        programId: program.id,
        academicYear: year,
        startDate,
        status: 'active',
      }
    });
  }

  // Group 2: 2 students
  for (let i = 4; i < 6; i++) {
    await prisma.enrollment.upsert({
      where: {
        studentId_academicYear: {
          studentId: students[i].id,
          academicYear: year,
        }
      },
      update: {
        groupId: groups[1].id,
        programId: program.id,
        status: 'active',
      },
      create: {
        studentId: students[i].id,
        groupId: groups[1].id,
        programId: program.id,
        academicYear: year,
        startDate,
        status: 'active',
      }
    });
  }
  console.log(`Enrolled students: 4 in ${groups[0].name}, 2 in ${groups[1].name}`);

  // 6. Add at least one Memorization Plan
  await prisma.memorizationPlan.upsert({
    where: { studentId: students[0].id },
    update: {
      currentSurah: 'البقرة',
      currentAyahFrom: 1,
      currentAyahTo: 10,
      progressPct: 5,
    },
    create: {
      studentId: students[0].id,
      currentSurah: 'البقرة',
      currentAyahFrom: 1,
      currentAyahTo: 10,
      progressPct: 5,
    }
  });
  console.log(`Added memorization plan for ${students[0].id}`);

  console.log('E2E Seeding completed successfully! ✅');
}

main()
  .catch((e) => {
    console.error('SEED_ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
