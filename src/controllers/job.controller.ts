import { Request, Response } from "express";
import { matchJobService } from "../services/jobs.service";

export async function matchJobController(req: Request, res: Response) {
  try {
    const { jobId, resumeId } = req.query;
    if (typeof jobId !== "string" || typeof resumeId !== "string") {
      res.status(400).json({ error: "jobId and resumeId must be strings." });
      return;
    }
    const { trackingKey } = await matchJobService(jobId, resumeId);
    res.status(200).json({ trackingKey });
  } catch (err: unknown) {
    if (err instanceof Error) res.status(400).json({ error: err.message });
    else {
      res.status(400).json({ error: "something went wrong" });
    }
  }
}
