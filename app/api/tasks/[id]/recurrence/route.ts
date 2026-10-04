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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseId(idStr)
    if (id === null) {
      return errorResponse('INVALID_ID', 'Task ID must be a valid number', undefined, 400)
    }

    const body = await req.json()
    const { recurrencePattern, recurrenceEndDate, applyToFuture } = body

    // Validate input
    if (!recurrencePattern && !recurrenceEndDate) {
      return errorResponse('VALIDATION_ERROR', 'Must provide recurrencePattern or recurrenceEndDate')
    }

    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('NOT_FOUND', 'Task not found', undefined, 404)
    }

    if (existing.recurrencePattern === 'NONE') {
      return errorResponse('VALIDATION_ERROR', 'Task is not recurring')
    }

    const updateData: any = {}
    if (recurrencePattern) updateData.recurrencePattern = recurrencePattern
    if (recurrenceEndDate) updateData.recurrenceEndDate = new Date(recurrenceEndDate)

    if (applyToFuture === false) {
      // Update only current task
      const task = await prisma.task.update({
        where: { id },
        data: updateData,
      })
      return NextResponse.json(task)
    }

    // Update current and all descendants
    await prisma.task.update({
      where: { id },
      data: updateData,
    })

    // Find all children recursively and update them
    const getAllDescendants = async (parentId: number): Promise<number[]> => {
      const children = await prisma.task.findMany({
        where: { parentTaskId: parentId },
      })
      const allIds: number[] = []
      for (const child of children) {
        allIds.push(child.id)
        const grandchildren = await getAllDescendants(child.id)
        allIds.push(...grandchildren)
      }
      return allIds
    }

    const descendantIds = await getAllDescendants(id)
    if (descendantIds.length > 0) {
      await prisma.task.updateMany({
        where: { id: { in: descendantIds } },
        data: updateData,
      })
    }

    // Return updated task
    const task = await prisma.task.findUnique({ where: { id } })
    return NextResponse.json(task)
  } catch (error) {
    const { id: idStr } = await params
    console.error(`PATCH /api/tasks/${idStr}/recurrence error:`, error)
    if (error instanceof SyntaxError) {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON')
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to update recurrence', undefined, 500)
  }
}
