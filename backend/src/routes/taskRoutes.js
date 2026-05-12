import express from 'express';
import { 
  listTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  bulkDeleteTasks, 
  importTasks 
} from '../controllers/taskController.js';
import { verifyAdminJWT } from '../middleware/auth.js';

const router = express.Router();

// All task routes are protected for Admin access
router.use(verifyAdminJWT);

router.get('/', listTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/bulk-delete', bulkDeleteTasks);
router.post('/import', importTasks);

export default router;
