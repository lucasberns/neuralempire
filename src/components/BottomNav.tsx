export type View = 'lab' | 'contratos' | 'skills' | 'workbench'

const TABS: { id: View; label: string; glyph: string }[] = [
  { id: 'lab', label: 'Lab', glyph: '⌂' },
  { id: 'contratos', label: 'Contratos', glyph: '≡' },
  { id: 'skills', label: 'Skills', glyph: '❖' },
]

export function BottomNav({
  view,
  onNavigate,
  hasActive,
}: {
  view: View
  onNavigate: (v: View) => void
  hasActive: boolean
}) {
  const tabs = hasActive
    ? [...TABS, { id: 'workbench' as View, label: 'Bancada', glyph: '⌗' }]
    : TABS
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`nav-tab${view === t.id ? ' is-active' : ''}`}
          aria-current={view === t.id}
          onClick={() => onNavigate(t.id)}
        >
          <span className="nav-glyph">{t.glyph}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
