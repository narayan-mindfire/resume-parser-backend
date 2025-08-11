import { Worker, Job } from "bullmq";
import redisClient from "../config/redisClient";
import pool from "../config/db";
import { JOBS } from "../constants/jobDescription";
import { Resume } from "../types/types";
import { JobType } from "../types/types";

function calculateMatchScore(resume: Resume, job: JobType) {
  let score = 0;

  const resumeSkills = (resume.skills || []).map((s) => s.toLowerCase());
  const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
  const matchedSkills = jobSkills.filter((skill) =>
    resumeSkills.includes(skill),
  );
  const skillsScore = (matchedSkills.length / jobSkills.length) * 70;
  score += skillsScore;

  const expRequired = job.required_experience_years || 0;
  const expCandidate = parseFloat(resume.total_experience_years) || 0;
  const expScore =
    expRequired > 0 ? Math.min((expCandidate / expRequired) * 20, 20) : 20;
  score += expScore;

  const jobKeywords = job.description.toLowerCase().split(/\W+/);
  const resumeText = (resume.raw_text || "").toLowerCase();
  const matchedKeywords = jobKeywords.filter((k) => resumeText.includes(k));
  const keywordScore = Math.min(
    (matchedKeywords.length / jobKeywords.length) * 10,
    10,
  );
  score += keywordScore;

  return {
    total: Math.round(score),
    breakdown: {
      skills: Math.round(skillsScore),
      experience: Math.round(expScore),
      keywords: Math.round(keywordScore),
    },
  };
}

// --- BullMQ Processor ---
export const matcherProcessor = async (
  job: Job<{ jobId: string; resumeId: string; trackingKey?: string }>,
) => {
  const { jobId, resumeId, trackingKey } = job.data;

  try {
    // Get Job Details
    const jobDef = JOBS.find((j) => j.id === jobId);
    if (!jobDef) {
      throw new Error(`Job with id ${jobId} not found`);
    }

    // Get Resume from DB
    const res = await pool.query("SELECT * FROM resumes WHERE id = $1", [
      resumeId,
    ]);
    if (res.rows.length === 0) {
      throw new Error(`Resume with id ${resumeId} not found`);
    }
    const resume = res.rows[0];

    // Calculate Score
    const matchResult = calculateMatchScore(resume, jobDef);
    console.log("match result: ", matchResult);
    // Store Result in DB
    // await pool.query(
    //   `INSERT INTO resume_matches (resume_id, job_id, score, breakdown)
    //    VALUES ($1, $2, $3, $4)
    //    ON CONFLICT (resume_id, job_id)
    //    DO UPDATE SET score = EXCLUDED.score, breakdown = EXCLUDED.breakdown, updated_at = CURRENT_TIMESTAMP`,
    //   [resumeId, jobId, matchResult.total, matchResult.breakdown]
    // );

    if (trackingKey) {
      await redisClient.set(
        `status:${trackingKey}`,
        JSON.stringify({
          status: "matched",
          resumeId,
          jobId,
          matchResult,
          timestamp: Date.now(),
        }),
        "EX",
        24 * 60 * 60,
      );

      await redisClient.publish(
        "job-matches",
        JSON.stringify({
          jobId: job.id,
          status: "matched",
          resumeId,
          matchResult,
          timestamp: Date.now(),
          trackingKey,
        }),
      );
    }

    return {
      jobId,
      resumeId,
      matchResult,
    };
  } catch (error) {
    console.error(`Error matching resume ${resumeId} to job ${jobId}:`, error);
    throw error;
  }
};

// Worker Init
export const matcherWorker = new Worker("matcher", matcherProcessor, {
  connection: redisClient,
  concurrency: 5,
  removeOnComplete: { count: 50, age: 24 * 3600 },
  removeOnFail: { count: 20, age: 24 * 3600 },
});

matcherWorker.on("completed", (job, result) => {
  console.log(
    `Matcher job ${job.id} completed with score:`,
    result.matchResult.total,
  );
});

matcherWorker.on("failed", (job, err) => {
  console.error(`Matcher job ${job?.id} failed:`, err.message);
});

matcherWorker.on("error", (err) => {
  console.error("Matcher worker error:", err);
});

console.log("Matcher worker started successfully");
