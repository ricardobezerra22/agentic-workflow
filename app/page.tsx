'use client'

import { useSearchParams } from 'next/navigation'
import { greeting, farewell } from '@/lib/greeting'

export default function Home() {
  const searchParams = useSearchParams()
  const name = searchParams.get('name')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-foreground">{greeting(name)}</h1>
        <p className="text-xl text-muted-foreground">{farewell(name)}</p>
      </div>

      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>Task Manager powered by Next.js + TypeScript + Prisma</p>
        <p>Production-grade task management application</p>
      </div>
    </div>
  )
}
