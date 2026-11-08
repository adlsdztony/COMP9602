// 第 15 章 定位法 Localization methods —— 交互组件
import { useState, useMemo } from 'react'
import { Mafs, Coordinates, Plot, Point, Line, Polygon, Text, Theme } from 'mafs'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'

// Mafs 外的 SVG 用中性配色（Mafs 的 CSS 变量只在 .MafsView 内有效）
const C = { ink: '#1d1d1f', gray: '#636366', light: '#aeaeb2', orange: '#ff9500', red: '#ff3b30', green: '#34c759', brown: '#a2845e' }
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]

function LogChart({ series, xMax, yMin, yMax, xLabel, yLabel, height = 200 }) {
  const W = 600, H = height, L = 52, R = 12, T = 12, B = 34
  const ly0 = Math.log10(yMin), ly1 = Math.log10(yMax)
  const sx = (x) => L + (x / xMax) * (W - L - R)
  const sy = (y) => T + (1 - (Math.log10(Math.min(Math.max(y, yMin), yMax)) - ly0) / (ly1 - ly0)) * (H - T - B)
  const ticks = []
  const de = ly1 - ly0 > 12 ? 4 : ly1 - ly0 > 6 ? 2 : 1
  for (let e = Math.ceil(ly0); e <= Math.floor(ly1); e += 1) if (e % de === 0) ticks.push(e)
  const stepX = xMax <= 15 ? 1 : xMax <= 40 ? 5 : xMax <= 120 ? 20 : xMax <= 300 ? 50 : 100
  const xt = []
  for (let x = 0; x <= xMax; x += stepX) xt.push(x)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', background: '#fff', border: '1px solid #e5e5ea', borderRadius: 10, marginTop: 10 }}>
      {ticks.map((e) => (
        <g key={e}>
          <line x1={L} x2={W - R} y1={sy(10 ** e)} y2={sy(10 ** e)} stroke="#f0f0f2" />
          <text x={L - 6} y={sy(10 ** e) + 4} fontSize="11" textAnchor="end" fill={C.gray}>1e{e}</text>
        </g>
      ))}
      {xt.map((x) => <text key={x} x={sx(x)} y={H - B + 15} fontSize="11" textAnchor="middle" fill={C.gray}>{x}</text>)}
      <line x1={L} x2={L} y1={T} y2={H - B} stroke={C.light} />
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke={C.light} />
      <text x={(L + W) / 2} y={H - 4} fontSize="12" textAnchor="middle" fill={C.gray}>{xLabel}</text>
      <text x={12} y={T + 8} fontSize="12" fill={C.gray}>{yLabel}</text>
      {series.map((s, i) => (
        <polyline key={i} fill="none" stroke={s.color} strokeWidth={s.width || 2} strokeDasharray={s.dash ? '5 4' : undefined}
          points={s.pts.map((p) => `${sx(p[0])},${sy(p[1])}`).join(' ')} />
      ))}
      {series.filter((s) => s.label).map((s, i) => (
        <g key={'l' + i}>
          <line x1={W - 200} x2={W - 180} y1={T + 10 + i * 16} y2={T + 10 + i * 16} stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dash ? '5 4' : undefined} />
          <text x={W - 175} y={T + 14 + i * 16} fontSize="11" fill={C.ink}>{s.label}</text>
        </g>
      ))}
    </svg>
  )
}

