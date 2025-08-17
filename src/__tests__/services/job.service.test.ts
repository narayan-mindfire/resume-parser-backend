import { matchJobInBatch } from "../../services/jobs.service";
import { resumeRepository } from "../../repositories/resumeRepository";
import { JOBS } from "../../constants/jobDescription";
import { Resume } from "../../../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";

jest.mock("../../repositories/resumeRepository", () => ({
  resumeRepository: {
    findByBatchId: jest.fn(),
  },
}));

describe("matchJobInBatch Service", () => {
  const mockJob = {
    id: "job-1",
    title: "Software Engineer",
    description: "We need someone skilled in JavaScript and React.",
    skills: ["JavaScript", "React"],
    required_experience_years: 2,
  };

  const mockResumes: Partial<Resume>[] = [
    {
      id: "resume-1",
      skills: ["JavaScript", "React", "Node.js"],
      totalExperienceYears: new Decimal(3),
      rawText: "I am a developer with JavaScript and React experience.",
    },
    {
      id: "resume-2",
      skills: ["Python", "Django"],
      totalExperienceYears: new Decimal(1),
      rawText: "Worked with Python extensively.",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (JOBS as any).push(mockJob);
  });

  afterEach(() => {
    const index = JOBS.findIndex((j) => j.id === mockJob.id);
    if (index > -1) JOBS.splice(index, 1);
  });

  it("should throw an error if job is not found", async () => {
    await expect(matchJobInBatch("non-existent", "batch-1")).rejects.toThrow(
      "Job with ID non-existent not found.",
    );
  });

  it("should return an empty array if no resumes are found", async () => {
    (resumeRepository.findByBatchId as jest.Mock).mockResolvedValue(null);

    const result = await matchJobInBatch(mockJob.id, "batch-1");

    expect(result).toEqual([]);
    expect(resumeRepository.findByBatchId).toHaveBeenCalledWith("batch-1");
  });

  it("should calculate match scores for resumes in the batch", async () => {
    (resumeRepository.findByBatchId as jest.Mock).mockResolvedValue(
      mockResumes,
    );

    const result = await matchJobInBatch(mockJob.id, "batch-1");

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result?.[0]).toHaveProperty("resumeId", "resume-1");
    expect(result?.[0].score.total).toBeGreaterThan(0);
    expect(result?.[0].score.breakdown).toHaveProperty("skills");
    expect(result?.[0].score.breakdown).toHaveProperty("experience");
    expect(result?.[0].score.breakdown).toHaveProperty("keywords");
  });
});
