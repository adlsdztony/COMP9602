// 第 6 章交互组件：ILP · QP · SOCP · GP · SDP · 多目标
import { useState, useMemo, useRef, useEffect } from 'react'
import { Mafs, Coordinates, Point, Line, Polygon, Ellipse, Circle, Vector, Text, Theme, useMovablePoint } from 'mafs'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'
import { ch04InPoly, ch04ProjSeg } from './ch04.jsx'

const f2 = (v) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2)
const GRAY = '#636366', LIGHT = '#aeaeb2', INK = '#1d1d1f', ORANGE = '#ff9500', RED = '#ff3b30', GREEN = '#34c759'

/* ================= 1. ILP vs LP 松弛 ================= */
const ILP_POLYS = {
  frac: [[0, 0], [4.6, 0], [4.1, 1.75], [2.6, 2.5], [0, 2.5]],
  tu: [[0, 0], [3, 0], [4, 1], [4, 2], [2, 3], [0, 2]],
}
export function Ch06ILP() {
  const [mode, setMode] = useState('frac')
  const [ang, setAng] = useState(30)
  const V = ILP_POLYS[mode]
  const d = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)] // d = −c
  const c = [-d[0], -d[1]]
  const val = (p) => c[0] * p[0] + c[1] * p[1]
  const lp = V.reduce((b, v) => (val(v) < val(b) - 1e-9 ? v : b), V[0])
  const pts = []
  for (let i = -1; i <= 6; i++) for (let j = -1; j <= 4; j++) pts.push([i, j])
  const feas = pts.filter((p) => ch04InPoly(p, V))
  const ip = feas.reduce((b, p) => (val(p) < val(b) - 1e-9 ? p : b), feas[0])
  const rnd = [Math.round(lp[0]), Math.round(lp[1])]
  const rndFeas = ch04InPoly(rnd, V)
  const same = Math.abs(lp[0] - ip[0]) < 1e-9 && Math.abs(lp[1] - ip[1]) < 1e-9
  return (
    <Widget title="整数规划 vs LP 松弛" hint="黑点是格点（整数点），灰色多边形是 LP 松弛的可行集。转动 −c 的方向：红点是 LP 最优（总在顶点），橙点是 ILP 最优（最好的格点）。在“分数顶点”多边形里两者常常不同，“四舍五入”LP 解甚至可能不可行；切到“整数顶点”多边形，两者永远重合。">
      <Tabs tabs={[{ value: 'frac', label: '一般多面体（分数顶点）' }, { value: 'tu', label: '整数顶点多面体（如 TU 约束）' }]} value={mode} set={setMode} />
      <Mafs viewBox={{ x: [-1, 6], y: [-1, 3.6] }} height={300} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={false} />
        <Polygon points={V} color={Theme.blue} fillOpacity={0.1} />
        {[-2, -1, 0, 1, 2].map((k) => {
          const v0 = val(lp) + k * 0.8
          return <Line.PointAngle key={k} point={[v0 * c[0], v0 * c[1]]} angle={Math.atan2(c[1], c[0]) + Math.PI / 2} color={k === 0 ? RED : LIGHT} style="dashed" weight={k === 0 ? 2 : 1} />
        })}
        {pts.map((p, i) => <Point key={i} x={p[0]} y={p[1]} color={ch04InPoly(p, V) ? INK : '#e5e5ea'} />)}
        <Point x={rnd[0]} y={rnd[1]} color={rndFeas ? GRAY : RED} />
        <Point x={ip[0]} y={ip[1]} color={Theme.orange} />
        <Point x={lp[0]} y={lp[1]} color={Theme.red} />
        <Vector tail={[5.2, 2.6]} tip={[5.2 + 0.7 * d[0], 2.6 + 0.7 * d[1]]} color={Theme.red} />
        <Text x={5.2} y={2.6} attach="w" size={13} color={Theme.red}>−c</Text>
      </Mafs>
      <div className="wrow"><Slider label="−c 的角度" value={ang} set={setAng} min={-20} max={110} step={1} fmt={(v) => v + '°'} /></div>
      <div className="wstat">
        <span className="chip info">LP 最优 ({f2(lp[0])}, {f2(lp[1])})，值 {val(lp).toFixed(3)}</span>
        <span className="chip info">ILP 最优 ({ip[0]}, {ip[1]})，值 {val(ip).toFixed(3)}</span>
        <span className={`chip ${same ? 'good' : 'bad'}`}>{same ? 'LP 松弛是精确的（exact）：LP 解本身就是整数' : `差距 OPT − OPT_f = ${(val(ip) - val(lp)).toFixed(3)} > 0`}</span>
        <span className={`chip ${rndFeas ? 'info' : 'bad'}`}>四舍五入 LP 解 → ({rnd[0]}, {rnd[1]}) {rndFeas ? (rnd[0] === ip[0] && rnd[1] === ip[1] ? '恰好最优' : '可行但不一定最优') : '不可行！'}</span>
      </div>
    </Widget>
  )
}

