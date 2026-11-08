// 第 13 章 内点法 Interior-Point Methods —— 交互组件
import { useState, useMemo } from 'react'
import { Mafs, Coordinates, Plot, Point, Line, Polygon, Polyline, Text, Theme } from 'mafs'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'

/* ---------------- 小工具 ---------------- */
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]
// 图表（Mafs 外的 SVG）用的中性配色：Mafs 的 CSS 变量只在 .MafsView 内有效
const C = { ink: '#1d1d1f', gray: '#636366', light: '#aeaeb2', orange: '#ff9500', red: '#ff3b30', green: '#34c759', brown: '#a2845e' }

// 简易对数坐标折线图（纯 SVG）
function LogChart({ series, xMax, yMin, yMax, xLabel, yLabel, height = 210, refLines = [] }) {
  const W = 600, H = height, L = 52, R = 12, T = 12, B = 34
  const ly0 = Math.log10(yMin), ly1 = Math.log10(yMax)
  const sx = (x) => L + (x / xMax) * (W - L - R)
  const sy = (y) => {
    const v = Math.log10(Math.max(y, yMin))
    return T + (1 - (v - ly0) / (ly1 - ly0)) * (H - T - B)
  }
  const ticks = []
  for (let e = Math.ceil(ly0); e <= Math.floor(ly1); e++) ticks.push(e)
  const xt = []
  const stepX = xMax <= 12 ? 1 : xMax <= 40 ? 5 : xMax <= 120 ? 10 : xMax <= 300 ? 50 : 100
  for (let x = 0; x <= xMax; x += stepX) xt.push(x)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, marginTop: 10 }}>
      {ticks.map((e) => (
        <g key={e}>
          <line x1={L} x2={W - R} y1={sy(10 ** e)} y2={sy(10 ** e)} stroke="#eee" />
          <text x={L - 6} y={sy(10 ** e) + 4} fontSize="11" textAnchor="end" fill="#777">1e{e}</text>
        </g>
      ))}
      {xt.map((x) => (
        <text key={x} x={sx(x)} y={H - B + 15} fontSize="11" textAnchor="middle" fill="#777">{x}</text>
      ))}
      <line x1={L} x2={L} y1={T} y2={H - B} stroke="#999" />
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="#999" />
      <text x={(L + W) / 2} y={H - 4} fontSize="12" textAnchor="middle" fill="#555">{xLabel}</text>
      <text x={12} y={T + 8} fontSize="12" fill="#555">{yLabel}</text>
      {refLines.map((r, i) => (
        <g key={'r' + i}>
          <line x1={L} x2={W - R} y1={sy(r.y)} y2={sy(r.y)} stroke={r.color} strokeDasharray="5 4" />
          <text x={W - R - 4} y={sy(r.y) - 4} fontSize="11" textAnchor="end" fill={r.color}>{r.label}</text>
        </g>
      ))}
      {series.map((s, i) => (
        <polyline key={i} fill="none" stroke={s.color} strokeWidth={s.width || 2} strokeDasharray={s.dash ? '5 4' : undefined} opacity={s.opacity ?? 1}
          points={s.pts.filter((p) => p[0] <= xMax).map((p) => `${sx(p[0])},${sy(p[1])}`).join(' ')} />
      ))}
      {series.filter((s) => s.label).map((s, i) => (
        <g key={'l' + i}>
          <line x1={W - 150} x2={W - 130} y1={T + 10 + i * 16} y2={T + 10 + i * 16} stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dash ? '5 4' : undefined} />
          <text x={W - 125} y={T + 14 + i * 16} fontSize="11" fill="#444">{s.label}</text>
        </g>
      ))}
    </svg>
  )
}

/* ---------------- 一个 2D LP：a_i^T x <= b_i ---------------- */
const LP_A = [[-1, 0], [0, -1], [1, 1], [1, -0.5], [-0.6, 1], [-1, -1]]
const LP_b = [2, 1.5, 3, 2.5, 2.2, 2.8]

function vertices(A, b) {
  const pts = []
  for (let i = 0; i < A.length; i++)
    for (let j = i + 1; j < A.length; j++) {
      const det = A[i][0] * A[j][1] - A[i][1] * A[j][0]
      if (Math.abs(det) < 1e-12) continue
      const x = (b[i] * A[j][1] - A[i][1] * b[j]) / det
      const y = (A[i][0] * b[j] - b[i] * A[j][0]) / det
      if (A.every((a, k) => dot(a, [x, y]) <= b[k] + 1e-9)) pts.push([x, y])
    }
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
  pts.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx))
  return pts
}

