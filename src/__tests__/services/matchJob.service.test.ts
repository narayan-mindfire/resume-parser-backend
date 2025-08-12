import { matchJobService } from "../../services/jobs.service";
import { jobMatchingQueue } from "../../queues/jobMatchingQueue";
import { Job } from "bullmq";

jest.mock("bullmq", () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      close: jest.fn(),
    })),
    Job: jest.requireActual("bullmq").Job,
  };
});

const mockJobMatchingQueueAdd = jobMatchingQueue.add as jest.Mock;

describe("matchJobService", () => {
  const jobId = "test-job-id";
  const resumeId = "test-resume-id";
  const trackingKey = `${jobId}:${resumeId}`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should add a job to the queue and return a tracking key", async () => {
    mockJobMatchingQueueAdd.mockResolvedValue({ id: "mock-job-id" } as Job);

    const result = await matchJobService(jobId, resumeId);

    expect(mockJobMatchingQueueAdd).toHaveBeenCalledWith("matchJob", {
      jobId,
      resumeId,
      trackingKey,
    });

    expect(result).toEqual({
      jobId: "mock-job-id",
      trackingKey,
    });
  });

  test("should throw an error if jobId is missing", async () => {
    await expect(matchJobService("", resumeId)).rejects.toThrow(
      "jobId and resumeId are required",
    );
    expect(mockJobMatchingQueueAdd).not.toHaveBeenCalled();
  });

  test("should throw an error if resumeId is missing", async () => {
    await expect(matchJobService(jobId, "")).rejects.toThrow(
      "jobId and resumeId are required",
    );
    expect(mockJobMatchingQueueAdd).not.toHaveBeenCalled();
  });

  afterAll(async () => {
    await jobMatchingQueue.close();
  });
});