/* ================= 2. 最小顶点覆盖：LP 松弛 + 取整 ================= */
const VC_GRAPHS = {
  tri: { label: '三角形', pos: [[150, 30], [60, 170], [240, 170]], E: [[0, 1], [1, 2], [0, 2]] },
  c5: { label: '五边形 C₅', pos: [[150, 20], [260, 95], [215, 190], [85, 190], [40, 95]], E: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] },
  star: { label: '星形', pos: [[150, 105], [150, 20], [260, 105], [150, 190], [40, 105]], E: [[0, 1], [0, 2], [0, 3], [0, 4]] },
  path: { label: '路径 + 三角', pos: [[30, 160], [100, 60], [170, 160], [240, 60], [280, 170], [210, 200]], E: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 3]] },
}
function vcSolve(n, E) {
  // ILP：枚举 {0,1}^n；LP：最优解总是半整数，枚举 {0, 1/2, 1}^n 即精确
  let opt = Infinity
  for (let m = 0; m < 1 << n; m++) {
    if (E.every(([i, j]) => ((m >> i) & 1) + ((m >> j) & 1) >= 1)) {
      let s = 0
      for (let i = 0; i < n; i++) s += (m >> i) & 1
      opt = Math.min(opt, s)
    }
  }
  let best = null, bv = Infinity
  const x = new Array(n).fill(0)
  const total = 3 ** n
  for (let k = 0; k < total; k++) {
    let t = k
    for (let i = 0; i < n; i++) { x[i] = (t % 3) / 2; t = Math.floor(t / 3) }
    if (!E.every(([i, j]) => x[i] + x[j] >= 1)) continue
    const s = x.reduce((a, b) => a + b, 0)
    if (s < bv - 1e-9) { bv = s; best = [...x] }
  }
  return { opt, lp: best, lpv: bv }
}
export function Ch06VertexCover() {
  const [g, setG] = useState('tri')
  const G = VC_GRAPHS[g]
  const n = G.pos.length
  const [sel, setSel] = useState(() => new Array(8).fill(false))
  const [showLP, setShowLP] = useState(false)
  const sol = useMemo(() => vcSolve(n, G.E), [g])
  const pick = (k) => { setG(k); setSel(new Array(8).fill(false)); setShowLP(false) }
  const cover = sel.slice(0, n)
  const viol = G.E.filter(([i, j]) => !cover[i] && !cover[j])
  const size = cover.filter(Boolean).length
  const rounded = sol.lp.map((v) => (v >= 0.5 ? 1 : 0))
  const rsize = rounded.reduce((a, b) => a + b, 0)
  return (
    <Widget title="最小顶点覆盖：ILP、LP 松弛与 2-近似" hint="点击顶点把它选入/移出覆盖集，红边表示还没被覆盖（违反 xᵢ + xⱼ ≥ 1）。然后点“解 LP 松弛”：节点上显示 LP 最优解（只会是 0、½、1），再按 xᵢ ≥ ½ 取整得到一个覆盖。看看三角形上近似比是多少——永远不超过 2。">
      <Tabs tabs={Object.entries(VC_GRAPHS).map(([k, v]) => ({ value: k, label: v.label }))} value={g} set={pick} />
      <svg viewBox="0 0 300 215" style={{ width: '100%', maxWidth: 460, display: 'block', margin: '8px auto' }}>
        {G.E.map(([i, j], k) => {
          const bad = !showLP && viol.some(([a, b]) => a === i && b === j)
          return <line key={k} x1={G.pos[i][0]} y1={G.pos[i][1]} x2={G.pos[j][0]} y2={G.pos[j][1]} stroke={bad ? RED : LIGHT} strokeWidth={bad ? 3 : 2} />
        })}
        {G.pos.map((p, i) => {
          const on = showLP ? rounded[i] === 1 : cover[i]
          return (
            <g key={i} style={{ cursor: 'pointer' }} onClick={() => { if (!showLP) { const s = [...sel]; s[i] = !s[i]; setSel(s) } }}>
              <circle cx={p[0]} cy={p[1]} r={15} fill={on ? ORANGE : '#fff'} stroke={INK} strokeWidth={1.5} />
              <text x={p[0]} y={p[1] + 4} fontSize={12} textAnchor="middle" fill={INK}>{showLP ? (sol.lp[i] === 0.5 ? '½' : sol.lp[i]) : i + 1}</text>
            </g>
          )
        })}
      </svg>
      <div className="wrow">
        <button className={`wbtn ${showLP ? '' : 'primary'}`} onClick={() => setShowLP(!showLP)}>{showLP ? '回到手动选择' : '解 LP 松弛并取整'}</button>
      </div>
      <div className="wstat">
        {!showLP && <span className={`chip ${viol.length ? 'bad' : 'good'}`}>{viol.length ? `还有 ${viol.length} 条边没被覆盖` : `是覆盖 ✓，大小 ${size}`}</span>}
        <span className="chip info">ILP 最优 OPT = {sol.opt}</span>
        {showLP && <span className="chip info">LP 松弛最优 OPT_f = {sol.lpv}</span>}
        {showLP && <span className="chip good">取整后覆盖大小 A = {rsize}</span>}
        {showLP && <span className="chip info">A / OPT = {(rsize / sol.opt).toFixed(2)} ≤ 2 ✓；OPT / OPT_f = {(sol.opt / sol.lpv).toFixed(2)}</span>}
      </div>
    </Widget>
  )
}