// 用（阻尼）Newton 法求 min t c^T x - sum log(b - Ax)
function centering(A, b, c, t, x0, tol = 1e-9, maxit = 80) {
  let x = [...x0], iters = 0
  const F = (z) => {
    let v = t * dot(c, z)
    for (let i = 0; i < A.length; i++) {
      const s = b[i] - dot(A[i], z)
      if (s <= 0) return Infinity
      v -= Math.log(s)
    }
    return v
  }
  for (; iters < maxit; ) {
    const g = [t * c[0], t * c[1]]
    let h11 = 0, h12 = 0, h22 = 0
    for (let i = 0; i < A.length; i++) {
      const s = b[i] - dot(A[i], x)
      const a = A[i]
      g[0] += a[0] / s; g[1] += a[1] / s
      h11 += (a[0] * a[0]) / (s * s); h12 += (a[0] * a[1]) / (s * s); h22 += (a[1] * a[1]) / (s * s)
    }
    const det = h11 * h22 - h12 * h12
    const dx = [-(h22 * g[0] - h12 * g[1]) / det, -(-h12 * g[0] + h11 * g[1]) / det]
    const lam2 = -dot(g, dx)
    if (lam2 / 2 <= tol) break
    let st = 1
    const f0 = F(x)
    while (F([x[0] + st * dx[0], x[1] + st * dx[1]]) > f0 - 0.25 * st * lam2 && st > 1e-12) st *= 0.5
    x = [x[0] + st * dx[0], x[1] + st * dx[1]]
    iters++
  }
  return { x, iters }
}

const LP_VERTS = vertices(LP_A, LP_b)
const LP_X0 = [LP_VERTS.reduce((s, p) => s + p[0], 0) / LP_VERTS.length, LP_VERTS.reduce((s, p) => s + p[1], 0) / LP_VERTS.length]
const LP_AC = centering(LP_A, LP_b, [0, 0], 0, LP_X0, 1e-14).x // analytic center

/* ================= 1. 一维 log barrier 逼近 indicator ================= */
export function Ch13LogBarrier() {
  const [lt, setLt] = useState(0)
  const t = 10 ** lt
  const phi = (u) => -(1 / t) * Math.log(-u)
  return (
    <Widget title="对数障碍逼近指示函数 Log barrier vs. indicator"
      hint="拖动 t：橙色曲线是 −(1/t)·log(−u)。试试把 t 调到 100，观察曲线在 u<0 的大部分区域几乎贴着 0（像 indicator 的“免费区”），只在 u→0 附近突然冲上去（像一堵墙）。">
      <Mafs viewBox={{ x: [-3, 0.5], y: [-1, 3] }} height={300} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        {[0.5, 1, 2].map((tt) => (
          <Plot.OfX key={tt} y={(u) => -(1 / tt) * Math.log(-u)} domain={[-3, -0.0005]} color={Theme.foreground} opacity={0.15} weight={1.5} />
        ))}
        <Line.Segment point1={[-3, 0]} point2={[0, 0]} color={Theme.blue} weight={4} style="dashed" />
        <Line.Segment point1={[0, 0]} point2={[0, 3]} color={Theme.blue} weight={4} style="dashed" />
        <Plot.OfX y={phi} domain={[-3, -0.0005]} color={Theme.orange} weight={3} />
        <Text x={-1.5} y={0} attach="s" size={13} color={Theme.blue}>I₋(u) = 0（u ≤ 0）</Text>
        <Text x={0} y={2.6} attach="e" size={13} color={Theme.blue}>I₋ = ∞</Text>
        <Text x={-2.6} y={phi(-2.6)} attach="n" size={13} color={Theme.orange}>−(1/t)log(−u)</Text>
      </Mafs>
      <div className="wrow">
        <Slider label={<M>{'t'}</M>} value={lt} set={setLt} min={-0.3} max={2} step={0.01} fmt={() => t.toFixed(t < 10 ? 2 : 0)} />
      </div>
      <div className="wstat">
        <span className="chip info">t = {t.toFixed(2)}</span>
        <span className="chip">u = −1 处值 = {phi(-1).toFixed(3)}</span>
        <span className="chip">u = −0.1 处值 = {phi(-0.1).toFixed(3)}</span>
        <span className={'chip ' + (Math.abs(phi(-0.1)) < 0.05 ? 'good' : 'bad')}>u = −0.1 处与 indicator 的误差 {Math.abs(phi(-0.1)).toFixed(3)}</span>
      </div>
    </Widget>
  )
}

