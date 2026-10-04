export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'all' | 'open' | 'done'

export interface Task {
  id: number
  title: string
  description?: string | null
  priority: TaskPriority
  dueDate?: string | null
  completed: boolean
  completedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: string
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  completed?: boolean
}

export interface ListTasksParams {
  status?: TaskStatus
  priority?: TaskPriority
  q?: string
}