/* ---------- 共用的目标函数：f(x) = ½ (x−x*)ᵀ Q (x−x*) ---------- */
const Q = [[2, 0.6], [0.6, 1]]
const XS = [1.1, -0.6]
const f0 = (x) => { const d = [x[0] - XS[0], x[1] - XS[1]]; return 0.5 * (d[0] * (Q[0][0] * d[0] + Q[0][1] * d[1]) + d[1] * (Q[1][0] * d[0] + Q[1][1] * d[1])) }
const g0 = (x) => { const d = [x[0] - XS[0], x[1] - XS[1]]; return [Q[0][0] * d[0] + Q[0][1] * d[1], Q[1][0] * d[0] + Q[1][1] * d[1]] }
// 等高线（椭圆）f = c
function levelCurve(c, center = XS) {
  // Q = L Lᵀ 的逆方向：点 = center + sqrt(2c) Q^{-1/2} u，用 Cholesky of Q^{-1}
  const det = Q[0][0] * Q[1][1] - Q[0][1] * Q[1][0]
  const Pi = [[Q[1][1] / det, -Q[0][1] / det], [-Q[1][0] / det, Q[0][0] / det]]
  return ellipsePts(center, Pi.map((r) => r.map((v) => v * 2 * c)))
}
function ellipsePts(x, P, n = 90) {
  const l11 = Math.sqrt(P[0][0]), l21 = P[0][1] / l11, l22 = Math.sqrt(Math.max(P[1][1] - l21 * l21, 1e-12))
  return Array.from({ length: n }, (_, i) => {
    const t = (2 * Math.PI * i) / n, u = [Math.cos(t), Math.sin(t)]
    return [x[0] + l11 * u[0], x[1] + l21 * u[0] + l22 * u[1]]
  })
}
const LEVELS = [0.1, 0.4, 1, 2, 4].map((c) => levelCurve(c))

/* ---------- 多边形工具 ---------- */
function clip(poly, a, b) {
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], R = poly[(i + 1) % poly.length]
    const vp = dot(a, P) - b, vq = dot(a, R) - b
    if (vp <= 0) out.push(P)
    if (vp * vq < 0) { const t = vp / (vp - vq); out.push([P[0] + t * (R[0] - P[0]), P[1] + t * (R[1] - P[1])]) }
  }
  return out
}
function area(poly) { let s = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; s += p[0] * q[1] - q[0] * p[1] } return Math.abs(s) / 2 }
function centroid(poly) {
  let s = 0, cx = 0, cy = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], cr = p[0] * q[1] - q[0] * p[1]
    s += cr; cx += (p[0] + q[0]) * cr; cy += (p[1] + q[1]) * cr
  }
  return [cx / (3 * s), cy / (3 * s)]
}
function analyticCenter(cons, x0) {
  let x = [...x0]
  const F = (z) => { let v = 0; for (const c of cons) { const s = c.b - dot(c.a, z); if (s <= 0) return Infinity; v -= Math.log(s) } return v }
  for (let it = 0; it < 60; it++) {
    const g = [0, 0]; let h11 = 0, h12 = 0, h22 = 0
    for (const c of cons) { const s = c.b - dot(c.a, x), a = c.a; g[0] += a[0] / s; g[1] += a[1] / s; h11 += a[0] * a[0] / (s * s); h12 += a[0] * a[1] / (s * s); h22 += a[1] * a[1] / (s * s) }
    const det = h11 * h22 - h12 * h12
    const dx = [-(h22 * g[0] - h12 * g[1]) / det, -(-h12 * g[0] + h11 * g[1]) / det]
    const lam2 = -dot(g, dx)
    if (lam2 < 1e-12) break
    let st = 1; const fx = F(x)
    while (F([x[0] + st * dx[0], x[1] + st * dx[1]]) > fx - 0.25 * st * lam2 && st > 1e-10) st *= 0.5
    x = [x[0] + st * dx[0], x[1] + st * dx[1]]
  }
  return x
}
function chebyshev(cons) {
  let best = null, bR = -Infinity
  const rows = cons.map((c) => [c.a[0], c.a[1], Math.hypot(c.a[0], c.a[1]), c.b])
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) for (let k = j + 1; k < rows.length; k++) {
    const A = [rows[i], rows[j], rows[k]]
    const d3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    const M0 = A.map((r) => [r[0], r[1], r[2]])
    const D = d3(M0)
    if (Math.abs(D) < 1e-12) continue
    const sol = [0, 1, 2].map((col) => d3(M0.map((r, ri) => r.map((v, ci) => (ci === col ? A[ri][3] : v)))) / D)
    const [x, y, R] = sol
    if (R <= bR) continue
    if (rows.every((r) => r[0] * x + r[1] * y + r[2] * R <= r[3] + 1e-9)) { bR = R; best = [x, y] }
  }
  return { x: best, R: bR }
}
function rng(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 } }

const BOX = [[-3, -2.5], [3, -2.5], [3, 2.5], [-3, 2.5]]
const BOXCONS = [{ a: [-1, 0], b: 3 }, { a: [1, 0], b: 3 }, { a: [0, -1], b: 2.5 }, { a: [0, 1], b: 2.5 }]

