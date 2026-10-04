# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tasks.e2e.test.ts >> clear filters → all tasks return
- Location: tests/e2e/tasks.e2e.test.ts:115:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=High')
    - locator resolved to 2 elements. Proceeding with the first one: <span title="Priority: high" aria-label="Priority: high" class="text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-200 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 opacity-70 group-hover:opacity-100">high</span>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <html lang="en">…</html> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <html lang="en">…</html> intercepts pointer events
    - retrying click action
      - waiting 100ms
    57 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <html lang="en">…</html> intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic:
  - generic [aria-hidden]:
    - main:
      - generic:
        - generic:
          - generic:
            - generic:
              - heading [level=1]: Tasks
              - generic:
                - button: New
                - button: Filter
            - generic:
              - searchbox
        - generic:
          - generic:
            - generic:
              - generic:
                - generic: Status
                - generic:
                  - button: All tasks
                  - button: Open
                  - button: Completed
              - generic:
                - generic: Priority
                - combobox [expanded]:
                  - generic: All priorities
          - generic:
            - generic:
              - generic:
                - checkbox
                - generic: Task B
                - generic: low
                - button
              - generic:
                - checkbox
                - generic: Task A
                - generic: high
                - button
  - button "Open Next.js Dev Tools" [ref=e6] [cursor=pointer]
  - alert
  - listbox [ref=e10]:
    - option "All priorities" [active] [selected] [ref=e11] [cursor=pointer]
    - option "Low" [ref=e17] [cursor=pointer]
    - option "Medium" [ref=e20] [cursor=pointer]
    - option "High" [ref=e23] [cursor=pointer]
```

# Test source

```ts
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
> 122 |   await page.click('text=High')
      |              ^ Error: page.click: Test timeout of 30000ms exceeded.
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