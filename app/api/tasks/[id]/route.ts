import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validatePatchTask } from '@/lib/validation'

export const dynamic = 'force-dynamic'

function errorResponse(code: string, message: string, details?: unknown, status = 400) {
  return NextResponse.json({ error: { code, message, details } }, { status })
}

function parseId(id: string): number | null {
  const parsed = parseInt(id, 10)
  return isNaN(parsed) ? null : parsed
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id)
    if (id === null) {
      return errorResponse('INVALID_ID', 'Task ID must be a valid number', undefined, 400)
    }

    const task = await prisma.task.findUnique({ where: { id } })

    if (!task) {
      return errorResponse('NOT_FOUND', 'Task not found', undefined, 404)
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error(`GET /api/tasks/${params.id} error:`, error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch task', undefined, 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id)
    if (id === null) {
      return errorResponse('INVALID_ID', 'Task ID must be a valid number', undefined, 400)
    }

    const body = await req.json()

    const validation = validatePatchTask(body)
    if (!validation.valid) {
      return errorResponse('VALIDATION_ERROR', 'Invalid task data', validation.errors)
    }

    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('NOT_FOUND', 'Task not found', undefined, 404)
    }

    const updateData: any = {}

    if ('title' in body && body.title !== undefined) {
      updateData.title = (body.title as string).trim()
    }
    if ('description' in body && body.description !== undefined) {
      updateData.description = body.description
    }
    if ('priority' in body && body.priority !== undefined) {
      updateData.priority = (body.priority as string).toUpperCase()
    }
    if ('dueDate' in body && body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate
    }
    if ('completed' in body && body.completed !== undefined) {
      updateData.completed = body.completed
      if (body.completed) {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error(`PATCH /api/tasks/${params.id} error:`, error)
    if (error instanceof SyntaxError) {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON')
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to update task', undefined, 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id)
    if (id === null) {
      return errorResponse('INVALID_ID', 'Task ID must be a valid number', undefined, 400)
    }

    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('NOT_FOUND', 'Task not found', undefined, 404)
    }

    await prisma.task.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(`DELETE /api/tasks/${params.id} error:`, error)
    return errorResponse('INTERNAL_ERROR', 'Failed to delete task', undefined, 500)
  }
}