/* ================= 3. QP：椭圆等高线 + 多面体 ================= */
const QP_POLY = [[-2.2, -0.4], [-0.6, -2.2], [2.0, -1.9], [2.4, 0.6], [0.2, 1.9]]
export function Ch06QP() {
  const C = useMovablePoint([2.8, 2.4], { color: Theme.orange })
  const [kap, setKap] = useState(3)
  const [phi, setPhi] = useState(20)
  const a = (phi * Math.PI) / 180
  const R = [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]]
  // P = R diag(1, kap) R^T
  const P = [
    [R[0][0] ** 2 + kap * R[0][1] ** 2, R[0][0] * R[1][0] + kap * R[0][1] * R[1][1]],
    [R[0][0] * R[1][0] + kap * R[0][1] * R[1][1], R[1][0] ** 2 + kap * R[1][1] ** 2],
  ]
  const q = (v) => v[0] * (P[0][0] * v[0] + P[0][1] * v[1]) + v[1] * (P[1][0] * v[0] + P[1][1] * v[1])
  const f = (x) => q([x[0] - C.x, x[1] - C.y])
  let xs, where
  if (ch04InPoly(C.point, QP_POLY)) { xs = C.point; where = '可行域内部（无约束最小点本身可行）' }
  else {
    let best = null, bv = Infinity, bs = 0
    for (let i = 0; i < QP_POLY.length; i++) {
      const p = QP_POLY[i], r = QP_POLY[(i + 1) % QP_POLY.length]
      const dd = [r[0] - p[0], r[1] - p[1]], w = [p[0] - C.x, p[1] - C.y]
      const num = dd[0] * (P[0][0] * w[0] + P[0][1] * w[1]) + dd[1] * (P[1][0] * w[0] + P[1][1] * w[1])
      let s = -num / q(dd)
      s = Math.max(0, Math.min(1, s))
      const x = [p[0] + s * dd[0], p[1] + s * dd[1]]
      if (f(x) < bv) { bv = f(x); best = x; bs = s }
    }
    xs = best
    where = bs < 1e-3 || bs > 1 - 1e-3 ? '顶点' : '一条边的内部（不是顶点！）'
  }
  const fs = f(xs)
  const lv = [0.25, 1, 2.5, 5, 9, 14]
  const g = [2 * (P[0][0] * (xs[0] - C.x) + P[0][1] * (xs[1] - C.y)), 2 * (P[1][0] * (xs[0] - C.x) + P[1][1] * (xs[1] - C.y))]
  const gn = Math.hypot(...g)
  return (
    <Widget title="二次规划：椭圆等高线碰多面体" hint="拖动橙色点（f₀ 的无约束最小点），用滑块改变 P 的形状和方向。最优点 x* 是最小的那个椭圆和多面体的切点——它常常落在边的中间，而不像 LP 那样总在顶点。红色箭头是 −∇f₀(x*)，它垂直于切到的那条边。">
      <Mafs viewBox={{ x: [-3.6, 4.2], y: [-3, 3.2] }} height={340} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={false} />
        <Polygon points={QP_POLY} color={Theme.blue} fillOpacity={0.12} />
        {lv.map((l, i) => <Ellipse key={i} center={C.point} radius={[Math.sqrt(l), Math.sqrt(l / kap)]} angle={a} color={LIGHT} fillOpacity={0} strokeStyle="dashed" />)}
        {fs > 1e-6 && <Ellipse center={C.point} radius={[Math.sqrt(fs), Math.sqrt(fs / kap)]} angle={a} color={Theme.green} fillOpacity={0} weight={2.5} />}
        {gn > 1e-6 && <Vector tail={xs} tip={[xs[0] - (0.8 * g[0]) / gn, xs[1] - (0.8 * g[1]) / gn]} color={Theme.red} />}
        <Point x={xs[0]} y={xs[1]} color={Theme.green} />
        <Text x={xs[0]} y={xs[1]} attach="sw" size={13} color={Theme.green}>x*</Text>
        {C.element}
      </Mafs>
      <div className="wrow">
        <Slider label="P 的条件数 κ" value={kap} set={setKap} min={1} max={8} step={0.1} />
        <Slider label="旋转角" value={phi} set={setPhi} min={0} max={180} step={1} fmt={(v) => v + '°'} />
      </div>
      <div className="wstat">
        <span className="chip info">P = [[{f2(P[0][0])}, {f2(P[0][1])}], [{f2(P[1][0])}, {f2(P[1][1])}]] ⪰ 0（特征值 1 与 {kap.toFixed(1)}）</span>
        <span className="chip good">x* = ({f2(xs[0])}, {f2(xs[1])})，f₀(x*) = {fs.toFixed(3)}</span>
        <span className="chip info">x* 位于：{where}</span>
      </div>
    </Widget>
  )
}

