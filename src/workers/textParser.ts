import { Job, Worker } from "bullmq";
import redisClient from "../config/redisClient";
import pool from "../config/db";

import { TextParsingJob } from "./worker.types";
import { parseResumeText } from "./extractor.service";

/**
 * Sanitizes a filename to make it safe for SQL queries by replacing spaces and
 * parentheses with underscores. This prevents syntax errors.
 * @param {string} filename The original filename.
 * @returns {string} The sanitized filename.
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[\s()]/g, "_").replace(/_+/g, "_");
}

// --- The BullMQ Processor Function ---
export const processor = async (job: Job<TextParsingJob>) => {
  const { fileName } = job.data;
  let resumeId: string | null = null;
  const sanitizedFileName = sanitizeFilename(fileName);

  try {
    // Get raw text from Redis
    const raw = await redisClient.get(`ocr:${fileName}`);
    if (!raw) {
      throw new Error(`No OCR data found for ${fileName}`);
    }
    const { text } = JSON.parse(raw);

    if (!text || typeof text !== "string") {
      throw new Error(`Invalid text data for ${fileName}`);
    }

    const insertQuery = `
            INSERT INTO resumes (file_name, raw_text, processing_status)
            VALUES ($1, $2, 'processing')
            ON CONFLICT (file_name) DO UPDATE SET raw_text = EXCLUDED.raw_text, processing_status = 'processing'
            RETURNING id;
        `;
    const insertResult = await pool.query(insertQuery, [
      sanitizedFileName,
      text,
    ]);
    resumeId = insertResult.rows[0].id;
    console.log(
      `Started processing for ${sanitizedFileName} with DB ID: ${resumeId}`,
    );

    // Parse the resume text
    const parsed = parseResumeText(text);

    const updateQuery = `
            UPDATE resumes
            SET
                name = $1,
                email = $2,
                phone = $3,
                skills = $4,
                education = $5,
                experience = $6,
                total_experience_years = $7,
                processing_status = 'completed',
                updated_at = CURRENT_TIMESTAMP  
            WHERE id = $8;
        `;
    const values = [
      parsed.name,
      parsed.email,
      parsed.phone,
      parsed.skills,
      parsed.education,
      parsed.experience,
      parsed.totalExperienceYears,
      resumeId,
    ];
    await pool.query(updateQuery, values);

    console.log(
      `Successfully parsed and stored resume for ${sanitizedFileName} in PostgreSQL.`,
    );

    // Clean up the temporary OCR data from Redis.
    await redisClient.del(`ocr:${fileName}`);

    return parsed;
  } catch (error) {
    console.error(`Error processing resume ${sanitizedFileName}:`, error);

    if (resumeId) {
      const updateErrorQuery = `
                UPDATE resumes
                SET
                    processing_status = 'failed',
                    error_message = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2;
            `;
      await pool.query(updateErrorQuery, [
        error instanceof Error ? error.message : "Unknown error",
        resumeId,
      ]);
    }

    throw error;
  }
};

// BullMQ Worker Initialization
export const textParsingWorker = new Worker<TextParsingJob>(
  "text-parsing",
  processor,
  {
    connection: redisClient,
    concurrency: 5,
    removeOnComplete: { count: 50, age: 24 * 3600 },
    removeOnFail: { count: 20, age: 24 * 3600 },
  },
);

// Worker Event Handling
textParsingWorker.on("completed", (job, result) => {
  console.log(`Job ${job.id} for ${job.data.fileName} completed successfully.`);
});

textParsingWorker.on("failed", (job, err) => {
  console.error(
    `Job ${job?.id} failed for ${job?.data.fileName}:`,
    err.message,
  );
});

textParsingWorker.on("error", (err) => {
  console.error("Worker error:", err);
});

console.log("Text parsing worker started successfully");
