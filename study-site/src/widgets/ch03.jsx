// 第 3 章 凸函数 Convex Functions —— 交互组件
import { useState, useMemo } from 'react'
import { Mafs, Coordinates, Plot, Point, Line, Text, Theme, useMovablePoint } from 'mafs'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'

const fx = (v, d = 2) => (!isFinite(v) ? (v > 0 ? '+∞' : '−∞') : (Math.abs(v) < 1e-9 ? 0 : v).toFixed(d))
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

/* 一维函数库：f, f', f'', 定义域 [lo, hi]（显示用），视窗 */
const FN = {
  sq: { label: 'x²', tex: 'x^2', f: (x) => x * x, d1: (x) => 2 * x, d2: () => 2, lo: -3, hi: 3, view: { x: [-3, 3], y: [-1, 6] }, convex: true },
  abs: { label: '|x|', tex: '|x|', f: Math.abs, d1: (x) => Math.sign(x), d2: () => 0, lo: -3, hi: 3, view: { x: [-3, 3], y: [-1, 3.5] }, convex: true },
  exp: { label: 'eˣ', tex: 'e^x', f: Math.exp, d1: Math.exp, d2: Math.exp, lo: -3, hi: 1.8, view: { x: [-3, 2], y: [-1, 6] }, convex: true },
  nlog: { label: '−log x', tex: '-\\log x', f: (x) => -Math.log(x), d1: (x) => -1 / x, d2: (x) => 1 / (x * x), lo: 0.05, hi: 5, view: { x: [-0.5, 5], y: [-2, 3.5] }, convex: true },
  x4: { label: 'x⁴', tex: 'x^4', f: (x) => x ** 4, d1: (x) => 4 * x ** 3, d2: (x) => 12 * x * x, lo: -1.6, hi: 1.6, view: { x: [-2, 2], y: [-0.5, 5] }, convex: true },
  negent: { label: 'x log x', tex: 'x\\log x', f: (x) => x * Math.log(x), d1: (x) => Math.log(x) + 1, d2: (x) => 1 / x, lo: 0.01, hi: 3, view: { x: [-0.3, 3], y: [-1, 3.5] }, convex: true },
  sqrtabs: { label: '√|x|', tex: '\\sqrt{|x|}', f: (x) => Math.sqrt(Math.abs(x)), d1: (x) => (x === 0 ? 0 : Math.sign(x) / (2 * Math.sqrt(Math.abs(x)))), d2: (x) => -1 / (4 * Math.pow(Math.abs(x) + 1e-9, 1.5)), lo: -3, hi: 3, view: { x: [-3, 3], y: [-0.5, 2.5] }, convex: false },
  cubic: { label: 'x³ − 3x', tex: 'x^3-3x', f: (x) => x ** 3 - 3 * x, d1: (x) => 3 * x * x - 3, d2: (x) => 6 * x, lo: -2.2, hi: 2.2, view: { x: [-2.5, 2.5], y: [-4, 4] }, convex: false },
}
const pick = (keys) => keys.map((k) => ({ value: k, label: FN[k].label }))

