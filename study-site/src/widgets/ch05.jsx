// 第 5 章交互组件：拟凸问题与线性规划
import { useState, useMemo, useEffect, useRef } from 'react'
import { Mafs, Coordinates, Plot, Point, Line, Polygon, Circle, Vector, Text, Theme, useMovablePoint } from 'mafs'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'

const f2 = (v) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2)

// Sutherland–Hodgman：用半平面 g·p <= c 裁剪多边形
function clip(poly, g, c) {
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length]
    const fp = g[0] * P[0] + g[1] * P[1] - c, fq = g[0] * Q[0] + g[1] * Q[1] - c
    if (fp <= 0) out.push(P)
    if ((fp < 0) !== (fq < 0) && fp !== fq) {
      const s = fp / (fp - fq)
      out.push([P[0] + s * (Q[0] - P[0]), P[1] + s * (Q[1] - P[1])])
    }
  }
  return out
}
const rect = ([x0, x1], [y0, y1]) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]

/* ================= 1. 拟凸问题的二分法 ================= */
// f0(x) = p(x)/q(x)，p(x) = (x-1)^2 + 1（凸），q(x) = x + 1（仿射，故凹），定义域 x > -1
const BP = (x) => (x - 1) ** 2 + 1
const BQ = (x) => x + 1
const BF = (x) => BP(x) / BQ(x)
function bisFeasible(t, lo, hi) {
  // 凸可行性问题：是否存在 x∈[lo,hi] 使 φ_t(x) = p(x) − t q(x) <= 0
  let best = Infinity, arg = null
  for (let k = 0; k <= 600; k++) {
    const x = lo + ((hi - lo) * k) / 600
    const v = BP(x) - t * BQ(x)
    if (v < best) { best = v; arg = x }
  }
  return { ok: best <= 0, x: arg }
}
export function Ch05Bisection() {
  const [lo, setLo] = useState(0)
  const [hi, setHi] = useState(4.5)
  const [eps, setEps] = useState(0.02)
  const [view, setView] = useState('f')
  const l0 = 0
  const u0 = BF(hi)
  const [st, setSt] = useState({ l: l0, u: u0, hist: [] })
  const [auto, setAuto] = useState(false)
  const pstar = useMemo(() => {
    let b = Infinity
    for (let k = 0; k <= 2000; k++) b = Math.min(b, BF(lo + ((hi - lo) * k) / 2000))
    return b
  }, [lo, hi])
  const reset = () => { setSt({ l: l0, u: BF(hi), hist: [] }); setAuto(false) }
  useEffect(reset, [lo, hi, eps])
  const done = st.u - st.l <= eps
  const step = () => {
    setSt((s) => {
      if (s.u - s.l <= eps) return s
      const t = (s.l + s.u) / 2
      const r = bisFeasible(t, lo, hi)
      return { l: r.ok ? s.l : t, u: r.ok ? t : s.u, hist: [...s.hist, { t, ok: r.ok, x: r.x, l: s.l, u: s.u }] }
    })
  }
  const timer = useRef(null)
  useEffect(() => {
    if (!auto) return
    timer.current = setInterval(step, 600)
    return () => clearInterval(timer.current)
  }, [auto, lo, hi, eps])
  useEffect(() => { if (done) setAuto(false) }, [done])
  const last = st.hist[st.hist.length - 1]
  const t = last ? last.t : (st.l + st.u) / 2
  const fe = bisFeasible(t, lo, hi)
  const kPred = Math.ceil(Math.log2((u0 - l0) / eps))
  // 可行 x 的集合 {x∈[lo,hi]: f0(x) <= t}
  const segs = []
  let cur = null
  for (let k = 0; k <= 400; k++) {
    const x = lo + ((hi - lo) * k) / 400
    if (BF(x) <= t) { if (!cur) cur = [x, x]; else cur[1] = x } else if (cur) { segs.push(cur); cur = null }
  }
  if (cur) segs.push(cur)
  const phi = (x) => BP(x) - t * BQ(x)
  // 数轴映射
  const W = 600, X = (v) => 20 + ((W - 40) * v) / u0
  return (
    <Widget title="二分法求解拟凸问题" hint="目标 f₀(x) = ((x−1)²+1)/(x+1) 是“凸/凹”比值，拟凸。每一步取 t=(l+u)/2，问：是否存在可行 x 使 f₀(x) ≤ t？（等价于 φₜ(x)=p(x)−t·q(x) ≤ 0，一个凸可行性问题）。可行就把 u 压下来，不可行就把 l 抬上去。点“单步”看区间如何每次减半。">
      <Tabs tabs={[{ value: 'f', label: '看 f₀(x) 与水平线 t' }, { value: 'phi', label: '看 φₜ(x) = p(x) − t·q(x)' }]} value={view} set={setView} />
      <Mafs viewBox={{ x: [-0.9, 6], y: view === 'f' ? [-0.4, 3.6] : [-4, 6] }} height={280} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={false} />
        <Polygon points={[[lo, -10], [hi, -10], [hi, 30], [lo, 30]]} color={Theme.indigo} fillOpacity={0.08} weight={0} />
        {view === 'f' ? (
          <>
            <Plot.OfX y={BF} domain={[-0.85, 6]} color={Theme.blue} weight={3} />
            <Line.ThroughPoints point1={[0, t]} point2={[1, t]} color={fe.ok ? Theme.green : Theme.red} style="dashed" />
            <Text x={5.4} y={t} attach="n" size={13} color={fe.ok ? Theme.green : Theme.red}>t = {t.toFixed(3)}</Text>
          </>
        ) : (
          <>
            <Plot.OfX y={phi} domain={[-0.85, 6]} color={Theme.orange} weight={3} />
            <Line.ThroughPoints point1={[0, 0]} point2={[1, 0]} color={Theme.indigo} />
            <Text x={5.2} y={phi(5.2)} attach="e" size={13} color={Theme.orange}>φₜ</Text>
          </>
        )}
        {segs.map((s, i) => <Line.Segment key={i} point1={[s[0], 0]} point2={[s[1], 0]} color={Theme.green} weight={6} />)}
        {fe.ok && <Point x={fe.x} y={view === 'f' ? BF(fe.x) : phi(fe.x)} color={Theme.green} />}
      </Mafs>
      <svg viewBox={`0 0 ${W} 64`} style={{ width: '100%', marginTop: 8 }}>
        <line x1={X(0)} y1={30} x2={X(u0)} y2={30} stroke="#aeaeb2" strokeWidth={2} />
        <rect x={X(st.l)} y={22} width={Math.max(1, X(st.u) - X(st.l))} height={16} fill="#ff9500" opacity={0.35} />
        <line x1={X(pstar)} y1={14} x2={X(pstar)} y2={46} stroke="#34c759" strokeWidth={2} />
        <text x={X(pstar)} y={60} fontSize={12} textAnchor="middle" fill="#34c759">p* ≈ {pstar.toFixed(3)}</text>
        <text x={X(st.l)} y={14} fontSize={12} textAnchor="middle" fill="#1d1d1f">l</text>
        <text x={X(st.u)} y={14} fontSize={12} textAnchor="middle" fill="#1d1d1f">u</text>
        <text x={X(0)} y={60} fontSize={11} fill="#636366">0</text>
        <text x={X(u0)} y={60} fontSize={11} textAnchor="end" fill="#636366">{u0.toFixed(2)}</text>
      </svg>
      <div className="wrow">
        <button className="wbtn primary" onClick={step} disabled={done}>单步</button>
        <button className="wbtn" onClick={() => setAuto(!auto)} disabled={done}>{auto ? '暂停' : '自动运行'}</button>
        <button className="wbtn" onClick={reset}>重置</button>
        <Slider label="ε" value={eps} set={setEps} min={0.005} max={0.3} step={0.005} fmt={(v) => v.toFixed(3)} />
      </div>
      <div className="wrow">
        <Slider label="可行域下界" value={lo} set={setLo} min={-0.5} max={3} step={0.05} />
        <Slider label="可行域上界" value={hi} set={(v) => setHi(Math.max(v, lo + 0.3))} min={0.5} max={5.5} step={0.05} />
      </div>
      <div className="wstat">
        <span className="chip info">[l, u] = [{st.l.toFixed(4)}, {st.u.toFixed(4)}]</span>
        <span className="chip info">u − l = {(st.u - st.l).toFixed(4)}</span>
        <span className="chip info">已迭代 k = {st.hist.length}</span>
        <span className="chip info">理论次数 ⌈log₂((u−l)/ε)⌉ = {kPred}</span>
        {last && <span className={`chip ${last.ok ? 'good' : 'bad'}`}>t = {last.t.toFixed(4)}：{last.ok ? '可行 → p* ≤ t，令 u := t' : '不可行 → p* > t，令 l := t'}</span>}
        {done && <span className="chip good">u − l ≤ ε，停止。p* 落在 [l, u] 里 ✓</span>}
      </div>
      {st.hist.length > 0 && (
        <div className="legend-inline" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }}>
          {st.hist.slice(-6).map((h, i) => (
            <div key={i}>k={st.hist.length - Math.min(6, st.hist.length) + i + 1}: t={h.t.toFixed(4)} {h.ok ? '可行  ' : '不可行'} 区间 [{h.l.toFixed(4)}, {h.u.toFixed(4)}] → 长度减半</div>
          ))}
        </div>
      )}
    </Widget>
  )
}

