// 第 0 章 数学预备 —— 交互组件
import { useState, useMemo, useRef } from 'react'
import { Mafs, Plot, Point, Line, Polygon, Circle, Vector, Text, Theme, useMovablePoint } from 'mafs'
import { Coordinates } from './coordinates.jsx'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'

const fx = (v, d = 2) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(d)

/* =====================================================================
   通用：二维标量场（热力图 + 等高线 + 可拖动点），手写 SVG
   ===================================================================== */
function contourPaths(f, xr, yr, nx, ny, levels, sx, sy) {
  const dx = (xr[1] - xr[0]) / nx, dy = (yr[1] - yr[0]) / ny
  const V = new Float64Array((nx + 1) * (ny + 1))
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) V[j * (nx + 1) + i] = f(xr[0] + i * dx, yr[0] + j * dy)
  return levels.map((L) => {
    let d = ''
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const c = [
          [i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1],
        ].map(([a, b]) => ({ x: xr[0] + a * dx, y: yr[0] + b * dy, v: V[b * (nx + 1) + a] }))
        const pts = []
        for (let e = 0; e < 4; e++) {
          const p = c[e], q = c[(e + 1) % 4]
          if ((p.v - L) * (q.v - L) < 0) {
            const t = (L - p.v) / (q.v - p.v)
            pts.push([p.x + t * (q.x - p.x), p.y + t * (q.y - p.y)])
          }
        }
        for (let k = 0; k + 1 < pts.length; k += 2) {
          d += `M${sx(pts[k][0]).toFixed(1)} ${sy(pts[k][1]).toFixed(1)}L${sx(pts[k + 1][0]).toFixed(1)} ${sy(pts[k + 1][1]).toFixed(1)}`
        }
      }
    }
    return { L, d }
  })
}

function heatImage(f, xr, yr, diverging) {
  if (typeof document === 'undefined') return ''
  const w = 150, h = Math.round(150 * (yr[1] - yr[0]) / (xr[1] - xr[0]))
  const cv = document.createElement('canvas')
  cv.width = w; cv.height = h
  const ctx = cv.getContext('2d')
  const img = ctx.createImageData(w, h)
  const vals = new Float64Array(w * h)
  let lo = Infinity, hi = -Infinity
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const x = xr[0] + (c + 0.5) / w * (xr[1] - xr[0])
    const y = yr[1] - (r + 0.5) / h * (yr[1] - yr[0])
    const v = f(x, y)
    vals[r * w + c] = v
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const s = Math.max(Math.abs(lo), Math.abs(hi)) || 1
  for (let k = 0; k < w * h; k++) {
    let R, G, B
    if (diverging) {
      const t = Math.max(-1, Math.min(1, vals[k] / s))
      const m = Math.pow(Math.abs(t), 0.6)
      if (t >= 0) { R = 255 - m * (255 - 255); G = 255 - m * (255 - 160); B = 255 - m * (255 - 70) }
      else { R = 255 - m * (255 - 120); G = 255 - m * (255 - 190); B = 255 - m * (255 - 130) }
    } else {
      const t = Math.pow((vals[k] - lo) / ((hi - lo) || 1), 0.55)
      R = 255; G = 255 - t * 105; B = 255 - t * 190
    }
    img.data[4 * k] = R; img.data[4 * k + 1] = G; img.data[4 * k + 2] = B; img.data[4 * k + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return cv.toDataURL()
}

function Arrow({ x1, y1, x2, y2, color, w = 3, dash }) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy)
  if (L < 1) return null
  const ux = dx / L, uy = dy / L, hl = Math.min(12, L * 0.5)
  const bx = x2 - ux * hl, by = y2 - uy * hl
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={w} strokeDasharray={dash ? '6 4' : undefined} />
      <polygon points={`${x2},${y2} ${bx - uy * hl * 0.45},${by + ux * hl * 0.45} ${bx + uy * hl * 0.45},${by - ux * hl * 0.45}`} fill={color} />
    </g>
  )
}