/* ------------------------------------------------------------------ */
/* 1. Jensen 不等式：弦在图像上方                                       */
/* ------------------------------------------------------------------ */
function JensenInner({ F }) {
  const proj = ([x]) => { const c = clamp(x, F.lo, F.hi); return [c, F.f(c)] }
  const a = useMovablePoint(proj([F.lo + 0.2 * (F.hi - F.lo)]), { color: Theme.red, constrain: proj })
  const b = useMovablePoint(proj([F.lo + 0.85 * (F.hi - F.lo)]), { color: Theme.red, constrain: proj })
  const [t, setT] = useState(0.4)
  const z = t * a.x + (1 - t) * b.x
  const chord = t * F.f(a.x) + (1 - t) * F.f(b.x)
  const curve = F.f(z)
  const ok = curve <= chord + 1e-9
  // 对当前两点扫描所有 θ
  let worst = 0
  for (let k = 1; k < 100; k++) {
    const s = k / 100
    worst = Math.max(worst, F.f(s * a.x + (1 - s) * b.x) - (s * F.f(a.x) + (1 - s) * F.f(b.x)))
  }
  return (
    <>
      <Mafs viewBox={F.view} height={320} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.OfX y={F.f} domain={[F.lo, F.hi]} color={Theme.blue} weight={3} />
        <Line.Segment point1={a.point} point2={b.point} color={worst > 1e-9 ? Theme.red : Theme.green} weight={2.5} />
        <Line.Segment point1={[z, curve]} point2={[z, chord]} color={Theme.orange} style="dashed" />
        <Point x={z} y={chord} color={Theme.green} />
        <Point x={z} y={curve} color={Theme.orange} />
        <Text x={z} y={chord} attach="n" size={12}>θf(x)+(1−θ)f(y)</Text>
        <Text x={z} y={curve} attach="s" size={12}>f(θx+(1−θ)y)</Text>
        {a.element}
        {b.element}
      </Mafs>
      <div className="wrow"><Slider label={<M>{'\\theta'}</M>} value={t} set={setT} min={0} max={1} /></div>
      <div className="wstat">
        <span className="chip info">弦上的点 = {fx(chord)}，曲线上的点 = {fx(curve)}</span>
        <span className={`chip ${ok ? 'good' : 'bad'}`}>{ok ? '这个 θ：曲线 ≤ 弦' : '这个 θ：曲线 > 弦，Jensen 不等式被违反'}</span>
        <span className={`chip ${worst > 1e-9 ? 'bad' : 'good'}`}>{worst > 1e-9 ? `这对点之间曲线最多高出弦 ${fx(worst)} → 不凸` : '这对点之间整段弦都在曲线上方（或重合）'}</span>
      </div>
    </>
  )
}
export function Ch03Jensen() {
  const [k, setK] = useState('sq')
  return (
    <Widget
      title="Jensen 不等式：弦永远在图像上方"
      hint="选一个函数，沿曲线拖动两个红点 (x, f(x)) 与 (y, f(y))，再滑动 θ。绿色点在弦上，橙色点在曲线上。凸函数：无论怎么拖，橙点都不会高过绿点。试试 √|x| 或 x³−3x：把两点放在凸起的两侧，弦会变红。"
    >
      <Tabs value={k} set={setK} tabs={pick(['sq', 'abs', 'exp', 'nlog', 'x4', 'sqrtabs', 'cubic'])} />
      <JensenInner key={k} F={FN[k]} />
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 2. 一阶条件（切线在下方）+ 二阶条件（f'' ≥ 0）                         */
/* ------------------------------------------------------------------ */
function TangentInner({ F }) {
  const proj = ([x]) => { const c = clamp(x, F.lo + 0.05, F.hi - 0.05); return [c, F.f(c)] }
  const p = useMovablePoint(proj([F.lo + 0.3 * (F.hi - F.lo)]), { color: Theme.red, constrain: proj })
  const x0 = p.x, f0 = F.f(x0), g0 = F.d1(x0)
  const tan = (y) => f0 + g0 * (y - x0)
  let minGap = Infinity, argGap = x0
  for (let k = 0; k <= 400; k++) {
    const y = F.lo + (k / 400) * (F.hi - F.lo)
    const gap = F.f(y) - tan(y)
    if (gap < minGap) { minGap = gap; argGap = y }
  }
  const under = minGap >= -1e-9
  const d2 = F.d2(x0)
  const d2view = { x: F.view.x, y: [-4, 8] }
  return (
    <>
      <Mafs viewBox={F.view} height={280} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.OfX y={F.f} domain={[F.lo, F.hi]} color={Theme.blue} weight={3} />
        <Plot.OfX y={tan} color={under ? Theme.green : Theme.red} style="dashed" />
        {!under && <>
          <Line.Segment point1={[argGap, F.f(argGap)]} point2={[argGap, tan(argGap)]} color={Theme.red} weight={2} />
          <Point x={argGap} y={F.f(argGap)} color={Theme.red} />
        </>}
        <Text x={x0} y={f0} attach="nw" size={12}>(x, f(x))</Text>
        {p.element}
      </Mafs>
      <div style={{ fontSize: 13, color: '#636366', margin: '8px 0 4px' }}>下图：二阶导 f''(x)。红色区域表示 f'' &lt; 0（向下弯）。</div>
      <Mafs viewBox={d2view} height={150} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.Inequality y={{ '<=': () => 0, '>=': (x) => (x >= F.lo && x <= F.hi ? Math.max(-4, F.d2(x)) : 0) }} color={Theme.red} />
        <Plot.OfX y={(x) => clamp(F.d2(x), -4, 8)} domain={[F.lo, F.hi]} color={Theme.orange} />
        <Point x={x0} y={clamp(d2, -4, 8)} color={Theme.red} />
      </Mafs>
      <div className="wstat">
        <span className="chip info">切线：f(x) + f'(x)(y−x)，斜率 f'(x) = {fx(g0)}</span>
        <span className={`chip ${under ? 'good' : 'bad'}`}>{under ? '整条曲线都在切线上方：切线是全局下估计' : `在 y = ${fx(argGap)} 处曲线低于切线 ${fx(-minGap)}`}</span>
        <span className={`chip ${d2 >= -1e-9 ? 'good' : 'bad'}`}>f''(x) = {fx(d2)}</span>
      </div>
    </>
  )
}
export function Ch03Tangent() {
  const [k, setK] = useState('exp')
  return (
    <Widget
      title="一阶条件：切线是全局下估计 · 二阶条件：f'' ≥ 0"
      hint="沿曲线拖动红点 x，虚线是在 x 处的一阶 Taylor 近似（切线）。凸函数的切线永远在图像下方（绿色）；不凸时会找到曲线跑到切线下面的位置（红色竖线）。对照下图的 f''：凸 ⇔ f'' 处处 ≥ 0。试试 x⁴：在 x=0 处 f''=0，但它仍然严格凸。"
    >
      <Tabs value={k} set={setK} tabs={pick(['sq', 'exp', 'nlog', 'x4', 'negent', 'cubic', 'sqrtabs'])} />
      <TangentInner key={k} F={FN[k]} />
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Epigraph 与 sublevel set（含拟凸）                                */
/* ------------------------------------------------------------------ */
const EF = {
  sq: { label: 'x²（凸）', f: (x) => x * x, view: { x: [-3, 3], y: [-0.6, 4] } },
  sqrtabs: { label: '√|x|（拟凸，不凸）', f: (x) => Math.sqrt(Math.abs(x)), view: { x: [-3, 3], y: [-0.6, 2.2] } },
  slide: { label: '讲义 p29 形状（拟凸）', f: (x) => 1.2 / (1 + Math.exp(4 * (x + 1))) + Math.max(0, x - 0.5) ** 2, view: { x: [-3, 3], y: [-0.6, 2.5] } },
  ceil: { label: 'ceil(x)（拟线性）', f: (x) => Math.ceil(x), view: { x: [-2.5, 2.5], y: [-2.6, 3.2] } },
  dwell: { label: 'x⁴/4 − x²（都不是）', f: (x) => x ** 4 / 4 - x * x, view: { x: [-2.6, 2.6], y: [-1.6, 2.5] } },
}
function intervals(f, lo, hi, alpha, n = 600) {
  const out = []
  let start = null
  for (let k = 0; k <= n; k++) {
    const x = lo + (k / n) * (hi - lo)
    const inside = f(x) <= alpha
    if (inside && start === null) start = x
    if ((!inside || k === n) && start !== null) { out.push([start, inside ? x : x - (hi - lo) / n]); start = null }
  }
  return out
}
function numConvex(f, lo, hi) {
  for (let i = 0; i <= 40; i++) for (let j = i + 2; j <= 40; j += 1) {
    const x = lo + (i / 40) * (hi - lo), y = lo + (j / 40) * (hi - lo)
    if (f((x + y) / 2) > (f(x) + f(y)) / 2 + 1e-9) return false
  }
  return true
}
export function Ch03EpiSublevel() {
  const [k, setK] = useState('sqrtabs')
  const [alpha, setAlpha] = useState(0.9)
  const F = EF[k]
  const [lo, hi] = F.view.x
  const ints = intervals(F.f, lo, hi, alpha)
  const convex = useMemo(() => numConvex(F.f, lo, hi), [k])
  const yb = F.view.y[0] + 0.25
  return (
    <Widget
      title="Epigraph（图像上方）与 sublevel set（低于 α 的部分）"
      hint="灰色阴影是 epi f = {(x,t) | f(x) ≤ t}；拖动 α，x 轴附近的绿色粗线是 sublevel set C_α = {x | f(x) ≤ α}。凸函数 ⇔ 阴影是凸集。拟凸函数：阴影不一定凸，但每个 C_α 都是一整段区间。试试“x⁴/4 − x²”：某些 α 下 C_α 断成两段 → 连拟凸都不是。"
    >
      <Tabs value={k} set={setK} tabs={Object.entries(EF).map(([v, o]) => ({ value: v, label: o.label }))} />
      <Mafs viewBox={F.view} height={320} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.Inequality y={{ '>=': F.f, '<=': () => F.view.y[1] + 5 }} color={Theme.indigo} />
        <Plot.OfX y={F.f} color={Theme.blue} weight={3} />
        <Plot.OfX y={() => alpha} color={Theme.orange} style="dashed" />
        <Text x={hi - 0.2} y={alpha} attach="n" size={13}>α</Text>
        {ints.map((iv, i) => <Line.Segment key={i} point1={[iv[0], yb]} point2={[iv[1], yb]} color={Theme.green} weight={6} />)}
        {ints.map((iv, i) => <Line.Segment key={'v' + i} point1={[iv[0], yb]} point2={[iv[0], Math.min(alpha, F.view.y[1])]} color={Theme.green} style="dashed" weight={1} />)}
      </Mafs>
      <div className="wrow"><Slider label={<M>{'\\alpha'}</M>} value={alpha} set={setAlpha} min={F.view.y[0] + 0.1} max={F.view.y[1] - 0.1} /></div>
      <div className="wstat">
        <span className={`chip ${ints.length <= 1 ? 'good' : 'bad'}`}>
          {ints.length === 0 ? 'C_α 为空集（空集也是凸集）' : ints.length === 1 ? `C_α = [${fx(ints[0][0])}, ${fx(ints[0][1])}]，是一个区间 → 凸集` : `C_α 断成 ${ints.length} 段 → 不是凸集`}
        </span>
        <span className={`chip ${convex ? 'good' : 'bad'}`}>{convex ? 'epi f 是凸集 → f 是凸函数' : 'epi f 不是凸集 → f 不是凸函数'}</span>
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 4. 逐点最大值保凸，逐点最小值不保凸                                    */
/* ------------------------------------------------------------------ */
export function Ch03PointwiseMax() {
  const p1 = useMovablePoint([-1.5, 1], { color: Theme.red })
  const p2 = useMovablePoint([0, -0.5], { color: Theme.orange })
  const p3 = useMovablePoint([1.5, 1.2], { color: Theme.green })
  const [s1, setS1] = useState(-1.2)
  const [s2, setS2] = useState(0.2)
  const [s3, setS3] = useState(1.5)
  const [show, setShow] = useState('max')
  const L = [[p1, s1], [p2, s2], [p3, s3]].map(([p, s]) => (x) => p.y + s * (x - p.x))
  const fmax = (x) => Math.max(...L.map((f) => f(x)))
  const fmin = (x) => Math.min(...L.map((f) => f(x)))
  const cols = [Theme.red, Theme.orange, Theme.green]
  return (
    <Widget
      title="逐点最大值 max{f₁, f₂, f₃}"
      hint="三条直线（仿射函数，都是凸的）。拖动各自的锚点、调斜率。粗线 max{f₁,f₂,f₃} 永远是“向上开口”的折线 → 凸（分段线性函数）。切换到 min：得到“向下开口”的折线 → 一般是凹的，不是凸的。"
    >
      <Tabs value={show} set={setShow} tabs={[{ value: 'max', label: '逐点最大 max' }, { value: 'min', label: '逐点最小 min' }]} />
      <Mafs viewBox={{ x: [-3, 3], y: [-2.5, 3.5] }} height={320} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        {show === 'max'
          ? <Plot.Inequality y={{ '>=': fmax, '<=': () => 10 }} color={Theme.indigo} />
          : <Plot.Inequality y={{ '>=': fmin, '<=': () => 10 }} color={Theme.indigo} />}
        {L.map((f, i) => <Plot.OfX key={i} y={f} color={cols[i]} style="dashed" weight={1.5} />)}
        <Plot.OfX y={show === 'max' ? fmax : fmin} color={Theme.blue} weight={4} />
        {p1.element}{p2.element}{p3.element}
      </Mafs>
      <div className="wrow">
        <Slider label="f₁ 斜率" value={s1} set={setS1} min={-3} max={3} />
        <Slider label="f₂ 斜率" value={s2} set={setS2} min={-3} max={3} />
        <Slider label="f₃ 斜率" value={s3} set={setS3} min={-3} max={3} />
      </div>
      <div className="wstat">
        {show === 'max'
          ? <span className="chip good">max 的 epigraph = 三个半平面的交 → 凸集 → max 是凸函数</span>
          : <span className="chip bad">min 的 epigraph = 三个半平面的并 → 一般不凸 → min 一般不是凸函数</span>}
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 5. 复合规则 f(x) = h(g(x))                                           */
/* ------------------------------------------------------------------ */
const HS = {
  exp: { label: 'h(u)=eᵘ', h: Math.exp, dom: () => true, cv: 'convex', inc: true, dec: false, note: 'dom h = ℝ，h̃ 非减' },
  sq: { label: 'h(u)=u²', h: (u) => u * u, dom: () => true, cv: 'convex', inc: false, dec: false, note: '在 ℝ 上不单调' },
  sqpos: { label: 'h(u)=u², u≥0', h: (u) => u * u, dom: (u) => u >= 0, cv: 'convex', inc: false, dec: false, note: 'h 在定义域上非减，但 h̃ 在 u<0 处为 +∞，h̃ 不是非减！' },
  nlog: { label: 'h(u)=−log u', h: (u) => -Math.log(u), dom: (u) => u > 0, cv: 'convex', inc: false, dec: true, note: 'h̃ 非增（u≤0 处 +∞，在左边，没问题）' },
  inv: { label: 'h(u)=1/u, u>0', h: (u) => 1 / u, dom: (u) => u > 0, cv: 'convex', inc: false, dec: true, note: 'h̃ 非增' },
  log: { label: 'h(u)=log u', h: Math.log, dom: (u) => u > 0, cv: 'concave', inc: true, dec: false, note: '凹函数，h̃（u≤0 处 −∞）非减' },
}
const GS = {
  sqm: { label: 'g(x)=x²−1', g: (x) => x * x - 1, cv: 'convex' },
  abs: { label: 'g(x)=|x|', g: Math.abs, cv: 'convex' },
  conc: { label: 'g(x)=2−x²', g: (x) => 2 - x * x, cv: 'concave' },
  lin: { label: 'g(x)=x/2+1', g: (x) => x / 2 + 1, cv: 'affine' },
}
export function Ch03Composition() {
  const [hk, setHk] = useState('exp')
  const [gk, setGk] = useState('sqm')
  const H = HS[hk], G = GS[gk]
  const gConvex = G.cv === 'convex' || G.cv === 'affine'
  const gConcave = G.cv === 'concave' || G.cv === 'affine'
  let rule = null
  if (H.cv === 'convex' && gConvex && H.inc) rule = ['convex', 'g 凸，h 凸，h̃ 非减 ⇒ f 凸']
  else if (H.cv === 'convex' && gConcave && H.dec) rule = ['convex', 'g 凹，h 凸，h̃ 非增 ⇒ f 凸']
  else if (H.cv === 'concave' && gConcave && H.inc) rule = ['concave', 'g 凹，h 凹，h̃ 非减 ⇒ f 凹']
  else if (H.cv === 'concave' && gConvex && H.dec) rule = ['concave', 'g 凸，h 凹，h̃ 非增 ⇒ f 凹']
  const f = (x) => { const u = G.g(x); return H.dom(u) ? H.h(u) : NaN }
  // 数值检查：定义域是否一个区间，以及凸/凹
  const xs = Array.from({ length: 301 }, (_, i) => -3 + (i / 300) * 6)
  const vals = xs.map(f)
  let pieces = 0
  vals.forEach((v, i) => { if (isFinite(v) && !(i > 0 && isFinite(vals[i - 1]))) pieces++ })
  let cvx = true, ccv = true
  for (let i = 1; i < 300; i++) {
    if (![vals[i - 1], vals[i], vals[i + 1]].every(isFinite)) continue
    const d = vals[i - 1] - 2 * vals[i] + vals[i + 1]
    if (d < -1e-7) cvx = false
    if (d > 1e-7) ccv = false
  }
  const numMsg = pieces === 0 ? '定义域为空' : pieces > 1 ? `dom f 断成 ${pieces} 段，不是凸集 → f 既不凸也不凹` : cvx ? '数值检查：f 是凸的' : ccv ? '数值检查：f 是凹的' : '数值检查：f 既不凸也不凹'
  const yv = vals.filter(isFinite)
  const ymax = Math.min(8, Math.max(2, ...yv)), ymin = Math.max(-4, Math.min(-0.5, ...yv))
  return (
    <Widget
      title="复合规则 f(x) = h(g(x))"
      hint="分别选外层 h 和内层 g。上面的芯片告诉你复合规则表的哪一行适用（不适用就“不能下结论”），下面用数值检查结果核对。重点试：h=eᵘ、g=x²−1（规则 1）；h=1/u、g=2−x²（规则 2）；h=u², u≥0 搭配 g=x²−1——h 自己是凸且在定义域上递增，但 h̃ 不是非减，结果定义域都断开了。"
    >
      <div className="wrow" style={{ marginTop: 0 }}><span style={{ fontSize: 13, color: '#636366' }}>外层 h：</span></div>
      <Tabs value={hk} set={setHk} tabs={Object.entries(HS).map(([v, o]) => ({ value: v, label: o.label }))} />
      <div className="wrow" style={{ marginTop: 0 }}><span style={{ fontSize: 13, color: '#636366' }}>内层 g：</span></div>
      <Tabs value={gk} set={setGk} tabs={Object.entries(GS).map(([v, o]) => ({ value: v, label: o.label }))} />
      <Mafs viewBox={{ x: [-3, 3], y: [ymin, ymax] }} height={280} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.OfX y={G.g} color={Theme.indigo} style="dashed" weight={1.5} />
        <Plot.OfX y={f} color={Theme.blue} weight={3.5} />
      </Mafs>
      <div className="wstat">
        <span className="chip info">h：{H.cv === 'convex' ? '凸' : '凹'}；{H.note}</span>
        <span className="chip info">g：{G.cv === 'convex' ? '凸' : G.cv === 'concave' ? '凹' : '仿射（既凸又凹）'}（虚线）</span>
        {rule ? <span className="chip good">规则适用：{rule[1]}</span> : <span className="chip bad">没有一行规则适用 → 规则不能下结论</span>}
        <span className={`chip ${pieces === 1 && (cvx || ccv) ? 'good' : 'bad'}`}>{numMsg}</span>
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 6. 共轭函数 f*(y) = sup_x (yx − f(x))                                */
/* ------------------------------------------------------------------ */
const CF = {
  half: { label: '½x²', f: (x) => x * x / 2, lo: -8, hi: 8, view: { x: [-3, 3], y: [-3, 4] }, exact: (y) => y * y / 2, arg: (y) => y, exTex: 'f^*(y)=\\tfrac12 y^2' },
  nlog: { label: '−log x', f: (x) => -Math.log(x), lo: 0.002, hi: 60, view: { x: [-0.5, 5], y: [-3, 4] }, exact: (y) => (y < 0 ? -1 - Math.log(-y) : Infinity), arg: (y) => -1 / y, exTex: 'f^*(y)=-1-\\log(-y)\\ (y<0)' },
  exp: { label: 'eˣ', f: Math.exp, lo: -40, hi: 4, view: { x: [-3, 2.5], y: [-3, 5] }, exact: (y) => (y > 0 ? y * Math.log(y) - y : y === 0 ? 0 : Infinity), arg: (y) => (y > 0 ? Math.log(y) : -40), exTex: 'f^*(y)=y\\log y-y\\ (y>0)' },
  aff: { label: '0.5x + 1', f: (x) => 0.5 * x + 1, lo: -40, hi: 40, view: { x: [-3, 3], y: [-3, 4] }, exact: (y) => (Math.abs(y - 0.5) < 1e-9 ? -1 : Infinity), arg: () => 1, exTex: 'f^*(y)=-b\\ (y=a),\\ +\\infty\\ \\text{otherwise}' },
  wave: { label: '非凸：(x²−1)²/2 − 0.5', f: (x) => (x * x - 1) ** 2 / 2 - 0.5, lo: -6, hi: 6, view: { x: [-2.5, 2.5], y: [-3, 4] }, exact: null, exTex: '' },
}
function supGap(F, y) {
  if (F.exact) return { val: F.exact(y), arg: F.arg(y) }
  let best = -Infinity, arg = F.lo
  const n = 4000
  for (let k = 0; k <= n; k++) {
    const x = F.lo + (k / n) * (F.hi - F.lo)
    const v = y * x - F.f(x)
    if (v > best) { best = v; arg = x }
  }
  const atEdge = arg === F.lo || arg === F.hi
  return { val: atEdge ? Infinity : best, arg }
}
export function Ch03Conjugate() {
  const [k, setK] = useState('half')
  const [y, setY] = useState(1)
  const F = CF[k]
  const s = supGap(F, y)
  const bounded = isFinite(s.val)
  const ys = useMemo(() => {
    const out = []
    for (let i = 0; i <= 120; i++) { const yy = -3 + (i / 120) * 6; out.push([yy, supGap(F, yy).val]) }
    return out
  }, [k])
  const fstar = (yy) => {
    let best = null
    for (const [a, v] of ys) if (best === null || Math.abs(a - yy) < Math.abs(best[0] - yy)) best = [a, v]
    return best && isFinite(best[1]) ? best[1] : NaN
  }
  return (
    <Widget
      title="共轭函数 f*(y) = sup_x ( yx − f(x) )"
      hint="滑动斜率 y：虚线是过原点的直线 yx。在每个 x 处计算“直线减曲线”的竖直差 yx − f(x)，最大的那个差（橙色竖线）就是 f*(y)。把这条直线往下平移 f*(y)，它恰好贴住 f 的图像，并在纵轴上截出 −f*(y)。下图把每个 y 的 f*(y) 连起来——无论 f 凸不凸，f* 都是凸的。"
    >
      <Tabs value={k} set={(v) => { setK(v); setY(v === 'nlog' ? -1 : 1) }} tabs={Object.entries(CF).map(([v, o]) => ({ value: v, label: o.label }))} />
      <Mafs viewBox={F.view} height={300} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.OfX y={(x) => (x >= F.lo && x <= F.hi ? F.f(x) : NaN)} color={Theme.blue} weight={3} />
        <Plot.OfX y={(x) => y * x} color={Theme.indigo} style="dashed" />
        {bounded && <>
          <Plot.OfX y={(x) => y * x - s.val} color={Theme.green} />
          <Line.Segment point1={[s.arg, F.f(s.arg)]} point2={[s.arg, y * s.arg]} color={Theme.orange} weight={3} />
          <Point x={s.arg} y={F.f(s.arg)} color={Theme.orange} />
          <Point x={0} y={-s.val} color={Theme.green} />
          <Text x={0} y={-s.val} attach="e" size={12}>(0, −f*(y))</Text>
        </>}
      </Mafs>
      <div className="wrow"><Slider label={<M>{'y'}</M>} value={y} set={setY} min={-3} max={3} /></div>
      <div style={{ fontSize: 13, color: '#636366', margin: '8px 0 4px' }}>下图：f*(y)（空缺处表示 +∞）</div>
      <Mafs viewBox={{ x: [-3, 3], y: [-3, 5] }} height={160} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.OfX y={fstar} color={Theme.green} weight={3} />
        {bounded && <Point x={y} y={clamp(s.val, -3, 5)} color={Theme.orange} />}
      </Mafs>
      <div className="wstat">
        <span className={`chip ${bounded ? 'good' : 'bad'}`}>{bounded ? `f*(${fx(y)}) = ${fx(s.val)}，在 x* = ${fx(s.arg)} 处取到最大间隙` : `y = ${fx(y)}：yx − f(x) 无上界 → f*(y) = +∞`}</span>
        {F.exTex && <span className="chip info"><M>{F.exTex}</M></span>}
      </div>
    </Widget>
  )
}