/* ================= 2. 2D LP 上的 central path ================= */
export function Ch13CentralPath() {
  const [ang, setAng] = useState(205)
  const [lt, setLt] = useState(0)
  const t = 10 ** lt
  const c = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)]
  const m = LP_A.length
  const { path, xopt, pstar } = useMemo(() => {
    let x = LP_AC
    const path = []
    for (let k = 0; k <= 160; k++) {
      const tt = 10 ** (-1.5 + (5 * k) / 160)
      x = centering(LP_A, LP_b, c, tt, x).x
      path.push(x)
    }
    let best = LP_VERTS[0]
    for (const v of LP_VERTS) if (dot(c, v) < dot(c, best)) best = v
    return { path, xopt: best, pstar: dot(c, best) }
  }, [ang])
  const xt = useMemo(() => {
    // 从路径上最近的点热启动
    const k = Math.max(0, Math.min(160, Math.round(((lt + 1.5) * 160) / 5)))
    return centering(LP_A, LP_b, c, t, path[k]).x
  }, [lt, ang, path])
  const lam = LP_A.map((a, i) => 1 / (t * (LP_b[i] - dot(a, xt))))
  const gap = dot(c, xt) - pstar
  // 切线 c^T x = c^T x*(t) 的方向
  const d = [-c[1], c[0]]
  return (
    <Widget title="中心路径 Central path（2D LP）"
      hint="滑动 log₁₀t：红点是 x*(t)，它从 analytic center（t→0，黑点）出发，沿棕色的 central path 走向最优顶点 x*（绿点）。虚线是超平面 cᵀx = cᵀx*(t)。也可以转动目标方向 c，看最优顶点和整条路径如何改变。">
      <Mafs viewBox={{ x: [-3, 3.6], y: [-2.3, 3.6] }} height={360} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Polygon points={LP_VERTS} color={Theme.indigo} fillOpacity={0.08} />
        <Polyline points={path} color={Theme.violet} weight={2.5} />
        <Line.ThroughPoints point1={xt} point2={[xt[0] + d[0], xt[1] + d[1]]} color={Theme.foreground} style="dashed" opacity={0.5} weight={1.5} />
        <Line.Segment point1={[-2.4, 3.1]} point2={[-2.4 + 0.7 * c[0], 3.1 + 0.7 * c[1]]} color={Theme.pink} weight={3} />
        <Point x={-2.4 + 0.7 * c[0]} y={3.1 + 0.7 * c[1]} color={Theme.pink} />
        <Text x={-2.4} y={3.1} attach="e" size={13} color={Theme.pink}>  c</Text>
        <Point x={LP_AC[0]} y={LP_AC[1]} color={Theme.blue} />
        <Text x={LP_AC[0]} y={LP_AC[1]} attach="ne" size={12} color={Theme.blue}>x_ac</Text>
        <Point x={xopt[0]} y={xopt[1]} color={Theme.green} />
        <Text x={xopt[0]} y={xopt[1]} attach="sw" size={13} color={Theme.green}>x*</Text>
        <Point x={xt[0]} y={xt[1]} color={Theme.red} />
        <Text x={xt[0]} y={xt[1]} attach="ne" size={13} color={Theme.red}>x*(t)</Text>
      </Mafs>
      <div className="wrow">
        <Slider label={<M>{'\\log_{10} t'}</M>} value={lt} set={setLt} min={-1.5} max={3.5} step={0.01} />
        <Slider label="c 的方向（度）" value={ang} set={setAng} min={0} max={359} step={1} fmt={(v) => v.toFixed(0) + '°'} />
      </div>
      <div className="wstat">
        <span className="chip info">t = {t < 10 ? t.toFixed(3) : t.toFixed(0)}</span>
        <span className="chip">cᵀx*(t) − p* = {gap.toExponential(2)}</span>
        <span className={'chip ' + (gap <= m / t + 1e-12 ? 'good' : 'bad')}>理论上界 m/t = {(m / t).toExponential(2)}（m = 6）</span>
        <span className="chip">λᵢ*(t) = 1/(−t fᵢ) = [{lam.map((v) => v.toFixed(2)).join(', ')}]</span>
        <span className="chip good">每个 −λᵢ fᵢ = 1/t = {(1 / t).toExponential(2)}</span>
      </div>
    </Widget>
  )
}

