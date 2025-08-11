import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
/**
 * @desc    Handles fetching all the resumes from the db
 */
export const getAllResumes = asyncHandler(
  async (req: Request, res: Response) => {
    res.send(res.json({ message: "get all resumes called" }));
  },
);
