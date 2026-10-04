import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Tasks API Routes Integration', () => {
  const BASE_URL = 'http://localhost:3000/api'

  beforeAll(async () => {
    await prisma.$connect()
    await prisma.task.deleteMany()
  })

  beforeEach(async () => {
    await prisma.task.deleteMany()
  })

  afterAll(async () => {
    await prisma.task.deleteMany()
    await prisma.$disconnect()
  })

  describe('POST /api/tasks', () => {
    it('should create a task with valid data', async () => {
      const response = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Integration test task',
          priority: 'high',
          description: 'Test description',
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.title).toBe('Integration test task')
      expect(data.priority).toBe('high')
      expect(data.completed).toBe(false)
    })

    it('should reject request with missing title', async () => {
      const response = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priority: 'medium',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should handle invalid JSON', async () => {
      const response = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('INVALID_JSON')
    })

    it('should trim whitespace from title', async () => {
      const response = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '  Task with spaces  ',
          priority: 'medium',
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.title).toBe('Task with spaces')
    })
  })

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await prisma.task.create({
        data: { title: 'High priority task', priority: 'high', completed: false },
      })
      await prisma.task.create({
        data: { title: 'Completed task', priority: 'low', completed: true },
      })
      await prisma.task.create({
        data: { title: 'Medium priority', priority: 'medium', completed: false },
      })
    })

    it('should list all tasks', async () => {
      const response = await fetch(`${BASE_URL}/tasks`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.tasks).toHaveLength(3)
    })

    it('should filter by status=open', async () => {
      const response = await fetch(`${BASE_URL}/tasks?status=open`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.tasks).toHaveLength(2)
      expect(data.tasks.every((t: any) => !t.completed)).toBe(true)
    })

    it('should filter by status=done', async () => {
      const response = await fetch(`${BASE_URL}/tasks?status=done`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.tasks).toHaveLength(1)
      expect(data.tasks[0].completed).toBe(true)
    })

    it('should filter by priority', async () => {
      const response = await fetch(`${BASE_URL}/tasks?priority=high`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.tasks).toHaveLength(1)
      expect(data.tasks[0].title).toBe('High priority task')
    })

    it('should search by query string', async () => {
      const response = await fetch(`${BASE_URL}/tasks?q=completed`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.tasks).toHaveLength(1)
      expect(data.tasks[0].title).toBe('Completed task')
    })

    it('should reject invalid status parameter', async () => {
      const response = await fetch(`${BASE_URL}/tasks?status=invalid`)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/tasks/[id]', () => {
    it('should fetch a task by id', async () => {
      const created = await prisma.task.create({
        data: { title: 'Fetch me', priority: 'medium' },
      })

      const response = await fetch(`${BASE_URL}/tasks/${created.id}`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe(created.id)
      expect(data.title).toBe('Fetch me')
    })

    it('should return 404 for non-existent task', async () => {
      const response = await fetch(`${BASE_URL}/tasks/99999`)
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid id', async () => {
      const response = await fetch(`${BASE_URL}/tasks/invalid-id`)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('INVALID_ID')
    })
  })

  describe('PATCH /api/tasks/[id]', () => {
    it('should update task title', async () => {
      const created = await prisma.task.create({
        data: { title: 'Original', priority: 'medium' },
      })

      const response = await fetch(`${BASE_URL}/tasks/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.title).toBe('Updated')
    })

    it('should mark task as completed', async () => {
      const created = await prisma.task.create({
        data: { title: 'Complete me', priority: 'medium' },
      })

      const response = await fetch(`${BASE_URL}/tasks/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.completed).toBe(true)
      expect(data.completedAt).toBeDefined()
    })

    it('should update priority', async () => {
      const created = await prisma.task.create({
        data: { title: 'Change priority', priority: 'low' },
      })

      const response = await fetch(`${BASE_URL}/tasks/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: 'high' }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.priority).toBe('high')
    })

    it('should return 404 when updating non-existent task', async () => {
      const response = await fetch(`${BASE_URL}/tasks/99999`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('should reject invalid id', async () => {
      const response = await fetch(`${BASE_URL}/tasks/bad-id`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('INVALID_ID')
    })
  })

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete a task', async () => {
      const created = await prisma.task.create({
        data: { title: 'Delete me', priority: 'medium' },
      })

      const response = await fetch(`${BASE_URL}/tasks/${created.id}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(204)

      const task = await prisma.task.findUnique({
        where: { id: created.id },
      })
      expect(task).toBeNull()
    })

    it('should return 404 when deleting non-existent task', async () => {
      const response = await fetch(`${BASE_URL}/tasks/99999`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid id', async () => {
      const response = await fetch(`${BASE_URL}/tasks/bad-id`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('INVALID_ID')
    })
  })
})
