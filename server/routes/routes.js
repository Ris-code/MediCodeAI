// Import Express
import { Router } from 'express'; 
// Local Modules 
import { chatresponse, test, evaluate_answer } from '../controllers/controller.js'; 
  
// Initialization 
const router = Router(); 
  
// Requests  
router.post('/', chatresponse);
router.get('/test', test);
router.post('/evaluate', evaluate_answer);
  
export default router;