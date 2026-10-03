/**
 * Builds the greeting shown on the home page.
 * @param {string} name
 * @returns {string}
 */
export function greeting(name) {
  const trimmed = (name ?? "").trim();
  return trimmed ? `Hello, ${trimmed}!` : "Hello, stranger!";
}

export function farewell(name) {
  const trimmed = (name ?? "").trim();
  return trimmed ? `Goodbye, ${trimmed}!` : "Goodbye, stranger!";
}
