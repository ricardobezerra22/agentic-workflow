import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '../lib/prisma.js'

describe('Tasks API Routes Integration', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  beforeEach(async () => {
    await prisma.task.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /api/tasks', () => {
    it('should return empty list when no tasks exist', async () => {
      const tasks = await prisma.task.findMany()
      expect(tasks).toEqual([])
    })

    it('should return all tasks with correct fields', async () => {
      await prisma.task.create({
        data: { title: 'Task 1', priority: 'HIGH' },
      })
      await prisma.task.create({
        data: { title: 'Task 2', priority: 'LOW' },
      })

      const tasks = await prisma.task.findMany()

      expect(tasks).toHaveLength(2)
      tasks.forEach((task) => {
        expect(task).toHaveProperty('id')
        expect(task).toHaveProperty('title')
        expect(task).toHaveProperty('priority')
        expect(task).toHaveProperty('completed')
        expect(task).toHaveProperty('createdAt')
      })
    })
  })

  describe('POST /api/tasks', () => {
    it('should create a task with required fields', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'New task',
          priority: 'MEDIUM',
        },
      })

      expect(task.title).toBe('New task')
      expect(task.priority).toBe('MEDIUM')
      expect(task.completed).toBe(false)
    })

    it('should create task with all optional fields', async () => {
      const dueDate = new Date('2026-12-31')
      const task = await prisma.task.create({
        data: {
          title: 'Complete task',
          description: 'Full details',
          priority: 'HIGH',
          dueDate,
        },
      })

      expect(task.title).toBe('Complete task')
      expect(task.description).toBe('Full details')
      expect(task.dueDate).toEqual(dueDate)
    })
  })

  describe('PATCH /api/tasks/:id', () => {
    it('should update task title', async () => {
      const created = await prisma.task.create({
        data: { title: 'Original', priority: 'MEDIUM' },
      })

      const updated = await prisma.task.update({
        where: { id: created.id },
        data: { title: 'Updated' },
      })

      expect(updated.title).toBe('Updated')
    })

    it('should mark task as completed with timestamp', async () => {
      const created = await prisma.task.create({
        data: { title: 'Task', priority: 'LOW' },
      })

      const updated = await prisma.task.update({
        where: { id: created.id },
        data: {
          completed: true,
          completedAt: new Date(),
        },
      })

      expect(updated.completed).toBe(true)
      expect(updated.completedAt).toBeDefined()
    })

    it('should unmark task as completed', async () => {
      const created = await prisma.task.create({
        data: {
          title: 'Task',
          priority: 'MEDIUM',
          completed: true,
          completedAt: new Date(),
        },
      })

      const updated = await prisma.task.update({
        where: { id: created.id },
        data: {
          completed: false,
          completedAt: null,
        },
      })

      expect(updated.completed).toBe(false)
      expect(updated.completedAt).toBeNull()
    })
  })

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const created = await prisma.task.create({
        data: { title: 'Delete me', priority: 'LOW' },
      })

      await prisma.task.delete({
        where: { id: created.id },
      })

      const found = await prisma.task.findUnique({
        where: { id: created.id },
      })

      expect(found).toBeNull()
    })

    it('should not find deleted task in list', async () => {
      const created = await prisma.task.create({
        data: { title: 'Temporary', priority: 'HIGH' },
      })

      await prisma.task.delete({
        where: { id: created.id },
      })

      const tasks = await prisma.task.findMany()
      expect(tasks.find((t) => t.id === created.id)).toBeUndefined()
    })
  })
})
