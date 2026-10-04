import { test, expect } from '@playwright/test'

async function cleanTasks(request: Parameters<Parameters<typeof test>[1]>[0]['request']) {
  const res = await request.get('/api/tasks')
  const { tasks } = await res.json()
  for (const task of tasks) {
    await request.delete(`/api/tasks/${task.id}`).catch(() => {})
  }
}

test.beforeEach(async ({ request }) => {
  await cleanTasks(request)
})

// ── CRUD ──────────────────────────────────────────────────────────────────────

test('create task → appears in list', async ({ page }) => {
  await page.goto('/')
  await page.click('[aria-label="Create new task"]')
  await page.fill('[aria-label="New task title"]', 'Buy milk')
  await page.click('text=Save')
  await expect(page.locator('text=Buy milk')).toBeVisible()
})

test('mark task complete → checkbox checked', async ({ page, request }) => {
  await request.post('/api/tasks', { data: { title: 'Complete me', priority: 'medium' } })
  await page.goto('/')
  const checkbox = page.getByRole('checkbox', { name: /Complete me/ })
  await expect(checkbox).not.toBeChecked()
  await checkbox.click()
  await expect(checkbox).toBeChecked()
})

test('mark completed task incomplete → checkbox unchecked', async ({ page, request }) => {
  const res = await request.post('/api/tasks', { data: { title: 'Already done', priority: 'medium' } })
  const { id } = await res.json()
  await request.patch(`/api/tasks/${id}`, { data: { completed: true } })
  await page.goto('/')
  const checkbox = page.getByRole('checkbox', { name: /Already done/ })
  await expect(checkbox).toBeChecked()
  await checkbox.click()
  await expect(checkbox).not.toBeChecked()
})

test('edit task title inline (double-click) → update persists', async ({ page, request }) => {
  await request.post('/api/tasks', { data: { title: 'Old title', priority: 'low' } })
  await page.goto('/')
  await page.dblclick('text=Old title')
  const input = page.locator('input[type="text"]').last()
  await input.fill('New title')
  await input.press('Enter')
  await expect(page.locator('text=New title')).toBeVisible()
  await expect(page.locator('text=Old title')).not.toBeVisible()
})

test('delete task → removed from list', async ({ page, request }) => {
  await request.post('/api/tasks', { data: { title: 'Delete me', priority: 'low' } })
  await page.goto('/')
  await page.hover('text=Delete me')
  await page.click('[aria-label*="Actions for task \\"Delete me\\""]')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('text=Delete me')).not.toBeVisible()
})

// ── FILTERING ─────────────────────────────────────────────────────────────────

test('filter by status=open → only open tasks visible', async ({ page, request }) => {
  await request.post('/api/tasks', { data: { title: 'Open task', priority: 'medium' } })
  const res = await request.post('/api/tasks', { data: { title: 'Done task', priority: 'medium' } })
  const { id } = await res.json()
  await request.patch(`/api/tasks/${id}`, { data: { completed: true } })

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.click('[aria-label="Toggle filters"]')
  await page.click('text=Open')
  await expect(page.locator('text=Open task')).toBeVisible()
  await expect(page.locator('text=Done task')).not.toBeVisible()
})

test('filter by status=done → only completed tasks visible', async ({ page, request }) => {
  await request.post('/api/tasks', { data: { title: 'Active task', priority: 'medium' } })
  const res = await request.post('/api/tasks', { data: { title: 'Finished task', priority: 'medium' } })
  const { id } = await res.json()
  await request.patch(`/api/tasks/${id}`, { data: { completed: true } })

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.click('[aria-label="Toggle filters"]')
  await page.click('text=Completed')
  await expect(page.locator('text=Finished task')).toBeVisible()
  await expect(page.locator('text=Active task')).not.toBeVisible()
})

test('filter by priority=high → only high-priority tasks', async ({ page, request }) => {
  await request.post('/api/tasks', { data: { title: 'Urgent task', priority: 'high' } })
  await request.post('/api/tasks', { data: { title: 'Low task', priority: 'low' } })

  await page.goto('/')
  await page.click('[aria-label="Toggle filters"]')
  await page.locator('#filter-priority').click()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('text=Urgent task')).toBeVisible()
  await expect(page.locator('text=Low task')).not.toBeVisible()
})

test('search by text (case-insensitive) → matching tasks shown', async ({ page, request }) => {
  await request.post('/api/tasks', { data: { title: 'Buy groceries', priority: 'medium' } })
  await request.post('/api/tasks', { data: { title: 'Call dentist', priority: 'medium' } })

  await page.goto('/')
  await page.fill('[aria-label="Search tasks"]', 'BUY')
  await expect(page.locator('text=Buy groceries')).toBeVisible()
  await expect(page.locator('text=Call dentist')).not.toBeVisible()
})

test('clear filters → all tasks return', async ({ page, request }) => {
  await request.post('/api/tasks', { data: { title: 'Task A', priority: 'high' } })
  await request.post('/api/tasks', { data: { title: 'Task B', priority: 'low' } })

  await page.goto('/')
  await page.click('[aria-label="Toggle filters"]')
  await page.locator('#filter-priority').click()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('text=Task B')).not.toBeVisible()

  await page.click('text=Clear filters')
  await expect(page.locator('text=Task A')).toBeVisible()
  await expect(page.locator('text=Task B')).toBeVisible()
})

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────────

test('press N → inline task creator opens', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.press('body', 'n')
  await expect(page.locator('[aria-label="New task title"]')).toBeVisible()
})

test('press Cmd+K → search input focused', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const searchInput = page.locator('[aria-label="Search tasks"]')
  await page.keyboard.press('Meta+k')
  await expect(searchInput).toBeFocused({ timeout: 5000 })
})

test('press Escape in creator → creator closes without creating', async ({ page }) => {
  await page.goto('/')
  await page.click('[aria-label="Create new task"]')
  await expect(page.locator('[aria-label="New task title"]')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('[aria-label="New task title"]')).not.toBeVisible()
})

// ── FORM VALIDATION ───────────────────────────────────────────────────────────

test('submit empty title → does not create task', async ({ page }) => {
  await page.goto('/')
  const initialCount = await page.locator('[type="checkbox"]').count()
  await page.click('[aria-label="Create new task"]')
  await page.click('text=Save')
  // creator remains open (title is empty, handleSubmit returns early)
  await expect(page.locator('[aria-label="New task title"]')).toBeVisible()
  const afterCount = await page.locator('[type="checkbox"]').count()
  expect(afterCount).toBe(initialCount)
})

// ── EMPTY STATE ───────────────────────────────────────────────────────────────

test('empty state shown when no tasks match filter', async ({ page }) => {
  await page.goto('/')
  await page.fill('[aria-label="Search tasks"]', 'xyzzy-no-match-12345')
  await expect(page.locator('text=No tasks found')).toBeVisible()
})
