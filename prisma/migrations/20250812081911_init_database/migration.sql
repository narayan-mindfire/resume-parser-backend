-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "fname" TEXT NOT NULL,
    "lname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "bio" TEXT,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."resumes" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total_experience_years" DECIMAL(5,2),
    "raw_text" TEXT,
    "processing_status" TEXT NOT NULL DEFAULT 'processing',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "resumes_file_name_key" ON "public"."resumes"("file_name");

-- CreateIndex
CREATE INDEX "resumes_file_name_idx" ON "public"."resumes"("file_name");

-- CreateIndex
CREATE INDEX "resumes_processing_status_idx" ON "public"."resumes"("processing_status");

-- CreateIndex
CREATE INDEX "resumes_created_at_idx" ON "public"."resumes"("created_at");

-- CreateIndex
CREATE INDEX "resumes_email_idx" ON "public"."resumes"("email");
