import { Router } from "express";
import { runValidationWorkflow } from "../controllers/workflowController";

const router = Router();

router.post("/workflows/validation", runValidationWorkflow);

export default router;
