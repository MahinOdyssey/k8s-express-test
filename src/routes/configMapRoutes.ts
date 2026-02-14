import { Router } from "express";
import {
  createConfigMap,
  getConfigMap,
  listConfigMaps,
  deleteConfigMap,
} from "../controllers/configMapController";

const router = Router();

router.post("/configmaps/create", createConfigMap);
router.get("/configmaps", listConfigMaps);
router.get("/configmaps/:namespace/:name", getConfigMap);
router.delete("/configmaps/:namespace/:name", deleteConfigMap);

export default router;