function runCutting(method, K) {
  let poly = BOX, cons = [...BOXCONS]
  const steps = []
  for (let k = 0; k < K; k++) {
    let x, extra = null
    if (method === 'cg') x = centroid(poly)
    else if (method === 'ac') x = analyticCenter(cons, centroid(poly))
    else if (method === 'cheb') { const r = chebyshev(cons); x = r.x; extra = r.R }
    else { const r = rng(k + 7); const w = poly.map(() => r() ** 3); const s = w.reduce((a, b) => a + b, 0); x = poly.reduce((acc, p, i) => [acc[0] + (w[i] / s) * p[0], acc[1] + (w[i] / s) * p[1]], [0, 0]) }
    const g = g0(x)
    const b = dot(g, x)
    const next = clip(poly, g, b)
    steps.push({ poly, x, g, b, next, R: extra, area: area(poly), f: f0(x) })
    poly = next
    cons = [...cons, { a: g, b }]
    if (area(poly) < 1e-12) break
  }
  return steps
}

/* ================= 1. 2D 割平面法 ================= */
export function Ch15CuttingPlane() {
  const [method, setMethod] = useState('cg')
  const [k, setK] = useState(1)
  const steps = useMemo(() => runCutting(method, 25), [method])
  const s = steps[Math.min(k, steps.length) - 1]
  const d = [-s.g[1], s.g[0]]
  let fbest = Infinity
  for (let i = 0; i < Math.min(k, steps.length); i++) fbest = Math.min(fbest, steps[i].f)
  const ratio = area(s.next) / s.area
  const A0 = area(BOX)
  return (
    <Widget title="割平面法 Cutting-plane method（2D）"
      hint="灰色多边形 P_k 一定包含最优点 x*（绿点）。每一步在 P_k 的某种“中心”查询 oracle，得到 subgradient g，切线 gᵀ(z−x)=0 把 g 指向的那半边（红色）整个丢掉。点“下一步”观察多边形如何收缩；切换查询点的选择方式，比较面积缩小的速度。">
      <Tabs tabs={[{ value: 'cg', label: '重心 CG' }, { value: 'ac', label: 'Analytic center (ACCPM)' }, { value: 'cheb', label: 'Chebyshev center' }, { value: 'rand', label: '随便选一个点' }]} value={method} set={(m) => { setMethod(m); setK(1) }} />
      <Mafs viewBox={{ x: [-3.3, 3.3], y: [-2.8, 2.8] }} height={340} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        {LEVELS.map((p, i) => <Polygon key={i} points={p} color={Theme.indigo} fillOpacity={0} weight={1} />)}
        <Polygon points={s.poly} color={Theme.red} fillOpacity={0.15} weight={1} />
        {s.next.length > 2 && <Polygon points={s.next} color={Theme.blue} fillOpacity={0.15} weight={2} />}
        <Line.ThroughPoints point1={s.x} point2={[s.x[0] + d[0], s.x[1] + d[1]]} color={Theme.red} style="dashed" weight={1.5} />
        {method === 'cheb' && s.R > 0 && <Polygon points={ellipsePts(s.x, [[s.R * s.R, 0], [0, s.R * s.R]], 60)} color={Theme.orange} fillOpacity={0} weight={1.5} />}
        <Line.Segment point1={s.x} point2={[s.x[0] + 0.4 * s.g[0] / Math.hypot(...s.g), s.x[1] + 0.4 * s.g[1] / Math.hypot(...s.g)]} color={Theme.red} weight={3} />
        <Text x={s.x[0] + 0.5 * s.g[0] / Math.hypot(...s.g)} y={s.x[1] + 0.5 * s.g[1] / Math.hypot(...s.g)} size={13} color={Theme.red}>g</Text>
        <Point x={s.x[0]} y={s.x[1]} color={Theme.orange} />
        <Text x={s.x[0]} y={s.x[1]} attach="sw" size={12}>{`x(${k})`}</Text>
        <Point x={XS[0]} y={XS[1]} color={Theme.green} />
        <Text x={XS[0]} y={XS[1]} attach="se" size={12} color={Theme.green}>x*</Text>
      </Mafs>
      <div className="wrow">
        <button className="wbtn primary" onClick={() => setK(Math.min(k + 1, steps.length))} disabled={k >= steps.length}>下一步 →</button>
        <button className="wbtn" onClick={() => setK(Math.max(1, k - 1))}>← 上一步</button>
        <button className="wbtn" onClick={() => setK(1)}>重置</button>
        <button className="wbtn" onClick={() => setK(steps.length)}>跑完 {steps.length} 步</button>
      </div>
      <LogChart xMax={25} yMin={1e-8} yMax={100} xLabel="迭代 k" yLabel="面积 / f_best−f*"
        series={[
          { pts: steps.slice(0, k).map((t, i) => [i + 1, area(t.next)]), color: C.ink, width: 2.5, label: 'vol(P_k)' },
          { pts: steps.slice(0, k).map((t, i) => [i + 1, 0.632 ** (i + 1) * A0]), color: C.light, dash: true, label: 'CG 保证：0.632ᵏ·vol(P₀)' },
          { pts: (() => { let b = Infinity; return steps.slice(0, k).map((t, i) => { b = Math.min(b, t.f); return [i + 1, b] }) })(), color: C.red, label: 'f_best − f*' },
        ]} />
      <div className="wstat">
        <span className="chip info">第 {k} 步：查询 x = ({s.x[0].toFixed(2)}, {s.x[1].toFixed(2)})</span>
        <span className="chip">vol(P_k) = {s.area.toExponential(2)} → {area(s.next).toExponential(2)}</span>
        <span className={'chip ' + (ratio <= 0.632 ? 'good' : 'bad')}>本步保留比例 {ratio.toFixed(3)}</span>
        <span className="chip">f_best − f* = {fbest.toExponential(2)}（f* = 0）</span>
      </div>
    </Widget>
  )
}