/* ================= 2. 二维 LP：拖动 c 看最优顶点跳变 ================= */
const LP_VIEW = { x: [-3.6, 3.6], y: [-2.8, 2.8] }
const LP_POLY = [[-2.2, 0.4], [-1.6, -1.6], [0.6, -2.1], [2.2, -0.8], [2.2, 0.6], [0.6, 1.8]]
const UB_H = [[[-1, 0], 1.5], [[0, -1], 1.5], [[-1, -1], 1.8]] // 无界区域：x1>=-1.5, x2>=-1.5, x1+x2>=-1.8
const UB_V = [[-1.5, -0.3], [-0.3, -1.5]]
function LPInner({ mode }) {
  const bounded = mode === 'b'
  const T = [-3, 2.2]
  // 所有边的外法向（用于“吸附”：让 −c 与某条边的外法向平行）
  const normals = bounded
    ? LP_POLY.map((a, i) => { const b = LP_POLY[(i + 1) % LP_POLY.length]; const n = [b[1] - a[1], -(b[0] - a[0])]; const L = Math.hypot(...n); return [n[0] / L, n[1] / L] })
    : UB_H.map(([g]) => { const L = Math.hypot(...g); return [g[0] / L, g[1] / L] })
  const tip = useMovablePoint([T[0] + 0.5, T[1] - 0.9], {
    color: Theme.orange,
    constrain: ([x, y]) => {
      const d = [x - T[0], y - T[1]], L = Math.hypot(...d)
      if (L < 1e-6) return [x, y]
      for (const n of normals) {
        const cosang = (-n[0] * d[0] - n[1] * d[1]) / L
        if (cosang > Math.cos((3 * Math.PI) / 180)) return [T[0] - n[0] * L, T[1] - n[1] * L]
      }
      return [x, y]
    },
  })
  const c = [tip.x - T[0], tip.y - T[1]]
  const cn = Math.hypot(...c)
  const V = bounded ? LP_POLY : UB_V
  const vals = V.map((v) => c[0] * v[0] + c[1] * v[1])
  const unbounded = !bounded && (c[0] < -1e-6 || c[1] < -1e-6)
  const pmin = Math.min(...vals)
  const tol = 1e-6 + 1e-4 * cn
  const optIdx = vals.map((v, i) => (Math.abs(v - pmin) <= tol ? i : -1)).filter((i) => i >= 0)
  const region = bounded ? LP_POLY : UB_H.reduce((P, [g, b]) => clip(P, g, b), rect([-4, 4], [-3, 3]))
  // 等值线 c^T x = k
  const ks = []
  if (cn > 1e-6) for (let j = -6; j <= 6; j++) ks.push(pmin + j * 0.9 * cn)
  const onRay = !bounded && !unbounded && (Math.abs(c[0]) < 1e-6 || Math.abs(c[1]) < 1e-6)
  const xs = V[optIdx[0]]
  return (
    <>
      <Mafs viewBox={LP_VIEW} height={360} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={false} />
        <Polygon points={region} color={Theme.blue} fillOpacity={0.12} weight={bounded ? 2 : 1} />
        {ks.map((k, i) => (
          <Line.PointAngle key={i} point={[(k * c[0]) / (cn * cn), (k * c[1]) / (cn * cn)]} angle={Math.atan2(c[1], c[0]) + Math.PI / 2}
            color={i === 6 && !unbounded ? Theme.green : '#aeaeb2'} style={i === 6 && !unbounded ? 'solid' : 'dashed'} weight={i === 6 && !unbounded ? 2.5 : 1} />
        ))}
        {!unbounded && optIdx.length === 2 && <Line.Segment point1={V[optIdx[0]]} point2={V[optIdx[1]]} color={Theme.green} weight={6} />}
        {!unbounded && optIdx.map((i) => <Point key={i} x={V[i][0]} y={V[i][1]} color={Theme.green} />)}
        {!unbounded && cn > 1e-6 && <Vector tail={xs} tip={[xs[0] - (0.9 * c[0]) / cn, xs[1] - (0.9 * c[1]) / cn]} color={Theme.red} />}
        {!unbounded && cn > 1e-6 && <Text x={xs[0] - (0.9 * c[0]) / cn} y={xs[1] - (0.9 * c[1]) / cn} attach="ne" size={13} color={Theme.red}>−c</Text>}
        <Vector tail={T} tip={tip.point} color={Theme.orange} />
        <Text x={T[0]} y={T[1]} attach="nw" size={13} color={Theme.orange}>c</Text>
        {tip.element}
      </Mafs>
      <div className="wstat">
        <span className="chip info">c = ({f2(c[0])}, {f2(c[1])})</span>
        {unbounded
          ? <span className="chip bad">c 有负分量 → 沿区域的无界方向 cᵀx → −∞，p* = −∞（无下界）</span>
          : <>
              <span className="chip good">p* = min cᵀx = {f2(pmin)}</span>
              <span className={`chip ${optIdx.length > 1 || onRay ? 'info' : 'good'}`}>
                {onRay ? '最优点集是一条射线（−c 与无界边垂直方向平行）' : optIdx.length > 1 ? '−c 垂直于一条边：整条边都是最优的' : `最优解在顶点 x* = (${f2(xs[0])}, ${f2(xs[1])})`}
              </span>
            </>}
      </div>
      <div className="legend-inline"><i style={{ background: '#aeaeb2' }} />等值线 cᵀx = 常数（彼此平行，法向是 c）<i style={{ background: Theme.green }} />最后一条碰到可行域的等值线</div>
    </>
  )
}
export function Ch05LP2D() {
  const [mode, setMode] = useState('b')
  return (
    <Widget title="线性规划的几何：最优解在顶点" hint="拖动橙色箭头的端点改变 c。最小化 cᵀx = 沿 −c 方向把等值线往前推，最后碰到的点就是 x*。慢慢转动 c，观察 x* 在顶点间“跳”；当 −c 正好垂直于某条边时（会自动吸附），整条边都最优。切到“无界区域”试试让 c 有负分量。">
      <Tabs tabs={[{ value: 'b', label: '有界多面体' }, { value: 'u', label: '无界区域 x₁≥−1.5, x₂≥−1.5, x₁+x₂≥−1.8' }]} value={mode} set={setMode} />
      <LPInner key={mode} mode={mode} />
    </Widget>
  )
}

