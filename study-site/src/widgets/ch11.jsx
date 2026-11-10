// 第 11 章 无约束优化：梯度下降与牛顿法 —— 交互组件
import { useState, useMemo, useEffect, useRef } from 'react'
import { Mafs, Plot, Point, Line, Polygon, Vector, Text, Theme, useMovablePoint } from 'mafs'
import { Coordinates } from './coordinates.jsx'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'

/* =====================================================================
   通用工具：等高线（marching squares）、对数误差曲线、小线性代数
   ===================================================================== */

// 返回每个 level 的 SVG path（已映射到像素坐标）
export function ch11ContourPaths(f, xr, yr, levels, sx, sy, nx = 90, ny = 60) {
  const xs = [], ys = []
  for (let i = 0; i <= nx; i++) xs.push(xr[0] + ((xr[1] - xr[0]) * i) / nx)
  for (let j = 0; j <= ny; j++) ys.push(yr[0] + ((yr[1] - yr[0]) * j) / ny)
  const V = ys.map((y) => xs.map((x) => f(x, y)))
  const seg = (a, b) => `M${sx(a[0]).toFixed(1)} ${sy(a[1]).toFixed(1)}L${sx(b[0]).toFixed(1)} ${sy(b[1]).toFixed(1)}`
  return levels.map((L) => {
    let d = ''
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const c = [
          [xs[i], ys[j], V[j][i]],
          [xs[i + 1], ys[j], V[j][i + 1]],
          [xs[i + 1], ys[j + 1], V[j + 1][i + 1]],
          [xs[i], ys[j + 1], V[j + 1][i]],
        ]
        const pts = []
        for (let e = 0; e < 4; e++) {
          const a = c[e], b = c[(e + 1) % 4]
          const ina = a[2] < L, inb = b[2] < L
          if (ina !== inb && isFinite(a[2]) && isFinite(b[2])) {
            const s = (L - a[2]) / (b[2] - a[2])
            pts.push([a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1])])
          }
        }
        if (pts.length >= 2) {
          d += seg(pts[0], pts[1])
          if (pts.length === 4) d += seg(pts[2], pts[3])
        }
      }
    }
    return d
  })
}

// 等高线画布：children 是 render 函数 ({sx, sy}) => svg 元素
export function Ch11Contour({ f, fkey, xr, yr, W = 520, H = 300, levels, onPick, children }) {
  const ref = useRef(null)
  // Fit both world ranges with one scale, including when this SVG is used in
  // a narrow column. Expanding the visible range keeps the plot edge-to-edge.
  const scale = Math.min(W / (xr[1] - xr[0]), H / (yr[1] - yr[0]))
  const cx = (xr[0] + xr[1]) / 2, cy = (yr[0] + yr[1]) / 2
  const vx = [cx - W / (2 * scale), cx + W / (2 * scale)]
  const vy = [cy - H / (2 * scale), cy + H / (2 * scale)]
  const sx = (x) => W / 2 + (x - cx) * scale
  const sy = (y) => H / 2 - (y - cy) * scale
  const paths = useMemo(
    () => ch11ContourPaths(f, vx, vy, levels, sx, sy),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fkey, xr[0], xr[1], yr[0], yr[1], levels.join(','), W, H],
  )
  const pick = (e) => {
    if (!onPick || !ref.current) return
    const svg = ref.current
    const point = svg.createSVGPoint()
    point.x = e.clientX; point.y = e.clientY
    const local = point.matrixTransform(svg.getScreenCTM().inverse())
    onPick([cx + (local.x - W / 2) / scale, cy + (H / 2 - local.y) / scale])
  }
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block', background: '#fafafa', border: '1px solid #e3e3e3', borderRadius: 10, cursor: onPick ? 'crosshair' : 'default' }}
      onClick={pick}
    >
      {xr[0] < 0 && xr[1] > 0 && <line x1={sx(0)} x2={sx(0)} y1={0} y2={H} stroke="#ced4da" strokeWidth={1} />}
      {yr[0] < 0 && yr[1] > 0 && <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} stroke="#ced4da" strokeWidth={1} />}
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={`hsl(0, 0%, ${80 - (i * 45) / Math.max(1, paths.length - 1)}%)`} strokeWidth={1.1} />
      ))}
      {children && children({ sx, sy })}
    </svg>
  )
}