function Field2D({ f, fkey, xr, yr, levels, diverging = false, highlight, points = [], children, W = 560 }) {
  const H = Math.round(W * (yr[1] - yr[0]) / (xr[1] - xr[0]))
  const sx = (x) => (x - xr[0]) / (xr[1] - xr[0]) * W
  const sy = (y) => (yr[1] - y) / (yr[1] - yr[0]) * H
  const ix = (px) => xr[0] + px / W * (xr[1] - xr[0])
  const iy = (py) => yr[1] - py / H * (yr[1] - yr[0])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const img = useMemo(() => heatImage(f, xr, yr, diverging), [fkey])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const paths = useMemo(() => contourPaths(f, xr, yr, 96, Math.round(96 * H / W), levels, sx, sy), [fkey])
  const hl = highlight !== undefined ? contourPaths(f, xr, yr, 96, Math.round(96 * H / W), [highlight], sx, sy)[0] : null
  const ref = useRef(null)
  const [drag, setDrag] = useState(-1)
  const toWorld = (e) => {
    const svg = ref.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const q = pt.matrixTransform(svg.getScreenCTM().inverse())
    return [Math.max(xr[0], Math.min(xr[1], ix(q.x))), Math.max(yr[0], Math.min(yr[1], iy(q.y)))]
  }
  const down = (e) => {
    if (!points.length) return
    const w = toWorld(e)
    let best = 0, bd = Infinity
    points.forEach((p, k) => { const d = Math.hypot(p.p[0] - w[0], p.p[1] - w[1]); if (d < bd) { bd = d; best = k } })
    setDrag(best)
    ref.current.setPointerCapture?.(e.pointerId)
    points[best].set(w)
  }
  const move = (e) => { if (drag >= 0) points[drag].set(toWorld(e)) }
  const up = () => setDrag(-1)
  const ctx = { sx, sy, W, H }
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', borderRadius: 10, border: '1px solid #e5e5ea', background: '#fff', cursor: points.length ? 'crosshair' : 'default', userSelect: 'none' }}>
      {img && <image href={img} x={0} y={0} width={W} height={H} preserveAspectRatio="none" />}
      <line x1={sx(0)} y1={0} x2={sx(0)} y2={H} stroke="#999" strokeWidth={1} />
      <line x1={0} y1={sy(0)} x2={W} y2={sy(0)} stroke="#999" strokeWidth={1} />
      {paths.map(({ L, d }) => <path key={L} d={d} stroke={L < 0 ? '#636366' : '#7a4a10'} strokeOpacity={0.55} strokeWidth={1.3} fill="none" />)}
      {hl && <path d={hl.d} stroke="#ff9500" strokeWidth={2.6} fill="none" />}
      {children && children(ctx)}
      {points.map((p, k) => (
        <circle key={k} cx={sx(p.p[0])} cy={sy(p.p[1])} r={9} fill={p.color || Theme.pink} stroke="#fff" strokeWidth={2.5} style={{ cursor: 'grab' }} />
      ))}
    </svg>
  )
}

/* =====================================================================
   1. 内积与投影
   ===================================================================== */
