/** Sets the address of the page, where a scenario of the mocks is chosen: `/?mock-items=empty`. */
export function openPage(address: string) {
  window.history.replaceState(null, '', address)
}
