import { Router } from "express";
import { createPVC, listPVCs, deletePVC } from "../controllers/pvcController";

const router = Router();

router.post("/pvcs/create", createPVC);
router.get("/pvcs", listPVCs);
router.delete("/pvcs/:namespace/:name", deletePVC);

export default router;
