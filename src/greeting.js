/**
 * Builds the greeting shown on the home page.
 * @param {string} name
 * @returns {string}
 */
export function greeting(name) {
  const trimmed = (name ?? "").trim();
  return trimmed ? `Hello, ${trimmed}!` : "Hello, stranger!";
}

/**
 * Builds the farewell shown on the home page.
 * @param {string | null | undefined} name - Name to trim; blank or missing names use "stranger".
 * @returns {string} The personalized farewell message.
 */
export function farewell(name) {
  const trimmed = (name ?? "").trim();
  return trimmed ? `Goodbye, ${trimmed}!` : "Goodbye, stranger!";
}
