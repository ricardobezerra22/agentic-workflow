export function greeting(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? `Hello, ${trimmed}!` : 'Hello, stranger!'
}

export function farewell(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? `Goodbye, ${trimmed}!` : 'Goodbye, stranger!'
}
