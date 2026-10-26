import type { QueryClient } from '@tanstack/react-query'
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from '@testing-library/react'
import { createElement, type ReactElement, type ReactNode } from 'react'

import { TestProviders } from './TestProviders'

interface ProviderOptions {
  /** The query cache to render with, to look at it in the test. */
  queryClient?: QueryClient
}

function wrapperFor(queryClient: QueryClient | undefined) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(TestProviders, queryClient ? { queryClient, children } : { children })
  }
}

/** Renders a component with the providers of `TestProviders`. */
export function renderWithProviders(
  ui: ReactElement,
  { queryClient, ...options }: Omit<RenderOptions, 'wrapper' | 'queries'> & ProviderOptions = {},
) {
  return render(ui, { ...options, wrapper: wrapperFor(queryClient) })
}

/** Renders a hook with the providers of `TestProviders`. */
export function renderHookWithProviders<Result, Props>(
  callback: (props: Props) => Result,
  {
    queryClient,
    ...options
  }: Omit<RenderHookOptions<Props>, 'wrapper' | 'queries'> & ProviderOptions = {},
) {
  return renderHook(callback, { ...options, wrapper: wrapperFor(queryClient) })
}
