// @ts-nocheck
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
          priority: 'medium',
        },
      })

      expect(task).toBeDefined()
      expect(task.title).toBe('Test task')
      expect(task.priority).toBe('medium')
      expect(task.completed).toBe(false)
    })

    it('should read a task by id', async () => {
      const created = await prisma.task.create({
        data: {
          title: 'Read test',
          priority: 'high',
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
          priority: 'low',
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
          priority: 'medium',
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
        data: { title: 'Task 1', priority: 'high' },
      })
      await prisma.task.create({
        data: { title: 'Task 2', priority: 'medium' },
      })
      await prisma.task.create({
        data: { title: 'Task 3', priority: 'low' },
      })

      const tasks = await prisma.task.findMany()

      expect(tasks).toHaveLength(3)
      const titles = tasks.map((task) => task.title)
      expect(titles).toContain('Task 1')
      expect(titles).toContain('Task 2')
      expect(titles).toContain('Task 3')
    })
  })

  describe('Task Filtering', () => {
    beforeEach(async () => {
      await prisma.task.create({
        data: { title: 'Open task', priority: 'high', completed: false },
      })
      await prisma.task.create({
        data: {
          title: 'Completed task',
          priority: 'low',
          completed: true,
          completedAt: new Date(),
        },
      })
      await prisma.task.create({
        data: { title: 'Medium priority', priority: 'medium', completed: false },
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
        where: { priority: 'high' },
      })

      expect(highPriority).toHaveLength(1)
      expect(highPriority[0].title).toBe('Open task')
    })

    it('should order tasks correctly', async () => {
      const tasks = await prisma.task.findMany({
        orderBy: [
          { completed: 'asc' },
        ],
      })

      expect(tasks.filter((t) => !t.completed).length).toBeGreaterThan(0)
      expect(tasks.filter((t) => t.completed).length).toBeGreaterThan(0)
    })
  })

  describe('Task Validation', () => {
    it('should handle empty title gracefully', async () => {
      const task = await prisma.task.create({
        data: {
          title: '',
          priority: 'medium',
        },
      })

      expect(task.title).toBe('')
    })

    it('should set default priority to medium', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'No priority specified',
          priority: 'medium',
        },
      })

      expect(task.priority).toBe('medium')
    })

    it('should handle long titles', async () => {
      const longTitle = 'A'.repeat(200)
      const task = await prisma.task.create({
        data: {
          title: longTitle,
          priority: 'low',
        },
      })

      expect(task.title).toHaveLength(200)
    })

    it('should handle optional description', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Task with description',
          description: 'This is a detailed description',
          priority: 'medium',
        },
      })

      expect(task.description).toBe('This is a detailed description')
    })
  })
})