export function Ch00InnerProduct() {
  const a = useMovablePoint([3, 1], { color: Theme.blue })
  const b = useMovablePoint([1, 2.2], { color: Theme.red })
  const dot = a.x * b.x + a.y * b.y
  const na = Math.hypot(a.x, a.y), nb = Math.hypot(b.x, b.y)
  const k = na > 1e-6 ? dot / (na * na) : 0
  const proj = [k * a.x, k * a.y]
  const cos = na * nb > 1e-9 ? dot / (na * nb) : 0
  const ang = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI
  const kind = Math.abs(ang - 90) < 2 ? ['info', '≈ 直角：x 与 y 正交，内积 ≈ 0'] : ang < 90 ? ['good', '锐角：内积 > 0'] : ['bad', '钝角：内积 < 0']
  return (
    <Widget title="内积与投影 Inner product & projection" hint="拖动黑色向量 x 和红色向量 y 的箭头端点。试试把 y 拖到与 x 垂直的方向，观察内积变成 0；再拖到 x 的反方向，观察内积变负、绿色投影反向。">
      <Mafs viewBox={{ x: [-4, 4], y: [-3, 3] }} height={330} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        {na > 1e-3 && <Line.ThroughPoints point1={[0, 0]} point2={a.point} color={Theme.blue} opacity={0.25} style="dashed" />}
        <Vector tip={a.point} color={Theme.blue} weight={3} />
        <Vector tip={b.point} color={Theme.red} weight={3} />
        <Vector tip={proj} color={Theme.green} weight={5} />
        <Line.Segment point1={b.point} point2={proj} color={Theme.indigo} style="dashed" />
        <Text x={a.x} y={a.y} attach="e" size={16} color={Theme.blue}>x</Text>
        <Text x={b.x} y={b.y} attach="n" size={16} color={Theme.red}>y</Text>
        <Text x={proj[0]} y={proj[1]} attach="s" size={13} color={Theme.green}>y 在 x 上的投影</Text>
        {a.element}
        {b.element}
      </Mafs>
      <div className="wstat">
        <span className="chip info">x = ({fx(a.x)}, {fx(a.y)})</span>
        <span className="chip info">y = ({fx(b.x)}, {fx(b.y)})</span>
        <span className="chip info"><M>{'x^Ty'}</M> = {fx(a.x)}·{fx(b.x)} + {fx(a.y)}·{fx(b.y)} = {fx(dot)}</span>
        <span className="chip"><M>{'\\|x\\|_2'}</M> = {fx(na)}, <M>{'\\|y\\|_2'}</M> = {fx(nb)}</span>
        <span className="chip">cos θ = {fx(cos)}，θ = {ang.toFixed(1)}°</span>
        <span className={`chip ${kind[0]}`}>{kind[1]}</span>
      </div>
    </Widget>
  )
}

/* =====================================================================
   2. 范数单位球
   ===================================================================== */
const sgn = (v) => (v < 0 ? -1 : 1)
const ballXY = (p, r) => (t) => [r * sgn(Math.cos(t)) * Math.pow(Math.abs(Math.cos(t)), 2 / p), r * sgn(Math.sin(t)) * Math.pow(Math.abs(Math.sin(t)), 2 / p)]
const pnorm = (x, y, p) => (p === Infinity ? Math.max(Math.abs(x), Math.abs(y)) : Math.pow(Math.pow(Math.abs(x), p) + Math.pow(Math.abs(y), p), 1 / p))

export function Ch00NormBall() {
  const [p, setP] = useState(2)
  const [inf, setInf] = useState(false)
  const q = useMovablePoint([1.2, 0.7], { color: Theme.pink })
  const P = inf ? Infinity : p
  const r = pnorm(q.x, q.y, P)
  const sq = (s) => [[s, s], [-s, s], [-s, -s], [s, -s]]
  return (
    <Widget title="范数的单位球 Unit ball of ℓp norm" hint="拖动 p 滑块：p=1 是菱形，p=2 是圆，p 越大越接近正方形（p=∞）。拖动粉色点，看同一个点在不同范数下的“长度”；虚线是经过该点的那个范数球 {x | ‖x‖ₚ = ‖q‖ₚ}。">
      <Mafs viewBox={{ x: [-2.6, 2.6], y: [-1.7, 1.7] }} height={330} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        <Polygon points={[[1, 0], [0, 1], [-1, 0], [0, -1]]} color={Theme.orange} fillOpacity={0} strokeOpacity={0.35} />
        <Circle center={[0, 0]} radius={1} color={Theme.green} fillOpacity={0} strokeOpacity={0.35} />
        <Polygon points={sq(1)} color={Theme.violet} fillOpacity={0} strokeOpacity={0.35} />
        {inf
          ? <Polygon points={sq(1)} color={Theme.blue} fillOpacity={0.18} weight={3} />
          : <Plot.Parametric domain={[0, 2 * Math.PI]} xy={ballXY(p, 1)} color={Theme.blue} weight={3.5} />}
        {r > 0.05 && (inf
          ? <Polygon points={sq(r)} color={Theme.pink} fillOpacity={0} strokeStyle="dashed" />
          : <Plot.Parametric domain={[0, 2 * Math.PI]} xy={ballXY(p, r)} color={Theme.pink} style="dashed" />)}
        <Text x={1.05} y={-0.15} attach="e" size={12} color={Theme.orange}>ℓ₁</Text>
        <Text x={0.72} y={0.72} attach="ne" size={12} color={Theme.green}>ℓ₂</Text>
        <Text x={1} y={1} attach="ne" size={12} color={Theme.violet}>ℓ∞</Text>
        {q.element}
      </Mafs>
      <div className="wrow">
        <Slider label={<M>{'p'}</M>} value={p} set={(v) => { setP(v); setInf(false) }} min={1} max={10} step={0.1} fmt={(v) => (inf ? '∞' : v.toFixed(1))} />
        <label style={{ fontSize: 14 }}><input type="checkbox" checked={inf} onChange={(e) => setInf(e.target.checked)} /> p = ∞</label>
      </div>
      <div className="wstat">
        <span className="chip info">q = ({fx(q.x)}, {fx(q.y)})</span>
        <span className="chip"><M>{'\\|q\\|_1'}</M> = {fx(pnorm(q.x, q.y, 1))}</span>
        <span className="chip"><M>{'\\|q\\|_2'}</M> = {fx(pnorm(q.x, q.y, 2))}</span>
        <span className="chip"><M>{'\\|q\\|_\\infty'}</M> = {fx(pnorm(q.x, q.y, Infinity))}</span>
        <span className="chip good">当前 <M>{inf ? '\\|q\\|_\\infty' : `\\|q\\|_{${p.toFixed(1)}}`}</M> = {fx(r)} {r <= 1 ? '（在单位球内）' : '（在单位球外）'}</span>
      </div>
    </Widget>
  )
}

