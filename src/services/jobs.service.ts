import { Resume } from "../../generated/prisma";
import { JobType } from "../types/types";
import { JOBS } from "../constants/jobDescription";
import { resumeRepository } from "../repositories/resumeRepository";

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
  const expCandidate = Number(resume.totalExperienceYears ?? 0);
  const expScore =
    expRequired > 0 ? Math.min((expCandidate / expRequired) * 20, 20) : 20;
  score += expScore;

  const jobKeywords = job.description.toLowerCase().split(/\W+/);
  const resumeText = (resume.rawText || "").toLowerCase();
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

export async function matchJobInBatch(jobId: string, batchId: string) {
  try {
    const job = JOBS.find((j) => j.id === jobId);
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found.`);
    }
    const resumes = await resumeRepository.findByBatchId(batchId);
    if (!resumes) {
      return [];
    }
    const results = resumes.map((resume) => {
      const matchResult = calculateMatchScore(resume, job);
      return {
        resumeId: resume.id,
        score: matchResult,
      };
    });

    return results;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
}
