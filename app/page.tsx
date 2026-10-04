import { TasksClient } from '@/features/tasks/components/TasksClient'

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Tasks</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your tasks efficiently
        </p>
      </div>
      <TasksClient />
    </div>
  )
}