/* =====================================================================
   3. 矩阵作用于向量；特征向量
   ===================================================================== */
function eig2(a, b, c) {
  const m = (a + c) / 2, r = Math.hypot((a - c) / 2, b)
  const phi = 0.5 * Math.atan2(2 * b, a - c)
  return { l1: m + r, l2: m - r, v1: [Math.cos(phi), Math.sin(phi)], v2: [-Math.sin(phi), Math.cos(phi)] }
}
function classify(l1, l2) {
  const e = 1e-3
  const lo = Math.min(l1, l2), hi = Math.max(l1, l2)
  if (lo > e) return ['good', '正定 positive definite (≻ 0)']
  if (lo >= -e && hi > e) return ['info', '半正定 PSD (⪰ 0)，有一个特征值 = 0']
  if (lo >= -e && hi >= -e) return ['info', '零矩阵（⪰ 0）']
  if (hi < -e) return ['bad', '负定 negative definite (≺ 0)']
  if (hi <= e) return ['bad', '半负定 (⪯ 0)']
  return ['bad', '不定 indefinite（特征值有正有负）']
}

export function Ch00MatVec() {
  const [a, setA] = useState(2)
  const [b, setB] = useState(0.8)
  const [c, setC] = useState(1)
  const x = useMovablePoint([Math.cos(0.4), Math.sin(0.4)], {
    color: Theme.blue,
    constrain: ([u, v]) => { const r = Math.hypot(u, v) || 1; return [u / r, v / r] },
  })
  const Ax = [a * x.x + b * x.y, b * x.x + c * x.y]
  const { l1, l2, v1, v2 } = eig2(a, b, c)
  const cross = Ax[0] * x.y - Ax[1] * x.x
  const parallel = Math.abs(cross) < 0.06 * Math.max(1, Math.hypot(...Ax))
  const lam = Ax[0] * x.x + Ax[1] * x.y
  const cl = classify(l1, l2)
  return (
    <Widget title="矩阵乘向量 Ax 与特征向量 Eigenvectors" hint="黑点 x 只能在单位圆上移动，红色箭头是 Ax。绕一圈拖动 x：大多数方向上 Ax 会“拐弯”，但在两条虚线（特征向量方向）上 Ax 与 x 共线，伸缩倍数就是特征值。橙色曲线是整个单位圆被 A 变换后的形状。">
      <Mafs viewBox={{ x: [-4, 4], y: [-3, 3] }} height={340} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        <Circle center={[0, 0]} radius={1} color={Theme.blue} fillOpacity={0.04} strokeOpacity={0.5} />
        <Plot.Parametric domain={[0, 2 * Math.PI]} xy={(t) => [a * Math.cos(t) + b * Math.sin(t), b * Math.cos(t) + c * Math.sin(t)]} color={Theme.orange} />
        <Line.ThroughPoints point1={[0, 0]} point2={v1} color={Theme.violet} style="dashed" opacity={0.6} />
        <Line.ThroughPoints point1={[0, 0]} point2={v2} color={Theme.violet} style="dashed" opacity={0.6} />
        <Vector tip={Ax} color={Theme.red} weight={3} />
        <Vector tip={x.point} color={Theme.blue} weight={3} />
        <Text x={Ax[0]} y={Ax[1]} attach="ne" size={15} color={Theme.red}>Ax</Text>
        {x.element}
      </Mafs>
      <div className="wrow">
        <Slider label={<M>{'A_{11}'}</M>} value={a} set={setA} min={-2} max={3} step={0.05} />
        <Slider label={<M>{'A_{12}=A_{21}'}</M>} value={b} set={setB} min={-2} max={2} step={0.05} />
        <Slider label={<M>{'A_{22}'}</M>} value={c} set={setC} min={-2} max={3} step={0.05} />
      </div>
      <div className="wstat">
        <span className="chip info"><M>{`A=\\begin{bmatrix}${fx(a)} & ${fx(b)}\\\\ ${fx(b)} & ${fx(c)}\\end{bmatrix}`}</M></span>
        <span className="chip info">x = ({fx(x.x)}, {fx(x.y)}) → Ax = ({fx(Ax[0])}, {fx(Ax[1])})</span>
        <span className="chip">特征值 λ₁ = {fx(l1)}, λ₂ = {fx(l2)}</span>
        <span className={`chip ${parallel ? 'good' : ''}`}>{parallel ? `Ax ∥ x：找到特征向量！Ax ≈ ${fx(lam)}·x` : 'Ax 与 x 不共线'}</span>
        <span className={`chip ${cl[0]}`}>{cl[1]}</span>
      </div>
    </Widget>
  )
}

