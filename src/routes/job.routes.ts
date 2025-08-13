import express from "express";
import { matchJobController } from "../controllers/job.controller";
import { protect } from "../middlewares/auth.middleware";

const resumeRouter = express.Router();

resumeRouter.get("/match-job", protect, matchJobController);

export default resumeRouter;
