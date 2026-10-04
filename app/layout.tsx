import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'A production-grade task management application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-border">
            <nav className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold">Task Manager</h1>
            </nav>
          </header>
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
          <footer className="border-t border-border">
            <div className="mx-auto max-w-6xl px-4 py-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
              <p>&copy; 2024 Task Manager. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