/* ================= 4. 二阶锥 ================= */
export function Ch06SOC() {
  const [az, setAz] = useState(35)
  const [x1, setX1] = useState(0.5)
  const [x2, setX2] = useState(0.3)
  const [t, setT] = useState(0.8)
  const A = (az * Math.PI) / 180, el = 0.42, S = 120, O = [170, 175]
  const pr = ([u, v, w]) => {
    const X = u * Math.cos(A) - v * Math.sin(A)
    const D = u * Math.sin(A) + v * Math.cos(A)
    return [O[0] + S * X, O[1] - S * (w * Math.cos(el) - D * Math.sin(el))]
  }
  const ring = (h) => Array.from({ length: 73 }, (_, k) => pr([h * Math.cos((k * Math.PI) / 36), h * Math.sin((k * Math.PI) / 36), h])).map((p) => p.join(',')).join(' ')
  const H = 1.2
  const inside = Math.hypot(x1, x2) <= t + 1e-9
  const P0 = pr([x1, x2, t]), Pb = pr([x1, x2, 0])
  const axes = [[[-1.2, 0, 0], [1.3, 0, 0], 'x₁'], [[0, -1.2, 0], [0, 1.3, 0], 'x₂'], [[0, 0, 0], [0, 0, 1.45], 't']]
  return (
    <Widget title="二阶锥 {(x, t) : ‖x‖₂ ≤ t}" hint="左边是 3 维的“冰淇淋锥”（拖动方位角旋转），右边是在高度 t 处横切得到的圆盘 ‖x‖₂ ≤ t。调 x₁、x₂、t：点在锥内 ⇔ 它在切片圆盘里。t 越大圆盘越大；t 小于 0 时切片是空集。">
      <div className="two-col">
        <svg viewBox="0 0 340 300" style={{ width: '100%' }}>
          {axes.map(([a, b, l], i) => {
            const p = pr(a), q = pr(b)
            return <g key={i}><line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={LIGHT} strokeWidth={1} /><text x={q[0] + 4} y={q[1]} fontSize={13} fill={GRAY}>{l}</text></g>
          })}
          {Array.from({ length: 24 }, (_, k) => {
            const q = pr([H * Math.cos((k * Math.PI) / 12), H * Math.sin((k * Math.PI) / 12), H])
            return <line key={k} x1={O[0]} y1={O[1]} x2={q[0]} y2={q[1]} stroke={GRAY} strokeWidth={0.7} opacity={0.6} />
          })}
          <polyline points={ring(H)} fill="none" stroke={INK} strokeWidth={1.2} />
          {t > 0 && <polyline points={ring(Math.min(t, H))} fill={ORANGE} fillOpacity={0.18} stroke={ORANGE} strokeWidth={1.5} />}
          <line x1={Pb[0]} y1={Pb[1]} x2={P0[0]} y2={P0[1]} stroke={LIGHT} strokeDasharray="3 3" />
          <circle cx={P0[0]} cy={P0[1]} r={6} fill={inside ? GREEN : RED} stroke="#fff" />
        </svg>
        <Mafs viewBox={{ x: [-1.4, 1.4], y: [-1.4, 1.4] }} height={260}>
          <Coordinates.Cartesian subdivisions={false} />
          {t > 0 && <Circle center={[0, 0]} radius={t} color={Theme.orange} fillOpacity={0.15} />}
          <Point x={x1} y={x2} color={inside ? Theme.green : Theme.red} />
          <Text x={1.1} y={1.25} size={13}>t = {t.toFixed(2)} 的切片</Text>
        </Mafs>
      </div>
      <div className="wrow">
        <Slider label="方位角" value={az} set={setAz} min={0} max={360} step={1} fmt={(v) => v + '°'} />
        <Slider label="x₁" value={x1} set={setX1} min={-1.2} max={1.2} />
        <Slider label="x₂" value={x2} set={setX2} min={-1.2} max={1.2} />
        <Slider label="t" value={t} set={setT} min={-0.3} max={1.2} />
      </div>
      <div className="wstat">
        <span className="chip info">‖x‖₂ = {Math.hypot(x1, x2).toFixed(3)}</span>
        <span className={`chip ${inside ? 'good' : 'bad'}`}>{inside ? '‖x‖₂ ≤ t：在锥内 ✓' : '‖x‖₂ > t：在锥外'}</span>
      </div>
    </Widget>
  )
}

