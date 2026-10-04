import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function errorResponse(code: string, message: string, details?: unknown, status = 400) {
  return NextResponse.json({ error: { code, message, details } }, { status })
}

function parseId(id: string): number | null {
  const parsed = parseInt(id, 10)
  return isNaN(parsed) ? null : parsed
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseId(idStr)
    if (id === null) {
      return errorResponse('INVALID_ID', 'Task ID must be a valid number', undefined, 400)
    }

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      return errorResponse('NOT_FOUND', 'Task not found', undefined, 404)
    }

    // Find root task by walking up the parent chain
    let rootId = id
    let current = task
    while (current.parentTaskId) {
      current = await prisma.task.findUnique({ where: { id: current.parentTaskId } })
      if (!current) break
      rootId = current.id
    }

    // Get all tasks in series (root + all descendants)
    const series = await prisma.task.findMany({
      where: {
        OR: [
          { id: rootId },
          { parentTaskId: rootId },
        ],
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json({ series })
  } catch (error) {
    const { id: idStr } = await params
    console.error(`GET /api/tasks/${idStr}/series error:`, error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch series', undefined, 500)
  }
}