/* ================= 3. barrier method 外循环 + μ 的影响 ================= */
function runBarrier(mu, eps, t0 = 1) {
  const c = [Math.cos((205 * Math.PI) / 180), Math.sin((205 * Math.PI) / 180)]
  const m = LP_A.length
  let x = LP_AC, t = t0, N = 0
  const steps = []
  for (let k = 0; k < 60; k++) {
    const r = centering(LP_A, LP_b, c, t, x)
    x = r.x
    steps.push({ t, x, newton: r.iters, before: N, after: N + r.iters, gap: m / t })
    N += r.iters
    if (m / t < eps) break
    t *= mu
  }
  return { steps, total: N }
}
function staircase(steps, mu) {
  const pts = []
  steps.forEach((s, i) => {
    pts.push([s.before, s.gap], [s.after, s.gap])
    if (i < steps.length - 1) pts.push([s.after, s.gap / mu])
  })
  return pts
}

export function Ch13BarrierMethod() {
  const [mu, setMu] = useState(10)
  const [le, setLe] = useState(-6)
  const [show, setShow] = useState(99)
  const eps = 10 ** le
  const m = LP_A.length
  const res = useMemo(() => runBarrier(mu, eps), [mu, eps])
  const compare = useMemo(() => [2, 10, 50, 150].map((u) => ({ u, r: runBarrier(u, eps) })), [eps])
  const n = Math.min(show, res.steps.length)
  const shown = res.steps.slice(0, n)
  const formula = Math.ceil(Math.log(m / (eps * 1)) / Math.log(mu))
  const xMax = Math.max(...compare.map((c) => c.r.total), res.total) + 2
  const colors = { 2: C.ink, 10: C.green, 50: C.orange, 150: C.brown }
  return (
    <Widget title="Barrier method：外循环与 μ 的取舍"
      hint="选 μ 后点“下一个外循环”逐步执行：每个外循环 = 一次 centering（若干 Newton 步）+ 把 t 乘以 μ。观察下方阶梯图：平台 = centering 的 Newton 步，竖直下降 = t 更新。试试 μ = 2 与 μ = 150，比较外循环次数和总 Newton 步数。">
      <Tabs tabs={[2, 5, 10, 20, 50, 150].map((u) => ({ value: u, label: 'μ = ' + u }))} value={mu} set={(u) => { setMu(u); setShow(99) }} />
      <Mafs viewBox={{ x: [-3, 3.6], y: [-2.3, 3.6] }} height={300} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Polygon points={LP_VERTS} color={Theme.indigo} fillOpacity={0.08} />
        <Polyline points={[LP_AC, ...shown.map((s) => s.x)]} color={Theme.orange} weight={2} />
        <Point x={LP_AC[0]} y={LP_AC[1]} color={Theme.blue} />
        {shown.map((s, i) => <Point key={i} x={s.x[0]} y={s.x[1]} color={i === n - 1 ? Theme.red : Theme.orange} />)}
        {n > 0 && <Text x={shown[n - 1].x[0]} y={shown[n - 1].x[1]} attach="ne" size={12} color={Theme.red}>{`x*(t), t=${shown[n - 1].t.toExponential(0)}`}</Text>}
      </Mafs>
      <div className="wrow">
        <button className="wbtn primary" onClick={() => setShow(Math.min(n + 1, res.steps.length) || 1)} disabled={n >= res.steps.length}>下一个外循环 →</button>
        <button className="wbtn" onClick={() => setShow(1)}>重置</button>
        <button className="wbtn" onClick={() => setShow(99)}>全部运行</button>
        <Slider label={<M>{'\\log_{10}\\epsilon'}</M>} value={le} set={(v) => { setLe(v); setShow(99) }} min={-9} max={-1} step={1} fmt={(v) => '1e' + v} />
      </div>
      <LogChart xMax={xMax} yMin={Math.min(eps / 20, 1e-6)} yMax={20} xLabel="累计 Newton 迭代次数" yLabel="duality gap m/t"
        refLines={[{ y: eps, color: C.red, label: 'ε' }]}
        series={[
          ...compare.filter((c) => c.u !== mu).map((c) => ({ pts: staircase(c.r.steps, c.u), color: colors[c.u], opacity: 0.35, width: 1.5, label: 'μ=' + c.u })),
          { pts: staircase(shown, mu), color: C.red, width: 3, label: 'μ=' + mu + '（当前）' },
        ]} />
      <div className="wstat">
        <span className="chip info">已执行外循环 {n} / {res.steps.length}</span>
        <span className="chip">当前 t = {n ? shown[n - 1].t.toExponential(1) : '-'}，gap m/t = {n ? shown[n - 1].gap.toExponential(1) : '-'}</span>
        <span className="chip">本次 centering 用了 {n ? shown[n - 1].newton : 0} 步 Newton</span>
        <span className="chip good">总 Newton 步 = {res.total}</span>
        <span className="chip">公式 ⌈log(m/(ε t⁽⁰⁾))/log μ⌉ = {formula}（+1 次初始 centering）</span>
      </div>
      <div className="legend-inline">
        对比（同一 ε）：{compare.map((c) => `μ=${c.u}: ${c.r.steps.length} 个外循环 / ${c.r.total} 步 Newton`).join('；')}
      </div>
    </Widget>
  )
}

