import { Suspense, useEffect, useState } from 'react'
import { Routes, Route, Link, NavLink, useParams, useLocation, Navigate } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { chapters } from './chapters/index.js'
import * as C from './components/index.jsx'
import Home from './Home.jsx'

const mdxComponents = C

function useDone() {
  const read = () => { try { return JSON.parse(localStorage.getItem('c9602-done') || '{}') } catch { return {} } }
  const [done, setDone] = useState(read)
  const toggle = (slug) => {
    const next = { ...done, [slug]: !done[slug] }
    setDone(next)
    try { localStorage.setItem('c9602-done', JSON.stringify(next)) } catch {}
  }
  return [done, toggle]
}

function Sidebar({ done, open, close }) {
  const parts = [...new Set(chapters.map((c) => c.part))]
  const n = chapters.filter((c) => done[c.slug]).length
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <Link to="/" className="brand" onClick={close}>
        <div className="brand-logo">∇</div>
        <div><div className="brand-title">COMP9602</div><div className="brand-sub">凸优化 · 交互学习</div></div>
      </Link>
      <div className="progress"><div className="progress-bar" style={{ width: `${(n / chapters.length) * 100}%` }} /><span>{n}/{chapters.length} 已完成</span></div>
      <nav>
        {parts.map((p) => (
          <div key={p} className="nav-part">
            <div className="nav-part-title">{p}</div>
            {chapters.filter((c) => c.part === p).map((c) => (
              <NavLink key={c.slug} to={`/c/${c.slug}`} className="nav-item" onClick={close}>
                <span className={`nav-num ${done[c.slug] ? 'done' : ''}`}>{done[c.slug] ? '✓' : c.num}</span>
                <span className="nav-text">{c.title}<small>{c.en}</small></span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

function Toc({ deps }) {
  const [items, setItems] = useState([])
  const [active, setActive] = useState(null)
  useEffect(() => {
    let obs, t, tries = 0
    const label = (h) => { const c = h.cloneNode(true); c.querySelectorAll('.katex-mathml').forEach((m) => m.remove()); return c.textContent }
    const scan = () => {
      const hs = [...document.querySelectorAll('.prose h2, .prose h3')]
      if (!hs.length && tries++ < 60) { t = setTimeout(scan, 250); return }
      hs.forEach((h, i) => { if (!h.id) h.id = 'sec-' + i })
      setItems(hs.map((h) => ({ id: h.id, text: label(h), lvl: h.tagName })))
      obs = new IntersectionObserver((es) => { es.forEach((e) => e.isIntersecting && setActive(e.target.id)) }, { rootMargin: '0px 0px -75% 0px' })
      hs.forEach((h) => obs.observe(h))
    }
    setItems([])
    t = setTimeout(scan, 200)
    return () => { clearTimeout(t); obs?.disconnect() }
  }, [deps])
  if (!items.length) return null
  return (
    <div className="toc">
      <div className="toc-title">本章目录</div>
      {items.map((it) => (
        <a key={it.id} href={'#'} onClick={(e) => { e.preventDefault(); document.getElementById(it.id)?.scrollIntoView({ behavior: 'smooth' }) }} className={`toc-item ${it.lvl === 'H3' ? 'sub' : ''} ${active === it.id ? 'on' : ''}`}>{it.text}</a>
      ))}
    </div>
  )
}

function ChapterPage({ done, toggle }) {
  const { slug } = useParams()
  const idx = chapters.findIndex((c) => c.slug === slug)
  useEffect(() => { window.scrollTo(0, 0) }, [slug])
  if (idx < 0) return <Navigate to="/" />
  const ch = chapters[idx]
  const prev = chapters[idx - 1], next = chapters[idx + 1]
  const Comp = ch.Component
  return (
    <div className="chapter-wrap">
      <article className="chapter">
        <header className="chapter-head">
          <div className="chapter-meta">第 {ch.num} 章 · 对应讲义 {ch.lecture}</div>
          <h1>{ch.title}</h1>
          <div className="chapter-en">{ch.en}</div>
        </header>
        <div className="prose">
          <Suspense fallback={<div className="loading">加载中…</div>}>
            <MDXProvider components={mdxComponents}><Comp /></MDXProvider>
          </Suspense>
        </div>
        <div className="chapter-foot">
          <button className={`done-btn ${done[slug] ? 'on' : ''}`} onClick={() => toggle(slug)}>{done[slug] ? '✓ 已学完本章' : '标记本章为已学完'}</button>
          <div className="pager">
            {prev ? <Link to={`/c/${prev.slug}`}>← {prev.title}</Link> : <span />}
            {next ? <Link to={`/c/${next.slug}`}>{next.title} →</Link> : <span />}
          </div>
        </div>
      </article>
      <Toc deps={slug} />
    </div>
  )
}

export default function App() {
  const [done, toggle] = useDone()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  return (
    <div className="layout">
      <button className="menu-btn" onClick={() => setOpen(!open)}>☰</button>
      <Sidebar done={done} open={open} close={() => setOpen(false)} />
      <main className="main" key={loc.pathname}>
        <Routes>
          <Route path="/" element={<Home done={done} />} />
          <Route path="/c/:slug" element={<ChapterPage done={done} toggle={toggle} />} />
        </Routes>
      </main>
    </div>
  )
}
