import { Router } from 'express';
import { 
  createJob, 
  listJobs, 
  deleteJob,
  createJobAndWatch,
  createJobFromYaml,  
  listYamlManifests   
} from '../controllers/jobController';

const router = Router();

router.post('/jobs/create', createJob);
router.post('/jobs/create-and-watch', createJobAndWatch);
router.post('/jobs/create-from-yaml', createJobFromYaml);  
router.get('/jobs/manifests', listYamlManifests);          
router.get('/jobs', listJobs);
router.delete('/jobs/:namespace/:name', deleteJob);

export default router;