/* ================= 5. 鲁棒 / 机会约束 → SOC ================= */
function erf(x) {
  const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)
  return s * y
}
const Phi = (x) => 0.5 * (1 + erf(x / Math.SQRT2))
function PhiInv(p) {
  let lo = -8, hi = 8
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m }
  return (lo + hi) / 2
}
const RB_A = [1, 0.6], RB_B = 1.5, RB_S = [[0.9, 0.3], [0, 0.5]] // Σ^{1/2}（或椭球的 P）
const RB_X = [-3, 4], RB_Y = [-3, 4]
export function Ch06Robust() {
  const [mode, setMode] = useState('chance')
  const [eta, setEta] = useState(0.9)
  const [rho, setRho] = useState(1)
  const kappa = mode === 'chance' ? PhiInv(eta) : rho
  const ref = useRef(null)
  const N = 220
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const img = ctx.createImageData(N, N)
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = RB_X[0] + ((i + 0.5) / N) * (RB_X[1] - RB_X[0])
      const y = RB_Y[1] - ((j + 0.5) / N) * (RB_Y[1] - RB_Y[0])
      const sx = [RB_S[0][0] * x + RB_S[1][0] * y, RB_S[0][1] * x + RB_S[1][1] * y] // S^T x
      const ok = RB_A[0] * x + RB_A[1] * y + kappa * Math.hypot(...sx) <= RB_B
      const k = 4 * (j * N + i)
      if (ok) { img.data[k] = 52; img.data[k + 1] = 199; img.data[k + 2] = 89; img.data[k + 3] = 70 }
      else { img.data[k] = 229; img.data[k + 1] = 229; img.data[k + 2] = 234; img.data[k + 3] = 255 }
    }
    ctx.putImageData(img, 0, 0)
    const toPx = (x, y) => [((x - RB_X[0]) / (RB_X[1] - RB_X[0])) * N, ((RB_Y[1] - y) / (RB_Y[1] - RB_Y[0])) * N]
    const drawLine = (a, b, color, w, dash) => {
      // a^T x = b 与视窗相交
      const P = []
      for (const x of RB_X) if (Math.abs(a[1]) > 1e-9) { const y = (b - a[0] * x) / a[1]; P.push([x, y]) }
      for (const y of RB_Y) if (Math.abs(a[0]) > 1e-9) { const x = (b - a[1] * y) / a[0]; P.push([x, y]) }
      const Q = P.filter(([x, y]) => x >= RB_X[0] - 1e-6 && x <= RB_X[1] + 1e-6 && y >= RB_Y[0] - 1e-6 && y <= RB_Y[1] + 1e-6)
      if (Q.length < 2) return
      ctx.beginPath(); ctx.setLineDash(dash || []); ctx.strokeStyle = color; ctx.lineWidth = w
      const p = toPx(...Q[0]), q = toPx(...Q[1]); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.setLineDash([])
    }
    if (mode === 'det') {
      for (let k = 0; k < 24; k++) {
        const u = [Math.cos((k * Math.PI) / 12), Math.sin((k * Math.PI) / 12)]
        const a = [RB_A[0] + rho * (RB_S[0][0] * u[0] + RB_S[0][1] * u[1]), RB_A[1] + rho * (RB_S[1][0] * u[0] + RB_S[1][1] * u[1])]
        drawLine(a, RB_B, 'rgba(99,99,102,0.35)', 1)
      }
    }
    drawLine(RB_A, RB_B, INK, 2, [5, 4])
    // 坐标轴
    ctx.strokeStyle = 'rgba(99,99,102,0.6)'; ctx.lineWidth = 1
    const o = toPx(0, 0)
    ctx.beginPath(); ctx.moveTo(0, o[1]); ctx.lineTo(N, o[1]); ctx.moveTo(o[0], 0); ctx.lineTo(o[0], N); ctx.stroke()
  }, [kappa, mode, rho])
  // 正态密度小图
  const bell = Array.from({ length: 121 }, (_, k) => { const z = -3 + k * 0.05; return [z, Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)] })
  const bx = (z) => 10 + ((z + 3) / 6) * 260, by = (p) => 90 - p * 190
  const kk = Math.max(-3, Math.min(3, kappa))
  const area = bell.filter(([z]) => z <= kk)
  return (
    <Widget title="鲁棒 LP：从半平面到二阶锥约束" hint="虚线是名义约束 āᵀx ≤ b（绿色是满足约束的区域）。机会约束：调 η，约束变成 āᵀx + Φ⁻¹(η)‖Σ^½x‖₂ ≤ b。η ≥ ½ 时 Φ⁻¹(η) ≥ 0，区域是凸的（SOC）；把 η 调到 ½ 以下，看区域怎样变成非凸。确定性椭球：灰线是椭球里各个 a 对应的边界，鲁棒可行域是它们的交。">
      <Tabs tabs={[{ value: 'chance', label: '随机：prob(aᵀx ≤ b) ≥ η' }, { value: 'det', label: '确定性：对椭球里所有 a 成立' }]} value={mode} set={setMode} />
      <div className="two-col">
        <canvas ref={ref} width={N} height={N} style={{ width: '100%', maxWidth: 320, border: '1px solid #e5e5ea', borderRadius: 10, imageRendering: 'auto' }} />
        <div>
          {mode === 'chance' && (
            <svg viewBox="0 0 280 110" style={{ width: '100%' }}>
              <polygon points={[[bx(-3), by(0)], ...area.map(([z, p]) => [bx(z), by(p)]), [bx(kk), by(0)]].map((p) => p.join(',')).join(' ')} fill={ORANGE} fillOpacity={0.3} />
              <polyline points={bell.map(([z, p]) => [bx(z), by(p)].join(',')).join(' ')} fill="none" stroke={INK} strokeWidth={1.5} />
              <line x1={bx(0)} y1={by(0)} x2={bx(0)} y2={10} stroke={LIGHT} strokeDasharray="3 3" />
              <line x1={bx(kk)} y1={by(0)} x2={bx(kk)} y2={14} stroke={RED} strokeWidth={1.5} />
              <text x={bx(kk)} y={12} fontSize={11} textAnchor="middle" fill={RED}>Φ⁻¹(η)</text>
              <text x={bx(-2.6)} y={by(0) + 14} fontSize={11} fill={GRAY}>面积 = η</text>
            </svg>
          )}
          <div className="wstat">
            <span className="chip info">{mode === 'chance' ? `Φ⁻¹(η) = ${kappa.toFixed(3)}` : `椭球大小 ρ = ${rho.toFixed(2)}`}</span>
            <span className={`chip ${kappa >= 0 ? 'good' : 'bad'}`}>{kappa >= 0 ? '系数 ≥ 0：凸的 SOC 约束' : '系数 < 0：可行域非凸！'}</span>
          </div>
        </div>
      </div>
      <div className="wrow">
        {mode === 'chance'
          ? <Slider label="η" value={eta} set={setEta} min={0.05} max={0.99} step={0.01} />
          : <Slider label="ρ" value={rho} set={setRho} min={0} max={1.5} step={0.01} />}
      </div>
    </Widget>
  )
}

