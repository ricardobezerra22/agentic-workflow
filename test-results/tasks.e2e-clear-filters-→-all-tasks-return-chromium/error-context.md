# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tasks.e2e.test.ts >> clear filters → all tasks return
- Location: tests/e2e/tasks.e2e.test.ts:121:1

# Error details

```
Error: expect(locator).not.toBeVisible() failed

Locator:  locator('text=Task B')
Expected: not visible
Received: visible
Timeout:  5000ms

Call log:
  - Expect "not toBeVisible" locator('text=Task B') with timeout 5000ms
  - waiting for locator('text=Task B')
    14 × locator resolved to <div title="Double-click to edit" class="flex-1 min-w-0 text-base cursor-text select-none transition-all duration-200 text-foreground">Task B</div>
       - unexpected value "visible"

```

```yaml
- text: Task B
```

# Test source

```ts
  32  | })
  33  | 
  34  | test('mark completed task incomplete → checkbox unchecked', async ({ page, request }) => {
  35  |   const res = await request.post('/api/tasks', { data: { title: 'Already done', priority: 'medium' } })
  36  |   const { id } = await res.json()
  37  |   await request.patch(`/api/tasks/${id}`, { data: { completed: true } })
  38  |   await page.goto('/')
  39  |   const checkbox = page.getByRole('checkbox', { name: /Already done/ })
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
  61  |   await page.keyboard.press('ArrowDown')
  62  |   await page.keyboard.press('Enter')
  63  |   await expect(page.locator('text=Delete me')).not.toBeVisible()
  64  | })
  65  | 
  66  | // ── FILTERING ─────────────────────────────────────────────────────────────────
  67  | 
  68  | test('filter by status=open → only open tasks visible', async ({ page, request }) => {
  69  |   await request.post('/api/tasks', { data: { title: 'Open task', priority: 'medium' } })
  70  |   const res = await request.post('/api/tasks', { data: { title: 'Done task', priority: 'medium' } })
  71  |   const { id } = await res.json()
  72  |   await request.patch(`/api/tasks/${id}`, { data: { completed: true } })
  73  | 
  74  |   await page.goto('/')
  75  |   await page.waitForLoadState('networkidle')
  76  |   await page.click('[aria-label="Toggle filters"]')
  77  |   await page.click('text=Open')
  78  |   await expect(page.locator('text=Open task')).toBeVisible()
  79  |   await expect(page.locator('text=Done task')).not.toBeVisible()
  80  | })
  81  | 
  82  | test('filter by status=done → only completed tasks visible', async ({ page, request }) => {
  83  |   await request.post('/api/tasks', { data: { title: 'Active task', priority: 'medium' } })
  84  |   const res = await request.post('/api/tasks', { data: { title: 'Finished task', priority: 'medium' } })
  85  |   const { id } = await res.json()
  86  |   await request.patch(`/api/tasks/${id}`, { data: { completed: true } })
  87  | 
  88  |   await page.goto('/')
  89  |   await page.waitForLoadState('networkidle')
  90  |   await page.click('[aria-label="Toggle filters"]')
  91  |   await page.click('text=Completed')
  92  |   await expect(page.locator('text=Finished task')).toBeVisible()
  93  |   await expect(page.locator('text=Active task')).not.toBeVisible()
  94  | })
  95  | 
  96  | test('filter by priority=high → only high-priority tasks', async ({ page, request }) => {
  97  |   await request.post('/api/tasks', { data: { title: 'Urgent task', priority: 'high' } })
  98  |   await request.post('/api/tasks', { data: { title: 'Low task', priority: 'low' } })
  99  | 
  100 |   await page.goto('/')
  101 |   await page.click('[aria-label="Toggle filters"]')
  102 |   await page.locator('#filter-priority').click()
  103 |   await page.keyboard.press('ArrowDown')
  104 |   await page.keyboard.press('ArrowDown')
  105 |   await page.keyboard.press('ArrowDown')
  106 |   await page.keyboard.press('Enter')
  107 |   await expect(page.locator('text=Urgent task')).toBeVisible()
  108 |   await expect(page.locator('text=Low task')).not.toBeVisible()
  109 | })
  110 | 
  111 | test('search by text (case-insensitive) → matching tasks shown', async ({ page, request }) => {
  112 |   await request.post('/api/tasks', { data: { title: 'Buy groceries', priority: 'medium' } })
  113 |   await request.post('/api/tasks', { data: { title: 'Call dentist', priority: 'medium' } })
  114 | 
  115 |   await page.goto('/')
  116 |   await page.fill('[aria-label="Search tasks"]', 'BUY')
  117 |   await expect(page.locator('text=Buy groceries')).toBeVisible()
  118 |   await expect(page.locator('text=Call dentist')).not.toBeVisible()
  119 | })
  120 | 
  121 | test('clear filters → all tasks return', async ({ page, request }) => {
  122 |   await request.post('/api/tasks', { data: { title: 'Task A', priority: 'high' } })
  123 |   await request.post('/api/tasks', { data: { title: 'Task B', priority: 'low' } })
  124 | 
  125 |   await page.goto('/')
  126 |   await page.click('[aria-label="Toggle filters"]')
  127 |   await page.locator('#filter-priority').click()
  128 |   await page.keyboard.press('ArrowDown')
  129 |   await page.keyboard.press('ArrowDown')
  130 |   await page.keyboard.press('ArrowDown')
  131 |   await page.keyboard.press('Enter')
> 132 |   await expect(page.locator('text=Task B')).not.toBeVisible()
      |                                                 ^ Error: expect(locator).not.toBeVisible() failed
  133 | 
  134 |   await page.click('text=Clear filters')
  135 |   await expect(page.locator('text=Task A')).toBeVisible()
  136 |   await expect(page.locator('text=Task B')).toBeVisible()
  137 | })
  138 | 
  139 | // ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────────
  140 | 
  141 | test('press N → inline task creator opens', async ({ page }) => {
  142 |   await page.goto('/')
  143 |   await page.waitForLoadState('networkidle')
  144 |   await page.press('body', 'n')
  145 |   await expect(page.locator('[aria-label="New task title"]')).toBeVisible()
  146 | })
  147 | 
  148 | test('press Cmd+K → search input focused', async ({ page }) => {
  149 |   await page.goto('/')
  150 |   await page.waitForLoadState('networkidle')
  151 |   const searchInput = page.locator('[aria-label="Search tasks"]')
  152 |   await page.keyboard.press('Meta+k')
  153 |   await expect(searchInput).toBeFocused({ timeout: 5000 })
  154 | })
  155 | 
  156 | test('press Escape in creator → creator closes without creating', async ({ page }) => {
  157 |   await page.goto('/')
  158 |   await page.click('[aria-label="Create new task"]')
  159 |   await expect(page.locator('[aria-label="New task title"]')).toBeVisible()
  160 |   await page.keyboard.press('Escape')
  161 |   await expect(page.locator('[aria-label="New task title"]')).not.toBeVisible()
  162 | })
  163 | 
  164 | // ── FORM VALIDATION ───────────────────────────────────────────────────────────
  165 | 
  166 | test('submit empty title → does not create task', async ({ page }) => {
  167 |   await page.goto('/')
  168 |   const initialCount = await page.locator('[type="checkbox"]').count()
  169 |   await page.click('[aria-label="Create new task"]')
  170 |   await page.click('text=Save')
  171 |   // creator remains open (title is empty, handleSubmit returns early)
  172 |   await expect(page.locator('[aria-label="New task title"]')).toBeVisible()
  173 |   const afterCount = await page.locator('[type="checkbox"]').count()
  174 |   expect(afterCount).toBe(initialCount)
  175 | })
  176 | 
  177 | // ── EMPTY STATE ───────────────────────────────────────────────────────────────
  178 | 
  179 | test('empty state shown when no tasks match filter', async ({ page }) => {
  180 |   await page.goto('/')
  181 |   await page.fill('[aria-label="Search tasks"]', 'xyzzy-no-match-12345')
  182 |   await expect(page.locator('text=No tasks found')).toBeVisible()
  183 | })
  184 | 
```