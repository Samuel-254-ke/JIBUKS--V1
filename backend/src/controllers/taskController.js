import { prisma } from '../lib/prisma.js';

/**
 * List Tasks with pagination, search, filter, and sort
 */
async function listTasks(req, res, next) {
  try {
    const {
      page = 1,
      pageSize = 10,
      filter,
      status,
      priority,
      sort
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    // Build where clause
    const where = {};

    if (filter) {
      where.OR = [
        { title: { contains: filter, mode: 'insensitive' } }
      ];
    }

    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      where.status = { in: statusArray };
    }

    if (priority) {
      const priorityArray = Array.isArray(priority) ? priority : [priority];
      where.priority = { in: priorityArray };
    }

    // Build orderBy
    let orderBy = { createdAt: 'desc' };
    if (sort) {
      const [field, direction] = sort.split(':');
      if (field && direction) {
        orderBy = { [field]: direction.toLowerCase() };
      }
    }

    const [tasks, totalCount] = await Promise.all([
      prisma.adminTask.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.adminTask.count({ where })
    ]);

    res.json({
      data: tasks,
      meta: {
        totalCount,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(totalCount / take)
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new task
 */
async function createTask(req, res, next) {
  try {
    const { title, status, label, priority, description, dueDate, assignee } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await prisma.adminTask.create({
      data: {
        title,
        status: status || 'todo',
        label: label || 'feature',
        priority: priority || 'medium',
        description,
        assignee,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

/**
 * Update a task (Partial)
 */
async function updateTask(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const updateData = { ...req.body };

    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const task = await prisma.adminTask.update({
      where: { id },
      data: updateData
    });

    res.json(task);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: `Task with ID ${req.params.id} not found` });
    }
    next(err);
  }
}

/**
 * Delete a task
 */
async function deleteTask(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await prisma.adminTask.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: `Task with ID ${req.params.id} not found` });
    }
    next(err);
  }
}

/**
 * Bulk Delete Tasks
 */
async function bulkDeleteTasks(req, res, next) {
  try {
    const ids = req.body.ids.map(id => parseInt(id));
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Array of ids is required' });
    }

    await prisma.adminTask.deleteMany({
      where: { id: { in: ids } }
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Import Tasks (Simple JSON implementation)
 */
async function importTasks(req, res, next) {
  try {
    // Basic implementation: Expects an array of tasks in the body
    // If a file is uploaded, more processing would be needed
    const tasks = req.body.tasks;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Array of tasks is required for import' });
    }

    const createdTasks = await Promise.all(
      tasks.map(t => prisma.adminTask.create({
        data: {
          title: t.title,
          status: t.status || 'todo',
          label: t.label || 'feature',
          priority: t.priority || 'medium',
          description: t.description,
          assignee: t.assignee,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
        }
      }))
    );

    res.json({
      message: 'Tasks imported successfully',
      count: createdTasks.length
    });
  } catch (err) {
    next(err);
  }
}

export {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  bulkDeleteTasks,
  importTasks
};