/* =====================================================================
   4. 二次型 x^T P x 的等高线：碗 / 槽 / 马鞍
   ===================================================================== */
export function Ch00Quadratic() {
  const [l1, setL1] = useState(2)
  const [l2, setL2] = useState(0.6)
  const [th, setTh] = useState(0.5)
  const [pt, setPt] = useState([1.2, 0.8])
  const cs = Math.cos(th), sn = Math.sin(th)
  const p11 = l1 * cs * cs + l2 * sn * sn, p12 = (l1 - l2) * cs * sn, p22 = l1 * sn * sn + l2 * cs * cs
  const f = (x, y) => p11 * x * x + 2 * p12 * x * y + p22 * y * y
  const cl = classify(l1, l2)
  const levels = [-6, -3, -1.5, -0.6, -0.15, 0.15, 0.6, 1.5, 3, 6]
  const val = f(pt[0], pt[1])
  return (
    <Widget title="二次型 xᵀPx 的形状 Quadratic form" hint="用滑块设定 P 的两个特征值 λ₁, λ₂ 和特征向量方向 θ。两个都 > 0：等高线是椭圆（碗）；一个 = 0：平行直线（槽）；一正一负：双曲线（马鞍）。橙色 = 正值，绿色 = 负值。点击/拖动图中任意位置看 xᵀPx 的值。">
      <Field2D f={f} fkey={`${l1},${l2},${th}`} xr={[-3, 3]} yr={[-2, 2]} levels={levels} diverging
        points={[{ p: pt, set: setPt, color: Theme.pink }]}>
        {({ sx, sy }) => (
          <g>
            <Arrow x1={sx(0)} y1={sy(0)} x2={sx(cs)} y2={sy(sn)} color={Theme.green} />
            <Arrow x1={sx(0)} y1={sy(0)} x2={sx(-sn)} y2={sy(cs)} color={Theme.violet} />
            <text x={sx(cs * 1.15)} y={sy(sn * 1.15)} fill={Theme.green} fontSize={14} fontWeight={700}>v₁ (λ₁)</text>
            <text x={sx(-sn * 1.2)} y={sy(cs * 1.2)} fill={Theme.violet} fontSize={14} fontWeight={700}>v₂ (λ₂)</text>
          </g>
        )}
      </Field2D>
      <div className="wrow">
        <Slider label={<M>{'\\lambda_1'}</M>} value={l1} set={setL1} min={-2} max={3} step={0.05} />
        <Slider label={<M>{'\\lambda_2'}</M>} value={l2} set={setL2} min={-2} max={3} step={0.05} />
        <Slider label={<M>{'\\theta'}</M>} value={th} set={setTh} min={0} max={Math.PI} step={0.01} />
      </div>
      <div className="wstat">
        <span className="chip info"><M>{`P=\\begin{bmatrix}${fx(p11)} & ${fx(p12)}\\\\ ${fx(p12)} & ${fx(p22)}\\end{bmatrix}`}</M></span>
        <span className={`chip ${cl[0]}`}>{cl[1]}</span>
        <span className={`chip ${val >= 0 ? 'good' : 'bad'}`}>x = ({fx(pt[0])}, {fx(pt[1])})，<M>{'x^TPx'}</M> = {fx(val)}</span>
      </div>
    </Widget>
  )
}

