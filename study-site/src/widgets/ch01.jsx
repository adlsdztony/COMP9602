// 第 1 章 什么是（凸）优化 —— 交互组件
import { useState } from 'react'
import { Mafs, Coordinates, Plot, Point, Line, Polygon, Vector, Text, Theme, useMovablePoint } from 'mafs'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'

const fx = (v, d = 2) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(d)

/* ---------- 半平面裁剪：保留 n·x <= r 的部分 ---------- */
function clip(poly, n, r) {
  const out = []
  const val = (p) => n[0] * p[0] + n[1] * p[1] - r
  for (let k = 0; k < poly.length; k++) {
    const p = poly[k], q = poly[(k + 1) % poly.length]
    const vp = val(p), vq = val(q)
    if (vp <= 1e-12) out.push(p)
    if ((vp < 0 && vq > 0) || (vp > 0 && vq < 0)) {
      const t = vp / (vp - vq)
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])])
    }
  }
  return out
}

/* =====================================================================
   1. 饮食问题 LP
   ===================================================================== */
const A = [[2, 1], [1, 3]] // a_ij：食物 j 每 mg 含维生素 i 的 mg 数
export function Ch01DietLP() {
  const [mode, setMode] = useState('min')
  const [b1, setB1] = useState(6)
  const [b2, setB2] = useState(6)
  const [c1, setC1] = useState(1.5)
  const [c2, setC2] = useState(1)
  const [d, setD] = useState(6)
  const X = 8, Y = 6
  let poly = [[0, 0], [X, 0], [X, Y], [0, Y]]
  let obj, sense
  if (mode === 'min') {
    poly = clip(poly, [-A[0][0], -A[0][1]], -b1)
    poly = clip(poly, [-A[1][0], -A[1][1]], -b2)
    obj = [c1, c2]; sense = 1
  } else {
    poly = clip(poly, [c1, c2], d)
    obj = [A[0][0] + A[1][0], A[0][1] + A[1][1]]; sense = -1
  }
  let best = null, bv = Infinity
  poly.forEach((p) => { const v = sense * (obj[0] * p[0] + obj[1] * p[1]); if (v < bv - 1e-9) { bv = v; best = p } })
  const fstar = sense * bv
  const iso = (val) => {
    // obj·x = val 的直线上两点
    if (Math.abs(obj[1]) > 1e-9) return [[0, val / obj[1]], [1, (val - obj[0]) / obj[1]]]
    return [[val / obj[0], 0], [val / obj[0], 1]]
  }
  const on = (p, a, b) => Math.abs(a[0] * p[0] + a[1] * p[1] - b) < 1e-6
  const active = best ? (mode === 'min'
    ? [on(best, A[0], b1) && '维生素 1', on(best, A[1], b2) && '维生素 2', best[0] < 1e-6 && 'x₁ ≥ 0', best[1] < 1e-6 && 'x₂ ≥ 0'].filter(Boolean)
    : [on(best, [c1, c2], d) && '卡路里上限', best[0] < 1e-6 && 'x₁ ≥ 0', best[1] < 1e-6 && 'x₂ ≥ 0'].filter(Boolean)) : []
  const unbounded = mode === 'min' && best && (Math.abs(best[0] - X) < 1e-6 || Math.abs(best[1] - Y) < 1e-6)
  return (
    <Widget title="饮食问题：一个二维 LP Diet problem" hint="两种食物，x₁, x₂ 是吃多少 mg。拖动滑块改变维生素需求 b 和每种食物的卡路里 c，观察：绿色可行域的形状随约束改变，红点（最优解）总是落在可行域的某个“角”（顶点）上；虚线是目标函数的等值线，最优时它恰好“擦着”可行域。">
      <Tabs tabs={[{ value: 'min', label: '版本 1：min 卡路里 s.t. 维生素够' }, { value: 'max', label: '版本 2：max 维生素 s.t. 卡路里 ≤ d' }]} value={mode} set={setMode} />
      <div style={{ margin: '6px 0', fontSize: 14 }}>
        {mode === 'min'
          ? <M>{`\\min\\ ${fx(c1)}x_1+${fx(c2)}x_2\\ \\ \\text{s.t.}\\ 2x_1+x_2\\ge ${fx(b1)},\\ x_1+3x_2\\ge ${fx(b2)},\\ x_1,x_2\\ge 0`}</M>
          : <M>{`\\max\\ (2+1)x_1+(1+3)x_2\\ \\ \\text{s.t.}\\ ${fx(c1)}x_1+${fx(c2)}x_2\\le ${fx(d)},\\ x_1,x_2\\ge 0`}</M>}
      </div>
      <Mafs viewBox={{ x: [-0.5, 8], y: [-0.5, 6] }} height={340} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={1} />
        {poly.length >= 3 && <Polygon points={poly} color={Theme.green} fillOpacity={0.2} weight={1.5} />}
        {mode === 'min' ? (
          <>
            <Line.ThroughPoints point1={[0, b1]} point2={[b1 / 2, 0]} color={Theme.blue} opacity={0.7} />
            <Line.ThroughPoints point1={[0, b2 / 3]} point2={[b2, 0]} color={Theme.violet} opacity={0.7} />
            <Text x={0.1} y={Math.min(b1, 5.6)} attach="e" size={12} color={Theme.blue}>2x₁+x₂ = b₁</Text>
            <Text x={Math.min(b2, 7) - 0.3} y={0.25} attach="n" size={12} color={Theme.violet}>x₁+3x₂ = b₂</Text>
          </>
        ) : (
          <Line.ThroughPoints point1={[0, d / c2]} point2={[d / c1, 0]} color={Theme.orange} opacity={0.7} />
        )}
        {best && [-2, -1, 1, 2].map((k) => {
          const pts = iso(fstar + k * (mode === 'min' ? 1.5 : 3))
          return <Line.ThroughPoints key={k} point1={pts[0]} point2={pts[1]} color={Theme.indigo} style="dashed" opacity={0.25} />
        })}
        {best && (() => { const pts = iso(fstar); return <Line.ThroughPoints point1={pts[0]} point2={pts[1]} color={Theme.red} style="dashed" weight={2.5} /> })()}
        {best && <Vector tail={best} tip={[best[0] - sense * obj[0] * 0.3, best[1] - sense * obj[1] * 0.3]} color={Theme.red} />}
        {poly.map((p, k) => <Point key={k} x={p[0]} y={p[1]} color={Theme.green} opacity={0.6} />)}
        {best && <Point x={best[0]} y={best[1]} color={Theme.red} />}
      </Mafs>
      <div className="wrow">
        {mode === 'min' ? (
          <>
            <Slider label={<M>{'b_1'}</M>} value={b1} set={setB1} min={1} max={10} step={0.1} />
            <Slider label={<M>{'b_2'}</M>} value={b2} set={setB2} min={1} max={12} step={0.1} />
          </>
        ) : <Slider label={<M>{'d'}</M>} value={d} set={setD} min={1} max={10} step={0.1} />}
        <Slider label={<M>{'c_1'}</M>} value={c1} set={setC1} min={0.3} max={3} step={0.05} />
        <Slider label={<M>{'c_2'}</M>} value={c2} set={setC2} min={0.3} max={3} step={0.05} />
      </div>
      <div className="wstat">
        {best ? <>
          <span className="chip good">最优解 x* = ({fx(best[0])}, {fx(best[1])})</span>
          <span className="chip good">{mode === 'min' ? '最少卡路里' : '最多维生素'} = {fx(fstar)}</span>
          <span className="chip info">起作用的约束（active）：{active.join('、') || '无'}</span>
          {unbounded && <span className="chip bad">最优点碰到了画图边界，请调整参数</span>}
        </> : <span className="chip bad">可行域为空 infeasible</span>}
        <span className="chip">可行域顶点数：{poly.length}</span>
      </div>
    </Widget>
  )
}