/* ================= 6. 几何规划：log 变换前后 ================= */
const GP_XR = [0.05, 5.2]
const GP_YR = [Math.log(0.1), Math.log(5.2)]
export function Ch06GP() {
  const [k, setK] = useState(3)
  const [A, setA] = useState([0.6, 4.0])
  const [B, setB] = useState([4.0, 0.6])
  const [next, setNext] = useState('A')
  const feas = ([x1, x2]) => x1 > 0 && x2 > 0 && (x1 * x2) / k <= 1 && 0.5 / (x1 * x2) <= 1 && 0.2 * x1 + 0.2 * x2 <= 1
  const refX = useRef(null), refY = useRef(null)
  const N = 220
  const segX = (s) => [A[0] + s * (B[0] - A[0]), A[1] + s * (B[1] - A[1])] // x 空间直线
  const segY = (s) => [Math.exp((1 - s) * Math.log(A[0]) + s * Math.log(B[0])), Math.exp((1 - s) * Math.log(A[1]) + s * Math.log(B[1]))] // y 空间直线
  useEffect(() => {
    for (const [ref, logv] of [[refX, false], [refY, true]]) {
      const cv = ref.current
      if (!cv) continue
      const ctx = cv.getContext('2d')
      const R = logv ? GP_YR : GP_XR
      const img = ctx.createImageData(N, N)
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        let u = R[0] + ((i + 0.5) / N) * (R[1] - R[0]), v = R[1] - ((j + 0.5) / N) * (R[1] - R[0])
        if (logv) { u = Math.exp(u); v = Math.exp(v) }
        const q = 4 * (j * N + i)
        if (feas([u, v])) { img.data[q] = 52; img.data[q + 1] = 199; img.data[q + 2] = 89; img.data[q + 3] = 80 }
        else { img.data[q] = 242; img.data[q + 1] = 242; img.data[q + 2] = 247; img.data[q + 3] = 255 }
      }
      ctx.putImageData(img, 0, 0)
      const px = ([u, v]) => {
        if (logv) { u = Math.log(u); v = Math.log(v) }
        return [((u - R[0]) / (R[1] - R[0])) * N, ((R[1] - v) / (R[1] - R[0])) * N]
      }
      const draw = (fn, straight) => {
        for (let s = 0; s < 60; s++) {
          const p = fn(s / 60), q = fn((s + 1) / 60)
          const ok = feas(fn((s + 0.5) / 60))
          ctx.beginPath(); ctx.setLineDash(straight ? [] : [4, 3])
          ctx.strokeStyle = ok ? (straight ? INK : GRAY) : RED; ctx.lineWidth = straight ? 2.5 : 1.5
          const a = px(p), b = px(q); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke()
        }
        ctx.setLineDash([])
      }
      // 本空间里的“直线段”用实线，另一空间直线段的像用虚线
      draw(logv ? segY : segX, true)
      draw(logv ? segX : segY, false)
      for (const [p, l] of [[A, 'A'], [B, 'B']]) {
        const a = px(p)
        ctx.beginPath(); ctx.fillStyle = ORANGE; ctx.arc(a[0], a[1], 5, 0, 2 * Math.PI); ctx.fill()
        ctx.fillStyle = INK; ctx.font = '12px sans-serif'; ctx.fillText(l, a[0] + 7, a[1] - 5)
      }
    }
  }, [k, A, B])
  const click = (logv) => (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const R = logv ? GP_YR : GP_XR
    let u = R[0] + ((e.clientX - r.left) / r.width) * (R[1] - R[0])
    let v = R[1] - ((e.clientY - r.top) / r.height) * (R[1] - R[0])
    if (logv) { u = Math.exp(u); v = Math.exp(v) }
    if (u <= 0.02 || v <= 0.02) return
    if (next === 'A') { setA([u, v]); setNext('B') } else { setB([u, v]); setNext('A') }
  }
  const badX = Array.from({ length: 41 }, (_, s) => feas(segX(s / 40))).some((o) => !o)
  const badY = Array.from({ length: 41 }, (_, s) => feas(segY(s / 40))).some((o) => !o)
  return (
    <Widget title="几何规划：取对数之后变凸" hint="约束：(1/k)x₁x₂ ≤ 1，0.5x₁⁻¹x₂⁻¹ ≤ 1（单项式），0.2x₁ + 0.2x₂ ≤ 1（正项式）。左图是 x 空间，右图是 y = log x 空间。点击任一图依次放置 A、B 两个可行点：实线是本空间里的直线段，红色部分走出了可行域。x 空间里线段会出界（非凸），y 空间里永远不会（凸）。">
      <div className="two-col">
        <div><canvas ref={refX} width={N} height={N} onClick={click(false)} style={{ width: '100%', maxWidth: 300, cursor: 'crosshair', border: '1px solid #e5e5ea', borderRadius: 10 }} /><div className="legend-inline">x 空间：x₁, x₂ ∈ (0, 5.2]</div></div>
        <div><canvas ref={refY} width={N} height={N} onClick={click(true)} style={{ width: '100%', maxWidth: 300, cursor: 'crosshair', border: '1px solid #e5e5ea', borderRadius: 10 }} /><div className="legend-inline">y = log x 空间：单项式约束变成直线（半平面）</div></div>
      </div>
      <div className="wrow">
        <Slider label="k" value={k} set={setK} min={1} max={6} step={0.1} />
        <span className="muted">下一次点击放置：{next}</span>
      </div>
      <div className="wstat">
        <span className="chip info">A = ({f2(A[0])}, {f2(A[1])})，B = ({f2(B[0])}, {f2(B[1])})</span>
        <span className={`chip ${feas(A) && feas(B) ? 'good' : 'bad'}`}>{feas(A) && feas(B) ? 'A、B 都可行' : 'A 或 B 不可行，请重新点'}</span>
        <span className={`chip ${badX ? 'bad' : 'good'}`}>x 空间连线：{badX ? '走出可行域' : '全在可行域内'}</span>
        <span className={`chip ${badY ? 'bad' : 'good'}`}>y 空间连线：{badY ? '走出可行域' : '全在可行域内'}</span>
      </div>
    </Widget>
  )
}

