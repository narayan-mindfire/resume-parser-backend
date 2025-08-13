import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { fetchAllResumes, fetchResumeById } from "../services/resumes.service";
/**
 * @desc Handles fetching all the resumes from the db
 */
export const getAllResumes = asyncHandler(
  async (req: Request, res: Response) => {
    fetchAllResumes(req, res);
  },
);

export const getResumeById = asyncHandler(
  async (req: Request, res: Response) => {
    fetchResumeById(req, res);
  },
);
