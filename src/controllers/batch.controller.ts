import { Request, Response } from "express";
import { fetchMyBatches } from "../repositories/batch.repository";
import { resumeRepository } from "../repositories/resumeRepository";
import { AuthRequest, Insights } from "../types/types";

export async function getMyBatches(req: Request, res: Response) {
  try {
    const userId = (req as AuthRequest).user.id;
    const batches = await fetchMyBatches(userId);
    res.status(200).json(batches);
  } catch (err: unknown) {
    if (err instanceof Error) res.status(400).json({ error: err.message });
    else {
      res.status(400).json({ error: "something went wrong" });
    }
  }
}

export async function getMyInsights(req: Request, res: Response) {
  try {
    const batchId = req.query.batchId as string;
    const insights: Insights = await resumeRepository.fetchInsights(batchId);
    return res.status(200).json({ insights });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(400).json({ error: "couldn't fetch insights" });
    }
  }
}
