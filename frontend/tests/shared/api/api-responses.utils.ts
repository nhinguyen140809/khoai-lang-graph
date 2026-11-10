import { expect } from '@playwright/test'

import type { ApiReply } from './api-client.utils'

/** A list as every list endpoint of the API answers it. */
export interface ApiPage<Item> {
  items: Item[]
  next_cursor: string | null
}

/** An error as the API answers it: a stable code, and the fields of a refused body. */
interface ApiProblem {
  code: string
  errors?: { field: string; message: string }[]
}

/** Checks the status of an answer; a failure shows the body, which says what went wrong. */
export function expectStatus(reply: ApiReply, status: number) {
  expect(reply.status, JSON.stringify(reply.body)).toBe(status)
}

/** Checks a 200 answer and gives its body. */
export function expectOk<Body>(reply: ApiReply<Body>): Body {
  expectStatus(reply, 200)
  return reply.body
}

/** Checks a 201 answer and gives its body. */
export function expectCreated<Body>(reply: ApiReply<Body>): Body {
  expectStatus(reply, 201)
  return reply.body
}

/** Checks a 202 answer: the work goes on after the answer. */
export function expectAccepted<Body>(reply: ApiReply<Body>): Body {
  expectStatus(reply, 202)
  return reply.body
}

/** Checks a 204 answer, which has no body. */
export function expectNoContent(reply: ApiReply) {
  expectStatus(reply, 204)
}

/** Checks a list answer, with the cursor a string or null, and gives it. */
export function expectPage<Item>(reply: ApiReply<ApiPage<Item>>): ApiPage<Item> {
  const page = expectOk(reply)
  expect(Array.isArray(page.items)).toBe(true)
  expect(page.next_cursor === null || typeof page.next_cursor === 'string').toBe(true)
  return page
}

/** Checks an error answer by its status and code, and by the field when a body was refused. */
export function expectProblem(reply: ApiReply, status: number, code: string, field?: string) {
  expectStatus(reply, status)
  const problem = reply.body as ApiProblem
  expect(problem.code).toBe(code)
  if (field !== undefined) expect(problem.errors?.map((entry) => entry.field)).toContain(field)
}