/* =====================================================================
   2. 凸函数 Jensen 不等式：弦在曲线上方
   ===================================================================== */
const JF = {
  sq: { label: '½x²（凸）', f: (x) => 0.5 * x * x },
  quart: { label: '0.1x⁴（凸）', f: (x) => 0.1 * x ** 4 },
  lin: { label: '线性 0.8x+1', f: (x) => 0.8 * x + 1 },
  cave: { label: '3−½x²（凹）', f: (x) => 3 - 0.5 * x * x },
  sin: { label: '1.5+1.5 sin 1.5x（都不是）', f: (x) => 1.5 + 1.5 * Math.sin(1.5 * x) },
}
export function Ch01Jensen() {
  const [key, setKey] = useState('sq')
  const [al, setAl] = useState(0.4)
  const px = useMovablePoint([-2, 0], { constrain: 'horizontal', color: Theme.blue })
  const py = useMovablePoint([1.5, 0], { constrain: 'horizontal', color: Theme.blue })
  const f = JF[key].f
  const x = px.x, y = py.x
  const z = al * x + (1 - al) * y
  const fz = f(z), chord = al * f(x) + (1 - al) * f(y)
  const gap = chord - fz
  let minGap = Infinity
  for (let k = 0; k <= 100; k++) { const a = k / 100; minGap = Math.min(minGap, a * f(x) + (1 - a) * f(y) - f(a * x + (1 - a) * y)) }
  const ok = gap >= -1e-9
  return (
    <Widget title="Jensen 不等式：凸函数在弦的下方" hint="沿 x 轴拖动两个黑点（x 和 y），再拖动 α。黑色线段是弦；竖线连接曲线上的点 f(αx+βy) 与弦上的点 αf(x)+βf(y)。凸函数：竖线永远是绿色（曲线 ≤ 弦）；线性函数：两者重合；换成凹函数或 sin，找一找让竖线变红的位置。">
      <Tabs tabs={Object.entries(JF).map(([k, v]) => ({ value: k, label: v.label }))} value={key} set={setKey} />
      <Mafs viewBox={{ x: [-3.2, 3.2], y: [-1, 5] }} height={330} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.OfX y={f} color={Theme.blue} weight={3} />
        <Line.Segment point1={[x, f(x)]} point2={[y, f(y)]} color="#222" weight={2.5} />
        <Line.Segment point1={[x, 0]} point2={[x, f(x)]} color={Theme.blue} style="dashed" opacity={0.4} />
        <Line.Segment point1={[y, 0]} point2={[y, f(y)]} color={Theme.blue} style="dashed" opacity={0.4} />
        <Line.Segment point1={[z, fz]} point2={[z, chord]} color={ok ? Theme.green : Theme.red} weight={4} />
        <Point x={z} y={fz} color={Theme.blue} />
        <Point x={z} y={chord} color="#222" />
        <Point x={z} y={0} color={Theme.orange} />
        <Text x={z} y={0} attach="s" size={12} color={Theme.orange}>αx+βy</Text>
        <Text x={x} y={0} attach="s" size={13}>x</Text>
        <Text x={y} y={0} attach="s" size={13}>y</Text>
        {px.element}
        {py.element}
      </Mafs>
      <div className="wrow">
        <Slider label={<M>{'\\alpha'}</M>} value={al} set={setAl} min={0} max={1} step={0.01} fmt={(v) => `${v.toFixed(2)}  (β = ${(1 - v).toFixed(2)})`} />
      </div>
      <div className="wstat">
        <span className="chip info">f(αx+βy) = {fx(fz)}</span>
        <span className="chip info">αf(x)+βf(y) = {fx(chord)}</span>
        <span className={`chip ${Math.abs(gap) < 1e-6 ? 'info' : ok ? 'good' : 'bad'}`}>弦 − 曲线 = {fx(gap, 3)} {Math.abs(gap) < 1e-6 ? '（相等）' : ok ? '≥ 0 ✓' : '< 0 ✗ 违反 Jensen'}</span>
        <span className={`chip ${minGap >= -1e-9 ? 'good' : 'bad'}`}>{minGap >= -1e-9 ? '这一对 x, y 的整段弦都在曲线上方或重合' : '这一对 x, y 存在 α 使曲线高于弦 ⇒ 不是凸函数'}</span>
      </div>
    </Widget>
  )
}

