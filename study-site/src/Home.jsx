import { Link } from 'react-router-dom'
import { chapters } from './chapters/index.js'

const MAP = [
  { k: '基础', d: '凸集与凸函数 —— 一切的地基：什么形状、什么函数是“好”的。' },
  { k: '建模', d: '把实际问题写成标准形式，认识 LP / QP / SOCP / GP / SDP 这一家子。' },
  { k: '对偶', d: '拉格朗日对偶、强弱对偶、KKT —— 本课的理论核心，也是考试重点。' },
  { k: '算法', d: '梯度下降、牛顿法、内点法、次梯度法、椭球法 —— 怎么真的把最优解算出来。' },
]

export default function Home({ done }) {
  const first = chapters.find((c) => !done[c.slug]) || chapters[0]
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-eyebrow">COMP9602 Optimization · HKU · Fall 2026</div>
        <h1>把凸优化<br />一次学明白</h1>
        <p>按讲义 L1–L15 与 18 节课堂录音整理。每个知识点配讲义原图、可拖动的交互图和自测题。默认你数学基础薄弱：遇到需要的数学，会先给你补。</p>
        <div className="hero-cta">
          <Link className="btn primary" to={`/c/${first.slug}`}>{Object.keys(done).some((k) => done[k]) ? '继续学习：' : '从这里开始：'}{first.title} →</Link>
          <Link className="btn" to="/c/cheatsheet">速查表</Link>
        </div>
      </section>

      <section className="roadmap">
        <h2>学习路线</h2>
        <div className="road">
          {MAP.map((m, i) => (
            <div className="road-step" key={m.k}>
              <div className="road-dot">{i + 1}</div>
              <div><b>{m.k}</b><p>{m.d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid">
        {chapters.map((c) => (
          <Link key={c.slug} to={`/c/${c.slug}`} className={`card ${done[c.slug] ? 'done' : ''}`}>
            <div className="card-top"><span className="card-num">{c.num}</span><span className="card-part">{c.part} · {c.lecture}</span></div>
            <div className="card-title">{c.title}</div>
            <div className="card-en">{c.en}</div>
            {done[c.slug] && <div className="card-done">✓ 已完成</div>}
          </Link>
        ))}
      </section>
      <section className="legend">
        <h2>页面里的标记</h2>
        <div className="legend-row">
          <span className="callout-mini def">定义</span><span className="callout-mini thm">定理</span><span className="callout-mini intuition">直觉</span>
          <span className="callout-mini exam">考点</span><span className="callout-mini warn">易错</span><span className="callout-mini prof">课堂原声</span><span className="callout-mini math">数学补课</span>
        </div>
        <p className="muted">图片点击可放大。带虚下划线的<span className="term">English term</span>是专业术语原文，鼠标悬停可看中文。</p>
      </section>
    </div>
  )
}