/* ================= 7. Pareto 前沿与标量化 ================= */
const PA_N = 400
function paretoData(nonconvex) {
  const g = (u) => 0.3 + 1.3 / (u - 0.05) + (nonconvex ? 0.9 * Math.exp(-((u - 2.0) ** 2) / 0.18) : 0)
  const B = Array.from({ length: PA_N + 1 }, (_, i) => { const u = 0.4 + (4 * i) / PA_N; return [u, g(u)] })
  // Pareto：比左边所有点都严格低
  const par = []
  let m = Infinity
  for (const p of B) { par.push(p[1] < m - 1e-12); m = Math.min(m, p[1]) }
  const reach = new Array(B.length).fill(false)
  for (let d = 0.2; d < 90; d += 0.2) {
    const l = [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180)]
    let bi = 0, bv = Infinity
    B.forEach((p, i) => { const v = l[0] * p[0] + l[1] * p[1]; if (v < bv) { bv = v; bi = i } })
    reach[bi] = true
  }
  // 可达：两个被选中的相邻样本之间若在凸包边上也算可达（采样误差）—— 这里直接用采样结果平滑
  for (let i = 1; i < B.length - 1; i++) if (reach[i - 1] && reach[i + 1]) reach[i] = true
  return { B, par, reach }
}
export function Ch06Pareto() {
  const [nc, setNc] = useState(true)
  const [deg, setDeg] = useState(40)
  const [s, setS] = useState(0.15)
  const { B, par, reach } = useMemo(() => paretoData(nc), [nc])
  const l = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)]
  let bi = 0, bv = Infinity
  B.forEach((p, i) => { const v = l[0] * p[0] + l[1] * p[1]; if (v < bv) { bv = v; bi = i } })
  const xs = B[bi]
  const si = Math.round(s * PA_N)
  const sp = B[si]
  // 把 Pareto 点分成连续段
  const runs = []
  let cur = null
  B.forEach((p, i) => {
    const key = par[i] ? (reach[i] ? 'r' : 'u') : null
    if (key && cur && cur.key === key) cur.pts.push(p)
    else { if (cur) runs.push(cur); cur = key ? { key, pts: [p] } : null }
  })
  if (cur) runs.push(cur)
  const region = [[0.4, 5.5], ...B, [4.4, 5.5]]
  return (
    <Widget title="Pareto 最优与标量化" hint="灰色是可达集 𝒪（目标空间里所有 (F₁, F₂)）。转动权重 λ = (λ₁, λ₂)：最小化 λᵀf₀ 就是用法向为 λ 的直线去“托”𝒪，切点（红）一定是 Pareto 最优。在“非凸前沿”里，橙色那段 Pareto 点无论 λ 怎么转都托不到。拖动下面的滑块选一个边界点，看它的“左下方”（更好的区域）里有没有 𝒪 的点。">
      <Tabs tabs={[{ value: true, label: '非凸前沿' }, { value: false, label: '凸前沿' }]} value={nc} set={setNc} />
      <Mafs viewBox={{ x: [0, 4.8], y: [0, 4.4] }} height={340} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={false} />
        <Polygon points={region} color={Theme.indigo} fillOpacity={0.14} weight={1} />
        <Polygon points={[[0, 0], [sp[0], 0], sp, [0, sp[1]]]} color={Theme.orange} fillOpacity={0.08} weight={1} strokeStyle="dashed" />
        {runs.map((r, i) => r.pts.slice(1).map((p, j) => <Line.Segment key={i + '-' + j} point1={r.pts[j]} point2={p} color={r.key === 'r' ? Theme.green : Theme.orange} weight={4} />))}
        <Line.PointAngle point={xs} angle={Math.atan2(l[1], l[0]) + Math.PI / 2} color={Theme.red} style="dashed" />
        <Vector tail={xs} tip={[xs[0] + 0.7 * l[0], xs[1] + 0.7 * l[1]]} color={Theme.red} />
        <Text x={xs[0] + 0.7 * l[0]} y={xs[1] + 0.7 * l[1]} attach="ne" size={13} color={Theme.red}>λ</Text>
        <Point x={xs[0]} y={xs[1]} color={Theme.red} />
        <Point x={sp[0]} y={sp[1]} color={Theme.orange} />
        <Text x={3.6} y={3.6} size={14}>𝒪</Text>
      </Mafs>
      <div className="wrow">
        <Slider label="λ 的角度" value={deg} set={setDeg} min={1} max={89} step={0.5} fmt={(v) => v + '°'} />
        <Slider label="选边界点" value={s} set={setS} min={0} max={1} step={0.0025} />
      </div>
      <div className="wstat">
        <span className="chip info">λ = ({l[0].toFixed(2)}, {l[1].toFixed(2)}) ≻ 0</span>
        <span className="chip good">λᵀf₀ 的最小点 f₀(x) = ({f2(xs[0])}, {f2(xs[1])})：Pareto 最优</span>
        <span className={`chip ${par[si] ? 'good' : 'bad'}`}>所选点 ({f2(sp[0])}, {f2(sp[1])})：{par[si] ? (reach[si] ? 'Pareto 最优，且能被某个 λ 找到' : 'Pareto 最优，但没有 λ 能找到它') : '不是 Pareto 最优（左下方虚线框里有更好的点）'}</span>
      </div>
      <div className="legend-inline"><i style={{ background: GREEN }} />标量化能找到的 Pareto 点 <i style={{ background: ORANGE }} />标量化找不到的 Pareto 点</div>
    </Widget>
  )
}