/* =====================================================================
   5. 超平面与半空间
   ===================================================================== */
export function Ch00Hyperplane() {
  const a = useMovablePoint([1, 1.5], { color: Theme.blue })
  const z = useMovablePoint([-2, -1], { color: Theme.pink })
  const [b, setB] = useState(2)
  const na = Math.hypot(a.x, a.y) || 1e-6
  const ah = [a.x / na, a.y / na]
  const d = [-ah[1], ah[0]]
  const x0 = [b * a.x / (na * na), b * a.y / (na * na)]
  const R = 30
  const half = [
    [x0[0] + R * d[0], x0[1] + R * d[1]],
    [x0[0] - R * d[0], x0[1] - R * d[1]],
    [x0[0] - R * d[0] - R * ah[0], x0[1] - R * d[1] - R * ah[1]],
    [x0[0] + R * d[0] - R * ah[0], x0[1] + R * d[1] - R * ah[1]],
  ]
  const az = a.x * z.x + a.y * z.y
  const side = Math.abs(az - b) < 0.05 ? ['info', 'aᵀz ≈ b：z 在超平面上'] : az < b ? ['good', 'aᵀz < b：z 在绿色半空间内'] : ['bad', 'aᵀz > b：z 在 a 所指的那一侧（半空间外）']
  return (
    <Widget title="超平面与半空间 Hyperplane & halfspace" hint="拖动黑点改变法向量 a，拖动 b 滑块平移直线。观察：直线始终与 a 垂直；b 增大时直线沿 a 的方向移动；绿色区域是半空间 {x | aᵀx ≤ b}。拖动粉色点 z 看它在哪一侧。">
      <Mafs viewBox={{ x: [-4, 4], y: [-3, 3] }} height={330} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        <Polygon points={half} color={Theme.green} fillOpacity={0.13} strokeOpacity={0} />
        <Line.ThroughPoints point1={x0} point2={[x0[0] + d[0], x0[1] + d[1]]} color={Theme.indigo} weight={3} />
        <Vector tip={a.point} color={Theme.blue} weight={3} />
        <Vector tail={x0} tip={[x0[0] + ah[0] * 0.8, x0[1] + ah[1] * 0.8]} color={Theme.orange} />
        <Point x={x0[0]} y={x0[1]} color={Theme.indigo} />
        <Text x={x0[0]} y={x0[1]} attach="sw" size={13} color={Theme.indigo}>x₀</Text>
        <Text x={a.x} y={a.y} attach="ne" size={16} color={Theme.blue}>a</Text>
        <Text x={z.x} y={z.y} attach="s" size={15} color={Theme.pink}>z</Text>
        {a.element}
        {z.element}
      </Mafs>
      <div className="wrow">
        <Slider label={<M>{'b'}</M>} value={b} set={setB} min={-4} max={4} step={0.05} />
      </div>
      <div className="wstat">
        <span className="chip info">a = ({fx(a.x)}, {fx(a.y)})，超平面 {fx(a.x)}·x₁ + {fx(a.y)}·x₂ = {fx(b)}</span>
        <span className="chip">离原点距离 |b|/‖a‖₂ = {fx(Math.abs(b) / na)}</span>
        <span className="chip">aᵀz = {fx(az)}</span>
        <span className={`chip ${side[0]}`}>{side[1]}</span>
      </div>
    </Widget>
  )
}

