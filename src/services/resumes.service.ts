import { Request, Response } from "express";
import { ResumeRepository } from "../repositories/resumeRepository";

export const fetchAllResumes = async (req: Request, res: Response) => {
  const resumes = await ResumeRepository.findById(
    "dc7245ab-6d67-498e-a083-bdf767c836ac",
  );
  console.log("got resumes: ", resumes);
  res.status(200).json({ resumes });
};