/* ================= 3. Chebyshev center ================= */
function hull(pts) {
  const P = pts.map((p) => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower = [], upper = []
  for (const p of P) { while (lower.length >= 2 && cr(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p) }
  for (const p of [...P].reverse()) { while (upper.length >= 2 && cr(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p) }
  return lower.slice(0, -1).concat(upper.slice(0, -1)) // 逆时针
}
function det3(m) {
  return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
}
function solve3(A, b) {
  const D = det3(A)
  if (Math.abs(D) < 1e-9) return null
  return [0, 1, 2].map((k) => det3(A.map((row, i) => row.map((v, j) => (j === k ? b[i] : v)))) / D)
}
// LP：max r s.t. a_i^T xc + r||a_i|| <= b_i，r >= 0 —— 枚举 3 个约束取等号的顶点
function chebyshev(H) {
  const rows = H.map(([a, b]) => [a[0], a[1], Math.hypot(a[0], a[1]), b])
  rows.push([0, 0, -1, 0])
  let best = null
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) for (let k = j + 1; k < rows.length; k++) {
    const R = [rows[i], rows[j], rows[k]]
    const s = solve3(R.map((r) => r.slice(0, 3)), R.map((r) => r[3]))
    if (!s) continue
    if (rows.every((r) => r[0] * s[0] + r[1] * s[1] + r[2] * s[2] <= r[3] + 1e-7) && (!best || s[2] > best[2] + 1e-9)) best = s
  }
  return best
}
export function Ch05Chebyshev() {
  const pts = [
    useMovablePoint([-2.4, 0.9], { color: Theme.orange }),
    useMovablePoint([-1.6, -1.8], { color: Theme.orange }),
    useMovablePoint([1.4, -2.0], { color: Theme.orange }),
    useMovablePoint([2.6, 0.2], { color: Theme.orange }),
    useMovablePoint([0.4, 2.1], { color: Theme.orange }),
  ]
  const V = hull(pts.map((p) => p.point))
  const H = V.map((a, i) => {
    const b = V[(i + 1) % V.length]
    const n = [b[1] - a[1], -(b[0] - a[0])] // 逆时针时的外法向
    return [n, n[0] * a[0] + n[1] * a[1]]
  })
  const sol = V.length >= 3 ? chebyshev(H) : null
  const xc = sol ? [sol[0], sol[1]] : [0, 0]
  const r = sol ? sol[2] : 0
  const active = sol ? H.map(([a, b], i) => ({ i, a, s: b - a[0] * xc[0] - a[1] * xc[1] - r * Math.hypot(...a) })).filter((o) => Math.abs(o.s) < 1e-4 * Math.max(1, Math.hypot(...o.a))) : []
  return (
    <Widget title="Chebyshev 中心：多面体里最大的内切圆" hint="拖动 5 个橙色顶点（取凸包作为多面体 P）。程序在每一帧都解 LP：max r s.t. aᵢᵀx_c + r‖aᵢ‖₂ ≤ bᵢ。红色箭头是“最危险方向” u* = r·aᵢ/‖aᵢ‖₂ —— 圆正好在这些方向碰到边。试着把多边形拉得很扁，看圆怎么变。">
      <Mafs viewBox={{ x: [-4, 4], y: [-3, 3] }} height={360} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={false} />
        {V.length >= 3 && <Polygon points={V} color={Theme.blue} fillOpacity={0.1} />}
        {sol && <Circle center={xc} radius={r} color={Theme.green} fillOpacity={0.15} />}
        {sol && <Point x={xc[0]} y={xc[1]} color={Theme.green} />}
        {sol && <Text x={xc[0]} y={xc[1]} attach="ne" size={13} color={Theme.green}>x_cheb</Text>}
        {active.map(({ i, a }) => {
          const L = Math.hypot(...a)
          return <Vector key={i} tail={xc} tip={[xc[0] + (r * a[0]) / L, xc[1] + (r * a[1]) / L]} color={Theme.red} />
        })}
        {pts.map((p, i) => <g key={i}>{p.element}</g>)}
      </Mafs>
      <div className="wstat">
        <span className="chip info">约束个数 m = {V.length}</span>
        {sol && <span className="chip good">r* = {r.toFixed(3)}</span>}
        {sol && <span className="chip good">x_cheb = ({f2(xc[0])}, {f2(xc[1])})</span>}
        <span className="chip info">取等号（紧）的约束：{active.length} 条</span>
      </div>
      <div className="legend-inline">在 2 维里，LP 的变量是 (x_c, r) 共 3 个，所以最优解一般有 3 条约束取等号——圆一般同时碰到 3 条边。</div>
    </Widget>
  )
}

/* ================= 4. 分段线性最小化 → LP（上境图） ================= */
export function Ch05PiecewiseLinear() {
  const [a3, setA3] = useState(0.5)
  const A = [-1, -0.25, a3, 1.4]
  const B = [0.4, 1.1, 0.7, -1.4]
  const cols = [Theme.blue, Theme.violet, Theme.orange, Theme.pink]
  const F = (x) => Math.max(...A.map((a, i) => a * x + B[i]))
  // 最优：在所有两两交点中取 F 最小者
  const opt = useMemo(() => {
    let best = null
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      if (Math.abs(A[i] - A[j]) < 1e-9) continue
      const x = (B[j] - B[i]) / (A[i] - A[j])
      if (!best || F(x) < best[1]) best = [x, F(x)]
    }
    return best
  }, [a3])
  const P = useMovablePoint([1.8, 2.6], { color: Theme.green, constrain: ([x, t]) => [Math.max(-3.4, Math.min(3.4, x)), Math.min(4.3, t)] })
  const sat = A.map((a, i) => P.y >= a * P.x + B[i] - 1e-9)
  return (
    <Widget title="分段线性最小化：min maxᵢ(aᵢx+bᵢ) 变成 LP" hint="灰色阴影 = max 函数的上境图。拖动绿色点 (x, t)：只有当 t ≥ 每一条直线时（四个约束全部满足），点才在阴影里。再按“压低 t”，t 会贴到 max 曲线上；按“最优”跳到 LP 的解。滑块改变第 3 条直线的斜率。">
      <Mafs viewBox={{ x: [-3.5, 3.5], y: [-1.2, 4.5] }} height={320} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={false} />
        <Plot.Inequality y={{ '>=': F, '<=': () => 6 }} color={Theme.indigo} fillOpacity={0.1} weight={0} />
        {A.map((a, i) => <Plot.OfX key={i} y={(x) => a * x + B[i]} color={cols[i]} weight={1.5} style="dashed" />)}
        <Plot.OfX y={F} color={Theme.blue} weight={3.5} />
        <Point x={opt[0]} y={opt[1]} color={Theme.red} />
        <Text x={opt[0]} y={opt[1]} attach="s" size={13} color={Theme.red}>(x*, t*)</Text>
        {P.element}
      </Mafs>
      <div className="wrow">
        <Slider label={<M>{'a_3'}</M>} value={a3} set={setA3} min={-0.2} max={1.2} />
        <button className="wbtn" onClick={() => P.setPoint([P.x, F(P.x)])}>压低 t</button>
        <button className="wbtn primary" onClick={() => P.setPoint(opt)}>最优</button>
      </div>
      <div className="wstat">
        {sat.map((ok, i) => (
          <span key={i} className={`chip ${ok ? 'good' : 'bad'}`} style={{ borderLeft: `4px solid ${cols[i]}` }}>
            t ≥ a{i + 1}x + b{i + 1} {ok ? '✓' : '✗'}
          </span>
        ))}
        <span className="chip info">t = {P.y.toFixed(3)}，max = {F(P.x).toFixed(3)}</span>
        <span className="chip good">t* = {opt[1].toFixed(3)} 在 x* = {opt[0].toFixed(3)}</span>
      </div>
    </Widget>
  )
}