/* =====================================================================
   6. 梯度与等高线
   ===================================================================== */
const GFUNS = {
  bowl: { label: '椭圆碗 ½x₁²+2x₂²', tex: 'f(x)=\\tfrac12 x_1^2+2x_2^2', f: (x, y) => 0.5 * x * x + 2 * y * y, levels: [0.25, 0.75, 1.5, 2.5, 4, 6, 8] },
  lse: { label: 'log-sum-exp', tex: 'f(x)=\\log(e^{x_1+3x_2-0.1}+e^{x_1-3x_2-0.1}+e^{-x_1-0.1})', f: (x, y) => Math.log(Math.exp(x + 3 * y - 0.1) + Math.exp(x - 3 * y - 0.1) + Math.exp(-x - 0.1)), levels: [1.2, 1.6, 2, 2.6, 3.4, 4.4, 5.6] },
  wavy: { label: '双谷（非凸）', tex: 'f(x)=\\tfrac14x_1^4-x_1^2+x_2^2', f: (x, y) => 0.25 * x ** 4 - x * x + y * y, levels: [-0.8, -0.5, -0.2, 0.2, 0.7, 1.5, 2.5, 4] },
}
function numGrad(f, x, y) {
  const h = 1e-5
  return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)]
}

export function Ch00Gradient() {
  const [key, setKey] = useState('bowl')
  const [pt, setPt] = useState([1.5, 0.6])
  const F = GFUNS[key]
  const g = numGrad(F.f, pt[0], pt[1])
  const gn = Math.hypot(g[0], g[1])
  const s = gn > 1e-9 ? Math.min(1.4, 0.45 * gn) / gn : 0 // 显示长度
  const tng = gn > 1e-9 ? [-g[1] / gn, g[0] / gn] : [0, 0]
  const val = F.f(pt[0], pt[1])
  return (
    <Widget title="梯度 ⊥ 等高线 Gradient & level sets" hint="点击或拖动粉色点。红色箭头是梯度 ∇f(x)（最陡上升方向），绿色虚线箭头是 −∇f(x)（最陡下降方向），橙色曲线是经过当前点的等高线，黑色短线是它的切线。观察：梯度永远垂直于等高线；等高线越密，梯度越长。">
      <Tabs tabs={Object.entries(GFUNS).map(([k, v]) => ({ value: k, label: v.label }))} value={key} set={setKey} />
      <div style={{ margin: '6px 0' }}><M>{F.tex}</M></div>
      <Field2D f={F.f} fkey={key} xr={[-3, 3]} yr={[-2, 2]} levels={F.levels} highlight={val}
        points={[{ p: pt, set: setPt, color: Theme.pink }]}>
        {({ sx, sy }) => (
          <g>
            <line x1={sx(pt[0] - tng[0] * 0.8)} y1={sy(pt[1] - tng[1] * 0.8)} x2={sx(pt[0] + tng[0] * 0.8)} y2={sy(pt[1] + tng[1] * 0.8)} stroke="#222" strokeWidth={2} />
            <Arrow x1={sx(pt[0])} y1={sy(pt[1])} x2={sx(pt[0] + g[0] * s)} y2={sy(pt[1] + g[1] * s)} color={Theme.red} w={3.5} />
            <Arrow x1={sx(pt[0])} y1={sy(pt[1])} x2={sx(pt[0] - g[0] * s)} y2={sy(pt[1] - g[1] * s)} color={Theme.green} w={2.5} dash />
          </g>
        )}
      </Field2D>
      <div className="wstat">
        <span className="chip info">x = ({fx(pt[0])}, {fx(pt[1])})，f(x) = {fx(val)}</span>
        <span className="chip info">∇f(x) = ({fx(g[0])}, {fx(g[1])})</span>
        <span className={`chip ${gn < 0.05 ? 'good' : ''}`}>‖∇f(x)‖₂ = {fx(gn)}{gn < 0.05 ? '  ≈ 0：驻点 stationary point！' : ''}</span>
        <span className="chip">∇f · 切线方向 = {fx(g[0] * tng[0] + g[1] * tng[1], 3)}（垂直 ⇒ 0）</span>
      </div>
    </Widget>
  )
}

