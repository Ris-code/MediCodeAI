// Import Express
import { Router } from 'express'; 
// Local Modules 
import { chatresponse, test, evaluate_answer, text2speech } from '../controllers/controller.js'; 
  
// Initialization 
const router = Router(); 
  
// Requests  
router.post('/response', chatresponse);
router.get('/test', test);
router.post('/evaluate', evaluate_answer);
router.post('/text2speech', text2speech);
  
export default router;