/* =====================================================================
   3. 凸 vs 非凸：局部最优
   ===================================================================== */
const LF = {
  convex: { label: '凸函数', f: (x) => 0.3 * (x - 0.5) ** 2 + 0.5, d: (x) => 0.6 * (x - 0.5), xs: 0.5 },
  nonconvex: { label: '非凸函数', f: (x) => 0.08 * x ** 4 - 0.6 * x * x + 0.3 * x + 2, d: (x) => 0.32 * x ** 3 - 1.2 * x + 0.3, xs: -2.0496 },
}
export function Ch01LocalMin() {
  const [key, setKey] = useState('nonconvex')
  const [K, setK] = useState(30)
  const [t, setT] = useState(0.3)
  const s = useMovablePoint([2.8, 0], { constrain: (p) => [Math.max(-3.4, Math.min(3.4, p[0])), 0], color: Theme.violet })
  const F = LF[key]
  const path = [s.x]
  for (let k = 0; k < K; k++) {
    const nx = path[k] - t * F.d(path[k])
    path.push(Math.max(-4, Math.min(4, nx)))
  }
  const xe = path[path.length - 1]
  const global = Math.abs(xe - F.xs) < 0.05
  const fv = path.map(F.f)
  const W = 260, H = 70, fmin = Math.min(...fv, F.f(F.xs)), fmax = Math.max(...fv)
  const spark = fv.map((v, k) => `${(k / Math.max(1, K)) * W},${H - 4 - ((v - fmin) / ((fmax - fmin) || 1)) * (H - 8)}`).join(' ')
  return (
    <Widget title="凸 vs 非凸：局部最优陷阱 Local vs global minimum" hint="拖动棕色起点，“下山”算法（梯度下降，每步沿斜率反方向走一小步）会停在第一个碰到的谷底。凸函数：无论从哪里出发都到达同一个全局最优；非凸函数：试试把起点放在右边（x > 0.3）——它会困在右边那个更高的局部最小值。">
      <Tabs tabs={Object.entries(LF).map(([k, v]) => ({ value: k, label: v.label }))} value={key} set={setKey} />
      <Mafs viewBox={{ x: [-3.6, 3.6], y: [-0.3, 4.2] }} height={300} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.OfX y={F.f} color={Theme.blue} weight={3} />
        {path.slice(0, -1).map((p, k) => (
          <Line.Segment key={k} point1={[p, F.f(p)]} point2={[path[k + 1], F.f(path[k + 1])]} color={Theme.orange} opacity={0.8} />
        ))}
        {path.map((p, k) => <Point key={k} x={p} y={F.f(p)} color={Theme.orange} opacity={0.35 + 0.65 * (k / path.length)} />)}
        <Point x={F.xs} y={F.f(F.xs)} color={Theme.green} />
        <Text x={F.xs} y={F.f(F.xs)} attach="s" size={12} color={Theme.green}>全局最优</Text>
        <Point x={xe} y={F.f(xe)} color={Theme.red} />
        {s.element}
      </Mafs>
      <div className="wrow">
        <Slider label="迭代步数 k" value={K} set={setK} min={0} max={60} step={1} fmt={(v) => String(v)} />
        <Slider label="步长 t" value={t} set={setT} min={0.05} max={1} step={0.01} />
      </div>
      <div className="wrow">
        <svg width={W} height={H} style={{ background: '#f5f5f7', borderRadius: 6, border: '1px solid #e5e5ea' }}>
          <polyline points={spark} fill="none" stroke={Theme.orange} strokeWidth={2} />
        </svg>
        <span style={{ fontSize: 13, color: '#666' }}>f(x⁽ᵏ⁾) 随迭代下降</span>
      </div>
      <div className="wstat">
        <span className="chip info">起点 x⁽⁰⁾ = {fx(s.x)}</span>
        <span className="chip info">x⁽{K}⁾ = {fx(xe)}，f = {fx(F.f(xe))}，斜率 f′ = {fx(F.d(xe), 3)}</span>
        <span className={`chip ${global ? 'good' : 'bad'}`}>{global ? '到达全局最优 ✓' : Math.abs(F.d(xe)) < 0.01 ? '停在局部最优（不是全局最优）✗' : '还没收敛'}</span>
      </div>
    </Widget>
  )
}