/* ================= 2. 椭球法 ================= */
const CON_A = [1, 1] // 约束 f1(x) = x1 + x2 ≤ 0
const f1 = (x) => dot(CON_A, x)
const QINV = (() => { const det = Q[0][0] * Q[1][1] - Q[0][1] ** 2; return [[Q[1][1] / det, -Q[0][1] / det], [-Q[0][1] / det, Q[0][0] / det]] })()
const XC = (() => { const qa = [QINV[0][0] * CON_A[0] + QINV[0][1] * CON_A[1], QINV[1][0] * CON_A[0] + QINV[1][1] * CON_A[1]]; const t = f1(XS) / dot(CON_A, qa); return [XS[0] - t * qa[0], XS[1] - t * qa[1]] })()
const matv = (P, v) => [P[0][0] * v[0] + P[0][1] * v[1], P[1][0] * v[0] + P[1][1] * v[1]]
const detP = (P) => P[0][0] * P[1][1] - P[0][1] * P[1][0]

function runEllipsoid(mode, K) {
  let x = [-1.2, 1.4], P = [[16, 0], [0, 16]], fbest = Infinity
  const n = 2
  const steps = []
  for (let k = 0; k < K; k++) {
    let g, h, kind
    if (mode === 'con' && f1(x) > 0) { g = CON_A; h = f1(x); kind = 'feas' }
    else { g = g0(x); fbest = Math.min(fbest, f0(x)); h = mode === 'con' ? f0(x) - fbest : 0; kind = 'obj' }
    const Pg = matv(P, g)
    const sg = Math.sqrt(dot(g, Pg))
    const alpha = h / sg
    if (alpha > 1 || sg < 1e-12) { steps.push({ x, P, g, h, alpha, sg, kind, empty: true, fbest }); break }
    const gt = [g[0] / sg, g[1] / sg], Pgt = matv(P, gt)
    const xn = [x[0] - ((1 + alpha * n) / (n + 1)) * Pgt[0], x[1] - ((1 + alpha * n) / (n + 1)) * Pgt[1]]
    const c1 = (n * n * (1 - alpha * alpha)) / (n * n - 1), c2 = (2 * (1 + alpha * n)) / ((n + 1) * (1 + alpha))
    const Pn = [[c1 * (P[0][0] - c2 * Pgt[0] * Pgt[0]), c1 * (P[0][1] - c2 * Pgt[0] * Pgt[1])], [c1 * (P[1][0] - c2 * Pgt[1] * Pgt[0]), c1 * (P[1][1] - c2 * Pgt[1] * Pgt[1])]]
    steps.push({ x, P, g, h, alpha, sg, kind, xn, Pn, fbest, ratio: Math.sqrt(detP(Pn) / detP(P)) })
    x = xn; P = Pn
  }
  return steps
}