/* ================= 8. 问题家族层级图 ================= */
const FAM = [
  { id: 'cvx', label: '凸优化问题 Convex', x: 10, y: 10, w: 520, h: 330, info: '凸目标 + 凸不等式约束 + 仿射等式约束。局部最优 = 全局最优，可高效求解。' },
  { id: 'sdp', label: 'SDP', x: 30, y: 45, w: 330, h: 280, info: 'SDP：min cᵀx s.t. x₁F₁+…+xₙFₙ+G ⪯ 0（LMI），Ax=b。SOCP 约束可以写成 LMI，所以 SOCP ⊂ SDP。' },
  { id: 'socp', label: 'SOCP', x: 50, y: 80, w: 290, h: 230, info: 'SOCP：min fᵀx s.t. ‖Aᵢx+bᵢ‖₂ ≤ cᵢᵀx+dᵢ，Fx=g。Aᵢ=0 退化为 LP；cᵢ=0 平方后得到凸二次约束（QCQP）。' },
  { id: 'qcqp', label: 'QCQP', x: 70, y: 115, w: 250, h: 180, info: 'QCQP：目标和不等式约束都是凸二次函数（Pᵢ ⪰ 0）。约束为线性时就是 QP。' },
  { id: 'qp', label: 'QP', x: 90, y: 150, w: 210, h: 130, info: 'QP：min ½xᵀPx+qᵀx+r s.t. Gx ⪯ h，Ax=b，P ⪰ 0。P=0 时就是 LP。最小二乘是无约束 QP。' },
  { id: 'lp', label: 'LP', x: 110, y: 185, w: 170, h: 80, info: 'LP：目标和约束全是仿射函数。可行集是多面体，最优在顶点。' },
  { id: 'gp', label: 'GP（log 变换后）', x: 375, y: 120, w: 145, h: 120, info: 'GP 在原变量 x 下不是凸问题；令 y = log x 后，单项式 → 仿射，正项式 → log-sum-exp（凸），变成凸问题。' },
  { id: 'qcvx', label: '拟凸问题', x: 548, y: 140, w: 130, h: 90, info: '拟凸目标 + 凸约束。不在“凸”的框内（局部最优可能不是全局最优），但可用二分法 + 凸可行性问题求解。' },
  { id: 'ilp', label: 'ILP（非凸）', x: 548, y: 40, w: 130, h: 90, info: 'ILP：LP + x ∈ ℤⁿ。可行集是离散点，非凸，一般 NP-hard。LP 松弛给出下界；约束矩阵 TU 且 b 为整数时，松弛是精确的。' },
  { id: 'vec', label: '向量优化', x: 548, y: 240, w: 130, h: 90, info: '目标是向量，关于锥 K 最小化。用 λ ∈ int K* 标量化后变成普通（标量）问题，解是 Pareto 最优。' },
]
export function Ch06Hierarchy() {
  const [sel, setSel] = useState('socp')
  const S = FAM.find((f) => f.id === sel)
  const fills = ['#f5f5f7', '#ececf0', '#e3e3e8', '#d9d9de', '#cfcfd4', '#c4c4ca']
  return (
    <Widget title="问题家族层级图" hint="点击任意一个框，查看这一类问题的形式和它与其他类的关系。嵌套表示“是特例”：LP ⊂ QP ⊂ QCQP ⊂ SOCP ⊂ SDP ⊂ 凸问题。">
      <svg viewBox="0 0 690 350" style={{ width: '100%' }}>
        <rect x={540} y={10} width={145} height={330} rx={14} fill="none" stroke={LIGHT} strokeDasharray="5 4" />
        <text x={612} y={28} fontSize={12} textAnchor="middle" fill={GRAY}>凸框之外 / 相关</text>
        {FAM.map((f, i) => {
          const on = f.id === sel
          const nested = i < 6
          return (
            <g key={f.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setSel(f.id) }}>
              <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={12} fill={nested ? fills[i] : '#f5f5f7'} stroke={on ? ORANGE : nested ? GRAY : LIGHT} strokeWidth={on ? 3 : 1.2} strokeDasharray={!nested && f.id !== 'gp' ? '5 4' : undefined} />
              <text x={f.x + 12} y={f.y + 20} fontSize={14} fontWeight={600} fill={on ? '#c76a00' : INK}>{f.label}</text>
            </g>
          )
        })}
      </svg>
      <div className="wstat"><span className="chip info" style={{ whiteSpace: 'normal' }}>{S.label}：{S.info}</span></div>
    </Widget>
  )
}