/* =====================================================================
   4. 最小二乘拟合直线
   ===================================================================== */
export function Ch01LeastSquares() {
  const init = [[0.8, 1.2], [1.8, 2.4], [3, 2.2], [4, 3.6], [5.2, 3.3], [6.5, 4.8]]
  const P = init.map((p) => useMovablePoint(p, { color: Theme.blue })) // eslint-disable-line react-hooks/rules-of-hooks
  const [manual, setManual] = useState(false)
  const [ma, setMa] = useState(0.3)
  const [mb, setMb] = useState(2)
  const N = P.length
  let Sx = 0, Sy = 0, Sxx = 0, Sxy = 0
  P.forEach(({ x, y }) => { Sx += x; Sy += y; Sxx += x * x; Sxy += x * y })
  // [a;b] = [[Sx, N],[Sxx, Sx]]^{-1} [Sy; Sxy]
  const det = Sx * Sx - N * Sxx
  const a = Math.abs(det) > 1e-9 ? (Sx * Sy - N * Sxy) / det : 0
  const b = Math.abs(det) > 1e-9 ? (Sx * Sxy - Sxx * Sy) / det : Sy / N
  const J = (aa, bb) => P.reduce((s, { x, y }) => s + (y - aa * x - bb) ** 2, 0)
  const Jstar = J(a, b), Jm = J(ma, mb)
  const la = manual ? ma : a, lb = manual ? mb : b
  return (
    <Widget title="最小二乘拟合直线 Least-squares line fitting" hint="拖动 6 个黑色数据点，黑线自动更新为最小二乘最优直线 ŷ = ax + b；红色竖线是残差 yᵢ − ŷᵢ。打开“手动”后自己调 a, b，看看你的 J 能否比最优的 J* 更小（不可能！）。">
      <Mafs viewBox={{ x: [-0.3, 7.5], y: [-0.3, 6] }} height={320} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={1} />
        {manual && <Plot.OfX y={(x) => a * x + b} color={Theme.blue} opacity={0.3} style="dashed" />}
        <Plot.OfX y={(x) => la * x + lb} color={manual ? Theme.orange : Theme.blue} weight={3} />
        {P.map(({ x, y }, k) => <Line.Segment key={k} point1={[x, y]} point2={[x, la * x + lb]} color={Theme.red} weight={2} />)}
        {P.map((p, k) => <span key={k}>{p.element}</span>)}
      </Mafs>
      <div className="wrow">
        <label style={{ fontSize: 14 }}><input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} /> 手动调直线</label>
        {manual && <>
          <Slider label={<M>{'a'}</M>} value={ma} set={setMa} min={-1} max={2} step={0.01} />
          <Slider label={<M>{'b'}</M>} value={mb} set={setMb} min={-2} max={5} step={0.01} />
        </>}
      </div>
      <div className="wstat">
        <span className="chip good">最优：a* = {fx(a, 3)}，b* = {fx(b, 3)}</span>
        <span className="chip good">J* = Σ(yᵢ − a*xᵢ − b*)² = {fx(Jstar, 3)}</span>
        {manual && <span className={`chip ${Jm - Jstar < 1e-3 ? 'good' : 'bad'}`}>你的直线 J = {fx(Jm, 3)}（比最优多 {fx(Jm - Jstar, 3)}）</span>}
        <span className="chip info">Σxᵢ = {fx(Sx)}，Σxᵢ² = {fx(Sxx)}，Σyᵢ = {fx(Sy)}，Σxᵢyᵢ = {fx(Sxy)}</span>
      </div>
    </Widget>
  )
}

