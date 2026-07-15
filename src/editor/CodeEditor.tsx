import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'

// Ajustes para touch: fonte 16px (impede o zoom automático do iOS ao focar),
// alvos maiores e sem autocorreção/capitalização do teclado virtual.
const touchTheme = EditorView.theme({
  '&': { fontSize: '16px' },
  '.cm-content': { padding: '12px 0', minHeight: '220px' },
  '.cm-line': { padding: '0 12px' },
  '.cm-scroller': { fontFamily: "ui-monospace, 'Cascadia Mono', Menlo, monospace" },
})

interface Props {
  initialCode: string
  onChange: (code: string) => void
}

export function CodeEditor({ initialCode, onChange }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Monta uma vez; initialCode só é lido na montagem (o pai troca a `key` para resetar).
  useEffect(() => {
    if (!host.current) return
    const view = new EditorView({
      doc: initialCode,
      parent: host.current,
      extensions: [
        basicSetup,
        python(),
        oneDark,
        touchTheme,
        keymap.of([indentWithTab]),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          autocapitalize: 'off',
          autocorrect: 'off',
          spellcheck: 'false',
        }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString())
        }),
      ],
    })
    return () => view.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={host} className="code-editor" />
}
