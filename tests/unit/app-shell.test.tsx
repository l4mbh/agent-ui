import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { expect, it, vi } from 'vitest'
import { AppShell } from '@/registry/blocks/app-shell'
import { I18nProvider } from '@/registry/i18n/i18n'
import { shellProps } from './app-shell-props'

// jsdom has no ResizeObserver; Text needs it.
vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} unobserve() {} })

const header = (actions?: React.ReactNode) => {
  const r = render(<I18nProvider locale="zh-TW" messages={{ en: {}, 'zh-TW': {} }}><AppShell {...shellProps} actions={actions}><p>body</p></AppShell></I18nProvider>)
  const html = r.container.querySelector('header')!.outerHTML.replace(/_r_\w+_/g, 'ID') + '\n'
  r.unmount()
  return html
}

// Apps on v0.1.0 pass no `actions`; their header must render exactly as v0.1.0 did. The fixture is the v0.1.0
// component's header (git show v0.1.0:registry/blocks/app-shell.tsx) rendered with the same props.
it('without actions the header is byte-identical to v0.1.0', () => {
  expect(header()).toBe(readFileSync('tests/unit/fixtures/app-shell-header-v0.1.0.html', 'utf8'))
})

it('with actions the header differs (the pin above can fail)', () => {
  expect(header(<button>x</button>)).not.toBe(readFileSync('tests/unit/fixtures/app-shell-header-v0.1.0.html', 'utf8'))
})
