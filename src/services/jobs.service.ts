import { jobMatchingQueue } from "../queues/jobMatchingQueue";

export async function matchJobService(jobId: string, resumeId: string) {
  console.log(jobId, resumeId);
  if (!jobId || !resumeId) {
    throw new Error("jobId and resumeId are required");
  }
  const trackingKey = `${jobId}:${resumeId}`;
  const job = await jobMatchingQueue.add("matchJob", {
    jobId,
    resumeId,
    trackingKey,
  });

  return {
    jobId: job.id,
    trackingKey,
  };
}