export function Ch15Ellipsoid() {
  const [mode, setMode] = useState('unc')
  const [k, setK] = useState(1)
  const steps = useMemo(() => runEllipsoid(mode, 40), [mode])
  const s = steps[Math.min(k, steps.length) - 1]
  const opt = mode === 'con' ? XC : XS
  const fstar = f0(opt)
  const d = [-s.g[1], s.g[0]]
  // 切线 gᵀ(z−x)+h = 0 上的一点
  const gg = dot(s.g, s.g)
  const p0 = [s.x[0] - (s.h * s.g[0]) / gg, s.x[1] - (s.h * s.g[1]) / gg]
  // 保留的半椭球（弧 + 弦）
  const pts = ellipsePts(s.x, s.P, 180)
  const keep = pts.map((p) => dot(s.g, [p[0] - s.x[0], p[1] - s.x[1]]) + s.h <= 0)
  let st = keep.findIndex((v) => !v)
  const half = []
  if (st >= 0) for (let i = 0; i < pts.length; i++) { const j = (st + i) % pts.length; if (keep[j]) half.push(pts[j]) }
  const ub = Math.max(0, mode === 'con' && s.kind === 'feas' ? NaN : s.sg)
  return (
    <Widget title="椭球法 Ellipsoid method（n = 2）"
      hint="灰色椭圆 E⁽ᵏ⁾ 包含 x*。在中心 x 处求 subgradient g，切线把椭圆切成两半，保留橙色半椭圆；红色虚线椭圆是覆盖这半块的最小体积椭圆 E⁽ᵏ⁺¹⁾。逐步点击，看体积比每步都 ≤ e^(−1/4) ≈ 0.779。切换到“带约束”看 feasibility cut / 深切（deep cut）。">
      <Tabs tabs={[{ value: 'unc', label: '无约束（neutral cut）' }, { value: 'con', label: '带约束 x₁+x₂ ≤ 0（deep cut）' }]} value={mode} set={(m) => { setMode(m); setK(1) }} />
      <Mafs viewBox={{ x: [-4.5, 4.5], y: [-3.4, 4.6] }} height={360} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        {LEVELS.map((p, i) => <Polygon key={i} points={p} color={Theme.indigo} fillOpacity={0} weight={1} />)}
        {mode === 'con' && <Plot.Inequality y={{ '<=': (x) => -x }} color={Theme.green} fillOpacity={0.06} weight={1.5} />}
        <Polygon points={pts} color={Theme.blue} fillOpacity={0.04} weight={2} />
        {half.length > 2 && <Polygon points={half} color={Theme.orange} fillOpacity={0.25} weight={0} />}
        <Line.ThroughPoints point1={p0} point2={[p0[0] + d[0], p0[1] + d[1]]} color={Theme.foreground} style="dashed" weight={1.5} opacity={0.6} />
        {s.Pn && <Polygon points={ellipsePts(s.xn, s.Pn, 120)} color={Theme.red} fillOpacity={0} strokeStyle="dashed" weight={2} />}
        <Line.Segment point1={s.x} point2={[s.x[0] + (0.6 * s.g[0]) / Math.sqrt(gg), s.x[1] + (0.6 * s.g[1]) / Math.sqrt(gg)]} color={Theme.red} weight={3} />
        <Point x={s.x[0]} y={s.x[1]} color={Theme.blue} />
        <Text x={s.x[0]} y={s.x[1]} attach="nw" size={12}>{`x(${k - 1})`}</Text>
        {s.xn && <Point x={s.xn[0]} y={s.xn[1]} color={Theme.red} />}
        {s.xn && <Text x={s.xn[0]} y={s.xn[1]} attach="se" size={12} color={Theme.red}>x⁺</Text>}
        <Point x={opt[0]} y={opt[1]} color={Theme.green} />
        <Text x={opt[0]} y={opt[1]} attach="ne" size={12} color={Theme.green}>x*</Text>
      </Mafs>
      <div className="wrow">
        <button className="wbtn primary" onClick={() => setK(Math.min(k + 1, steps.length))} disabled={k >= steps.length}>下一步 →</button>
        <button className="wbtn" onClick={() => setK(Math.max(1, k - 1))}>← 上一步</button>
        <button className="wbtn" onClick={() => setK(1)}>重置</button>
        <button className="wbtn" onClick={() => setK(Math.min(20, steps.length))}>跳到第 20 步</button>
      </div>
      <LogChart xMax={40} yMin={1e-8} yMax={100} xLabel="迭代 k" yLabel=""
        series={[
          { pts: steps.slice(0, k).map((t, i) => [i, Math.abs(f0(t.x) - fstar) + 1e-12]), color: C.light, width: 1.5, label: '|f₀(x⁽ᵏ⁾) − f*|' },
          { pts: steps.slice(0, k).filter((t) => t.kind === 'obj').map((t, i) => [steps.indexOf(t), t.sg]), color: C.ink, dash: true, label: '√(gᵀPg)（停止准则）' },
          { pts: steps.slice(0, k).map((t, i) => [i, Math.sqrt(detP(t.P))]), color: C.orange, label: 'vol(E⁽ᵏ⁾) ∝ √det P' },
        ]} />
      <div className="wstat">
        <span className="chip info">{s.kind === 'feas' ? 'x 不可行 → feasibility cut（deep）' : mode === 'con' ? (s.h > 1e-12 ? 'x 可行 → objective cut（deep，h = f₀(x) − f_best）' : 'x 可行且是目前最好 → neutral objective cut') : 'objective cut（neutral）'}</span>
        <span className="chip">α = h/√(gᵀPg) = {s.alpha.toFixed(3)}</span>
        {s.ratio !== undefined && <span className={'chip ' + (s.ratio < Math.exp(-0.25) ? 'good' : 'bad')}>体积比 vol(E⁺)/vol(E) = {s.ratio.toFixed(4)} &lt; e^(−1/4) = 0.7788</span>}
        {s.empty && <span className="chip bad">α &gt; 1：交集为空</span>}
        <span className="chip">√(gᵀPg) = {s.sg.toExponential(2)}</span>
        <span className="chip">f₀(x) − f* = {(f0(s.x) - fstar).toExponential(2)}</span>
        {!isNaN(ub) && s.kind === 'obj' && mode === 'unc' && <span className={'chip ' + (f0(s.x) - fstar <= s.sg + 1e-12 ? 'good' : 'bad')}>验证 f(x) − f* ≤ √(gᵀPg)</span>}
      </div>
    </Widget>
  )
}