/* ================= 4. Phase I（basic）：把 s 往下压 ================= */
export function Ch13PhaseI() {
  const [d, setD] = useState(1.5)
  const sStar = -d / 3
  const [ds, setDs] = useState(0.8) // s = s* + ds
  const s = sStar + ds
  // {x : -x1 <= s, -x2 <= s, x1 + x2 - d <= s}
  const tri = (sv) => [[-sv, -sv], [d + 2 * sv, -sv], [-sv, d + 2 * sv]]
  const feasTri = d > 0 ? tri(0) : null
  const cs = Math.abs(sStar) < 0.02 ? 'zero' : sStar < 0 ? 'neg' : 'pos'
  return (
    <Widget title="Phase I：寻找严格可行起点"
      hint="三个约束 −x₁ ≤ 0, −x₂ ≤ 0, x₁+x₂ ≤ d。辅助问题 (2) 用一个标量 s 同时“放宽”所有约束：fᵢ(x) ≤ s。滑动 s 往下压，橙色三角形 {x : fᵢ(x) ≤ s} 缩成一点时的 s 就是最优值 p̄*。再滑动 d，看 p̄* 的符号如何对应三种情形。">
      <Mafs viewBox={{ x: [-2, 3.5], y: [-2, 3.5] }} height={320} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        {feasTri && <Polygon points={feasTri} color={Theme.green} fillOpacity={0.25} />}
        <Polygon points={tri(s)} color={Theme.orange} fillOpacity={0.12} />
        <Point x={d / 3} y={d / 3} color={Theme.red} />
        <Text x={d / 3} y={d / 3} attach="ne" size={12} color={Theme.red}>argmin（s = p̄*）</Text>
      </Mafs>
      <div className="wrow">
        <Slider label="d（第三个约束的右端）" value={d} set={setD} min={-1.5} max={2.5} step={0.05} />
        <Slider label={<M>{'s - \\bar p^\\star'}</M>} value={ds} set={setDs} min={0} max={2} step={0.01} />
      </div>
      <div className="wstat">
        <span className="chip info">p̄* = −d/3 = {sStar.toFixed(3)}</span>
        <span className="chip">当前 s = {s.toFixed(3)}（(x,s) 可行当且仅当 s ≥ p̄*）</span>
        {cs === 'neg' && <span className="chip good">p̄* &lt; 0 ⇒ 原问题严格可行，可从 argmin 处启动 barrier method</span>}
        {cs === 'zero' && <span className="chip info">p̄* = 0 且可达 ⇒ 可行但不严格可行（可行集只是一个点）</span>}
        {cs === 'pos' && <span className="chip bad">p̄* &gt; 0 ⇒ 原问题不可行</span>}
        <span className="chip">sum of infeasibilities 最优值 = max(0, −d) = {Math.max(0, -d).toFixed(2)}</span>
      </div>
    </Widget>
  )
}
