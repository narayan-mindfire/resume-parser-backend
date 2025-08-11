import express from "express";
import { getAllResumes } from "../controllers/resume.controller";

const resumeRouter = express.Router();

resumeRouter.get("/get-all-resumes", getAllResumes);

export default resumeRouter;
