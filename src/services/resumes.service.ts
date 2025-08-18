import { Request, Response } from "express";
import { resumeRepository } from "../repositories/resumeRepository";

export const fetchAllResumes = async (req: Request, res: Response) => {
  const resumes = await resumeRepository.findAll();
  res.status(200).json({ resumes });
};

export const fetchResumeById = async (req: Request, res: Response) => {
  const resumeId = req.params.id;
  if (resumeId) {
    const resume = await resumeRepository.findById(resumeId);
    if (resume) {
      res.status(200).json({ resume });
    } else {
      res.status(404);
    }
  }
};

export const fetchResumeByBatch = async (req: Request, res: Response) => {
  const batchId = req.params.batchId;
  if (batchId) {
    const resumes = await resumeRepository.findByBatchId(batchId);
    if (resumes) {
      res.status(200).json({ resumes });
    } else {
      res.status(404);
    }
  }
};
