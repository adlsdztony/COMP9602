// 第 2 章 凸集 Convex Sets —— 交互组件
import { useState, useMemo } from 'react'
import { Mafs, Plot, Point, Line, Polygon, Ellipse, Circle, Vector, Text, Theme, useMovablePoint } from 'mafs'
import { Coordinates } from './coordinates.jsx'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'

const fx = (v, d = 2) => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(d)

/* ------------------------------------------------------------------ */
/* 1. 三种组合：凸组合 / 仿射组合 / 锥组合                              */
/* ------------------------------------------------------------------ */
export function Ch02Combos() {
  const [mode, setMode] = useState('convex')
  const a = useMovablePoint([-1.5, 1], { color: Theme.blue })
  const b = useMovablePoint([2, 0.5], { color: Theme.red })
  const [t, setT] = useState(0.3)
  const [t1, setT1] = useState(0.8)
  const [t2, setT2] = useState(0.6)
  let th1, th2
  if (mode === 'conic') { th1 = t1; th2 = t2 } else { th1 = t; th2 = 1 - t }
  const p = [th1 * a.x + th2 * b.x, th1 * a.y + th2 * b.y]
  const R = 12
  const inSeg = mode !== 'affine' || (t >= 0 && t <= 1)
  return (
    <Widget
      title="凸组合 vs 仿射组合 vs 锥组合"
      hint="切换三种组合方式，拖动黑/红两个点并调节系数。观察：凸组合只能走在线段上；仿射组合允许 θ 取任意实数，能走遍整条直线；锥组合系数只要求非负、不要求和为 1，能扫出从原点出发的整个“扇形”。"
    >
      <Tabs value={mode} set={(v) => { setMode(v); setT(0.3) }} tabs={[
        { value: 'convex', label: '凸组合 convex' },
        { value: 'affine', label: '仿射组合 affine' },
        { value: 'conic', label: '锥组合 conic' },
      ]} />
      <Mafs viewBox={{ x: [-4, 4], y: [-2.5, 2.5] }} height={320} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        {mode === 'conic' && (
          <Polygon points={[[0, 0], [a.x * R, a.y * R], [b.x * R, b.y * R]]} color={Theme.violet} fillOpacity={0.15} weight={0} />
        )}
        {mode === 'conic' && <Line.Segment point1={[0, 0]} point2={[a.x * R, a.y * R]} color={Theme.blue} style="dashed" />}
        {mode === 'conic' && <Line.Segment point1={[0, 0]} point2={[b.x * R, b.y * R]} color={Theme.red} style="dashed" />}
        {mode === 'affine' && <Line.ThroughPoints point1={a.point} point2={b.point} color={Theme.indigo} style="dashed" />}
        <Line.Segment point1={a.point} point2={b.point} color={Theme.indigo} weight={3} />
        {mode === 'conic' && <Point x={0} y={0} color={Theme.foreground} />}
        <Point x={p[0]} y={p[1]} color={inSeg ? Theme.green : Theme.orange} />
        <Text x={a.x} y={a.y} attach="n" size={14}>x₁</Text>
        <Text x={b.x} y={b.y} attach="n" size={14}>x₂</Text>
        <Text x={p[0]} y={p[1]} attach="s" size={13}>x</Text>
        {a.element}
        {b.element}
      </Mafs>
      <div className="wrow">
        {mode === 'convex' && <Slider label={<M>{'\\theta\\in[0,1]'}</M>} value={t} set={setT} min={0} max={1} />}
        {mode === 'affine' && <Slider label={<M>{'\\theta\\in\\mathbb{R}'}</M>} value={t} set={setT} min={-2} max={3} />}
        {mode === 'conic' && <>
          <Slider label={<M>{'\\theta_1\\ge0'}</M>} value={t1} set={setT1} min={0} max={3} />
          <Slider label={<M>{'\\theta_2\\ge0'}</M>} value={t2} set={setT2} min={0} max={3} />
        </>}
      </div>
      <div className="wstat">
        <span className="chip info">θ₁ = {fx(th1)}，θ₂ = {fx(th2)}，θ₁+θ₂ = {fx(th1 + th2)}</span>
        {mode === 'affine' && (inSeg
          ? <span className="chip good">θ∈[0,1]：点在线段上（也是凸组合）</span>
          : <span className="chip bad">θ∉[0,1]：点跑出线段，但仍在直线上 → 仿射集需要它，凸集不需要</span>)}
        {mode === 'conic' && <span className="chip good">x = θ₁x₁+θ₂x₂ 永远落在棕色扇形（凸锥）里</span>}
        {mode === 'convex' && <span className="chip good">x 永远在线段 [x₁,x₂] 上</span>}
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 2. 凸集判定：拖动多边形顶点，自动寻找反例线段                          */
/* ------------------------------------------------------------------ */
function inPoly(pt, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
function distSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const L = dx * dx + dy * dy || 1e-12
  let s = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L
  s = Math.max(0, Math.min(1, s))
  return Math.hypot(p[0] - a[0] - s * dx, p[1] - a[1] - s * dy)
}
function outsideStrict(p, poly) {
  if (inPoly(p, poly)) return false
  for (let i = 0; i < poly.length; i++) if (distSeg(p, poly[i], poly[(i + 1) % poly.length]) < 0.02) return false
  return true
}
function findCounter(poly) {
  // 候选点：顶点 + 每条边上的若干点（都属于集合）
  const cand = []
  poly.forEach((v, i) => {
    const w = poly[(i + 1) % poly.length]
    for (const s of [0, 0.25, 0.5, 0.75]) cand.push([v[0] + s * (w[0] - v[0]), v[1] + s * (w[1] - v[1])])
  })
  let best = null
  for (let i = 0; i < cand.length; i++)
    for (let j = i + 1; j < cand.length; j++) {
      for (let k = 1; k < 20; k++) {
        const t = k / 20
        const q = [cand[i][0] + t * (cand[j][0] - cand[i][0]), cand[i][1] + t * (cand[j][1] - cand[i][1])]
        if (outsideStrict(q, poly)) {
          const len = Math.hypot(cand[j][0] - cand[i][0], cand[j][1] - cand[i][1])
          if (!best || len < best.len) best = { p: cand[i], q: cand[j], bad: q, len }
          break
        }
      }
    }
  return best
}
export function Ch02ConvexTest() {
  const pts = [
    useMovablePoint([-2.5, -1.5], { color: Theme.blue }),
    useMovablePoint([2.5, -1.5], { color: Theme.blue }),
    useMovablePoint([2.8, 1.2], { color: Theme.blue }),
    useMovablePoint([0, 0.2], { color: Theme.blue }),
    useMovablePoint([-2.6, 1.6], { color: Theme.blue }),
  ]
  const poly = pts.map((p) => p.point)
  const counter = useMemo(() => findCounter(poly), [JSON.stringify(poly)])
  const convex = !counter
  return (
    <Widget
      title="凸集判定器：找一条“跑出去”的线段"
      hint="拖动五个顶点改变多边形形状。如果集合不凸，程序会自动找到集合里的两点，它们之间的线段有一部分（橙色点）跑到集合外面——这就是“不凸”的反例。试试把中间那个凹进去的顶点往外拖，直到多边形变凸。"
    >
      <Mafs viewBox={{ x: [-4, 4], y: [-2.5, 2.5] }} height={320} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        <Polygon points={poly} color={convex ? Theme.green : Theme.red} fillOpacity={0.15} />
        {counter && <>
          <Line.Segment point1={counter.p} point2={counter.q} color={Theme.orange} weight={3} />
          <Point x={counter.p[0]} y={counter.p[1]} color={Theme.indigo} />
          <Point x={counter.q[0]} y={counter.q[1]} color={Theme.indigo} />
          <Point x={counter.bad[0]} y={counter.bad[1]} color={Theme.orange} />
          <Text x={counter.bad[0]} y={counter.bad[1]} attach="n" size={13}>在集合外！</Text>
        </>}
        {pts.map((p, i) => <g key={i}>{p.element}</g>)}
      </Mafs>
      <div className="wstat">
        {convex
          ? <span className="chip good">凸集：任取两点，线段都留在集合内</span>
          : <span className="chip bad">不是凸集：灰色两点都在集合里，但它们连线上的橙色点不在</span>}
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 3. 凸包：随机凸组合铺满凸包                                          */
/* ------------------------------------------------------------------ */
function hull(points) {
  const P = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (P.length < 3) return P
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower = [], upper = []
  for (const p of P) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p) }
  for (const p of [...P].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p) }
  return lower.slice(0, -1).concat(upper.slice(0, -1))
}
export function Ch02Hull() {
  const pts = [
    useMovablePoint([-2.5, -1], { color: Theme.blue }),
    useMovablePoint([-0.5, 1.8], { color: Theme.blue }),
    useMovablePoint([2.4, 1.2], { color: Theme.blue }),
    useMovablePoint([2, -1.6], { color: Theme.blue }),
    useMovablePoint([0.2, -0.3], { color: Theme.blue }),
    useMovablePoint([-1, 0.4], { color: Theme.blue }),
  ]
  const [seed, setSeed] = useState(0)
  const [showHull, setShowHull] = useState(true)
  const P = pts.map((p) => p.point)
  const H = hull(P)
  const samples = useMemo(() => {
    if (!seed) return []
    const out = []
    for (let s = 0; s < 160; s++) {
      // 随机非负权重并归一化 → 随机凸组合
      const w = P.map(() => -Math.log(Math.random() + 1e-12))
      const sum = w.reduce((a, b) => a + b, 0)
      out.push(P.reduce((acc, p, i) => [acc[0] + (w[i] / sum) * p[0], acc[1] + (w[i] / sum) * p[1]], [0, 0]))
    }
    return out
  }, [seed, JSON.stringify(P)])
  return (
    <Widget
      title="凸包 conv S：所有凸组合组成的集合"
      hint="S 是 6 个黑点。点“撒一把随机凸组合”：每个绿色小点都是 θ₁x₁+…+θ₆x₆（θᵢ≥0、和为 1），它们全部落在灰色凸包里、并把它铺满。把一个黑点拖进凸包内部，凸包形状不变——它不是“顶点”。"
    >
      <Mafs viewBox={{ x: [-4, 4], y: [-2.5, 2.5] }} height={320} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        {showHull && <Polygon points={H} color={Theme.indigo} fillOpacity={0.12} />}
        {samples.map((q, i) => <Point key={i} x={q[0]} y={q[1]} color={Theme.green} opacity={0.7} svgCircleProps={{ r: 3 }} />)}
        {pts.map((p, i) => <g key={i}>{p.element}</g>)}
      </Mafs>
      <div className="wrow">
        <button className="wbtn primary" onClick={() => setSeed(seed + 1)}>撒一把随机凸组合</button>
        <button className="wbtn" onClick={() => setSeed(0)}>清除</button>
        <label><input type="checkbox" checked={showHull} onChange={(e) => setShowHull(e.target.checked)} /> 显示凸包</label>
      </div>
      <div className="wstat">
        <span className="chip info">S 有 {P.length} 个点，凸包是 {H.length} 边形</span>
        <span className="chip good">凸包 = 包含 S 的最小凸集</span>
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 4. 椭球 {x | (x-xc)^T P^{-1} (x-xc) <= 1}                             */
/* ------------------------------------------------------------------ */
export function Ch02Ellipsoid() {
  const c = useMovablePoint([0, 0], { color: Theme.violet })
  const q = useMovablePoint([1.8, 1.2], { color: Theme.orange })
  const [l1, setL1] = useState(4)
  const [l2, setL2] = useState(1)
  const [ang, setAng] = useState(0.5)
  const [psi, setPsi] = useState(0.8)
  const co = Math.cos(ang), si = Math.sin(ang)
  // P = R diag(l1,l2) R^T
  const P = [[l1 * co * co + l2 * si * si, (l1 - l2) * co * si], [(l1 - l2) * co * si, l1 * si * si + l2 * co * co]]
  const det = P[0][0] * P[1][1] - P[0][1] * P[1][0]
  const Pi = [[P[1][1] / det, -P[0][1] / det], [-P[1][0] / det, P[0][0] / det]]
  const s1 = Math.sqrt(l1), s2 = Math.sqrt(l2)
  const A = [[s1 * co * co + s2 * si * si, (s1 - s2) * co * si], [(s1 - s2) * co * si, s1 * si * si + s2 * co * co]]
  const d = [q.x - c.x, q.y - c.y]
  const val = d[0] * (Pi[0][0] * d[0] + Pi[0][1] * d[1]) + d[1] * (Pi[1][0] * d[0] + Pi[1][1] * d[1])
  const u = [Math.cos(psi), Math.sin(psi)]
  const Au = [c.x + A[0][0] * u[0] + A[0][1] * u[1], c.y + A[1][0] * u[0] + A[1][1] * u[1]]
  const mat = (X) => `\\begin{bmatrix}${fx(X[0][0])}&${fx(X[0][1])}\\\\${fx(X[1][0])}&${fx(X[1][1])}\\end{bmatrix}`
  return (
    <Widget
      title="椭球 Ellipsoid 调参台"
      hint="λ₁、λ₂ 是 P 的特征值，半轴长 = √λᵢ；旋转角决定特征向量方向。拖动棕色中心 x_c 和橙色测试点，看二次型的值是否 ≤1。再拖动 u 的角度：单位圆上的 u 经过 x_c+Au（A=P^{1/2}）恰好走在椭圆边界上。试试把 λ₁=λ₂，椭球就变成了球（P=r²I）。"
    >
      <Mafs viewBox={{ x: [-4, 4], y: [-3, 3] }} height={340} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        <Circle center={[0, 0]} radius={1} color={Theme.foreground} fillOpacity={0} strokeStyle="dashed" weight={1} />
        <Ellipse center={c.point} radius={[s1, s2]} angle={ang} color={Theme.blue} fillOpacity={0.15} />
        <Vector tail={c.point} tip={[c.x + s1 * co, c.y + s1 * si]} color={Theme.red} />
        <Vector tail={c.point} tip={[c.x - s2 * si, c.y + s2 * co]} color={Theme.green} />
        <Vector tail={[0, 0]} tip={u} color={Theme.foreground} weight={1.5} />
        <Line.Segment point1={c.point} point2={Au} color={Theme.indigo} style="dashed" />
        <Point x={Au[0]} y={Au[1]} color={Theme.indigo} />
        <Text x={Au[0]} y={Au[1]} attach="ne" size={13}>x_c + Au</Text>
        <Text x={u[0]} y={u[1]} attach="sw" size={12}>u</Text>
        {c.element}
        {q.element}
      </Mafs>
      <div className="wrow">
        <Slider label={<M>{'\\lambda_1'}</M>} value={l1} set={setL1} min={0.1} max={6} />
        <Slider label={<M>{'\\lambda_2'}</M>} value={l2} set={setL2} min={0.1} max={6} />
        <Slider label="旋转角" value={ang} set={setAng} min={0} max={Math.PI} />
        <Slider label={<M>{'u\\text{ 的角度}'}</M>} value={psi} set={setPsi} min={0} max={2 * Math.PI} />
      </div>
      <div className="wrow" style={{ fontSize: 14 }}>
        <span><M>{`P=${mat(P)}`}</M></span>
        <span><M>{`P^{-1}=${mat(Pi)}`}</M></span>
        <span><M>{`A=P^{1/2}=${mat(A)}`}</M></span>
      </div>
      <div className="wstat">
        <span className="chip info">半轴：√λ₁ = {fx(s1)}（红），√λ₂ = {fx(s2)}（绿）</span>
        <span className={`chip ${val <= 1 ? 'good' : 'bad'}`}>测试点：(x−x_c)ᵀP⁻¹(x−x_c) = {fx(val)} {val <= 1 ? '≤ 1 → 在椭球内' : '> 1 → 在椭球外'}</span>
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 5. 范数球：调 p                                                     */
/* ------------------------------------------------------------------ */
const pnorm = (x, y, p) => (p >= 50 ? Math.max(Math.abs(x), Math.abs(y)) : Math.pow(Math.pow(Math.abs(x), p) + Math.pow(Math.abs(y), p), 1 / p))
export function Ch02NormBall() {
  const [p, setP] = useState(1.5)
  const pe = p >= 9.9 ? 100 : p
  const curve = (pp) => (t) => { const d = [Math.cos(t), Math.sin(t)]; const n = pnorm(d[0], d[1], pp); return [d[0] / n, d[1] / n] }
  const ok = pe >= 1
  return (
    <Widget
      title="单位范数球 {x | ‖x‖ₚ ≤ 1}"
      hint="拖动 p。p=1 是菱形（ℓ₁），p=2 是圆（ℓ₂），p→∞ 趋向正方形（ℓ∞）。p 越大球越“胖”。再把 p 拖到 1 以下：形状向内凹，不再是凸集——因为此时 ‖·‖ₚ 不满足三角不等式，已经不是范数了。"
    >
      <Mafs viewBox={{ x: [-1.8, 1.8], y: [-1.3, 1.3] }} height={320}>
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.Parametric t={[0, 2 * Math.PI]} xy={curve(1)} color={Theme.pink} style="dashed" weight={1.5} />
        <Plot.Parametric t={[0, 2 * Math.PI]} xy={curve(2)} color={Theme.red} style="dashed" weight={1.5} />
        <Plot.Parametric t={[0, 2 * Math.PI]} xy={curve(100)} color={Theme.blue} style="dashed" weight={1.5} />
        <Plot.Parametric t={[0, 2 * Math.PI]} xy={curve(pe)} color={ok ? Theme.green : Theme.orange} weight={3.5} />
        {!ok && <Line.Segment point1={[1, 0]} point2={[0, 1]} color={Theme.orange} style="dashed" />}
        {!ok && <Point x={0.5} y={0.5} color={Theme.orange} />}
      </Mafs>
      <div className="wrow">
        <Slider label="p" value={p} set={setP} min={0.3} max={10} fmt={(v) => (v >= 9.9 ? '∞' : v.toFixed(2))} />
      </div>
      <div className="wstat">
        <span className="chip info">虚线：粉 ℓ₁ ⊆ 红 ℓ₂ ⊆ 黑 ℓ∞</span>
        {ok
          ? <span className="chip good">p ≥ 1：是范数，单位球是凸集</span>
          : <span className="chip bad">p &lt; 1：不是范数；(1,0) 和 (0,1) 在“球”里，中点 (0.5,0.5) 的值 = {fx(pnorm(0.5, 0.5, pe))} &gt; 1，不在球里 → 不凸</span>}
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 6. 无穷多个半空间的交逼近凸集 / 并集不保凸                              */
/* ------------------------------------------------------------------ */
export function Ch02Intersection() {
  const [n, setN] = useState(5)
  const [mode, setMode] = useState('inter')
  const A = 2.4, B = 1.4
  const verts = []
  const R = 1 / Math.cos(Math.PI / n)
  for (let k = 0; k < n; k++) {
    const t = (2 * Math.PI * (k + 0.5)) / n
    verts.push([A * R * Math.cos(t), B * R * Math.sin(t)])
  }
  const tangents = []
  for (let k = 0; k < n; k++) {
    const t = (2 * Math.PI * k) / n
    const p0 = [A * Math.cos(t), B * Math.sin(t)]
    const dir = [-A * Math.sin(t), B * Math.cos(t)]
    tangents.push([p0, [p0[0] + dir[0], p0[1] + dir[1]]])
  }
  return (
    <Widget
      title="交集保凸 · 并集不保凸"
      hint="“交集”模式：n 个半空间 aₖᵀx ≤ bₖ（每条切线的内侧）的交是一个凸多边形；把 n 调大，交集越来越贴近椭圆——凸集可以看成无穷多个半空间的交。切到“并集”模式：椭圆 ∪ 一条直线，取直线上远处一点和椭圆里一点，连线会跑出并集。"
    >
      <Tabs value={mode} set={setMode} tabs={[{ value: 'inter', label: '交集 ∩' }, { value: 'union', label: '并集 ∪' }]} />
      <Mafs viewBox={{ x: [-4, 4], y: [-2.5, 2.5] }} height={320} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        {mode === 'inter' ? <>
          <Polygon points={verts} color={Theme.green} fillOpacity={0.15} />
          {tangents.map((l, i) => <Line.ThroughPoints key={i} point1={l[0]} point2={l[1]} color={Theme.indigo} weight={1} opacity={0.5} />)}
          <Ellipse center={[0, 0]} radius={[A, B]} color={Theme.blue} fillOpacity={0} />
        </> : <>
          <Ellipse center={[0, 0]} radius={[2, 1.2]} color={Theme.blue} fillOpacity={0.2} />
          <Line.ThroughPoints point1={[-3, 1.5]} point2={[3, -0.9]} color={Theme.blue} weight={3} />
          <Line.Segment point1={[-3.5, 1.7]} point2={[0.5, -0.9]} color={Theme.orange} style="dashed" weight={2.5} />
          <Point x={-3.5} y={1.7} color={Theme.indigo} />
          <Point x={0.5} y={-0.9} color={Theme.indigo} />
        </>}
      </Mafs>
      {mode === 'inter' && <div className="wrow"><Slider label="半空间个数 n" value={n} set={setN} min={3} max={60} step={1} fmt={(v) => String(v)} /></div>}
      <div className="wstat">
        {mode === 'inter'
          ? <span className="chip good">{n} 个半空间的交 = 凸 {n} 边形（多面体）；n→∞ 时就是椭圆本身</span>
          : <span className="chip bad">灰色两点都在并集里，但虚线段中间一段既不在椭圆里也不在直线上 → 并集不凸</span>}
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 7. 2×2 对称矩阵的广义不等式 X ⪯ Y                                    */
/* ------------------------------------------------------------------ */
const eig2 = (a, b, c) => { const m = (a + c) / 2, r = Math.hypot((a - c) / 2, b); return [m - r, m + r] }
export function Ch02MatrixOrder() {
  const [X, setX] = useState([1, 0, 0])
  const [Y, setY] = useState([0, 0, 1])
  const D = [Y[0] - X[0], Y[1] - X[1], Y[2] - X[2]]
  const [e1, e2] = eig2(...D)
  const q = (t) => D[0] * Math.cos(t) ** 2 + 2 * D[1] * Math.cos(t) * Math.sin(t) + D[2] * Math.sin(t) ** 2
  const tol = 1e-9
  const XleY = e1 >= -tol, YleX = e2 <= tol
  const setx = (i) => (v) => setX(X.map((o, j) => (j === i ? v : o)))
  const sety = (i) => (v) => setY(Y.map((o, j) => (j === i ? v : o)))
  const presets = [
    { label: 'diag(1,0) vs diag(0,1)', X: [1, 0, 0], Y: [0, 0, 1] },
    { label: 'I vs 2I', X: [1, 0, 1], Y: [2, 0, 2] },
    { label: '相等', X: [1, 0.5, 2], Y: [1, 0.5, 2] },
  ]
  const mat = (m) => `\\begin{bmatrix}${fx(m[0])}&${fx(m[1])}\\\\${fx(m[1])}&${fx(m[2])}\\end{bmatrix}`
  return (
    <Widget
      title="矩阵不等式 X ⪯ Y ⇔ Y − X 半正定"
      hint="X = [[a,b],[b,c]]，Y 同理。下方曲线画的是 zᵀ(Y−X)z，z=(cos t, sin t) 走遍所有方向：曲线处处 ≥0 ⇔ Y−X ⪰ 0 ⇔ X ⪯ Y。试试预设“diag(1,0) vs diag(0,1)”：曲线有正有负——两个矩阵谁也不比谁大，这就是“不是全序”。"
    >
      <div className="wrow">
        {presets.map((p) => <button key={p.label} className="wbtn" onClick={() => { setX(p.X); setY(p.Y) }}>{p.label}</button>)}
      </div>
      <div className="wrow">
        <Slider label="X: a" value={X[0]} set={setx(0)} min={-2} max={3} />
        <Slider label="X: b" value={X[1]} set={setx(1)} min={-2} max={2} />
        <Slider label="X: c" value={X[2]} set={setx(2)} min={-2} max={3} />
      </div>
      <div className="wrow">
        <Slider label="Y: a" value={Y[0]} set={sety(0)} min={-2} max={3} />
        <Slider label="Y: b" value={Y[1]} set={sety(1)} min={-2} max={2} />
        <Slider label="Y: c" value={Y[2]} set={sety(2)} min={-2} max={3} />
      </div>
      <div className="wrow" style={{ fontSize: 14 }}>
        <span><M>{`X=${mat(X)}`}</M></span><span><M>{`Y=${mat(Y)}`}</M></span><span><M>{`Y-X=${mat(D)}`}</M></span>
      </div>
      <Mafs viewBox={{ x: [0, Math.PI], y: [-3, 3] }} height={200} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} xAxis={{ labels: (v) => (v === 0 ? '0' : '') }} />
        <Plot.Inequality y={{ '<=': q, '>=': () => 0 }} color={Theme.green} />
        <Plot.Inequality y={{ '>=': q, '<=': () => 0 }} color={Theme.red} />
        <Plot.OfX y={q} color={Theme.indigo} />
        <Text x={2.9} y={2.6} size={13}>zᵀ(Y−X)z</Text>
      </Mafs>
      <div className="wstat">
        <span className="chip info">Y−X 的特征值：{fx(e1)}, {fx(e2)}</span>
        {XleY && YleX && <span className="chip good">X = Y（两个方向都成立）</span>}
        {XleY && !YleX && <span className="chip good">X ⪯ Y（Y−X 半正定）</span>}
        {!XleY && YleX && <span className="chip good">Y ⪯ X（X−Y 半正定）</span>}
        {!XleY && !YleX && <span className="chip bad">不可比较：Y−X 与 X−Y 都不是半正定</span>}
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 8. 分离超平面 + 支撑超平面                                           */
/* ------------------------------------------------------------------ */
export function Ch02Separating() {
  const c = useMovablePoint([1.4, -0.6], { color: Theme.blue })
  const d = useMovablePoint([-1.6, 0.9], { color: Theme.red })
  const [rc, setRc] = useState(1)
  const [rd, setRd] = useState(0.9)
  const [phi, setPhi] = useState(2.2)
  const dx = d.x - c.x, dy = d.y - c.y
  const dist = Math.hypot(dx, dy) || 1e-9
  const a = [dx / dist, dy / dist]
  const gap = dist - rc - rd
  const sep = gap > 0
  const m = [c.x + a[0] * (rc + gap / 2), c.y + a[1] * (rc + gap / 2)]
  const b = a[0] * m[0] + a[1] * m[1]
  const dir = [-a[1], a[0]]
  // 支撑超平面：C 的边界点 x0
  const x0 = [c.x + rc * Math.cos(phi), c.y + rc * Math.sin(phi)]
  const n0 = [Math.cos(phi), Math.sin(phi)]
  return (
    <Widget
      title="分离超平面 & 支撑超平面"
      hint="拖动两个圆盘（凸集 C 黑、D 红）的圆心。只要两者不相交，就能画出一条直线 aᵀx = b 把它们分在两侧；让它们重叠，分离超平面就不存在。滑动“x₀ 位置”：在凸集 C 边界上任意一点都有一条支撑超平面（橙色），整个 C 都在它的一侧。"
    >
      <Mafs viewBox={{ x: [-4, 4], y: [-2.5, 2.5] }} height={320} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        <Circle center={c.point} radius={rc} color={Theme.blue} fillOpacity={0.2} />
        <Circle center={d.point} radius={rd} color={Theme.red} fillOpacity={0.2} />
        <Text x={c.x} y={c.y} attach="s" size={14}>C</Text>
        <Text x={d.x} y={d.y} attach="s" size={14}>D</Text>
        {sep && <>
          <Line.ThroughPoints point1={m} point2={[m[0] + dir[0], m[1] + dir[1]]} color={Theme.green} weight={3} />
          <Vector tail={m} tip={[m[0] + a[0] * 0.8, m[1] + a[1] * 0.8]} color={Theme.green} />
          <Text x={m[0] + a[0] * 0.8} y={m[1] + a[1] * 0.8} attach="e" size={13}>a</Text>
        </>}
        <Line.ThroughPoints point1={x0} point2={[x0[0] - n0[1], x0[1] + n0[0]]} color={Theme.orange} style="dashed" />
        <Vector tail={x0} tip={[x0[0] + n0[0] * 0.6, x0[1] + n0[1] * 0.6]} color={Theme.orange} />
        <Point x={x0[0]} y={x0[1]} color={Theme.orange} />
        <Text x={x0[0]} y={x0[1]} attach="sw" size={12}>x₀</Text>
        {c.element}
        {d.element}
      </Mafs>
      <div className="wrow">
        <Slider label="C 半径" value={rc} set={setRc} min={0.3} max={2} />
        <Slider label="D 半径" value={rd} set={setRd} min={0.3} max={2} />
        <Slider label="x₀ 位置" value={phi} set={setPhi} min={0} max={2 * Math.PI} />
      </div>
      <div className="wstat">
        {sep
          ? <span className="chip good">不相交（间隙 {fx(gap)}）→ 分离超平面 a = ({fx(a[0])}, {fx(a[1])})，b = {fx(b)}：C 中 aᵀx ≤ b，D 中 aᵀx ≥ b</span>
          : <span className="chip bad">C 与 D 相交 → 不存在分离超平面</span>}
        <span className="chip info">支撑超平面：aᵀx = aᵀx₀，C 中所有点满足 aᵀx ≤ aᵀx₀</span>
      </div>
    </Widget>
  )
}
