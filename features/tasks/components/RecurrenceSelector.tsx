'use client'

export function RecurrenceSelector() {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="recurrence-select"
        className="text-sm font-medium text-muted-foreground"
      >
        Recurrence
      </label>
      <select
        id="recurrence-select"
        aria-label="Recurrence"
        disabled
        defaultValue="none"
        className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
      >
        <option value="none">Does not repeat</option>
        <option value="DAILY">Daily</option>
        <option value="WEEKLY">Weekly</option>
        <option value="MONTHLY">Monthly</option>
        <option value="YEARLY">Yearly</option>
      </select>
      <p className="text-xs text-muted-foreground">
        Recurrence configuration available after the{' '}
        <span className="font-mono">recurring-tasks</span> feature merges.
      </p>
    </div>
  )
}
