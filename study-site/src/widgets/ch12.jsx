// 第 12 章 等式约束优化 —— 交互组件
import { useState, useMemo, useEffect } from 'react'
import { Mafs, Coordinates, Plot, Point, Line, Text, Theme } from 'mafs'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'
import { Ch11Contour, Ch11PathSvg, Ch11LogPlot, ch11Solve, ch11Fexp, ch11Backtrack } from './ch11.jsx'

const C = { ink: '#1d1d1f', gray: '#636366', light: '#aeaeb2', orange: '#ff9500', red: '#ff3b30', green: '#34c759' }
const fmt = (v, d = 3) => (!isFinite(v) ? '∞' : Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(2) : v.toFixed(d))

// SVG 箭头（像素坐标）
function Arrow({ x1, y1, x2, y2, color, w = 2.2, dash }) {
  const L = Math.hypot(x2 - x1, y2 - y1)
  if (L < 1e-6) return null
  const ux = (x2 - x1) / L, uy = (y2 - y1) / L
  const hs = Math.min(10, L * 0.4)
  const p1 = [x2 - hs * ux + hs * 0.45 * uy, y2 - hs * uy - hs * 0.45 * ux]
  const p2 = [x2 - hs * ux - hs * 0.45 * uy, y2 - hs * uy + hs * 0.45 * ux]
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - hs * 0.6 * ux} y2={y2 - hs * 0.6 * uy} stroke={color} strokeWidth={w} strokeDasharray={dash} />
      <polygon points={`${x2},${y2} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} fill={color} />
    </g>
  )
}

// 约束直线 aᵀx = b 在视窗里的两个端点
function lineEnds(a, b, xr, yr) {
  const pts = []
  const push = (x, y) => { if (x >= xr[0] - 1e-9 && x <= xr[1] + 1e-9 && y >= yr[0] - 1e-9 && y <= yr[1] + 1e-9) pts.push([x, y]) }
  if (Math.abs(a[1]) > 1e-12) { push(xr[0], (b - a[0] * xr[0]) / a[1]); push(xr[1], (b - a[0] * xr[1]) / a[1]) }
  if (Math.abs(a[0]) > 1e-12) { push((b - a[1] * yr[0]) / a[0], yr[0]); push((b - a[1] * yr[1]) / a[0], yr[1]) }
  return pts.length >= 2 ? [pts[0], pts[pts.length - 1]] : null
}

const { f: FE, grad: GE, hess: HE } = ch11Fexp
const XR = [-3, 1.5], YR = [-1.2, 1.2]
const LEVELS = Array.from({ length: 13 }, (_, i) => ch11Fexp.pstar + 0.01 * 2 ** i)

// 可行起点 Newton 步：解 [H a; aᵀ 0][v; w] = [−g; −(aᵀx − b)]（可行时右下为 0）
function kktStep(x, nu, a, b, infeasible) {
  const g = GE(...x), H = HE(...x)
  const r1 = infeasible ? [g[0] + a[0] * nu, g[1] + a[1] * nu] : g
  const rp = infeasible ? a[0] * x[0] + a[1] * x[1] - b : 0
  const K = [[H[0][0], H[0][1], a[0]], [H[1][0], H[1][1], a[1]], [a[0], a[1], 0]]
  const s = ch11Solve(K, [-r1[0], -r1[1], -rp])
  return s ? { v: [s[0], s[1]], w: s[2], g } : null
}

/* =====================================================================
   1. 在直线 Ax=b 上最小化：可行 Newton 步与最优条件
   ===================================================================== */
export function Ch12EqualityNewton() {
  const [theta, setTheta] = useState(60) // 法向量 a 的角度（度）
  const [b, setB] = useState(0.3)
  const [s, setS] = useState(-1.6) // 沿直线的位置
  const [path, setPath] = useState(null)
  const a = [Math.cos((theta * Math.PI) / 180), Math.sin((theta * Math.PI) / 180)]
  const xhat = [b * a[0], b * a[1]]
  const dir = [-a[1], a[0]] // 零空间方向（AF=0）
  const x = path ? path[path.length - 1] : [xhat[0] + s * dir[0], xhat[1] + s * dir[1]]
  useEffect(() => setPath(null), [theta, b, s])
  const st = kktStep(x, 0, a, b, false)
  const g = st ? st.g : [0, 0]
  const v = st ? st.v : [0, 0]
  const lam2 = -(g[0] * v[0] + g[1] * v[1])
  const gn = Math.hypot(...g)
  const cosang = Math.abs(g[0] * a[0] + g[1] * a[1]) / (gn || 1)
  const ends = lineEnds(a, b, XR, YR)
  const step = () => {
    if (!st) return
    const phi = (t) => FE(x[0] + t * v[0], x[1] + t * v[1])
    const t = ch11Backtrack(phi, -lam2, 0.1, 0.7)
    const nx = [x[0] + t * v[0], x[1] + t * v[1]]
    setPath([...(path || [x]), nx])
  }
  const opt = lam2 < 1e-10
  return (
    <Widget
      title="在可行直线上做 Newton 步 Newton step on Ax = b"
      hint="橙色直线是约束 aᵀx=b（灰色细箭头是它的法向量 a）。用滑块沿直线移动 x，或点“Newton 一步”。红色箭头是可行 Newton 步 Δx_nt——它永远沿着直线（AΔx_nt=0）。黑色箭头是 ∇f(x) 的方向：走到最优点时，它与法向量 a 平行，即 ∇f(x*) + Aᵀν* = 0。试试转动直线、平移 b。"
    >
      <Ch11Contour f={FE} fkey="fexp12" xr={XR} yr={YR} W={540} H={288} levels={LEVELS}>
        {({ sx, sy }) => {
          const px = sx(x[0]), py = sy(x[1])
          const sc = 45 / (gn || 1)
          return (
            <>
              {ends && <line x1={sx(ends[0][0])} y1={sy(ends[0][1])} x2={sx(ends[1][0])} y2={sy(ends[1][1])} stroke={C.orange} strokeWidth={2.5} />}
              {path && <Ch11PathSvg pts={path} sx={sx} sy={sy} color={C.red} upto={path.length - 1} />}
              <Arrow x1={px} y1={py} x2={px + a[0] * 40} y2={py - a[1] * 40} color={C.light} w={1.6} />
              <Arrow x1={px} y1={py} x2={px + g[0] * sc} y2={py - g[1] * sc} color={C.ink} />
              {!opt && <Arrow x1={px} y1={py} x2={sx(x[0] + v[0])} y2={sy(x[1] + v[1])} color={C.red} w={2.6} />}
              <circle cx={px} cy={py} r={5} fill="#fff" stroke={C.ink} strokeWidth={2} />
              <text x={px + 8} y={py + 18} fontSize={13} fill={C.ink}>x</text>
            </>
          )
        }}
      </Ch11Contour>
      <div className="wrow">
        <Slider label="直线方向 θ" value={theta} set={setTheta} min={0} max={180} step={1} fmt={(v) => v.toFixed(0) + '°'} />
        <Slider label={<M>{'b'}</M>} value={b} set={setB} min={-0.8} max={0.8} step={0.01} />
        <Slider label="沿直线位置" value={s} set={setS} min={-2.5} max={2.5} step={0.01} />
      </div>
      <div className="wrow">
        <button className="wbtn" onClick={() => setPath(null)}>重置</button>
        <button className="wbtn primary" onClick={step} disabled={opt}>Newton 一步（回溯）</button>
      </div>
      <div className="wstat">
        <span className="chip info">aᵀx − b = {fmt(a[0] * x[0] + a[1] * x[1] - b)}（始终可行）</span>
        <span className="chip info">λ²/2 = {fmt(lam2 / 2)}</span>
        <span className="chip info">w（ν* 的估计）= {st ? fmt(st.w) : '—'}</span>
        <span className="chip info">AΔx_nt = {fmt(a[0] * v[0] + a[1] * v[1])}</span>
        {cosang > 0.99999 ? <span className="chip good">∇f ∥ a：满足最优条件</span> : <span className="chip">|cos∠(∇f, a)| = {cosang.toFixed(4)}</span>}
      </div>
    </Widget>
  )
}

/* =====================================================================
   2. 不可行起点 Newton：从直线外走向直线
   ===================================================================== */
export function Ch12InfeasibleNewton() {
  const [start, setStart] = useState([-2.6, -1.0])
  const [alpha, setAlpha] = useState(0.1)
  const [beta, setBeta] = useState(0.5)
  const [k, setK] = useState(0)
  const a = [0.6, 0.8], b = 0.5
  const iters = useMemo(() => {
    let x = [...start], nu = 0
    const rnorm = (x, nu) => {
      const g = GE(...x)
      return Math.hypot(g[0] + a[0] * nu, g[1] + a[1] * nu, a[0] * x[0] + a[1] * x[1] - b)
    }
    const out = [{ x, nu, r: rnorm(x, nu), f: FE(...x), t: null }]
    for (let it = 0; it < 40; it++) {
      const r0 = rnorm(x, nu)
      if (r0 < 1e-12) break
      const st = kktStep(x, nu, a, b, true)
      if (!st) break
      const dnu = st.w
      let t = 1, c = 0
      while (!(rnorm([x[0] + t * st.v[0], x[1] + t * st.v[1]], nu + t * dnu) <= (1 - alpha * t) * r0) && c < 60) { t *= beta; c++ }
      x = [x[0] + t * st.v[0], x[1] + t * st.v[1]]
      nu = nu + t * dnu
      out.push({ x, nu, r: rnorm(x, nu), f: FE(...x), t })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start[0], start[1], alpha, beta])
  const kmax = iters.length - 1
  useEffect(() => setK(0), [start, alpha, beta])
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    if (k >= kmax) { setRunning(false); return }
    const id = setTimeout(() => setK(k + 1), 450)
    return () => clearTimeout(id)
  }, [running, k, kmax])
  const ends = lineEnds(a, b, XR, YR)
  const cur = iters[k]
  const prim = a[0] * cur.x[0] + a[1] * cur.x[1] - b
  const fUp = iters.slice(1, k + 1).some((q, i) => q.f > iters[i].f)
  return (
    <Widget
      title="不可行起点 Newton 法 Infeasible start Newton"
      hint="点击图中任意位置（可以不在橙色直线上）作为起点 x⁽⁰⁾，ν⁽⁰⁾=0。逐步运行：路径从直线外走向直线；一旦某一步取到 t=1，aᵀx−b 就精确变成 0 并保持。下方表格里 f 可能上升（红色），但 ‖r‖₂ 每步都下降——所以线搜索盯的是 ‖r‖₂ 而不是 f。"
    >
      <Ch11Contour f={FE} fkey="fexp12b" xr={XR} yr={YR} W={540} H={288} levels={LEVELS} onPick={setStart}>
        {({ sx, sy }) => (
          <>
            {ends && <line x1={sx(ends[0][0])} y1={sy(ends[0][1])} x2={sx(ends[1][0])} y2={sy(ends[1][1])} stroke={C.orange} strokeWidth={2.5} />}
            <Ch11PathSvg pts={iters.map((q) => q.x)} sx={sx} sy={sy} color={C.red} upto={k} label="x⁽⁰⁾" />
          </>
        )}
      </Ch11Contour>
      <div className="wrow">
        <Slider label={<M>{'\\alpha'}</M>} value={alpha} set={setAlpha} min={0.01} max={0.49} step={0.01} />
        <Slider label={<M>{'\\beta'}</M>} value={beta} set={setBeta} min={0.1} max={0.9} step={0.01} />
      </div>
      <div className="wrow">
        <button className="wbtn" onClick={() => { setRunning(false); setK(0) }}>重置</button>
        <button className="wbtn" disabled={k >= kmax} onClick={() => setK(k + 1)}>单步</button>
        <button className="wbtn primary" onClick={() => { if (k >= kmax) setK(0); setRunning(!running) }}>{running ? '暂停' : '自动运行'}</button>
        <span style={{ fontSize: 13, color: C.gray }}>k = {k} / {kmax}</span>
      </div>
      <Ch11LogPlot series={[{ vals: iters.map((q) => q.r), color: C.red, label: '‖r(x,ν)‖₂' }]} k={k} ylabel="‖r(x⁽ᵏ⁾,ν⁽ᵏ⁾)‖₂" ymin={-15} ymax={5} />
      <div className="wstat">
        <span className="chip info">‖r‖₂ = {fmt(cur.r)}</span>
        <span className={`chip ${Math.abs(prim) < 1e-12 ? 'good' : 'bad'}`}>r_pri = aᵀx − b = {fmt(prim)}</span>
        <span className="chip info">ν = {fmt(cur.nu)}</span>
        {fUp && <span className="chip bad">出现过 f 上升：不是下降法</span>}
      </div>
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table style={{ fontSize: 13, borderCollapse: 'collapse', minWidth: 420 }}>
          <thead><tr>{['k', 't', '‖r‖₂', 'aᵀx − b', 'f(x)'].map((h) => <th key={h} style={{ padding: '2px 10px', borderBottom: '1px solid #e5e5ea', textAlign: 'left' }}>{h}</th>)}</tr></thead>
          <tbody>
            {iters.slice(0, k + 1).slice(-8).map((q) => {
              const i = iters.indexOf(q)
              const up = i > 0 && q.f > iters[i - 1].f
              return (
                <tr key={i}>
                  <td style={{ padding: '2px 10px' }}>{i}</td>
                  <td style={{ padding: '2px 10px' }}>{q.t === null ? '—' : fmt(q.t)}</td>
                  <td style={{ padding: '2px 10px' }}>{q.r.toExponential(2)}</td>
                  <td style={{ padding: '2px 10px' }}>{fmt(a[0] * q.x[0] + a[1] * q.x[1] - b)}</td>
                  <td style={{ padding: '2px 10px', color: up ? C.red : C.ink }}>{fmt(q.f, 4)}{up ? ' ↑' : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Widget>
  )
}

/* =====================================================================
   3. 消元法：二维约束问题 → 一维无约束问题
   ===================================================================== */
// f(x) = x₁² + 2e^{x₂}，约束 x₁ + x₂ = b（两人分资源）
const FEL = (x1, x2) => x1 * x1 + 2 * Math.exp(x2)
const EL_LEVELS = Array.from({ length: 14 }, (_, i) => 0.3 * 1.35 ** i)
export function Ch12Elimination() {
  const [b, setB] = useState(1)
  const [z, setZ] = useState(-1.2)
  const [hist, setHist] = useState([])
  const ft = (zz) => zz * zz + 2 * Math.exp(b - zz) // f̃(z) = f(Fz + x̂)
  const d1 = (zz) => 2 * zz - 2 * Math.exp(b - zz)
  const d2 = (zz) => 2 + 2 * Math.exp(b - zz)
  useEffect(() => setHist([]), [b])
  const x = [z, b - z] // x = Fz + x̂，F = (1, −1)ᵀ，x̂ = (0, b)
  const grad = [2 * x[0], 2 * Math.exp(x[1])]
  const nu = -(grad[0] + grad[1]) / 2 // −(AAᵀ)⁻¹A∇f
  const newton = () => {
    const nz = z - d1(z) / d2(z)
    setHist([...hist, z])
    setZ(Math.max(-2, Math.min(3, nz)))
  }
  const XRe = [-2, 3], YRe = [-2, 2.5]
  const ends = lineEnds([1, 1], b, XRe, YRe)
  const ymax = Math.max(ft(-2), ft(3)) * 0.6
  return (
    <Widget
      title="消元法：把平面上的约束问题变成一条数轴上的问题 Eliminating Ax = b"
      hint="左图：f(x)=x₁²+2e^{x₂} 的等高线与约束 x₁+x₂=b（橙线）。约束集写成 x = Fz + x̂，F=(1,−1)ᵀ，x̂=(0,b)。拖动 z 滑块，左边的点沿直线滑动，右图同步画出 f̃(z)=f(Fz+x̂)。点“对 z 做一步 Newton”，几步后 f̃′(z)=0；此时 ∇f 的两个分量相等，即 ∇f ∥ (1,1)=Aᵀ。"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        <Ch11Contour f={FEL} fkey="fel" xr={XRe} yr={YRe} W={400} H={360} levels={EL_LEVELS}>
          {({ sx, sy }) => (
            <>
              {ends && <line x1={sx(ends[0][0])} y1={sy(ends[0][1])} x2={sx(ends[1][0])} y2={sy(ends[1][1])} stroke={C.orange} strokeWidth={2.5} />}
              <Arrow x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={sy(b)} color={C.gray} w={1.6} dash="4 3" />
              <text x={sx(0) + 6} y={sy(b) - 6} fontSize={13} fill={C.gray}>x̂=(0,b)</text>
              <Arrow x1={sx(x[0])} y1={sy(x[1])} x2={sx(x[0]) + grad[0] * 12} y2={sy(x[1]) - grad[1] * 12} color={C.ink} />
              <circle cx={sx(x[0])} cy={sy(x[1])} r={6} fill={C.red} />
              <text x={sx(x[0]) + 8} y={sy(x[1]) + 18} fontSize={13} fill={C.red}>x = Fz + x̂</text>
            </>
          )}
        </Ch11Contour>
        <Mafs viewBox={{ x: [-2, 3], y: [-0.5, ymax] }} height={300} preserveAspectRatio={false}>
          <Coordinates.Cartesian subdivisions={1} />
          <Plot.OfX y={ft} color={Theme.blue} weight={3} />
          {hist.map((h, i) => <Point key={i} x={h} y={ft(h)} color={Theme.indigo} />)}
          <Line.Segment point1={[z - 1, ft(z) - d1(z)]} point2={[z + 1, ft(z) + d1(z)]} color={Theme.orange} style="dashed" />
          <Point x={z} y={ft(z)} color={Theme.red} />
          <Text x={z} y={ft(z)} attach="n" size={13}>f̃(z)</Text>
        </Mafs>
      </div>
      <div className="wrow">
        <Slider label={<M>{'z'}</M>} value={z} set={(v) => { setZ(v); setHist([]) }} min={-2} max={3} step={0.01} />
        <Slider label={<M>{'b'}</M>} value={b} set={setB} min={-1} max={2} step={0.01} />
        <button className="wbtn primary" onClick={newton}>对 z 做一步 Newton</button>
      </div>
      <div className="wstat">
        <span className="chip info">x = ({x[0].toFixed(3)}, {x[1].toFixed(3)})，x₁+x₂ = {(x[0] + x[1]).toFixed(3)}</span>
        <span className="chip info">f̃′(z) = {fmt(d1(z))}</span>
        <span className="chip info">∇f = ({grad[0].toFixed(3)}, {grad[1].toFixed(3)})</span>
        <span className="chip info">ν = −(AAᵀ)⁻¹A∇f = {nu.toFixed(3)}</span>
        {Math.abs(d1(z)) < 1e-6 ? <span className="chip good">f̃′(z)=0，∇f + Aᵀν = 0 成立</span> : <span className="chip">∇f + Aᵀν = ({(grad[0] + nu).toFixed(3)}, {(grad[1] + nu).toFixed(3)})</span>}
      </div>
    </Widget>
  )
}