/* =====================================================================
   5. 最大流（小网络）
   ===================================================================== */
const NODES = { s: [40, 120], i: [190, 40], j: [370, 55], k: [210, 200], l: [360, 160], t: [500, 110] }
const EDGES = [['s', 'i'], ['i', 'j'], ['s', 'l'], ['s', 'k'], ['k', 'j'], ['k', 'l'], ['j', 't'], ['l', 't']]
function maxflow(cap) {
  const names = Object.keys(NODES)
  const res = {}
  names.forEach((u) => { res[u] = {}; names.forEach((v) => { res[u][v] = 0 }) })
  EDGES.forEach(([u, v], e) => { res[u][v] += cap[e] })
  let total = 0
  for (;;) {
    const prev = { s: null }, Q = ['s']
    while (Q.length && !('t' in prev)) {
      const u = Q.shift()
      names.forEach((v) => { if (!(v in prev) && res[u][v] > 1e-9) { prev[v] = u; Q.push(v) } })
    }
    if (!('t' in prev)) break
    let bott = Infinity
    for (let v = 't'; prev[v] !== null; v = prev[v]) bott = Math.min(bott, res[prev[v]][v])
    for (let v = 't'; prev[v] !== null; v = prev[v]) { res[prev[v]][v] -= bott; res[v][prev[v]] += bott }
    total += bott
  }
  const flow = EDGES.map(([u, v], e) => Math.max(0, Math.min(cap[e], cap[e] - res[u][v])))
  return { total, flow }
}
export function Ch01MaxFlow() {
  const [cap, setCap] = useState([3, 2, 2, 4, 2, 3, 4, 3])
  const { total, flow } = maxflow(cap)
  const bump = (e) => setCap(cap.map((c, k) => (k === e ? (c % 6) + 1 : c)))
  const inner = ['i', 'j', 'k', 'l']
  const bal = inner.map((n) => {
    let inn = 0, out = 0
    EDGES.forEach(([u, v], e) => { if (v === n) inn += flow[e]; if (u === n) out += flow[e] })
    return [n, inn, out]
  })
  return (
    <Widget title="最大流 Max flow（讲义 slide 17–18 的网络）" hint="点击任意一条边，它的容量 uᵢⱼ 会在 1→6 之间循环增加。边上的数字是 “流量 / 容量”，边越粗流量越大；满载的边（流量 = 容量）显示为红色。观察：中间节点流入 = 流出（守恒），总流量 v 被“瓶颈”边卡住。">
      <svg viewBox="0 0 540 240" style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid #e5e5ea', borderRadius: 10, background: '#fff', userSelect: 'none' }}>
        {EDGES.map(([u, v], e) => {
          const [x1, y1] = NODES[u], [x2, y2] = NODES[v]
          const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L
          const ex = x2 - ux * 16, ey = y2 - uy * 16
          const sat = flow[e] >= cap[e] - 1e-9 && cap[e] > 0
          const col = flow[e] < 1e-9 ? '#aeaeb2' : sat ? Theme.red : Theme.blue
          const mx = (x1 + x2) / 2 - uy * 13, my = (y1 + y2) / 2 + ux * 13
          return (
            <g key={e} onClick={() => bump(e)} style={{ cursor: 'pointer' }}>
              <line x1={x1} y1={y1} x2={ex} y2={ey} stroke="transparent" strokeWidth={16} />
              <line x1={x1 + ux * 14} y1={y1 + uy * 14} x2={ex - ux * 8} y2={ey - uy * 8} stroke={col} strokeWidth={1.5 + flow[e] * 1.4} />
              <polygon points={`${ex},${ey} ${ex - ux * 11 - uy * 6},${ey - uy * 11 + ux * 6} ${ex - ux * 11 + uy * 6},${ey - uy * 11 - ux * 6}`} fill={col} />
              <rect x={mx - 18} y={my - 10} width={36} height={19} rx={5} fill="#fff" stroke={col} strokeWidth={1} />
              <text x={mx} y={my + 4} textAnchor="middle" fontSize={12} fill={col} fontWeight={700}>{fx(flow[e], 0)}/{cap[e]}</text>
            </g>
          )
        })}
        {Object.entries(NODES).map(([n, [x, y]]) => (
          <g key={n}>
            <circle cx={x} cy={y} r={14} fill={n === 's' ? '#ffe5cc' : n === 't' ? '#e5e5ea' : '#fff'} stroke="#333" strokeWidth={1.5} />
            <text x={x} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={700}>{n}</text>
          </g>
        ))}
      </svg>
      <div className="wrow">
        <button className="wbtn" onClick={() => setCap([3, 2, 2, 4, 2, 3, 4, 3])}>重置容量</button>
      </div>
      <div className="wstat">
        <span className="chip good">最大流 v* = {total}</span>
        {bal.map(([n, a, b]) => <span key={n} className={`chip ${Math.abs(a - b) < 1e-9 ? 'info' : 'bad'}`}>节点 {n}：流入 {a} = 流出 {b}</span>)}
      </div>
    </Widget>
  )
}
