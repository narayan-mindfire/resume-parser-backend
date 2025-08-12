import { Router } from "express";
import uploadRouter from "./upload.routes";
import resumeRouter from "./resume.routes";
import jobRouter from "./job.routes";

const router = Router();

router.use("/uploads", uploadRouter);
router.use("/resumes", resumeRouter);
router.use("/jobs", jobRouter);

export default router;
