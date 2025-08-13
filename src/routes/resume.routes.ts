import express from "express";
import { getAllResumes, getResumeById } from "../controllers/resume.controller";
import { protect } from "../middlewares/auth.middleware";

const resumeRouter = express.Router();

resumeRouter.get("/get-all-resumes", protect, getAllResumes);
resumeRouter.get("/get-resume/:id", protect, getResumeById);
export default resumeRouter;
