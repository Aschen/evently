/**
 * Convert a string to snake_case
 */
export function snakeCase(str: string) {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join('_')
}