/* ================= 3. 一维二分法 ================= */
const fb = (x) => Math.exp(0.8 * x) - 1.6 * x
const dfb = (x) => 0.8 * Math.exp(0.8 * x) - 1.6
const XB = Math.log(2) / 0.8

export function Ch15Bisection() {
  const [lr, setLr] = useState(-2) // log10 r
  const r = 10 ** lr
  const [k, setK] = useState(0)
  const hist = useMemo(() => {
    let l = -3, u = 3
    const h = [{ l, u }]
    while (u - l > 2 * r && h.length < 60) {
      const x = (l + u) / 2
      if (dfb(x) < 0) l = x; else u = x
      h.push({ l, u, x })
    }
    return h
  }, [r])
  const kk = Math.min(k, hist.length - 1)
  const cur = hist[kk]
  const nxt = hist[kk + 1]
  const mid = (cur.l + cur.u) / 2
  const pred = Math.ceil(Math.log2(6 / (2 * r)))
  const done = kk >= hist.length - 1
  return (
    <Widget title="一维二分法 Bisection on ℝ"
      hint="区间 [l, u] 一定包含最小点。每一步查询中点 x，看 f′(x) 的符号（切线斜率）：f′(x) < 0 说明最小点在右边，令 l := x；否则令 u := x。区间每步减半，直到 u − l ≤ 2r。调小容差 r，对比实际步数和公式。">
      <Mafs viewBox={{ x: [-3.3, 3.3], y: [-1, 6] }} height={290} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.OfX y={fb} color={Theme.blue} weight={2.5} />
        <Polygon points={[[cur.l, -0.6], [cur.u, -0.6], [cur.u, 6], [cur.l, 6]]} color={Theme.orange} fillOpacity={0.1} weight={0} />
        <Line.Segment point1={[cur.l, -0.6]} point2={[cur.u, -0.6]} color={Theme.orange} weight={6} />
        {!done && <Plot.OfX y={(x) => fb(mid) + dfb(mid) * (x - mid)} domain={[mid - 1, mid + 1]} color={dfb(mid) < 0 ? Theme.green : Theme.red} weight={2} />}
        {!done && <Point x={mid} y={fb(mid)} color={Theme.red} />}
        {!done && <Text x={mid} y={fb(mid)} attach="n" size={12}>{`x = ${mid.toFixed(3)}`}</Text>}
        <Point x={XB} y={fb(XB)} color={Theme.green} />
        <Text x={cur.l} y={-0.6} attach="sw" size={12}>l</Text>
        <Text x={cur.u} y={-0.6} attach="se" size={12}>u</Text>
      </Mafs>
      <div className="wrow">
        <button className="wbtn primary" onClick={() => setK(kk + 1)} disabled={done}>查询中点 →</button>
        <button className="wbtn" onClick={() => setK(0)}>重置</button>
        <button className="wbtn" onClick={() => setK(hist.length - 1)}>运行到结束</button>
        <Slider label="容差 r" value={lr} set={(v) => { setLr(v); setK(0) }} min={-4} max={-0.5} step={0.5} fmt={(v) => (10 ** v).toExponential(0)} />
      </div>
      <div className="wstat">
        <span className="chip info">第 {kk} 步：[l, u] = [{cur.l.toFixed(4)}, {cur.u.toFixed(4)}]，长度 {(cur.u - cur.l).toExponential(2)}</span>
        {!done && <span className={'chip ' + (dfb(mid) < 0 ? 'good' : 'bad')}>f′(x) = {dfb(mid).toFixed(3)} ⇒ {dfb(mid) < 0 ? 'l := x' : 'u := x'}</span>}
        {done && <span className="chip good">u − l ≤ 2r，停止；中点误差 ≤ r</span>}
        <span className="chip">实际总步数 {hist.length - 1}，公式 ⌈log₂((u₀−l₀)/(2r))⌉ = {pred}</span>
      </div>
    </Widget>
  )
}

