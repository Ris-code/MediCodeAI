// Import Express
const { Router } = require('express'); 
  
// Local Modules 
const controller = require('../controllers/controller'); 
  
// Initialization 
const router = Router(); 
  
// Requests  
router.get('/', controller.chatresponse);
  
module.exports = router;