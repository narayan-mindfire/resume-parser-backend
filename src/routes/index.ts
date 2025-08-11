import { Router } from "express";
import uploadRouter from "./upload.routes";
import resumeRouter from "./resume.routes";

const router = Router();
router.use("/uploads", uploadRouter);
router.use("/resumes", resumeRouter);

export default router;
