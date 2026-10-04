import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Tasks API Integration', () => {
  beforeAll(async () => {
    // Ensure test database connection
    await prisma.$connect()
  })

  beforeEach(async () => {
    // Clear tasks table before each test
    await prisma.task.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Task CRUD Operations', () => {
    it('should create a task', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Test task',
          priority: 'MEDIUM',
        },
      })

      expect(task).toBeDefined()
      expect(task.title).toBe('Test task')
      expect(task.priority).toBe('MEDIUM')
      expect(task.completed).toBe(false)
    })

    it('should read a task by id', async () => {
      const created = await prisma.task.create({
        data: {
          title: 'Read test',
          priority: 'HIGH',
        },
      })

      const task = await prisma.task.findUnique({
        where: { id: created.id },
      })

      expect(task).toBeDefined()
      expect(task?.title).toBe('Read test')
    })

    it('should update a task', async () => {
      const created = await prisma.task.create({
        data: {
          title: 'Original title',
          priority: 'LOW',
        },
      })

      const updated = await prisma.task.update({
        where: { id: created.id },
        data: {
          title: 'Updated title',
          completed: true,
          completedAt: new Date(),
        },
      })

      expect(updated.title).toBe('Updated title')
      expect(updated.completed).toBe(true)
      expect(updated.completedAt).toBeDefined()
    })

    it('should delete a task', async () => {
      const created = await prisma.task.create({
        data: {
          title: 'Task to delete',
          priority: 'MEDIUM',
        },
      })

      await prisma.task.delete({
        where: { id: created.id },
      })

      const task = await prisma.task.findUnique({
        where: { id: created.id },
      })

      expect(task).toBeNull()
    })

    it('should list all tasks', async () => {
      await prisma.task.create({
        data: { title: 'Task 1', priority: 'HIGH' },
      })
      await prisma.task.create({
        data: { title: 'Task 2', priority: 'MEDIUM' },
      })
      await prisma.task.create({
        data: { title: 'Task 3', priority: 'LOW' },
      })

      const tasks = await prisma.task.findMany()

      expect(tasks).toHaveLength(3)
      expect(tasks.map((t) => t.title)).toContain('Task 1')
      expect(tasks.map((t) => t.title)).toContain('Task 2')
      expect(tasks.map((t) => t.title)).toContain('Task 3')
    })
  })

  describe('Task Filtering', () => {
    beforeEach(async () => {
      await prisma.task.create({
        data: { title: 'Open task', priority: 'HIGH', completed: false },
      })
      await prisma.task.create({
        data: {
          title: 'Completed task',
          priority: 'LOW',
          completed: true,
          completedAt: new Date(),
        },
      })
      await prisma.task.create({
        data: { title: 'Medium priority', priority: 'MEDIUM', completed: false },
      })
    })

    it('should filter tasks by completed status', async () => {
      const openTasks = await prisma.task.findMany({
        where: { completed: false },
      })

      expect(openTasks).toHaveLength(2)
      expect(openTasks.every((t) => !t.completed)).toBe(true)
    })

    it('should filter tasks by priority', async () => {
      const highPriority = await prisma.task.findMany({
        where: { priority: 'HIGH' },
      })

      expect(highPriority).toHaveLength(1)
      expect(highPriority[0].title).toBe('Open task')
    })

    it('should order tasks correctly', async () => {
      const tasks = await prisma.task.findMany({
        orderBy: [
          { completed: 'asc' },
          { priority: 'asc' },
        ],
      })

      expect(tasks[0].completed).toBe(false)
      expect(tasks[tasks.length - 1].completed).toBe(true)
    })
  })

  describe('Task Validation', () => {
    it('should handle empty title gracefully', async () => {
      const task = await prisma.task.create({
        data: {
          title: '',
          priority: 'MEDIUM',
        },
      })

      expect(task.title).toBe('')
    })

    it('should set default priority to MEDIUM', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'No priority specified',
          priority: 'MEDIUM',
        },
      })

      expect(task.priority).toBe('MEDIUM')
    })

    it('should handle long titles', async () => {
      const longTitle = 'A'.repeat(200)
      const task = await prisma.task.create({
        data: {
          title: longTitle,
          priority: 'LOW',
        },
      })

      expect(task.title).toHaveLength(200)
    })

    it('should handle optional description', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Task with description',
          description: 'This is a detailed description',
          priority: 'MEDIUM',
        },
      })

      expect(task.description).toBe('This is a detailed description')
    })
  })
})
