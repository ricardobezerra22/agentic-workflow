import { test, expect, type APIRequestContext } from '@playwright/test'

// Use workerIndex to make titles unique across parallel browsers
function uid(base: string, workerIndex: number) {
  return `${base} [w${workerIndex}]`
}

async function createTask(request: APIRequestContext, title: string, priority = 'medium') {
  const res = await request.post('/api/tasks', { data: { title, priority } })
  const task = (await res.json()) as { id: number }
  return task
}

async function deleteTask(request: APIRequestContext, id: number) {
  await request.delete(`/api/tasks/${id}`).catch(() => {})
}

test('click task row → drawer opens with task data', async ({ page, request }, testInfo) => {
  const title = uid('Drawer open test', testInfo.workerIndex)
  const { id } = await createTask(request, title, 'low')
  try {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.click(`text=${title}`)
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.locator('#drawer-title')).toHaveValue(title)
  } finally {
    await deleteTask(request, id)
  }
})

test('drawer: edit priority → Save → list reflects change', async ({ page, request }, testInfo) => {
  const title = uid('Priority edit', testInfo.workerIndex)
  const { id } = await createTask(request, title, 'low')
  try {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click(`text=${title}`)
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.selectOption('#drawer-priority', 'high')
    await page.click('button:has-text("Save")')

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
    await page.waitForLoadState('networkidle')

    // Verify priority updated via API
    const check = await request.get(`/api/tasks/${id}`)
    const updated = await check.json()
    expect(updated.priority).toBe('high')
  } finally {
    await deleteTask(request, id)
  }
})

test('drawer: edit description → Save → reopen shows updated description', async ({ page, request }, testInfo) => {
  const title = uid('Description task', testInfo.workerIndex)
  const { id } = await createTask(request, title, 'medium')
  try {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click(`text=${title}`)
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.fill('#drawer-description', 'Updated description text')
    await page.click('button:has-text("Save")')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // Reopen and verify description persisted
    await page.waitForLoadState('networkidle')
    await page.click(`text=${title}`)
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.locator('#drawer-description')).toHaveValue('Updated description text')
  } finally {
    await deleteTask(request, id)
  }
})

test('drawer: Escape closes without saving when form is clean', async ({ page, request }, testInfo) => {
  const title = uid('Escape test', testInfo.workerIndex)
  const { id } = await createTask(request, title, 'medium')
  try {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click(`text=${title}`)
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 })
  } finally {
    await deleteTask(request, id)
  }
})

test('drawer: checkbox click does NOT open drawer', async ({ page, request }, testInfo) => {
  const title = uid('Checkbox no-open', testInfo.workerIndex)
  const { id } = await createTask(request, title, 'medium')
  try {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click(`[aria-label*="Mark \\"${title}\\""]`)
    await expect(page.getByRole('dialog')).not.toBeVisible()
  } finally {
    await deleteTask(request, id)
  }
})

test('drawer: delete task from drawer removes it from list', async ({ page, request }, testInfo) => {
  const title = uid('Delete from drawer', testInfo.workerIndex)
  await createTask(request, title, 'low')
  // Note: no finally cleanup — the test itself deletes the task via the UI
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await page.click(`text=${title}`)
  await expect(page.getByRole('dialog')).toBeVisible()

  page.on('dialog', (dialog) => dialog.accept())
  await page.click('[aria-label="Delete task"]')

  // Check the task row is gone (use role=button which TaskItem sets when onOpen is present)
  await expect(page.locator('[role="button"]').filter({ hasText: title })).not.toBeVisible({ timeout: 5000 })
})
