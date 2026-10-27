import { useEffect, useState, type JSX } from 'react'
import { ButtonsSection } from '@/stress/sections/buttons'
import { BadgesSection } from '@/stress/sections/badges'
import { DialogSection } from '@/stress/sections/dialog'
import { MenusSection } from '@/stress/sections/menus'
import { ListsSection } from '@/stress/sections/lists'
import { PageSection } from '@/stress/sections/page'
import { ResourceSection } from '@/stress/sections/resource'
import { SwitchesSection } from '@/stress/sections/switches'
import { TextLayoutSection } from '@/stress/sections/text-layout'
import { ToastsSection } from '@/stress/sections/toasts'

export type Section = { id: string; title: string; Component: () => JSX.Element }

// Each component task appends its section here.
export const sections: Section[] = [
  { id: 'text-layout', title: 'Text & layout (R1, R4, R6)', Component: TextLayoutSection },
  { id: 'buttons', title: 'Buttons (R7, R14)', Component: ButtonsSection },
  { id: 'switches', title: 'Switch (R4, R7, R14)', Component: SwitchesSection },
  { id: 'badges', title: 'Status badges (R3)', Component: BadgesSection },
  { id: 'menus', title: 'Menus, select, popover (R2, R15)', Component: MenusSection },
  { id: 'page', title: 'Page header, action bar, steps (R5, R14)', Component: PageSection },
  { id: 'dialog', title: 'Dialog (R9, R15)', Component: DialogSection },
  { id: 'resource', title: 'Loading, empty, error (R8, R10)', Component: ResourceSection },
  { id: 'lists', title: 'List and table (R6, R11, R13)', Component: ListsSection },
  { id: 'toasts', title: 'Toasts (R12, R15)', Component: ToastsSection },
]

export function Stress() {
  const [ready, setReady] = useState(false)
  // Measurements are only valid after the web font has replaced the fallback.
  useEffect(() => { void document.fonts.ready.then(() => setReady(true)) }, [])
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {sections.map(({ id, title, Component }) => (
        <section key={id} id={id} data-testid={`section-${id}`} className="border-b py-6">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h2>
          <Component />
        </section>
      ))}
      {ready && <div data-testid="stress-ready" hidden />}
    </div>
  )
}
