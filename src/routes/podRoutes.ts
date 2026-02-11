import { Router } from 'express';
import {
  listAllPods,
  createPod,
  getPodStatus,
  deletePod,
  createPodAndWatch, 
} from '../controllers/podController';

const router = Router();

router.get('/pods', listAllPods);
router.post('/pods/create', createPod);
router.post('/pods/create-and-watch', createPodAndWatch); 
router.get('/pods/:namespace/:name', getPodStatus);
router.delete('/pods/:namespace/:name', deletePod);

export default router;