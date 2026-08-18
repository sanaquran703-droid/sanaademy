-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'teacher', 'admin');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('female', 'male');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('scheduled', 'completed', 'absent', 'postponed', 'cancelled');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'excused');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'confirmed', 'rejected');

-- CreateEnum
CREATE TYPE "EvaluationGrade" AS ENUM ('excellent', 'very_good', 'good', 'needs_review');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('active', 'paused', 'completed', 'withdrawn');

-- CreateEnum
CREATE TYPE "MeetingProvider" AS ENUM ('google_meet', 'zoom', 'discord', 'teams', 'other');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'female',
    "birthDate" TIMESTAMP(3),
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "notes" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "specialty" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "programId" TEXT,
    "groupId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teacherId" TEXT,
    "programId" TEXT,
    "meetingProvider" "MeetingProvider" NOT NULL DEFAULT 'google_meet',
    "meetLink" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "academicYear" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 45,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Cairo',

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorizationPlan" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "currentSurah" TEXT,
    "currentAyahFrom" INTEGER,
    "currentAyahTo" INTEGER,
    "reviewSurah" TEXT,
    "reviewAyahFrom" INTEGER,
    "reviewAyahTo" INTEGER,
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemorizationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "LessonStatus" NOT NULL DEFAULT 'scheduled',
    "meetLink" TEXT,
    "newPortion" TEXT,
    "reviewPortion" TEXT,
    "errorsCount" INTEGER,
    "errorsType" TEXT,
    "hasNewMemorization" BOOLEAN NOT NULL DEFAULT true,
    "homework" TEXT,
    "teacherNotes" TEXT,
    "rescheduledTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'present',
    "note" TEXT,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "memorization" "EvaluationGrade" NOT NULL DEFAULT 'good',
    "review" "EvaluationGrade" NOT NULL DEFAULT 'good',
    "tajweed" "EvaluationGrade" NOT NULL DEFAULT 'good',
    "commitment" "EvaluationGrade" NOT NULL DEFAULT 'good',
    "overallNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "monthCovered" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'instapay',
    "proofUrl" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "note" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "username" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_academicYear_status_idx" ON "Enrollment"("academicYear", "status");

-- CreateIndex
CREATE INDEX "Enrollment_groupId_idx" ON "Enrollment"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_academicYear_key" ON "Enrollment"("studentId", "academicYear");

-- CreateIndex
CREATE INDEX "Group_teacherId_idx" ON "Group"("teacherId");

-- CreateIndex
CREATE INDEX "Schedule_groupId_idx" ON "Schedule"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "MemorizationPlan_studentId_key" ON "MemorizationPlan"("studentId");

-- CreateIndex
CREATE INDEX "Lesson_groupId_idx" ON "Lesson"("groupId");

-- CreateIndex
CREATE INDEX "Lesson_studentId_idx" ON "Lesson"("studentId");

-- CreateIndex
CREATE INDEX "Lesson_scheduledAt_idx" ON "Lesson"("scheduledAt");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_lessonId_studentId_key" ON "Attendance"("lessonId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_lessonId_key" ON "Evaluation"("lessonId");

-- CreateIndex
CREATE INDEX "Evaluation_studentId_idx" ON "Evaluation"("studentId");

-- CreateIndex
CREATE INDEX "Payment_studentId_idx" ON "Payment"("studentId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipHash_createdAt_idx" ON "LoginAttempt"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_username_createdAt_idx" ON "LoginAttempt"("username", "createdAt");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorizationPlan" ADD CONSTRAINT "MemorizationPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

