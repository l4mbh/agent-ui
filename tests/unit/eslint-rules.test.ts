import { Linter, RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { expect, it } from 'vitest'
import agentUi, { noLiteralUiText, noRawLayout, TEXT_PROPS } from '../../registry/eslint/agent-ui.eslint.js'

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } })
const raw = { messageId: 'raw' as const }

it('no-raw-layout', () => {
  tester.run('no-raw-layout', noRawLayout, {
    valid: [
      '<Stack gap={2}><a /></Stack>', '<div className="rounded border p-2" />', '<div className="flexible-name" />',
      '<div className="flex-1" />', '<div className="flex-col grid-cols-2" />', '<div className="inline-flex-wrapper" />',
      "<div className={cn('rounded p-2')} />", '<div className={cn({ rounded: x, flexible: y })} />', '<div className={`rounded ${x}`} />',
    ],
    invalid: [
      { code: '<div className="flex gap-2" />', errors: [raw] },
      { code: '<div className="md:grid" />', errors: [raw] },
      { code: '<div className="inline-flex items-center" />', errors: [raw] },
      { code: "<div className={cn('flex gap-2')} />", errors: [raw] },
      { code: "<div className={'grid'} />", errors: [raw] },
      { code: '<div className={`inline-flex ${x}`} />', errors: [raw] },
      { code: "<div className={cn(cond && 'flex')} />", errors: [raw] },
      { code: '<div className="data-[state=open]:flex" />', errors: [raw] },
      { code: '<div className="[&>*]:grid" />', errors: [raw] },
      { code: '<div className="!flex" />', errors: [raw] },
      { code: '<div className="md:!grid" />', errors: [raw] },
      { code: 'const a = <div className={cn({ flex: isRow })} />', errors: [raw] },
      { code: "const a = <div className={cn({ 'inline-flex': x })} />", errors: [raw] },
    ],
  })
})

it('no-literal-ui-text', () => {
  const lit = { messageId: 'literal' as const }
  tester.run('no-literal-ui-text', noLiteralUiText, {
    valid: [
      "<p>{t('x')}</p>", "<p>{'·'}</p>", '<p>·</p>', '<p> </p>', "<p title={t('x')} />", '<p aria-label={`${x}`} />',
      "<p>{t('a')} / {t('b')}</p>", '<p>{count}</p>', '<div className="flex-1" />', '<p>{`${n}`}</p>', '<p data-testid="x" />',
      "<p>{c ? t('a') : t('b')}</p>", "<p title={c ? t('a') : `${n}`} />", '<p>{`${a} · ${b}`}</p>',
    ],
    invalid: [
      { code: '<p>Hello</p>', errors: [lit] },
      { code: "<p>{'Hello'}</p>", errors: [lit] },
      { code: '<p>{`Hello`}</p>', errors: [lit] },
      { code: '<p>{`Hi ${n}`}</p>', errors: [lit] },
      { code: '<><b/>Hello</>', errors: [lit] },
      { code: '<PageHeader title="Meetings" description="x"/>', errors: [lit, lit] },
      { code: '<button aria-label="Close" />', errors: [lit] },
      { code: '<input placeholder={`Search ${n}`} />', errors: [lit] },
      { code: "<p>{busy ? 'Saving…' : 'Save'}</p>", errors: [lit, lit] },
      { code: "<p>{ok && 'Done'}</p>", errors: [lit] },
      { code: "<p title={ok ? t('a') : 'Nope'} />", errors: [lit] },
    ],
  })
})

it('TEXT_PROPS lists the text props in one place', () => {
  expect([...TEXT_PROPS]).toEqual(['title', 'description', 'label', 'placeholder', 'aria-label', 'alt', 'caption', 'header', 'emptyTitle', 'helperText'])
})

it('agentUi() config', () => {
  const config = agentUi()
  expect(config[0].rules).toMatchObject({ 'agent-ui/no-raw-layout': 'error' })
  expect(config[0].rules).toMatchObject({ 'agent-ui/no-literal-ui-text': 'error' })

  const linter = new Linter({ configType: 'flat' })
  const run = (code: string, filename: string) =>
    linter.verify(code, [{ languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } } }, ...config], filename).map((m) => m.ruleId)

  expect(run('export const A = () => <p>Hello</p>', 'src/a.tsx')).toContain('agent-ui/no-literal-ui-text')
  expect(run("export const A = () => <p>{t('x')}</p>", 'src/a.tsx')).toEqual([])
  expect(run('export const A = () => <PageHeader title="Meetings" description="x" />', 'src/a.tsx')).toContain('agent-ui/no-literal-ui-text')
  expect(run('export const A = () => <p className="flex">Hello</p>', 'src/a.tsx')).toContain('agent-ui/no-raw-layout')
  expect(run('export const A = () => <p className="flex">Hello</p>', 'src/components/agent-ui/a.tsx')).not.toContain('agent-ui/no-literal-ui-text')
  expect(run('export const A = () => <p className="flex">Hello</p>', 'src/components/agent-ui/a.tsx')).not.toContain('agent-ui/no-raw-layout')
})