/* ================= 4. 体积缩小速度与维数 ================= */
export function Ch15VolumeRace() {
  const [n, setN] = useState(2)
  const K = 200
  const ell = Array.from({ length: K + 1 }, (_, k) => [k, Math.exp(-k / (2 * n))])
  const exact = (n / (n + 1)) * Math.pow((n * n) / (n * n - 1 || 1), (n - 1) / 2)
  const ellEx = Array.from({ length: K + 1 }, (_, k) => [k, n === 1 ? 0.5 ** k : exact ** k])
  const cg = Array.from({ length: K + 1 }, (_, k) => [k, (1 - 1 / Math.E) ** k])
  const need = (q) => Math.ceil(Math.log(1e6) / -Math.log(q))
  return (
    <Widget title="体积缩小速度 vs. 维数 n"
      hint="纵轴是 vol(第 k 步)/vol(初始)。灰色：重心法的保证 (1−1/e)ᵏ，与维数无关；橙色/黑色：椭球法的界 e^(−k/(2n)) 与精确因子。把 n 从 2 拖到 50，看椭球法变得多慢。">
      <div className="wrow">
        <Slider label="维数 n" value={n} set={setN} min={1} max={50} step={1} fmt={(v) => v.toFixed(0)} />
      </div>
      <LogChart xMax={K} yMin={1e-12} yMax={1} xLabel="迭代 k" yLabel="体积比"
        series={[
          { pts: cg, color: C.light, width: 2, label: 'CG：(1 − 1/e)ᵏ' },
          { pts: ell, color: C.orange, dash: true, label: '椭球界：e^(−k/(2n))' },
          { pts: ellEx, color: C.ink, label: '椭球精确因子ᵏ' },
        ]} />
      <div className="wstat">
        <span className="chip info">n = {n}：每步因子 {n === 1 ? '0.5（就是二分法）' : exact.toFixed(4)}，界 e^(−1/(2n)) = {Math.exp(-1 / (2 * n)).toFixed(4)}</span>
        <span className="chip">体积缩小 10⁶ 倍：椭球法约 {need(n === 1 ? 0.5 : exact)} 步，CG 约 {need(1 - 1 / Math.E)} 步</span>
      </div>
    </Widget>
  )
}
