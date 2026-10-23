import { render } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { Button, PrimaryScope } from '@/registry/ui/button'

afterEach(() => vi.restoreAllMocks())

it('reports a second primary button in one view', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<PrimaryScope><Button variant="primary">A</Button><Button variant="primary">B</Button></PrimaryScope>)
  expect(error).toHaveBeenCalledWith('agent-ui R14: more than one primary button in one view')
})

it('is quiet with one primary', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<PrimaryScope><Button variant="primary">A</Button><Button>B</Button></PrimaryScope>)
  expect(error).not.toHaveBeenCalled()
})

// StrictMode runs effects twice in dev; register/unregister must keep the count right, with no false alarm.
it('is quiet with one primary under StrictMode', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<StrictMode><PrimaryScope><Button variant="primary">A</Button></PrimaryScope></StrictMode>)
  expect(error).not.toHaveBeenCalled()
})
