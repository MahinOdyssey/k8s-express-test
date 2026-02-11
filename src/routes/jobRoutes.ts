import { Router } from "express";
import {
  createJob,
  listJobs,
  deleteJob,
  createJobAndWatch,
} from "../controllers/jobController";

const router = Router();

router.post("/jobs/create", createJob);
router.post("/jobs/create-and-watch", createJobAndWatch);
router.get("/jobs", listJobs);
router.delete("/jobs/:namespace/:name", deleteJob);

export default router;
