import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validatePatchTask } from '@/lib/validation'
import { calculateNextDueDate, isRecurrenceEndDatePassed } from '@/lib/recurrence'

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

    return NextResponse.json(task)
  } catch (error) {
    const { id: idStr } = await params
    console.error(`GET /api/tasks/${idStr} error:`, error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch task', undefined, 500)
  }
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
    if ('priority' in body && body.priority != null) {
      updateData.priority = (body.priority as string).toLowerCase()
    }
    if ('dueDate' in body && body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    }
    if ('completed' in body && body.completed !== undefined) {
      updateData.completed = body.completed
      if (body.completed) {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }

    // Handle completeAction for recurring tasks
    const completeAction = body.completeAction as string | undefined
    if (completeAction === 'mark_done_skip_next' && existing.recurrencePattern === 'NONE') {
      return errorResponse('VALIDATION_ERROR', 'Cannot skip next on non-recurring task')
    }

    // Use transaction for atomic update + auto-create
    const task = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.task.update({
        where: { id },
        data: updateData,
      })

      // Auto-create next occurrence if completing or skipping a recurring task
      if ((completeAction === 'mark_done' || completeAction === 'mark_done_skip_next') &&
          existing.recurrencePattern !== 'NONE' &&
          existing.dueDate) {

        const nextDueDate = calculateNextDueDate(new Date(existing.dueDate), existing.recurrencePattern as any)

        // Don't create if past end date
        if (!isRecurrenceEndDatePassed(existing.recurrenceEndDate)) {
          await tx.task.create({
            data: {
              title: existing.title,
              description: existing.description,
              priority: existing.priority,
              dueDate: nextDueDate,
              recurrencePattern: existing.recurrencePattern,
              recurrenceEndDate: existing.recurrenceEndDate,
              parentTaskId: id,
            },
          })
        }
      }

      return updated
    })

    return NextResponse.json(task)
  } catch (error) {
    const { id: idStr } = await params
    console.error(`PATCH /api/tasks/${idStr} error:`, error)
    if (error instanceof SyntaxError) {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON')
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to update task', undefined, 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseId(idStr)
    if (id === null) {
      return errorResponse('INVALID_ID', 'Task ID must be a valid number', undefined, 400)
    }

    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('NOT_FOUND', 'Task not found', undefined, 404)
    }

    // Handle deleteSeries parameter
    const { searchParams } = new URL(req.url)
    const deleteSeries = searchParams.get('deleteSeries') === 'true'

    if (deleteSeries && existing.recurrencePattern !== 'NONE') {
      // Delete entire series
      const rootId = existing.parentTaskId || id
      const allInSeries = await prisma.task.findMany({
        where: {
          OR: [
            { id: rootId },
            { parentTaskId: rootId },
          ],
        },
      })

      const idsToDelete = allInSeries.map((t: any) => t.id)
      await prisma.task.deleteMany({
        where: { id: { in: idsToDelete } },
      })
    } else {
      // Delete only this task, orphan children
      if (existing.recurrencePattern !== 'NONE' && existing.parentTaskId) {
        // This is a child; just delete it
        await prisma.task.delete({ where: { id } })
      } else if (existing.recurrencePattern !== 'NONE') {
        // This is a parent; orphan children
        await prisma.task.updateMany({
          where: { parentTaskId: id },
          data: { parentTaskId: null },
        })
        await prisma.task.delete({ where: { id } })
      } else {
        await prisma.task.delete({ where: { id } })
      }
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const { id: idStr } = await params
    console.error(`DELETE /api/tasks/${idStr} error:`, error)
    return errorResponse('INTERNAL_ERROR', 'Failed to delete task', undefined, 500)
  }
}
