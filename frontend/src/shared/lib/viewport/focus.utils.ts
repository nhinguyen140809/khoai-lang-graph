/** Whether the element holds the focus of the page. */
export function isFocused(element: Element | null): boolean {
  return element !== null && document.activeElement === element
}