/* =====================================================================
   7. Taylor 近似
   ===================================================================== */
const TFUNS = {
  exp: { label: 'eˣ', f: Math.exp, d1: Math.exp, d2: Math.exp },
  sin: { label: 'sin x', f: Math.sin, d1: Math.cos, d2: (x) => -Math.sin(x) },
  cubic: { label: 'x³ − 3x', f: (x) => x ** 3 - 3 * x, d1: (x) => 3 * x * x - 3, d2: (x) => 6 * x },
  log: { label: 'log(1+x²)', f: (x) => Math.log(1 + x * x), d1: (x) => 2 * x / (1 + x * x), d2: (x) => 2 * (1 - x * x) / (1 + x * x) ** 2 },
}
export function Ch00Taylor() {
  const [key, setKey] = useState('exp')
  const [ord, setOrd] = useState('both')
  const [h, setH] = useState(0.8)
  const P = useMovablePoint([0, 0], { constrain: 'horizontal', color: Theme.indigo })
  const F = TFUNS[key]
  const x0 = P.x, f0 = F.f(x0), g = F.d1(x0), H = F.d2(x0)
  const t1 = (x) => f0 + g * (x - x0)
  const t2 = (x) => f0 + g * (x - x0) + 0.5 * H * (x - x0) ** 2
  const xe = x0 + h
  const e1 = Math.abs(F.f(xe) - t1(xe)), e2 = Math.abs(F.f(xe) - t2(xe))
  return (
    <Widget title="Taylor 近似 Taylor approximation" hint="沿 x 轴拖动灰色点改变展开点 x₀。红线是一阶近似（切线），绿线是二阶近似（抛物线）。把 h 调小，看两种误差都变小、而且二阶误差小得更快——“离 x₀ 越近越准”。">
      <Tabs tabs={Object.entries(TFUNS).map(([k, v]) => ({ value: k, label: v.label }))} value={key} set={setKey} />
      <Tabs tabs={[{ value: '1', label: '一阶（切线）' }, { value: '2', label: '二阶（抛物线）' }, { value: 'both', label: '都显示' }]} value={ord} set={setOrd} />
      <Mafs viewBox={{ x: [-3, 3], y: [-3, 4] }} height={340} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={2} />
        <Plot.OfX y={F.f} color={Theme.blue} weight={3.5} />
        {ord !== '2' && <Plot.OfX y={t1} color={Theme.red} />}
        {ord !== '1' && <Plot.OfX y={t2} color={Theme.green} />}
        <Line.Segment point1={[x0, 0]} point2={[x0, f0]} color={Theme.indigo} style="dashed" opacity={0.5} />
        <Point x={x0} y={f0} color={Theme.indigo} />
        <Line.Segment point1={[xe, -3]} point2={[xe, 4]} color={Theme.orange} style="dashed" opacity={0.5} />
        <Point x={xe} y={F.f(xe)} color={Theme.blue} />
        {ord !== '2' && <Point x={xe} y={t1(xe)} color={Theme.red} />}
        {ord !== '1' && <Point x={xe} y={t2(xe)} color={Theme.green} />}
        <Text x={xe} y={-2.7} attach="e" size={12} color={Theme.orange}>x₀+h</Text>
        {P.element}
      </Mafs>
      <div className="wrow">
        <Slider label={<M>{'h'}</M>} value={h} set={setH} min={-2} max={2} step={0.01} />
      </div>
      <div className="wstat">
        <span className="chip info">x₀ = {fx(x0)}：f = {fx(f0)}，f′ = {fx(g)}，f″ = {fx(H)}</span>
        <span className="chip bad">一阶误差 |f − f̂₁| = {fx(e1, 4)}</span>
        <span className="chip good">二阶误差 |f − f̂₂| = {fx(e2, 4)}</span>
      </div>
    </Widget>
  )
}
