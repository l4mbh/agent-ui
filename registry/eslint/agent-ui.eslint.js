// Guard rails the type system cannot express. Apps add `...agentUi()` to eslint.config.js.

// R1: hand-written flex/grid loses `min-w-0` on children — the cause of overlapping columns.
// Pure AST check: finds layout tokens in string literals and template text anywhere inside a `className`
// value (cn(), clsx(), cva(), ternaries, arrays, object keys). Known limit: identifiers are not followed,
// so `const row = 'flex'; className={row}` passes.
const LAYOUT = new Set(['flex', 'grid', 'inline-flex', 'inline-grid'])

// Variants may contain ':' inside brackets (`data-[state=open]:flex`), so blank the brackets first;
// then drop the variant prefix and the important marker (`!flex`, `md:!grid`, `flex!`).
function layoutToken(text) {
  return text.replace(/\[[^\]]*\]/g, 'X').split(/\s+/).find((c) => LAYOUT.has(c.split(':').pop().replace(/^!|!$/g, '')))
}

function findToken(node) {
  if (!node || typeof node.type !== 'string') return undefined
  if (node.type === 'Literal') return typeof node.value === 'string' ? layoutToken(node.value) : undefined
  if (node.type === 'TemplateElement') return layoutToken(node.value.cooked ?? '')
  // `cn({ flex: isRow })`: an unquoted key is an Identifier; quoted keys are Literals and are covered above.
  if (node.type === 'Property' && !node.computed && node.key.type === 'Identifier' && layoutToken(node.key.name)) return node.key.name
  for (const [key, child] of Object.entries(node)) {
    if (key === 'parent') continue
    for (const c of Array.isArray(child) ? child : [child]) {
      const hit = findToken(c)
      if (hit) return hit
    }
  }
  return undefined
}

export const noRawLayout = {
  meta: {
    type: 'problem',
    messages: { raw: 'agent-ui R1: use <Stack> or <Columns> instead of "{{cls}}"; they keep children shrinkable so columns cannot overlap. (Classes held in variables are not checked.)' },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className' || !node.value) return
        const cls = findToken(node.value)
        if (cls) context.report({ node, messageId: 'raw', data: { cls } })
      },
    }
  },
}

// i18n: visible text comes from useT(). Own rule (not eslint-plugin-react) so apps on ESLint 10 install cleanly.
// Checks JSX text, string/template children `{'x'}` and the text props below, following ternaries and `&&`/`||`.
// Known limit: identifiers are not followed, so `const s = 'Save'; <p>{s}</p>` passes.
const ALLOWED = new Set(['·', '…', '—', '–', '/', ':', '(', ')', '+', '×', '|'])

/** Props whose value is shown (or read aloud) to the user; className, data-testid, etc. are not text. */
export const TEXT_PROPS = new Set(['title', 'description', 'label', 'placeholder', 'aria-label', 'alt', 'caption', 'header', 'emptyTitle', 'helperText'])

export const noLiteralUiText = {
  meta: {
    type: 'problem',
    messages: { literal: 'agent-ui i18n: "{{text}}" is a literal; use useT() (punctuation like · … — is allowed).' },
    schema: [],
  },
  create(context) {
    const check = (node, text) => {
      const t = text.trim()
      if (t && !ALLOWED.has(t)) context.report({ node, messageId: 'literal', data: { text: t } })
    }
    // Only the static parts of a template count: `${n}` alone is not text.
    const visit = (node, e) => {
      if (e.type === 'Literal' && typeof e.value === 'string') check(node, e.value)
      else if (e.type === 'TemplateLiteral') check(node, e.quasis.map((q) => q.value.cooked ?? '').join(' '))
      else if (e.type === 'ConditionalExpression') { visit(node, e.consequent); visit(node, e.alternate) }
      else if (e.type === 'LogicalExpression') { visit(node, e.left); visit(node, e.right) }
    }
    return {
      JSXText(node) {
        check(node, node.value)
      },
      JSXExpressionContainer(node) {
        if (node.parent.type === 'JSXElement' || node.parent.type === 'JSXFragment') visit(node, node.expression)
      },
      JSXAttribute(node) {
        if (!TEXT_PROPS.has(node.name.name) || !node.value) return
        visit(node, node.value.type === 'JSXExpressionContainer' ? node.value.expression : node.value)
      },
    }
  },
}

export default function agentUi({ files = ['src/**/*.{ts,tsx}'], ignores = ['src/components/agent-ui/**'] } = {}) {
  return [
    {
      files,
      ignores,
      plugins: { 'agent-ui': { rules: { 'no-raw-layout': noRawLayout, 'no-literal-ui-text': noLiteralUiText } } },
      rules: {
        'agent-ui/no-raw-layout': 'error',
        'agent-ui/no-literal-ui-text': 'error',
      },
    },
  ]
}
