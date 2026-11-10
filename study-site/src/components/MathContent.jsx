import { useMemo } from 'react'
import katex from 'katex'

export default function MathContent({ children, block }) {
  const html = useMemo(() => katex.renderToString(String(children), {
    throwOnError: false,
    displayMode: !!block,
    strict: false,
  }), [children, block])
  return block
    ? <div className="kblock" dangerouslySetInnerHTML={{ __html: html }} />
    : <span dangerouslySetInnerHTML={{ __html: html }} />
}
