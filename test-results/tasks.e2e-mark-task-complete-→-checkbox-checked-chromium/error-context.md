# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tasks.e2e.test.ts >> mark task complete → checkbox checked
- Location: tests/e2e/tasks.e2e.test.ts:25:1

# Error details

```
Error: expect(locator).not.toBeChecked() failed

Locator: locator('[aria-label*="Complete me"]')
Expected: not checked
Error: strict mode violation: locator('[aria-label*="Complete me"]') resolved to 2 elements:
    1) <input type="checkbox" aria-label="Mark "Complete me" as complete" class="h-5 w-5 shrink-0 rounded border border-border text-primary cursor-pointer disabled:opacity-50 transition-all duration-200 accent-primary"/> aka getByRole('checkbox', { name: 'Mark "Complete me" as complete' })
    2) <button type="button" id="radix-_r_4_" data-state="closed" aria-haspopup="menu" aria-expanded="false" aria-label="Actions for task "Complete me"" class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-all rounded-lg disabled:opacity-50">…</button> aka getByRole('button', { name: 'Actions for task "Complete me"' })

Call log:
  - Expect "not toBeChecked" locator('[aria-label*="Complete me"]') with timeout 5000ms
  - waiting for locator('[aria-label*="Complete me"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - heading "Tasks" [level=1] [ref=e8]
          - generic [ref=e9]:
            - button "Create new task" [ref=e10]: New
            - button "Toggle filters" [ref=e13]: Filter
        - searchbox "Search tasks" [ref=e17]
      - generic [ref=e20]:
        - generic [ref=e21]:
          - checkbox "Mark \"Delete me\" as complete" [ref=e22] [cursor=pointer]
          - generic "Double-click to edit" [ref=e23]: Delete me
          - 'generic "Priority: low" [ref=e25]': low
          - button "Actions for task \"Delete me\"" [ref=e26]
        - generic [ref=e31]:
          - checkbox "Mark \"Old title\" as complete" [ref=e32] [cursor=pointer]
          - generic "Double-click to edit" [ref=e33]: Old title
          - 'generic "Priority: low" [ref=e35]': low
          - button "Actions for task \"Old title\"" [ref=e36]
        - generic [ref=e41]:
          - checkbox "Mark \"Complete me\" as complete" [ref=e42] [cursor=pointer]
          - generic "Double-click to edit" [ref=e43]: Complete me
          - 'generic "Priority: medium" [ref=e45]': medium
          - button "Actions for task \"Complete me\"" [ref=e46]
        - generic [ref=e51]:
          - checkbox "Mark \"Already done\" as incomplete" [checked] [ref=e52] [cursor=pointer]
          - generic "Double-click to edit" [ref=e53]: Already done
          - 'generic "Priority: medium" [ref=e55]': medium
          - button "Actions for task \"Already done\"" [ref=e56]
  - button "Open Next.js Dev Tools" [ref=e66] [cursor=pointer]
  - alert [ref=e70]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | async function cleanTasks(request: Parameters<Parameters<typeof test>[1]>[0]['request']) {
  4   |   const res = await request.get('/api/tasks')
  5   |   const { tasks } = await res.json()
  6   |   for (const task of tasks) {
  7   |     await request.delete(`/api/tasks/${task.id}`)
  8   |   }
  9   | }
  10  | 
  11  | test.beforeEach(async ({ request }) => {
  12  |   await cleanTasks(request)
  13  | })
  14  | 
  15  | // ── CRUD ──────────────────────────────────────────────────────────────────────
  16  | 
  17  | test('create task → appears in list', async ({ page }) => {
  18  |   await page.goto('/')
  19  |   await page.click('[aria-label="Create new task"]')
  20  |   await page.fill('[aria-label="New task title"]', 'Buy milk')
  21  |   await page.click('text=Save')
  22  |   await expect(page.locator('text=Buy milk')).toBeVisible()
  23  | })
  24  | 
  25  | test('mark task complete → checkbox checked', async ({ page, request }) => {
  26  |   await request.post('/api/tasks', { data: { title: 'Complete me', priority: 'medium' } })
  27  |   await page.goto('/')
  28  |   const checkbox = page.locator('[aria-label*="Complete me"]')
> 29  |   await expect(checkbox).not.toBeChecked()
      |                              ^ Error: expect(locator).not.toBeChecked() failed
  30  |   await checkbox.click()
  31  |   await expect(checkbox).toBeChecked()
  32  | })
  33  | 
  34  | test('mark completed task incomplete → checkbox unchecked', async ({ page, request }) => {
  35  |   const res = await request.post('/api/tasks', { data: { title: 'Already done', priority: 'medium' } })
  36  |   const { id } = await res.json()
  37  |   await request.patch(`/api/tasks/${id}`, { data: { completed: true } })
  38  |   await page.goto('/')
  39  |   const checkbox = page.locator('[aria-label*="Already done"]')
  40  |   await expect(checkbox).toBeChecked()
  41  |   await checkbox.click()
  42  |   await expect(checkbox).not.toBeChecked()
  43  | })
  44  | 
  45  | test('edit task title inline (double-click) → update persists', async ({ page, request }) => {
  46  |   await request.post('/api/tasks', { data: { title: 'Old title', priority: 'low' } })
  47  |   await page.goto('/')
  48  |   await page.dblclick('text=Old title')
  49  |   const input = page.locator('input[type="text"]').last()
  50  |   await input.fill('New title')
  51  |   await input.press('Enter')
  52  |   await expect(page.locator('text=New title')).toBeVisible()
  53  |   await expect(page.locator('text=Old title')).not.toBeVisible()
  54  | })
  55  | 
  56  | test('delete task → removed from list', async ({ page, request }) => {
  57  |   await request.post('/api/tasks', { data: { title: 'Delete me', priority: 'low' } })
  58  |   await page.goto('/')
  59  |   await page.hover('text=Delete me')
  60  |   await page.click('[aria-label*="Actions for task \\"Delete me\\""]')
  61  |   await page.click('text=Delete')
  62  |   await expect(page.locator('text=Delete me')).not.toBeVisible()
  63  | })
  64  | 
  65  | // ── FILTERING ─────────────────────────────────────────────────────────────────
  66  | 
  67  | test('filter by status=open → only open tasks visible', async ({ page, request }) => {
  68  |   await request.post('/api/tasks', { data: { title: 'Open task', priority: 'medium' } })
  69  |   const res = await request.post('/api/tasks', { data: { title: 'Done task', priority: 'medium' } })
  70  |   const { id } = await res.json()
  71  |   await request.patch(`/api/tasks/${id}`, { data: { completed: true } })
  72  | 
  73  |   await page.goto('/')
  74  |   await page.click('[aria-label="Toggle filters"]')
  75  |   await page.click('text=Open')
  76  |   await expect(page.locator('text=Open task')).toBeVisible()
  77  |   await expect(page.locator('text=Done task')).not.toBeVisible()
  78  | })
  79  | 
  80  | test('filter by status=done → only completed tasks visible', async ({ page, request }) => {
  81  |   await request.post('/api/tasks', { data: { title: 'Active task', priority: 'medium' } })
  82  |   const res = await request.post('/api/tasks', { data: { title: 'Finished task', priority: 'medium' } })
  83  |   const { id } = await res.json()
  84  |   await request.patch(`/api/tasks/${id}`, { data: { completed: true } })
  85  | 
  86  |   await page.goto('/')
  87  |   await page.click('[aria-label="Toggle filters"]')
  88  |   await page.click('text=Completed')
  89  |   await expect(page.locator('text=Finished task')).toBeVisible()
  90  |   await expect(page.locator('text=Active task')).not.toBeVisible()
  91  | })
  92  | 
  93  | test('filter by priority=high → only high-priority tasks', async ({ page, request }) => {
  94  |   await request.post('/api/tasks', { data: { title: 'Urgent task', priority: 'high' } })
  95  |   await request.post('/api/tasks', { data: { title: 'Low task', priority: 'low' } })
  96  | 
  97  |   await page.goto('/')
  98  |   await page.click('[aria-label="Toggle filters"]')
  99  |   await page.locator('#filter-priority').click()
  100 |   await page.click('text=High')
  101 |   await expect(page.locator('text=Urgent task')).toBeVisible()
  102 |   await expect(page.locator('text=Low task')).not.toBeVisible()
  103 | })
  104 | 
  105 | test('search by text (case-insensitive) → matching tasks shown', async ({ page, request }) => {
  106 |   await request.post('/api/tasks', { data: { title: 'Buy groceries', priority: 'medium' } })
  107 |   await request.post('/api/tasks', { data: { title: 'Call dentist', priority: 'medium' } })
  108 | 
  109 |   await page.goto('/')
  110 |   await page.fill('[aria-label="Search tasks"]', 'BUY')
  111 |   await expect(page.locator('text=Buy groceries')).toBeVisible()
  112 |   await expect(page.locator('text=Call dentist')).not.toBeVisible()
  113 | })
  114 | 
  115 | test('clear filters → all tasks return', async ({ page, request }) => {
  116 |   await request.post('/api/tasks', { data: { title: 'Task A', priority: 'high' } })
  117 |   await request.post('/api/tasks', { data: { title: 'Task B', priority: 'low' } })
  118 | 
  119 |   await page.goto('/')
  120 |   await page.click('[aria-label="Toggle filters"]')
  121 |   await page.locator('#filter-priority').click()
  122 |   await page.click('text=High')
  123 |   await expect(page.locator('text=Task B')).not.toBeVisible()
  124 | 
  125 |   await page.click('text=Clear filters')
  126 |   await expect(page.locator('text=Task A')).toBeVisible()
  127 |   await expect(page.locator('text=Task B')).toBeVisible()
  128 | })
  129 | 
```