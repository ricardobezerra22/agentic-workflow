# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tasks.e2e.test.ts >> filter by status=open → only open tasks visible
- Location: tests/e2e/tasks.e2e.test.ts:67:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Open task')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Open task') with timeout 5000ms
  - waiting for locator('text=Open task')

```

```yaml
- main:
  - heading "Tasks" [level=1]
  - button "Create new task":
    - img
    - text: New
  - button "Toggle filters":
    - img
    - text: Filter
  - searchbox "Search tasks"
  - img
  - text: Status
  - button "All tasks"
  - button "Open"
  - button "Completed"
  - text: Priority
  - combobox "Priority": All priorities
  - checkbox "Mark \"Task B\" as complete"
  - text: Task B low
  - button "Actions for task \"Task B\"":
    - img
  - checkbox "Mark \"Task A\" as complete"
  - text: Task A high
  - button "Actions for task \"Task A\"":
    - img
- alert
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
  29  |   await expect(checkbox).not.toBeChecked()
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
> 76  |   await expect(page.locator('text=Open task')).toBeVisible()
      |                                                ^ Error: expect(locator).toBeVisible() failed
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
  130 | // ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────────
  131 | 
  132 | test('press N → inline task creator opens', async ({ page }) => {
  133 |   await page.goto('/')
  134 |   await page.press('body', 'n')
  135 |   await expect(page.locator('[aria-label="New task title"]')).toBeVisible()
  136 | })
  137 | 
  138 | test('press Cmd+K → search input focused', async ({ page }) => {
  139 |   await page.goto('/')
  140 |   await page.keyboard.press('Meta+k')
  141 |   await expect(page.locator('[aria-label="Search tasks"]')).toBeFocused()
  142 | })
  143 | 
  144 | test('press Escape in creator → creator closes without creating', async ({ page }) => {
  145 |   await page.goto('/')
  146 |   await page.click('[aria-label="Create new task"]')
  147 |   await expect(page.locator('[aria-label="New task title"]')).toBeVisible()
  148 |   await page.keyboard.press('Escape')
  149 |   await expect(page.locator('[aria-label="New task title"]')).not.toBeVisible()
  150 | })
  151 | 
  152 | // ── FORM VALIDATION ───────────────────────────────────────────────────────────
  153 | 
  154 | test('submit empty title → does not create task', async ({ page }) => {
  155 |   await page.goto('/')
  156 |   const initialCount = await page.locator('[type="checkbox"]').count()
  157 |   await page.click('[aria-label="Create new task"]')
  158 |   await page.click('text=Save')
  159 |   // creator remains open (title is empty, handleSubmit returns early)
  160 |   await expect(page.locator('[aria-label="New task title"]')).toBeVisible()
  161 |   const afterCount = await page.locator('[type="checkbox"]').count()
  162 |   expect(afterCount).toBe(initialCount)
  163 | })
  164 | 
  165 | // ── EMPTY STATE ───────────────────────────────────────────────────────────────
  166 | 
  167 | test('empty state shown when no tasks match filter', async ({ page }) => {
  168 |   await page.goto('/')
  169 |   await page.fill('[aria-label="Search tasks"]', 'xyzzy-no-match-12345')
  170 |   await expect(page.locator('text=No tasks found')).toBeVisible()
  171 | })
  172 | 
```