import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateTask, validateListParams, type Status } from '@/lib/validation'

export const dynamic = 'force-dynamic'

function errorResponse(code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status: 400 })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as Status | null
    const priority = searchParams.get('priority') as string | null
    const q = searchParams.get('q') as string | null

    const validation = validateListParams({ status: status || undefined, priority })
    if (!validation.valid) {
      return errorResponse('VALIDATION_ERROR', 'Invalid query parameters', validation.errors)
    }

    const where: Record<string, any> = {}

    if (status === 'open') where.completed = false
    if (status === 'done') where.completed = true

    if (priority) where.priority = priority.toUpperCase()

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { completed: 'asc' },
        { dueDate: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      take: 500,
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('GET /api/tasks error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch tasks')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const validation = validateTask(body)
    if (!validation.valid) {
      return errorResponse('VALIDATION_ERROR', 'Invalid task data', validation.errors)
    }

    const task = await prisma.task.create({
      data: {
        title: (body.title as string).trim(),
        description: body.description,
        priority: body.priority?.toUpperCase() || 'MEDIUM',
        dueDate: body.dueDate,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('POST /api/tasks error:', error)
    if (error instanceof SyntaxError) {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON')
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to create task')
  }
}
