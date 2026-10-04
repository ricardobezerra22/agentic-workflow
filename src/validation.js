const VALID_PRIORITIES = ["low", "medium", "high"];
const VALID_STATUSES = ["all", "open", "done"];

function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str + "T00:00:00Z");
  return d.toISOString().startsWith(str);
}

export function validateTask(body) {
  const errors = [];

  const title = typeof body.title === "string" ? body.title.trim() : null;
  if (!title) {
    errors.push({ field: "title", issue: "required" });
  } else if (title.length > 200) {
    errors.push({ field: "title", issue: "max_length_exceeded" });
  }

  if (body.priority !== undefined && !VALID_PRIORITIES.includes(body.priority)) {
    errors.push({ field: "priority", issue: "invalid_value" });
  }

  if (body.dueDate !== undefined && body.dueDate !== null) {
    if (!isValidDate(body.dueDate)) {
      errors.push({ field: "dueDate", issue: "invalid_date" });
    }
  }

  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== "string" || body.description.length > 2000) {
      errors.push({ field: "description", issue: "max_length_exceeded" });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validatePatchTask(body) {
  const KNOWN = ["title", "description", "priority", "dueDate", "completed"];
  const hasKnown = KNOWN.some((k) => k in body);
  if (!hasKnown) {
    return {
      valid: false,
      errors: [{ field: "body", issue: "no_known_fields" }],
    };
  }
  // Re-use task validation on the partial fields
  return validateTask({ title: body.title ?? "placeholder", ...body });
}

export function validateListParams(query) {
  const errors = [];

  if (query.status !== undefined && !VALID_STATUSES.includes(query.status)) {
    errors.push({ field: "status", issue: "invalid_value" });
  }

  if (query.priority !== undefined && !VALID_PRIORITIES.includes(query.priority)) {
    errors.push({ field: "priority", issue: "invalid_value" });
  }

  return { valid: errors.length === 0, errors };
}