// 迭代路径（折线 + 圆点）
export function Ch11PathSvg({ pts, sx, sy, color, upto, label }) {
  const shown = pts.slice(0, upto + 1)
  const d = shown.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0]).toFixed(1)} ${sy(p[1]).toFixed(1)}`).join('')
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={2} />
      {shown.map((p, i) => (
        <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r={i === shown.length - 1 ? 5 : 3} fill={i === 0 ? '#fff' : color} stroke={color} strokeWidth={1.5} />
      ))}
      {label && shown.length > 0 && (
        <text x={sx(shown[0][0]) + 7} y={sy(shown[0][1]) - 7} fontSize={13} fill={color}>{label}</text>
      )}
    </g>
  )
}

// 对数坐标误差曲线：series = [{vals:[...], color, label}]
export function Ch11LogPlot({ series, k, ylabel = 'f(x⁽ᵏ⁾) − p*', ymin = -15, ymax = 5, H = 170, W = 520, kmin = 10 }) {
  const ml = 46, mr = 10, mt = 10, mb = 26
  const kmax = Math.max(kmin, ...series.map((s) => s.vals.length - 1))
  const X = (i) => ml + (i / kmax) * (W - ml - mr)
  const Y = (v) => {
    const l = Math.log10(Math.max(v, 1e-300))
    const c = Math.min(ymax, Math.max(ymin, l))
    return mt + ((ymax - c) / (ymax - ymin)) * (H - mt - mb)
  }
  const ticks = []
  for (let e = Math.ceil(ymin / 5) * 5; e <= ymax; e += 5) ticks.push(e)
  const kt = []
  const kstep = kmax <= 12 ? 2 : kmax <= 40 ? 5 : kmax <= 100 ? 10 : 20
  for (let i = 0; i <= kmax; i += kstep) kt.push(i)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', marginTop: 8 }}>
      <rect x={ml} y={mt} width={W - ml - mr} height={H - mt - mb} fill="#fcfcfc" stroke="#dee2e6" />
      {ticks.map((e) => (
        <g key={e}>
          <line x1={ml} x2={W - mr} y1={Y(10 ** e)} y2={Y(10 ** e)} stroke="#f1f3f5" />
          <text x={ml - 4} y={Y(10 ** e) + 4} fontSize={11} textAnchor="end" fill="#868e96">1e{e}</text>
        </g>
      ))}
      {kt.map((i) => (
        <text key={i} x={X(i)} y={H - 10} fontSize={11} textAnchor="middle" fill="#868e96">{i}</text>
      ))}
      <text x={W - mr} y={H - 10} fontSize={11} textAnchor="end" fill="#495057">k</text>
      <text x={ml + 6} y={mt + 14} fontSize={12} fill="#495057">{ylabel}（对数坐标）</text>
      {series.map((s, si) => {
        const vals = s.vals.slice(0, (k ?? s.vals.length) + 1)
        const d = vals.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('')
        return (
          <g key={si}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={1.8} />
            {vals.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r={2.4} fill={s.color} />)}
            {s.label && <text x={W - mr - 6} y={mt + 16 + si * 16} fontSize={12} textAnchor="end" fill={s.color}>{s.label}</text>}
          </g>
        )
      })}
    </svg>
  )
}

// 2×2 / n×n 线性方程组（高斯消元，部分主元）
export function ch11Solve(Ain, bin) {
  const n = bin.length
  const A = Ain.map((r) => [...r]), b = [...bin]
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r
    ;[A[c], A[p]] = [A[p], A[c]]
    ;[b[c], b[p]] = [b[p], b[c]]
    if (Math.abs(A[c][c]) < 1e-300) return null
    for (let r = c + 1; r < n; r++) {
      const m = A[r][c] / A[c][c]
      for (let k = c; k < n; k++) A[r][k] -= m * A[c][k]
      b[r] -= m * b[c]
    }
  }
  const x = new Array(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r]
    for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k]
    x[r] = s / A[r][r]
  }
  return x
}

// 一维精确线搜索：先倍增找区间，再黄金分割
export function ch11ExactLS(phi) {
  let B = 1, c = 0
  while (phi(2 * B) < phi(B) && c < 40) { B *= 2; c++ }
  let a = 0, b = 2 * B
  const g = (Math.sqrt(5) - 1) / 2
  let x1 = b - g * (b - a), x2 = a + g * (b - a), f1 = phi(x1), f2 = phi(x2)
  for (let i = 0; i < 90; i++) {
    if (!(f1 <= f2) && isFinite(f2)) { a = x1; x1 = x2; f1 = f2; x2 = a + g * (b - a); f2 = phi(x2) }
    else { b = x2; x2 = x1; f2 = f1; x1 = b - g * (b - a); f1 = phi(x1) }
  }
  return (a + b) / 2
}

// 回溯线搜索（返回 t 和尝试次数）
export function ch11Backtrack(phi, slope, alpha = 0.1, beta = 0.7) {
  const f0 = phi(0)
  let t = 1, n = 0
  while (!(phi(t) <= f0 + alpha * t * slope) && n < 80) { t *= beta; n++ }
  return t
}

// 讲义第 7 页的例子 f(x1,x2)=e^{x1+3x2-0.1}+e^{x1-3x2-0.1}+e^{-x1-0.1}
export const ch11Fexp = {
  f: (x, y) => Math.exp(x + 3 * y - 0.1) + Math.exp(x - 3 * y - 0.1) + Math.exp(-x - 0.1),
  grad: (x, y) => {
    const a = Math.exp(x + 3 * y - 0.1), b = Math.exp(x - 3 * y - 0.1), c = Math.exp(-x - 0.1)
    return [a + b - c, 3 * a - 3 * b]
  },
  hess: (x, y) => {
    const a = Math.exp(x + 3 * y - 0.1), b = Math.exp(x - 3 * y - 0.1), c = Math.exp(-x - 0.1)
    return [[a + b + c, 3 * a - 3 * b], [3 * a - 3 * b, 9 * a + 9 * b]]
  },
  pstar: 2 * Math.SQRT2 * Math.exp(-0.1),
  xstar: [-Math.log(2) / 2, 0],
}

const fmt = (v, d = 3) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(2) : v.toFixed(d))

// 自动播放 hook：running 时每隔 ms 把 k 加一，直到 kmax
function useAutoRun(k, setK, kmax, ms = 380) {
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    if (k >= kmax) { setRunning(false); return }
    const id = setTimeout(() => setK(k + 1), ms)
    return () => clearTimeout(id)
  }, [running, k, kmax, ms, setK])
  return [running, setRunning]
}

function RunButtons({ k, setK, kmax, running, setRunning }) {
  return (
    <div className="wrow">
      <button className="wbtn" onClick={() => { setRunning(false); setK(0) }}>重置</button>
      <button className="wbtn" disabled={k >= kmax} onClick={() => setK(Math.min(kmax, k + 1))}>单步 →</button>
      <button className="wbtn primary" onClick={() => { if (k >= kmax) setK(0); setRunning(!running) }}>{running ? '暂停' : '自动运行'}</button>
      <span style={{ fontSize: 13, color: '#666' }}>k = {k} / {kmax}</span>
    </div>
  )
}

/* =====================================================================
   1. 梯度下降：二次函数 f = ½(x₁² + γ x₂²)
   ===================================================================== */
const GD_LEVELS = Array.from({ length: 14 }, (_, i) => 0.03 * 2 ** i)

export function Ch11GradientDescent() {
  const [gamma, setGamma] = useState(8)
  const [mode, setMode] = useState('exact')
  const [tf, setTf] = useState(0.2)
  const [start, setStart] = useState([9, 2.5])
  const [k, setK] = useState(0)
  const f = (x, y) => 0.5 * (x * x + gamma * y * y)
  const path = useMemo(() => {
    let p = [...start]
    const out = [{ p, f: f(...p), t: null }]
    for (let it = 0; it < 120; it++) {
      const g = [p[0], gamma * p[1]]
      const gg = g[0] ** 2 + g[1] ** 2
      if (gg < 1e-28) break
      const d = [-g[0], -g[1]]
      let t
      if (mode === 'exact') t = gg / (g[0] ** 2 + gamma * g[1] ** 2)
      else if (mode === 'bt') t = ch11Backtrack((s) => f(p[0] + s * d[0], p[1] + s * d[1]), -gg, 0.25, 0.5)
      else t = tf
      p = [p[0] + t * d[0], p[1] + t * d[1]]
      const fv = f(...p)
      out.push({ p, f: fv, t })
      if (fv < 1e-13 || !isFinite(fv) || fv > 1e9) break
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamma, mode, tf, start[0], start[1]])
  const kmax = path.length - 1
  const [running, setRunning] = useAutoRun(k, setK, kmax, 320)
  useEffect(() => { setK(0); setRunning(false) }, [gamma, mode, tf, start, setRunning])
  const cur = path[Math.min(k, kmax)]
  const rate = ((gamma - 1) / (gamma + 1)) ** 2
  const diverge = !isFinite(cur.f) || path[kmax].f > path[0].f
  return (
    <Widget
      title="梯度下降在椭圆等高线上的表现 Gradient descent on a quadratic"
      hint="函数是 f(x)=½(x₁²+γx₂²)，最优点在原点、p*=0。点击图中任意位置换起点。试试把 γ 从 1 调到 25，观察 zig-zag 越来越严重、右下误差曲线越来越平；再切到“固定步长”，把 t 调过 2/γ，看它发散。"
    >
      <Ch11Contour f={f} fkey={'q' + gamma} xr={[-10, 10]} yr={[-5.36, 5.36]} W={560} H={300} levels={GD_LEVELS} onPick={(p) => setStart(p)}>
        {({ sx, sy }) => (
          <>
            <circle cx={sx(0)} cy={sy(0)} r={4} fill="#34c759" />
            <Ch11PathSvg pts={path.map((q) => q.p)} sx={sx} sy={sy} color="#ff9500" upto={k} label="x⁽⁰⁾" />
          </>
        )}
      </Ch11Contour>
      <div className="wrow">
        <Tabs value={mode} set={setMode} tabs={[{ value: 'exact', label: '精确线搜索 exact' }, { value: 'bt', label: '回溯 backtracking (α=0.25, β=0.5)' }, { value: 'fixed', label: '固定步长 fixed t' }]} />
      </div>
      <div className="wrow">
        <Slider label={<span>条件数 <M>{'\\gamma'}</M></span>} value={gamma} set={setGamma} min={1} max={25} step={0.5} fmt={(v) => v.toFixed(1)} />
        {mode === 'fixed' && <Slider label={<span>步长 <M>{'t'}</M></span>} value={tf} set={setTf} min={0.01} max={1.2} step={0.01} />}
      </div>
      <RunButtons k={k} setK={setK} kmax={kmax} running={running} setRunning={setRunning} />
      <Ch11LogPlot series={[{ vals: path.map((q) => q.f), color: '#ff9500', label: '梯度下降' }]} k={k} ymin={-15} ymax={5} />
      <div className="wstat">
        <span className="chip info">x⁽ᵏ⁾ = ({fmt(cur.p[0], 2)}, {fmt(cur.p[1], 2)})</span>
        <span className="chip info">f(x⁽ᵏ⁾) − p* = {fmt(cur.f)}</span>
        {cur.t !== null && <span className="chip">上一步 t = {fmt(cur.t)}</span>}
        <span className="chip">κ = γ = {gamma.toFixed(1)}，最坏每步误差因子 ((κ−1)/(κ+1))² = {rate.toFixed(3)}</span>
        {mode === 'fixed' && (tf < 2 / gamma ? <span className="chip good">t &lt; 2/γ = {(2 / gamma).toFixed(3)}：收敛</span> : <span className="chip bad">t ≥ 2/γ = {(2 / gamma).toFixed(3)}：x₂ 方向发散</span>)}
        {diverge && <span className="chip bad">发散！f 在变大</span>}
      </div>
    </Widget>
  )
}

/* =====================================================================
   2. 回溯线搜索：一维图
   ===================================================================== */
export function Ch11Backtracking() {
  const [alpha, setAlpha] = useState(0.3)
  const [beta, setBeta] = useState(0.5)
  const [s, setS] = useState(1)
  const [n, setN] = useState(0) // 已经尝试到第 n 个 t = β^n
  const x0 = 1.5
  const F = (x) => Math.exp(x) + Math.exp(-x)
  const dF = (x) => Math.exp(x) - Math.exp(-x)
  const dx = -s * dF(x0)
  const g = (t) => F(x0 + t * dx)
  const f0 = F(x0)
  const slope = dF(x0) * dx // ∇f^T Δx < 0
  const h = (t) => f0 + alpha * t * slope
  const tan = (t) => f0 + t * slope
  useEffect(() => setN(0), [alpha, beta, s])
  // t0：g(t)=h(t) 的正根（二分）
  const t0 = useMemo(() => {
    let lo = 1e-9, hi = 1e-9
    while (g(hi) <= h(hi) && hi < 50) hi = hi * 2 + 1e-3
    for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (g(m) <= h(m)) lo = m; else hi = m }
    return lo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alpha, s])
  const trials = Array.from({ length: n + 1 }, (_, i) => beta ** i)
  const ok = (t) => g(t) <= h(t)
  const done = ok(trials[n])
  // 视窗
  let gmax = -Infinity, gmin = Infinity
  for (let i = 0; i <= 60; i++) { const t = (1.1 * i) / 60; gmax = Math.max(gmax, g(t)); gmin = Math.min(gmin, g(t)) }
  const ytop = Math.min(gmax, f0 + 3 * (f0 - gmin) + 1) * 1.05 + 0.3
  const ybot = Math.min(gmin, h(1.1)) - 0.2 * (ytop - gmin)
  return (
    <Widget
      title="回溯线搜索 Backtracking line search"
      hint="黑色曲线是 g(t)=f(x+tΔx)，灰色虚线是 t=0 处的切线，橙色是“放宽的” α-线 f(x)+αt∇fᵀΔx。从 t=1 开始，点“下一次尝试”让 t←βt，直到点落到橙线下方（绿色区间 (0,t₀] 内）。试试把 β 调到 0.9（缩得慢、尝试次数多）或把 α 调小（更容易接受）。"
    >
      <Mafs viewBox={{ x: [-0.06, 1.12], y: [ybot, ytop] }} height={320} preserveAspectRatio="contain">
        <Coordinates.Cartesian xAxis={{ lines: 0.25 }} yAxis={{ lines: Math.max(0.5, Math.round((ytop - ybot) / 6)) }} />
        <Line.Segment point1={[0, ybot + 0.03 * (ytop - ybot)]} point2={[Math.min(t0, 1.12), ybot + 0.03 * (ytop - ybot)]} color={Theme.green} weight={7} />
        <Text x={Math.min(t0, 1.0)} y={ybot + 0.03 * (ytop - ybot)} attach="ne" size={13} color={Theme.green}>t₀ = {t0.toFixed(3)}</Text>
        <Plot.OfX y={tan} color={Theme.indigo} style="dashed" opacity={0.5} />
        <Plot.OfX y={h} color={Theme.orange} weight={2.5} />
        <Plot.OfX y={g} color={Theme.blue} weight={3} />
        {trials.map((t, i) => (
          <g key={i}>
            <Line.Segment point1={[t, h(t)]} point2={[t, g(t)]} color={ok(t) ? Theme.green : Theme.red} style="dashed" opacity={0.7} />
            <Point x={t} y={g(t)} color={ok(t) ? Theme.green : Theme.red} />
            <Text x={t} y={Math.max(g(t), h(t))} attach="n" size={12}>{i === 0 ? 't=1' : `β^${i}`}</Text>
          </g>
        ))}
        <Point x={0} y={f0} color={Theme.indigo} />
        <Text x={0} y={f0} attach="e" size={13}>f(x)</Text>
      </Mafs>
      <div className="wrow">
        <Slider label={<M>{'\\alpha'}</M>} value={alpha} set={setAlpha} min={0.01} max={0.49} step={0.01} />
        <Slider label={<M>{'\\beta'}</M>} value={beta} set={setBeta} min={0.1} max={0.95} step={0.01} />
        <Slider label={<span>Δx 长度倍数</span>} value={s} set={setS} min={0.2} max={1.5} step={0.05} />
      </div>
      <div className="wrow">
        <button className="wbtn" onClick={() => setN(0)}>重新从 t=1 开始</button>
        <button className="wbtn primary" disabled={done} onClick={() => setN(n + 1)}>下一次尝试 t ← βt</button>
      </div>
      <div className="wstat">
        <span className="chip info">当前 t = {trials[n].toFixed(4)}</span>
        <span className="chip info">g(t) = {g(trials[n]).toFixed(3)}</span>
        <span className="chip info">α-线 = {h(trials[n]).toFixed(3)}</span>
        {done ? <span className="chip good">满足 f(x+tΔx) ≤ f(x)+αt∇fᵀΔx，接受 t（共缩小 {n} 次）</span> : <span className="chip bad">点在橙线上方，需要继续缩小 t</span>}
        <span className="chip">∇fᵀΔx = {slope.toFixed(2)} （&lt; 0，是下降方向）</span>
      </div>
    </Widget>
  )
}

/* =====================================================================
   3. 最速下降：不同范数的单位球
   ===================================================================== */
const P_MAT = [[2.5, 1], [1, 1]] // 二次范数 ‖v‖_P = sqrt(vᵀPv)
export function Ch11SteepestNorms() {
  const gp = useMovablePoint([1.4, 0.6], { color: Theme.blue })
  const [norm, setNorm] = useState('l2')
  const g = [gp.x, gp.y]
  const gn = Math.hypot(g[0], g[1]) || 1e-9
  let d, dual, ball
  if (norm === 'l2') {
    d = [-g[0] / gn, -g[1] / gn]; dual = gn
  } else if (norm === 'l1') {
    const i = Math.abs(g[0]) >= Math.abs(g[1]) ? 0 : 1
    d = [0, 0]; d[i] = -Math.sign(g[i]) || -1; dual = Math.max(Math.abs(g[0]), Math.abs(g[1]))
    ball = [[1, 0], [0, 1], [-1, 0], [0, -1]]
  } else if (norm === 'linf') {
    d = [-(Math.sign(g[0]) || 1), -(Math.sign(g[1]) || 1)]; dual = Math.abs(g[0]) + Math.abs(g[1])
    ball = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
  } else {
    // P^{-1} g / sqrt(gᵀP^{-1}g)
    const det = P_MAT[0][0] * P_MAT[1][1] - P_MAT[0][1] ** 2
    const Pi = [[P_MAT[1][1] / det, -P_MAT[0][1] / det], [-P_MAT[0][1] / det, P_MAT[0][0] / det]]
    const u = [Pi[0][0] * g[0] + Pi[0][1] * g[1], Pi[1][0] * g[0] + Pi[1][1] * g[1]]
    dual = Math.sqrt(g[0] * u[0] + g[1] * u[1]) || 1e-9
    d = [-u[0] / dual, -u[1] / dual]
  }
  const dd = g[0] * d[0] + g[1] * d[1]
  const perp = [-g[1], g[0]]
  return (
    <Widget
      title="最速下降方向依赖于范数 Steepest descent in different norms"
      hint="拖动黑点改变梯度 ∇f(x)。红色箭头是在“单位球”（灰色区域）里让 ∇fᵀv 最小的方向 Δx_nsd，绿色虚线是与 ∇f 垂直、恰好切到单位球的等值线。切换范数：只有欧氏范数时它才正好是 −∇f 的方向。"
    >
      <Mafs viewBox={{ x: [-2.6, 2.6], y: [-1.8, 1.8] }} height={320} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        {norm === 'l2' && <Plot.Parametric domain={[0, 2 * Math.PI]} xy={(t) => [Math.cos(t), Math.sin(t)]} color={Theme.indigo} />}
        {ball && <Polygon points={ball} color={Theme.indigo} fillOpacity={0.12} />}
        {norm === 'quad' && (
          <Plot.Parametric
            domain={[0, 2 * Math.PI]}
            xy={(t) => {
              const c = Math.cos(t), s = Math.sin(t)
              const r = 1 / Math.sqrt(P_MAT[0][0] * c * c + 2 * P_MAT[0][1] * c * s + P_MAT[1][1] * s * s)
              return [r * c, r * s]
            }}
            color={Theme.indigo}
          />
        )}
        <Line.ThroughPoints point1={d} point2={[d[0] + perp[0], d[1] + perp[1]]} color={Theme.green} style="dashed" />
        <Vector tail={[0, 0]} tip={[-g[0] / gn, -g[1] / gn]} color={Theme.indigo} style="dashed" />
        <Vector tail={[0, 0]} tip={g} color={Theme.blue} />
        <Vector tail={[0, 0]} tip={d} color={Theme.red} weight={3} />
        <Text x={g[0]} y={g[1]} attach="ne" size={14} color={Theme.blue}>∇f(x)</Text>
        <Text x={d[0]} y={d[1]} attach="sw" size={14} color={Theme.red}>Δx_nsd</Text>
        {gp.element}
      </Mafs>
      <div className="wrow">
        <Tabs value={norm} set={setNorm} tabs={[{ value: 'l2', label: '欧氏 ‖·‖₂' }, { value: 'quad', label: '二次范数 ‖·‖_P' }, { value: 'l1', label: '‖·‖₁' }, { value: 'linf', label: '‖·‖∞' }]} />
      </div>
      <div className="wstat">
        <span className="chip info">Δx_nsd = ({d[0].toFixed(2)}, {d[1].toFixed(2)})</span>
        <span className="chip info">∇fᵀΔx_nsd = {dd.toFixed(3)}（= −‖∇f‖_*，对偶范数 {dual.toFixed(3)}）</span>
        {norm === 'l2' ? <span className="chip good">与 −∇f 同向 → 就是梯度下降</span> : <span className="chip bad">一般不与 −∇f 同向</span>}
      </div>
    </Widget>
  )
}

/* =====================================================================
   4. 一维牛顿法：二次近似动画
   ===================================================================== */
const N1D = {
  lc: {
    label: 'f(x)=log(eˣ+e⁻ˣ)',
    f: (x) => Math.abs(x) + Math.log1p(Math.exp(-2 * Math.abs(x))),
    d1: (x) => Math.tanh(x),
    d2: (x) => 1 - Math.tanh(x) ** 2,
    pstar: Math.log(2),
    view: { x: [-4, 4], y: [-0.6, 4.4] },
    x0: 1.3,
  },
  ex: {
    label: 'f(x)=eˣ−2x',
    f: (x) => Math.exp(x) - 2 * x,
    d1: (x) => Math.exp(x) - 2,
    d2: (x) => Math.exp(x),
    pstar: 2 - 2 * Math.log(2),
    view: { x: [-2.5, 2.5], y: [-0.6, 6] },
    x0: -1.8,
  },
}
export function Ch11Newton1D() {
  const [fk, setFk] = useState('lc')
  const [damped, setDamped] = useState(false)
  const F = N1D[fk]
  const clampX = (x) => Math.max(F.view.x[0] + 0.05, Math.min(F.view.x[1] - 0.05, x))
  const pt = useMovablePoint([F.x0, F.f(F.x0)], { color: Theme.blue, constrain: ([x]) => [clampX(x), F.f(clampX(x))] })
  const [hist, setHist] = useState([{ x: F.x0, t: null }])
  const x = hist[hist.length - 1].x
  useEffect(() => {
    if (Math.abs(pt.x - x) > 1e-9 && isFinite(x) && Math.abs(x) < 50) setHist([{ x: pt.x, t: null }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pt.x])
  const switchF = (k) => {
    setFk(k)
    setHist([{ x: N1D[k].x0, t: null }])
    pt.setPoint([N1D[k].x0, N1D[k].f(N1D[k].x0)])
  }
  const g1 = F.d1(x), g2 = F.d2(x)
  const dxnt = -g1 / g2
  const lam2 = (g1 * g1) / g2
  const fx = F.f(x)
  const q = (y) => fx + g1 * (y - x) + 0.5 * g2 * (y - x) ** 2
  const ok = isFinite(x) && Math.abs(x) < 1e6
  const step = () => {
    if (!ok) return
    let t = 1
    if (damped) t = ch11Backtrack((s) => F.f(x + s * dxnt), g1 * dxnt, 0.25, 0.5)
    const nx = x + t * dxnt
    setHist([...hist, { x: nx, t }])
    if (Math.abs(nx) < 50) pt.setPoint([clampX(nx), F.f(clampX(nx))])
  }
  const inView = ok && x > F.view.x[0] && x < F.view.x[1]
  return (
    <Widget
      title="牛顿法 = 反复跳到二次近似的最低点 Newton step as quadratic-model minimizer"
      hint="黑点是当前 x；棕色虚线抛物线是二阶 Taylor 近似 f̂(x+v)，红点是它的最低点 x+Δx_nt；竖直的绿色线段长度就是 λ²/2。拖动黑点或点“牛顿一步”。在 log(eˣ+e⁻ˣ) 上把起点拖到 |x|>1.1 再走纯牛顿（t=1），会越跳越远；勾上“阻尼（回溯）”就能收敛。靠近最优点时看表格里误差的位数每步翻倍。"
    >
      <div className="wrow" style={{ marginTop: 0, marginBottom: 8 }}>
        <Tabs value={fk} set={switchF} tabs={Object.entries(N1D).map(([k, v]) => ({ value: k, label: v.label }))} />
        <label style={{ fontSize: 14 }}><input type="checkbox" checked={damped} onChange={(e) => setDamped(e.target.checked)} /> 阻尼牛顿（回溯 α=0.25, β=0.5）</label>
      </div>
      <Mafs viewBox={F.view} height={320} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.OfX y={F.f} color={Theme.blue} weight={3} />
        {inView && <Plot.OfX y={q} color={Theme.violet} style="dashed" />}
        {inView && Math.abs(x + dxnt) < 1e3 && (
          <>
            <Line.Segment point1={[x, fx]} point2={[x + dxnt, fx]} color={Theme.indigo} style="dashed" opacity={0.6} />
            <Line.Segment point1={[x + dxnt, fx]} point2={[x + dxnt, fx - lam2 / 2]} color={Theme.green} weight={3} />
            <Point x={x + dxnt} y={fx - lam2 / 2} color={Theme.red} />
            <Text x={x + dxnt} y={fx - lam2 / 2} attach="s" size={13} color={Theme.red}>x+Δx_nt</Text>
            <Text x={x + dxnt} y={fx - lam2 / 4} attach="e" size={13} color={Theme.green}>λ²/2</Text>
          </>
        )}
        {pt.element}
      </Mafs>
      <div className="wrow">
        <button className="wbtn" onClick={() => { setHist([{ x: F.x0, t: null }]); pt.setPoint([F.x0, F.f(F.x0)]) }}>重置</button>
        <button className="wbtn primary" disabled={!ok} onClick={step}>牛顿一步 →</button>
      </div>
      <div className="wstat">
        <span className="chip info">x = {ok ? fmt(x, 4) : '发散'}</span>
        <span className="chip info">Δx_nt = −f′/f″ = {ok ? fmt(dxnt) : '—'}</span>
        <span className="chip info">λ²/2 = {ok ? fmt(lam2 / 2) : '—'}</span>
        <span className="chip">真实 f(x) − p* = {ok ? fmt(fx - F.pstar) : '—'}</span>
      </div>
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table style={{ fontSize: 13, borderCollapse: 'collapse', minWidth: 360 }}>
          <thead><tr>{['k', 'x⁽ᵏ⁾', '步长 t', 'f(x⁽ᵏ⁾) − p*'].map((h) => <th key={h} style={{ padding: '2px 10px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>{h}</th>)}</tr></thead>
          <tbody>
            {hist.slice(-8).map((r, i) => {
              const kk = hist.length - Math.min(8, hist.length) + i
              const e = F.f(r.x) - F.pstar
              return (
                <tr key={kk}>
                  <td style={{ padding: '2px 10px' }}>{kk}</td>
                  <td style={{ padding: '2px 10px' }}>{isFinite(r.x) ? fmt(r.x, 6) : '∞'}</td>
                  <td style={{ padding: '2px 10px' }}>{r.t === null ? '—' : fmt(r.t)}</td>
                  <td style={{ padding: '2px 10px', color: e < 1e-8 ? '#34c759' : '#333' }}>{isFinite(e) ? e.toExponential(3) : '∞'}</td>
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
   5. 牛顿法 vs 梯度下降（讲义第 7 页的函数）
   ===================================================================== */
const FE_LEVELS = Array.from({ length: 13 }, (_, i) => ch11Fexp.pstar + 0.01 * 2 ** i)

function runMethod(method, ls, start, maxIt) {
  const { f, grad, hess, pstar } = ch11Fexp
  let p = [...start]
  const out = [{ p, e: f(...p) - pstar, t: null }]
  for (let it = 0; it < maxIt; it++) {
    const g = grad(...p)
    let d
    if (method === 'gd') d = [-g[0], -g[1]]
    else { const s = ch11Solve(hess(...p), [-g[0], -g[1]]); if (!s) break; d = s }
    const slope = g[0] * d[0] + g[1] * d[1]
    if (Math.abs(slope) < 1e-30) break
    const phi = (t) => f(p[0] + t * d[0], p[1] + t * d[1])
    let t
    if (ls === 'pure' && method === 'nt') t = 1
    else if (ls === 'exact') t = ch11ExactLS(phi)
    else t = ch11Backtrack(phi, slope, 0.1, 0.7)
    p = [p[0] + t * d[0], p[1] + t * d[1]]
    const e = f(...p) - pstar
    if (!isFinite(e) || !isFinite(p[0]) || !isFinite(p[1])) break
    out.push({ p, e: Math.max(e, 1e-16), t })
    if (e < 1e-15 || !isFinite(e)) break
  }
  return out
}

export function Ch11NewtonVsGD() {
  const [start, setStart] = useState([-2.2, 0.8])
  const [ls, setLs] = useState('bt')
  const [k, setK] = useState(0)
  const gd = useMemo(() => runMethod('gd', ls === 'pure' ? 'bt' : ls, start, 80), [ls, start])
  const nt = useMemo(() => runMethod('nt', ls, start, 40), [ls, start])
  const kmax = Math.max(gd.length, nt.length) - 1
  const [running, setRunning] = useAutoRun(k, setK, kmax, 300)
  useEffect(() => { setK(0); setRunning(false) }, [ls, start, setRunning])
  const cg = gd[Math.min(k, gd.length - 1)], cn = nt[Math.min(k, nt.length - 1)]
  const firstBelow = (arr, tol) => { const i = arr.findIndex((q) => q.e < tol); return i < 0 ? '>' + (arr.length - 1) : i }
  return (
    <Widget
      title="牛顿法 vs 梯度下降 Newton vs gradient descent"
      hint="同一个非二次函数 f=e^{x₁+3x₂−0.1}+e^{x₁−3x₂−0.1}+e^{−x₁−0.1}（讲义第 7 页的例子）。点击图换起点，然后自动运行。观察：橙色梯度下降在窄谷里来回折，误差曲线是一条斜直线（线性收敛）；红色牛顿法几步就到，误差曲线先缓后“断崖式”下跌（二次收敛）。"
    >
      <Ch11Contour f={ch11Fexp.f} fkey="fexp" xr={[-3, 1.5]} yr={[-1.2, 1.2]} W={540} H={288} levels={FE_LEVELS} onPick={setStart}>
        {({ sx, sy }) => (
          <>
            <circle cx={sx(ch11Fexp.xstar[0])} cy={sy(0)} r={4} fill="#34c759" />
            <Ch11PathSvg pts={gd.map((q) => q.p)} sx={sx} sy={sy} color="#ff9500" upto={k} />
            <Ch11PathSvg pts={nt.map((q) => q.p)} sx={sx} sy={sy} color="#ff3b30" upto={k} label="x⁽⁰⁾" />
          </>
        )}
      </Ch11Contour>
      <div className="wrow">
        <Tabs value={ls} set={setLs} tabs={[{ value: 'bt', label: '回溯 (α=0.1, β=0.7)' }, { value: 'exact', label: '精确线搜索' }, { value: 'pure', label: '纯牛顿 t=1（GD 仍用回溯）' }]} />
      </div>
      <RunButtons k={k} setK={setK} kmax={kmax} running={running} setRunning={setRunning} />
      <Ch11LogPlot series={[{ vals: gd.map((q) => q.e), color: '#ff9500', label: '梯度下降' }, { vals: nt.map((q) => q.e), color: '#ff3b30', label: '牛顿法' }]} k={k} />
      <div className="wstat">
        <span className="chip info">GD: f−p* = {fmt(cg.e)}{cg.t !== null && `，t=${fmt(cg.t)}`}</span>
        <span className="chip info">Newton: f−p* = {fmt(cn.e)}{cn.t !== null && `，t=${fmt(cn.t)}`}</span>
        <span className="chip good">误差 &lt; 1e-10 所需迭代：GD {firstBelow(gd, 1e-10)}，Newton {firstBelow(nt, 1e-10)}</span>
      </div>
    </Widget>
  )
}
