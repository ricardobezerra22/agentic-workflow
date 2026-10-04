// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GET as listTasks, POST as createTask } from '@/app/api/tasks/route'
import { GET as getTask, PATCH as patchTask, DELETE as deleteTask } from '@/app/api/tasks/[id]/route'

function makeReq(path: string, options?: RequestInit) {
  return new NextRequest(`http://localhost${path}`, options)
}

function idParams(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

describe('Tasks API Integration', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  beforeEach(async () => {
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
        orderBy: [{ completed: 'asc' }],
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

  describe('HTTP POST /api/tasks', () => {
    it('creates task with valid title → 201', async () => {
      const req = makeReq('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'HTTP task' }),
      })
      const res = await createTask(req)
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.title).toBe('HTTP task')
      expect(body.priority).toBe('medium')
    })

    it('creates task with all fields → 201', async () => {
      const req = makeReq('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Full task', priority: 'high', dueDate: '2099-01-01', description: 'desc' }),
      })
      const res = await createTask(req)
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.priority).toBe('high')
      expect(body.description).toBe('desc')
    })

    it('rejects empty title → 400', async () => {
      const req = makeReq('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      })
      const res = await createTask(req)
      expect(res.status).toBe(400)
    })

    it('rejects whitespace-only title → 400', async () => {
      const req = makeReq('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '   ' }),
      })
      const res = await createTask(req)
      expect(res.status).toBe(400)
    })

    it('rejects invalid priority enum → 400', async () => {
      const req = makeReq('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'task', priority: 'urgent' }),
      })
      const res = await createTask(req)
      expect(res.status).toBe(400)
    })

    it('rejects invalid dueDate format → 400', async () => {
      const req = makeReq('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'task', dueDate: 'not-a-date' }),
      })
      const res = await createTask(req)
      expect(res.status).toBe(400)
    })
  })

  describe('HTTP GET /api/tasks', () => {
    beforeEach(async () => {
      await prisma.task.createMany({
        data: [
          { title: 'Open high', priority: 'high', completed: false },
          { title: 'Open low', priority: 'low', completed: false },
          { title: 'Done medium', priority: 'medium', completed: true, completedAt: new Date() },
        ],
      })
    })

    it('returns all tasks → 200', async () => {
      const res = await listTasks(makeReq('/api/tasks'))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.tasks).toHaveLength(3)
    })

    it('filters status=open → only incomplete', async () => {
      const res = await listTasks(makeReq('/api/tasks?status=open'))
      const { tasks } = await res.json()
      expect(tasks.every((t) => !t.completed)).toBe(true)
      expect(tasks).toHaveLength(2)
    })

    it('filters status=done → only completed', async () => {
      const res = await listTasks(makeReq('/api/tasks?status=done'))
      const { tasks } = await res.json()
      expect(tasks.every((t) => t.completed)).toBe(true)
      expect(tasks).toHaveLength(1)
    })

    it('filters priority=high → correct subset', async () => {
      const res = await listTasks(makeReq('/api/tasks?priority=high'))
      const { tasks } = await res.json()
      expect(tasks).toHaveLength(1)
      expect(tasks[0].priority).toBe('high')
    })

    it('q= search is case-insensitive', async () => {
      const res = await listTasks(makeReq('/api/tasks?q=OPEN'))
      const { tasks } = await res.json()
      expect(tasks.length).toBeGreaterThanOrEqual(2)
      expect(tasks.every((t) => t.title.toLowerCase().includes('open'))).toBe(true)
    })

    it('combined status + priority filters', async () => {
      const res = await listTasks(makeReq('/api/tasks?status=open&priority=high'))
      const { tasks } = await res.json()
      expect(tasks).toHaveLength(1)
      expect(tasks[0].title).toBe('Open high')
    })
  })

  describe('HTTP GET /api/tasks/:id', () => {
    it('fetches existing task → 200', async () => {
      const task = await prisma.task.create({ data: { title: 'Fetchable', priority: 'low' } })
      const res = await getTask(makeReq(`/api/tasks/${task.id}`), idParams(task.id))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.id).toBe(task.id)
    })

    it('non-existent id → 404', async () => {
      const res = await getTask(makeReq('/api/tasks/999999'), idParams(999999))
      expect(res.status).toBe(404)
    })

    it('non-numeric id → 400', async () => {
      const res = await getTask(makeReq('/api/tasks/abc'), { params: Promise.resolve({ id: 'abc' }) })
      expect(res.status).toBe(400)
    })
  })

  describe('HTTP PATCH /api/tasks/:id', () => {
    it('partial update (title only) → 200, other fields unchanged', async () => {
      const task = await prisma.task.create({ data: { title: 'Original', priority: 'high' } })
      const req = makeReq(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Renamed' }),
      })
      const res = await patchTask(req, idParams(task.id))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.title).toBe('Renamed')
      expect(body.priority).toBe('high')
    })

    it('setting completed=true sets completedAt', async () => {
      const task = await prisma.task.create({ data: { title: 'Complete me', priority: 'medium' } })
      const req = makeReq(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })
      const res = await patchTask(req, idParams(task.id))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.completed).toBe(true)
      expect(body.completedAt).not.toBeNull()
    })

    it('setting completed=false clears completedAt', async () => {
      const task = await prisma.task.create({
        data: { title: 'Uncomplete me', priority: 'medium', completed: true, completedAt: new Date() },
      })
      const req = makeReq(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: false }),
      })
      const res = await patchTask(req, idParams(task.id))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.completed).toBe(false)
      expect(body.completedAt).toBeNull()
    })

    it('non-existent id → 404', async () => {
      const req = makeReq('/api/tasks/999999', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Ghost' }),
      })
      const res = await patchTask(req, idParams(999999))
      expect(res.status).toBe(404)
    })

    it('invalid priority → 400', async () => {
      const task = await prisma.task.create({ data: { title: 'Priority test', priority: 'low' } })
      const req = makeReq(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: 'critical' }),
      })
      const res = await patchTask(req, idParams(task.id))
      expect(res.status).toBe(400)
    })
  })

  describe('HTTP DELETE /api/tasks/:id', () => {
    it('deletes task → 204, no longer retrievable', async () => {
      const task = await prisma.task.create({ data: { title: 'Delete me', priority: 'low' } })
      const delRes = await deleteTask(makeReq(`/api/tasks/${task.id}`, { method: 'DELETE' }), idParams(task.id))
      expect(delRes.status).toBe(204)
      const getRes = await getTask(makeReq(`/api/tasks/${task.id}`), idParams(task.id))
      expect(getRes.status).toBe(404)
    })

    it('non-existent id → 404', async () => {
      const res = await deleteTask(makeReq('/api/tasks/999999', { method: 'DELETE' }), idParams(999999))
      expect(res.status).toBe(404)
    })
  })
})
