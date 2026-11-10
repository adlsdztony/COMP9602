import { lazy, memo, Suspense, useState, useId } from 'react'

const MathContent = lazy(() => import('./MathContent.jsx'))

/* ---------- inline / block math usable inside JSX props ---------- */
export const M = memo(function M({ children, block }) {
  const fallback = block ? <div className="kblock">{children}</div> : <span>{children}</span>
  return <Suspense fallback={fallback}><MathContent block={block}>{children}</MathContent></Suspense>
})

/* ---------- callout boxes ---------- */
const KINDS = {
  def: { icon: '📐', label: '定义 Definition' },
  thm: { icon: '🧩', label: '定理 Theorem' },
  intuition: { icon: '💡', label: '直觉 Intuition' },
  exam: { icon: '🎯', label: '考点 Exam focus' },
  warn: { icon: '⚠️', label: '易错 Pitfall' },
  example: { icon: '✏️', label: '例子 Example' },
  prof: { icon: '🎙️', label: '课堂原声 In class' },
  math: { icon: '🧮', label: '数学补课 Math refresher' },
  summary: { icon: '📌', label: '小结 Summary' },
}
function Callout({ kind, title, children }) {
  const k = KINDS[kind]
  return (
    <div className={`callout callout-${kind}`}>
      <div className="callout-head"><span className="callout-icon">{k.icon}</span><span className="callout-label">{k.label}</span>{title && <span className="callout-title">· {title}</span>}</div>
      <div className="callout-body">{children}</div>
    </div>
  )
}
export const Def = (p) => <Callout kind="def" {...p} />
export const Thm = (p) => <Callout kind="thm" {...p} />
export const Intuition = (p) => <Callout kind="intuition" {...p} />
export const Exam = (p) => <Callout kind="exam" {...p} />
export const Warn = (p) => <Callout kind="warn" {...p} />
export const Example = (p) => <Callout kind="example" {...p} />
export const Prof = (p) => <Callout kind="prof" {...p} />
export const MathNote = (p) => <Callout kind="math" {...p} />
export const Summary = (p) => <Callout kind="summary" {...p} />

/* ---------- slide figure ---------- */
export function Figure({ src, caption, width, source }) {
  const [zoom, setZoom] = useState(false)
  const url = src.startsWith('http') ? src : `./figs/${src}`
  return (
    <figure className="fig">
      <img src={url} alt={caption} style={width ? { maxWidth: width } : undefined} onClick={() => setZoom(true)} loading="lazy" />
      {caption && <figcaption>{caption}{source !== false && <span className="fig-src"> — {source || '图源：课程讲义 (Boyd & Vandenberghe)'}</span>}</figcaption>}
      {zoom && <div className="lightbox" onClick={() => setZoom(false)}><img src={url} alt={caption} /></div>}
    </figure>
  )
}

/* ---------- English term chip ---------- */
export function T({ children, zh }) {
  return <span className="term" title={zh || ''}>{children}</span>
}

/* ---------- reveal ---------- */
export function Reveal({ label = '点击展开', children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`reveal ${open ? 'open' : ''}`}>
      <button className="reveal-btn" onClick={() => setOpen(!open)}>{open ? '▾ 收起' : '▸ ' + label}</button>
      {open && <div className="reveal-body">{children}</div>}
    </div>
  )
}

/* ---------- quiz ---------- */
export function Quiz({ q, options, answer, explain }) {
  const [pick, setPick] = useState(null)
  const id = useId()
  return (
    <div className="quiz">
      <div className="quiz-q">自测 · {typeof q === 'string' ? q : q}</div>
      <div className="quiz-opts">
        {options.map((o, i) => {
          const state = pick === null ? '' : i === answer ? 'right' : i === pick ? 'wrong' : 'dim'
          return (
            <button key={id + i} className={`quiz-opt ${state}`} onClick={() => setPick(i)}>
              <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>{o}
            </button>
          )
        })}
      </div>
      {pick !== null && (
        <div className={`quiz-explain ${pick === answer ? 'ok' : 'bad'}`}>
          {pick === answer ? '正确。' : '再想想。'} {explain}
        </div>
      )}
    </div>
  )
}

/* ---------- step-by-step derivation ---------- */
export function Steps({ steps, title }) {
  const [n, setN] = useState(1)
  return (
    <div className="steps">
      {title && <div className="steps-title">{title}</div>}
      <ol>
        {steps.slice(0, n).map((s, i) => (
          <li key={i} className="step">
            {s.text && <div className="step-text">{s.text}</div>}
            {s.math && <M block>{s.math}</M>}
          </li>
        ))}
      </ol>
      <div className="steps-ctrl">
        <button disabled={n <= 1} onClick={() => setN(n - 1)}>← 上一步</button>
        <span>{n} / {steps.length}</span>
        <button disabled={n >= steps.length} onClick={() => setN(n + 1)}>下一步 →</button>
        {n < steps.length && <button className="ghost" onClick={() => setN(steps.length)}>全部显示</button>}
      </div>
    </div>
  )
}

/* ---------- widget frame ---------- */
export function Widget({ title, hint, children }) {
  return (
    <div className="widget">
      <div className="widget-head"><span className="widget-badge">交互 Interactive</span>{title}</div>
      {hint && <div className="widget-hint">{hint}</div>}
      <div className="widget-body">{children}</div>
    </div>
  )
}

export function Slider({ label, value, set, min, max, step = 0.01, fmt }) {
  return (
    <label className="slider">
      <span className="slider-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(parseFloat(e.target.value))} />
      <span className="slider-val">{fmt ? fmt(value) : value.toFixed(2)}</span>
    </label>
  )
}

export function Tabs({ tabs, value, set }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.value} className={value === t.value ? 'on' : ''} onClick={() => set(t.value)}>{t.label}</button>
      ))}
    </div>
  )
}
