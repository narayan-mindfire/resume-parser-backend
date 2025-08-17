import { Request, Response } from "express";
import { matchJobInBatch } from "../services/jobs.service";

export async function matchJobByBatch(req: Request, res: Response) {
  try {
    const { jobId, batchId } = req.query;
    if (typeof jobId !== "string" || typeof batchId !== "string") {
      throw new Error("request queries missing");
    }
    const matches = await matchJobInBatch(jobId, batchId);
    res.status(200).json({ matches });
  } catch (err: unknown) {
    if (err instanceof Error) res.status(400).json({ error: err.message });
    else {
      res.status(400).json({ error: "something went wrong" });
    }
  }
}
