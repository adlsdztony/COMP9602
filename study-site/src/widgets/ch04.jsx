// 第 4 章交互组件：优化问题与凸问题
import { useState, useMemo } from 'react'
import { Mafs, Plot, Point, Line, Polygon, Circle, Vector, Text, Theme, useMovablePoint } from 'mafs'
import { Coordinates } from './coordinates.jsx'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'

/* ================= 共享小工具（ch05 / ch06 也会 import） ================= */

// 在 Mafs 坐标系里画任意 SVG path（d 用数学坐标书写）
export function Ch04Path({ d, color = '#868e96', weight = 1.5, opacity = 1, dash, fill = 'none', fillOpacity = 0.15 }) {
  return (
    <path
      d={d}
      style={{
        transform: 'var(--mafs-view-transform)',
        vectorEffect: 'non-scaling-stroke',
        stroke: color,
        strokeWidth: weight,
        strokeOpacity: opacity,
        strokeDasharray: dash,
        fill,
        fillOpacity: fill === 'none' ? 0 : fillOpacity,
      }}
    />
  )
}

// marching squares：返回 f(x,y)=level 的等高线 path 字符串
export function ch04Contour(f, [x0, x1], [y0, y1], level, n = 70) {
  const ny = Math.max(10, Math.round((n * (y1 - y0)) / (x1 - x0)))
  const dx = (x1 - x0) / n, dy = (y1 - y0) / ny
  const g = []
  for (let j = 0; j <= ny; j++) {
    const row = []
    for (let i = 0; i <= n; i++) row.push(f(x0 + i * dx, y0 + j * dy) - level)
    g.push(row)
  }
  let d = ''
  const fmt = (v) => v.toFixed(3)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < n; i++) {
      const a = g[j][i], b = g[j][i + 1], c = g[j + 1][i + 1], e = g[j + 1][i]
      const X = x0 + i * dx, Y = y0 + j * dy
      const pts = []
      if (!isFinite(a) || !isFinite(b) || !isFinite(c) || !isFinite(e)) continue
      if ((a < 0) !== (b < 0)) pts.push([X + (dx * a) / (a - b), Y])
      if ((b < 0) !== (c < 0)) pts.push([X + dx, Y + (dy * b) / (b - c)])
      if ((e < 0) !== (c < 0)) pts.push([X + (dx * e) / (e - c), Y + dy])
      if ((a < 0) !== (e < 0)) pts.push([X, Y + (dy * a) / (a - e)])
      for (let k = 0; k + 1 < pts.length; k += 2) d += `M${fmt(pts[k][0])} ${fmt(pts[k][1])}L${fmt(pts[k + 1][0])} ${fmt(pts[k + 1][1])}`
    }
  }
  return d
}

// 点到线段的投影
export function ch04ProjSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const L = dx * dx + dy * dy
  let s = L === 0 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L
  s = Math.max(0, Math.min(1, s))
  return [a[0] + s * dx, a[1] + s * dy]
}
// 点是否在逆时针凸多边形内
export function ch04InPoly(p, V) {
  for (let i = 0; i < V.length; i++) {
    const a = V[i], b = V[(i + 1) % V.length]
    if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) < -1e-9) return false
  }
  return true
}
// 投影到凸多边形
export function ch04ProjPoly(p, V) {
  if (ch04InPoly(p, V)) return p
  let best = null, bd = Infinity
  for (let i = 0; i < V.length; i++) {
    const q = ch04ProjSeg(p, V[i], V[(i + 1) % V.length])
    const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2
    if (d < bd) { bd = d; best = q }
  }
  return best
}
// 用半平面 {y : g·y >= g·x0}（或 <）裁剪矩形，返回多边形顶点
export function ch04ClipHalfplane(rect, g, c) {
  // 保留 g·p <= c 的部分
  const [[x0, x1], [y0, y1]] = rect
  let poly = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
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

const f2 = (v) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2)

/* ================= 1. 最优值 p* 与是否取到 ================= */
const VAL_CASES = {
  inv: { f: (x) => 1 / x, label: '1/x', p: '0', attained: false, note: 'x 越大 f 越接近 0，但永远到不了 0：有最优值、没有最优点' },
  nlog: { f: (x) => -Math.log(x), label: '-log x', p: '-∞', attained: false, note: 'x 越大 f 越小，没有下界：p* = −∞（unbounded below）' },
  xlog: { f: (x) => x * Math.log(x), label: 'x log x', p: '-1/e ≈ -0.368', attained: true, note: '在 x = 1/e 处取到最小值：最优点存在' },
}
export function Ch04OptimalValue() {
  const [k, setK] = useState('inv')
  const [x, setX] = useState(1.5)
  const C = VAL_CASES[k]
  const fx = C.f(x)
  return (
    <Widget title="最优值 p* 一定能取到吗？" hint="切换三个目标函数（定义域都是 x > 0），拖动滑块让 x 变大，观察 f₀(x) 能否“碰到”最优值 p*（虚线）。">
      <Tabs tabs={Object.entries(VAL_CASES).map(([v, c]) => ({ value: v, label: 'f₀ = ' + c.label }))} value={k} set={setK} />
      <Mafs viewBox={{ x: [-0.3, 6.5], y: [-2.2, 3] }} height={280} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={false} />
        <Plot.OfX y={C.f} domain={[0.02, 7]} color={Theme.blue} weight={3} />
        {k === 'inv' && <Line.ThroughPoints point1={[0, 0]} point2={[1, 0]} color={Theme.green} style="dashed" />}
        {k === 'xlog' && <Line.ThroughPoints point1={[0, -1 / Math.E]} point2={[1, -1 / Math.E]} color={Theme.green} style="dashed" />}
        {k === 'xlog' && <Point x={1 / Math.E} y={-1 / Math.E} color={Theme.green} />}
        <Line.Segment point1={[x, 0]} point2={[x, fx]} color={Theme.orange} style="dashed" />
        <Point x={x} y={fx} color={Theme.orange} />
      </Mafs>
      <div className="wrow">
        <Slider label="x" value={x} set={setX} min={0.05} max={6.4} />
      </div>
      <div className="wstat">
        <span className="chip info">f₀(x) = {fx.toFixed(3)}</span>
        <span className="chip info">p* = {C.p}</span>
        <span className={`chip ${C.attained ? 'good' : 'bad'}`}>{C.attained ? '最优点存在 ✓' : '最优点不存在 ✗'}</span>
      </div>
      <div className="legend-inline">{C.note}</div>
    </Widget>
  )
}

/* ================= 2. 局部最优 vs 全局最优 ================= */
const LG_CASES = {
  convex: {
    label: '凸问题',
    f: (x, y) => (x - 2.4) ** 2 + (y - 1.8) ** 2,
    disks: [[[0, 0], 1.6]],
    note: '凸目标 + 凸可行域：无论从哪里出发往下走，最终都到同一个点 —— 局部最优 = 全局最优。',
  },
  set: {
    label: '可行域非凸',
    f: (x, y) => (x - 2.4) ** 2 + (y - 1.8) ** 2,
    disks: [[[-1.9, -0.9], 1.1], [[1.0, 0.2], 0.85]],
    note: '目标是凸的，但可行域是两个圆的并（非凸）：左边圆上离目标最近的点是局部最优，但不是全局最优。',
  },
  obj: {
    label: '目标非凸',
    f: (x, y) => 0.18 * (x * x - 4) ** 2 + 0.45 * x + 0.5 * (y - 0.3) ** 2,
    half: true, // 可行域：x + y <= 2.6 的半平面
    note: '可行域是半平面（凸），但目标有两个“坑”：右边的坑是局部最优，左边更深的坑才是全局最优。',
  },
}
const LG_VIEW = { x: [-4, 4], y: [-2.6, 2.8] }
function lgFeasible(C, p) {
  if (C.half) return p[0] + p[1] <= 2.6 + 1e-9
  return C.disks.some(([c, r]) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 <= r * r + 1e-9)
}
function lgProject(C, p) {
  if (C.half) {
    const v = p[0] + p[1] - 2.6
    return v <= 0 ? p : [p[0] - v / 2, p[1] - v / 2]
  }
  let best = p, bd = Infinity
  for (const [c, r] of C.disks) {
    const dx = p[0] - c[0], dy = p[1] - c[1], L = Math.hypot(dx, dy)
    const q = L <= r ? p : [c[0] + (dx / L) * r, c[1] + (dy / L) * r]
    const d = Math.hypot(q[0] - p[0], q[1] - p[1])
    if (d < bd) { bd = d; best = q }
  }
  return best
}
function lgDescend(C, p0) {
  let p = p0
  for (let k = 0; k < 600; k++) {
    const h = 1e-4
    const gx = (C.f(p[0] + h, p[1]) - C.f(p[0] - h, p[1])) / (2 * h)
    const gy = (C.f(p[0], p[1] + h) - C.f(p[0], p[1] - h)) / (2 * h)
    p = lgProject(C, [p[0] - 0.05 * gx, p[1] - 0.05 * gy])
  }
  return p
}
function LocalGlobalInner({ mode }) {
  const C = LG_CASES[mode]
  const start = mode === 'set' ? [-2.2, -0.6] : mode === 'obj' ? [1.2, -1.5] : [-0.8, -0.6]
  const P = useMovablePoint(start, { color: Theme.orange, constrain: (p) => lgProject(C, p) })
  const glob = useMemo(() => {
    let best = null, bv = Infinity
    for (let i = 0; i <= 160; i++) for (let j = 0; j <= 110; j++) {
      const p = [LG_VIEW.x[0] + (i / 160) * 8, LG_VIEW.y[0] + (j / 110) * 5.4]
      if (!lgFeasible(C, p)) continue
      const v = C.f(p[0], p[1])
      if (v < bv) { bv = v; best = p }
    }
    return lgDescend(C, best)
  }, [mode])
  const contours = useMemo(() => {
    const lv = mode === 'obj' ? [0.2, 0.6, 1.1, 1.8, 2.8, 4] : [0.5, 1.5, 3, 5, 8, 12, 17]
    return lv.map((l) => ch04Contour(C.f, LG_VIEW.x, LG_VIEW.y, l, 90)).join('')
  }, [mode])
  const fx = C.f(P.x, P.y)
  // 局部最优检测：在小邻域的可行点里找更低的值
  let isLocal = true
  for (const r of [0.02, 0.06, 0.12]) for (let k = 0; k < 64; k++) {
    const q = [P.x + r * Math.cos((k * Math.PI) / 32), P.y + r * Math.sin((k * Math.PI) / 32)]
    if (lgFeasible(C, q) && C.f(q[0], q[1]) < fx - 1e-6) isLocal = false
  }
  const fg = C.f(glob[0], glob[1])
  const isGlobal = isLocal && fx <= fg + 1e-3
  const curLevel = useMemo(() => ch04Contour(C.f, LG_VIEW.x, LG_VIEW.y, fx, 110), [mode, fx.toFixed(3)])
  const gLevel = useMemo(() => ch04Contour(C.f, LG_VIEW.x, LG_VIEW.y, fg + 1e-4, 110), [mode])
  return (
    <>
      <Mafs viewBox={LG_VIEW} height={340} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={false} />
        {C.half
          ? <Polygon points={ch04ClipHalfplane([[-4.5, 4.5], [-3, 3.2]], [1, 1], 2.6)} color={Theme.blue} fillOpacity={0.12} weight={1.5} />
          : C.disks.map(([c, r], i) => <Circle key={i} center={c} radius={r} color={Theme.blue} fillOpacity={0.14} />)}
        <Ch04Path d={contours} color="#868e96" dash="4 4" weight={1.2} />
        <Ch04Path d={gLevel} color={Theme.green} weight={2} />
        <Ch04Path d={curLevel} color={Theme.orange} weight={2} />
        <Point x={glob[0]} y={glob[1]} color={Theme.green} />
        <Text x={glob[0]} y={glob[1]} attach="ne" size={13} color={Theme.green}>全局最优</Text>
        {P.element}
      </Mafs>
      <div className="wrow">
        <button className="wbtn primary" onClick={() => P.setPoint(lgDescend(C, P.point))}>从当前点一直“往下走”</button>
        <span className="muted">（投影梯度下降：只看附近，走到不能再降为止）</span>
      </div>
      <div className="wstat">
        <span className="chip info">f₀(x) = {fx.toFixed(3)}</span>
        <span className="chip info">p* = {fg.toFixed(3)}</span>
        <span className={`chip ${isLocal ? 'good' : 'bad'}`}>{isLocal ? '局部最优 ✓' : '不是局部最优'}</span>
        <span className={`chip ${isGlobal ? 'good' : 'bad'}`}>{isGlobal ? '全局最优 ✓' : '不是全局最优'}</span>
      </div>
      <div className="legend-inline"><i style={{ background: Theme.blue }} />可行域 C <i style={{ background: '#868e96' }} />等高线 <i style={{ background: Theme.orange }} />过当前点的等高线 <i style={{ background: Theme.green }} />最优值对应的等高线</div>
      <div className="legend-inline">{C.note}</div>
    </>
  )
}
export function Ch04LocalGlobal() {
  const [mode, setMode] = useState('convex')
  return (
    <Widget title="局部最优 vs 全局最优" hint="拖动橙色点（只能在灰黑色可行域内），再点“往下走”。凸问题里从任何地方出发都落到绿色全局最优；切到两个非凸情形，试试从左边出发，看它卡在哪里。">
      <Tabs tabs={Object.entries(LG_CASES).map(([v, c]) => ({ value: v, label: c.label }))} value={mode} set={setMode} />
      <LocalGlobalInner key={mode} mode={mode} />
    </Widget>
  )
}

/* ================= 3. 一阶最优性条件 ∇f0(x)^T (y-x) >= 0 ================= */
const OC_POLY = [[-2.5, -1.6], [1.2, -2], [2.2, 0.2], [0.6, 1.9], [-2.2, 1.2]]
const OC_VIEW = { x: [-3.6, 4.4], y: [-2.6, 3.2] }
function OptCondInner({ mode }) {
  const orth = mode === 'orth'
  const V = orth ? [[0, 0], [4.4, 0], [4.4, 3.2], [0, 3.2]] : OC_POLY
  const proj = (p) => (orth ? [Math.max(0, p[0]), Math.max(0, p[1])] : ch04ProjPoly(p, V))
  const c = useMovablePoint(orth ? [2.2, -1.4] : [3.2, 2.4], { color: Theme.violet })
  const X = useMovablePoint(orth ? [1, 1.2] : [-0.5, 0.2], { color: Theme.orange, constrain: proj })
  const Y = useMovablePoint(orth ? [3, 2.4] : [1.6, -1.2], { color: Theme.blue, constrain: proj })
  const g = [2 * (X.x - c.x), 2 * (X.y - c.y)]
  const gn = Math.hypot(g[0], g[1])
  const ip = g[0] * (Y.x - X.x) + g[1] * (Y.y - X.y)
  const xstar = proj(c.point)
  // 判断 x 是否最优：在可行集上 g^T(y-x) 的最小值是否 >= 0
  let opt
  if (orth) opt = g[0] >= -1e-3 && g[1] >= -1e-3 && Math.abs(X.x * g[0]) < 2e-2 && Math.abs(X.y * g[1]) < 2e-2
  else opt = Math.min(...V.map((v) => g[0] * (v[0] - X.x) + g[1] * (v[1] - X.y))) >= -2e-2 * Math.max(1, gn)
  const bad = gn > 1e-6 ? ch04ClipHalfplane([[-5, 6], [-4, 5]], g, g[0] * X.x + g[1] * X.y) : null
  const sc = gn > 0 ? Math.min(1.4, 1.4 / Math.max(gn / 2, 0.6)) * 0.6 : 0
  const contours = useMemo(() => [0.5, 1.5, 3, 5, 8, 12, 17, 24].map((l) => {
    const r = Math.sqrt(l)
    return `M${c.x + r} ${c.y}` + Array.from({ length: 48 }, (_, k) => `L${(c.x + r * Math.cos(((k + 1) * Math.PI) / 24)).toFixed(3)} ${(c.y + r * Math.sin(((k + 1) * Math.PI) / 24)).toFixed(3)}`).join('')
  }).join(''), [c.x, c.y])
  return (
    <>
      <Mafs viewBox={OC_VIEW} height={360} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={false} />
        {bad && <Polygon points={bad} color={Theme.red} fillOpacity={0.07} weight={0} />}
        <Polygon points={V} color={Theme.blue} fillOpacity={0.15} />
        <Ch04Path d={contours} color="#adb5bd" dash="4 4" weight={1} />
        {gn > 1e-6 && <Line.PointAngle point={X.point} angle={Math.atan2(g[1], g[0]) + Math.PI / 2} color={Theme.red} style="dashed" weight={1.5} />}
        {gn > 1e-6 && <Vector tail={X.point} tip={[X.x + g[0] * sc, X.y + g[1] * sc]} color={Theme.red} weight={3} />}
        <Vector tail={X.point} tip={Y.point} color={Theme.blue} />
        <Point x={xstar[0]} y={xstar[1]} color={Theme.green} />
        <Text x={c.x} y={c.y} attach="ne" size={13} color={Theme.violet}>f₀ 的无约束最小点</Text>
        {gn > 1e-6 && <Text x={X.x + g[0] * sc} y={X.y + g[1] * sc} attach="e" size={13} color={Theme.red}>∇f₀(x)</Text>}
        <Text x={X.x} y={X.y} attach="sw" size={13} color={Theme.orange}>x</Text>
        <Text x={Y.x} y={Y.y} attach="se" size={13} color={Theme.blue}>y</Text>
        {c.element}
        {Y.element}
        {X.element}
      </Mafs>
      <div className="wrow">
        <button className="wbtn primary" onClick={() => X.setPoint(xstar)}>把 x 放到最优点 x*</button>
      </div>
      <div className="wstat">
        <span className="chip info">∇f₀(x) = ({f2(g[0])}, {f2(g[1])})</span>
        <span className={`chip ${ip >= -1e-6 ? 'good' : 'bad'}`}>∇f₀(x)ᵀ(y−x) = {f2(ip)} {ip >= -1e-6 ? '≥ 0' : '< 0：沿 y−x 走 f₀ 会下降'}</span>
        <span className={`chip ${opt ? 'good' : 'bad'}`}>{opt ? 'x 是最优点 ✓（整个可行域都在红色半平面之外）' : 'x 不是最优（可行域有一部分落在红色半平面里）'}</span>
        {orth && <span className="chip info">x₁·∂₁f₀ = {f2(X.x * g[0])}，x₂·∂₂f₀ = {f2(X.y * g[1])}</span>}
      </div>
      <div className="legend-inline"><i style={{ background: Theme.red }} />红色半平面 = 让 ∇f₀(x)ᵀ(y−x) &lt; 0 的点（下降方向）<i style={{ background: Theme.green }} />真正的最优点 x*</div>
    </>
  )
}
export function Ch04OptimalityCondition() {
  const [mode, setMode] = useState('poly')
  return (
    <Widget title="最优性条件的几何：梯度与可行方向的夹角" hint="拖橙色 x、黑色 y（都限制在可行域内），棕色点决定目标 f₀(x)=‖x−棕点‖²。x 最优 ⇔ 所有可行 y 都不在红色半平面里，即 y−x 与 ∇f₀(x) 夹角都 ≤ 90°。试试点“把 x 放到最优点”，再拖 y 到处走，内积永远 ≥ 0。">
      <Tabs tabs={[{ value: 'poly', label: '一般凸可行域（多边形）' }, { value: 'orth', label: '非负象限 x ⪰ 0' }]} value={mode} set={setMode} />
      <OptCondInner key={mode} mode={mode} />
    </Widget>
  )
}

/* ================= 4. 消去等式约束 x = Fz + x0 ================= */
// 约束 x1 + 2 x2 = 2，目标 f0 = (x1-1)^2 + (x2-2)^2
export function Ch04Eliminate() {
  const [z, setZ] = useState(-0.6)
  const [alt, setAlt] = useState(false)
  const x0 = alt ? [0, 1] : [2, 0]
  const F = alt ? [-1, 0.5] : [-2, 1]
  const x = [x0[0] + F[0] * z, x0[1] + F[1] * z]
  const f0 = (p) => (p[0] - 1) ** 2 + (p[1] - 2) ** 2
  const phi = (zz) => f0([x0[0] + F[0] * zz, x0[1] + F[1] * zz])
  // phi(z) 是关于 z 的二次函数，解析求最小
  const a = F[0] ** 2 + F[1] ** 2, b = 2 * (F[0] * (x0[0] - 1) + F[1] * (x0[1] - 2))
  const zs = -b / (2 * a)
  const contours = useMemo(() => [0.5, 1.8, 3.5, 6, 9].map((l) => {
    const r = Math.sqrt(l)
    return `M${1 + r} 2` + Array.from({ length: 48 }, (_, k) => `L${(1 + r * Math.cos(((k + 1) * Math.PI) / 24)).toFixed(3)} ${(2 + r * Math.sin(((k + 1) * Math.PI) / 24)).toFixed(3)}`).join('')
  }).join(''), [])
  return (
    <Widget title="消去等式约束：把直线 Ax=b 参数化成 x = Fz + x₀" hint="拖动滑块 z：点 x(z)=Fz+x₀ 永远停在直线 x₁+2x₂=2 上（Ax 恒等于 b）。下方是新问题 φ(z)=f₀(Fz+x₀) —— 一个没有等式约束的一元问题。点“换一组 x₀, F”看看：参数化不唯一，但找到的最优 x* 一样。">
      <div className="two-col">
        <Mafs viewBox={{ x: [-2.5, 4], y: [-1, 3.5] }} height={280} preserveAspectRatio="contain">
          <Coordinates.Cartesian subdivisions={false} />
          <Ch04Path d={contours} color="#adb5bd" dash="4 4" />
          <Line.ThroughPoints point1={[2, 0]} point2={[0, 1]} color={Theme.blue} />
          <Vector tail={x0} tip={[x0[0] + F[0], x0[1] + F[1]]} color={Theme.violet} />
          <Point x={x0[0]} y={x0[1]} color={Theme.violet} />
          <Text x={x0[0]} y={x0[1]} attach="se" size={13} color={Theme.violet}>x₀</Text>
          <Text x={x0[0] + F[0]} y={x0[1] + F[1]} attach="n" size={13} color={Theme.violet}>x₀+F</Text>
          <Point x={x0[0] + F[0] * zs} y={x0[1] + F[1] * zs} color={Theme.green} />
          <Point x={x[0]} y={x[1]} color={Theme.orange} />
          <Text x={x[0]} y={x[1]} attach="ne" size={13} color={Theme.orange}>x(z)</Text>
        </Mafs>
        <Mafs viewBox={{ x: [-3, 3], y: [-0.5, 12] }} height={280} preserveAspectRatio="contain">
          <Coordinates.Cartesian subdivisions={false} xAxis={{ lines: 1 }} yAxis={{ lines: 2 }} />
          <Plot.OfX y={phi} color={Theme.blue} weight={3} />
          <Point x={zs} y={phi(zs)} color={Theme.green} />
          <Point x={z} y={phi(z)} color={Theme.orange} />
          <Text x={2.2} y={11} size={13}>φ(z)</Text>
        </Mafs>
      </div>
      <div className="wrow">
        <Slider label="z" value={z} set={setZ} min={-2.5} max={2.5} />
        <button className="wbtn" onClick={() => setAlt(!alt)}>换一组 x₀, F</button>
      </div>
      <div className="wstat">
        <span className="chip info">x₀ = ({x0.join(', ')})，F = ({F.join(', ')})ᵀ</span>
        <span className="chip good">AF = 1·({F[0]}) + 2·({F[1]}) = 0</span>
        <span className="chip good">Ax(z) = {(x[0] + 2 * x[1]).toFixed(2)} = b</span>
        <span className="chip info">φ(z) = {phi(z).toFixed(3)}</span>
        <span className="chip good">z* = {zs.toFixed(2)} → x* = ({(x0[0] + F[0] * zs).toFixed(2)}, {(x0[1] + F[1] * zs).toFixed(2)})</span>
      </div>
    </Widget>
  )
}

/* ================= 5. 松弛变量 & 上境图形式 ================= */
const SL_A = [[1, 1], [1, -1], [-1, 0.4]]
const SL_B = [3, 1.2, 1.6]
function SlackPanel() {
  const P = useMovablePoint([0.4, 0.8], { color: Theme.orange })
  const s = SL_A.map((a, i) => SL_B[i] - a[0] * P.x - a[1] * P.y)
  const feas = s.every((v) => v >= -1e-9)
  const cols = [Theme.blue, Theme.violet, Theme.green]
  return (
    <>
      <Mafs viewBox={{ x: [-3, 4], y: [-2.5, 3.5] }} height={300} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={false} />
        {SL_A.map((a, i) => (
          <Polygon key={i} points={ch04ClipHalfplane([[-4, 5], [-3.5, 4.5]], a, SL_B[i])} color={cols[i]} fillOpacity={0.07} weight={1.5} />
        ))}
        {P.element}
      </Mafs>
      <div className="wstat">
        {s.map((v, i) => (
          <span key={i} className={`chip ${v >= -1e-9 ? 'good' : 'bad'}`} style={{ borderLeft: `4px solid ${cols[i]}` }}>
            s{i + 1} = b{i + 1} − a{i + 1}ᵀx = {f2(v)} {v >= -1e-9 ? '≥ 0' : '< 0'}
          </span>
        ))}
        <span className={`chip ${feas ? 'good' : 'bad'}`}>{feas ? 'x 可行 ⇔ 所有 sᵢ ≥ 0 ✓' : '有 sᵢ < 0 → 原不等式被违反'}</span>
      </div>
      <div className="legend-inline">每个 sᵢ 就是点 x 离第 i 条边界还有多少“余量”（slack）。等式 aᵢᵀx + sᵢ = bᵢ 总是成立的 —— 真正的约束只剩 sᵢ ≥ 0。</div>
    </>
  )
}
const EP_F = (x) => 0.35 * (x - 2.6) ** 2 + 0.4
const EP_L = -1.5, EP_U = 1.6
function EpigraphPanel() {
  const P = useMovablePoint([-0.5, 3], {
    color: Theme.orange,
    constrain: ([x, t]) => {
      const xx = Math.max(EP_L, Math.min(EP_U, x))
      return [xx, Math.min(5, Math.max(EP_F(xx), t))]
    },
  })
  const xs = EP_U, ps = EP_F(EP_U)
  const gap = P.y - EP_F(P.x)
  return (
    <>
      <Mafs viewBox={{ x: [-2.5, 4.5], y: [-0.5, 5.2] }} height={300} preserveAspectRatio="contain">
        <Coordinates.Cartesian subdivisions={false} />
        <Plot.Inequality y={{ '>=': EP_F, '<=': () => 5.2 }} color={Theme.blue} fillOpacity={0.06} weight={0} />
        <Polygon points={[[EP_L, 0], [EP_U, 0], [EP_U, 5.2], [EP_L, 5.2]]} color={Theme.green} fillOpacity={0.08} weight={0} />
        <Plot.OfX y={EP_F} color={Theme.blue} weight={3} />
        <Line.Segment point1={[EP_L, 0]} point2={[EP_U, 0]} color={Theme.green} weight={5} />
        <Line.Segment point1={[P.x, EP_F(P.x)]} point2={P.point} color={Theme.orange} style="dashed" />
        <Point x={xs} y={ps} color={Theme.green} />
        <Text x={xs} y={ps} attach="se" size={13} color={Theme.green}>(x*, p*)</Text>
        <Text x={3.6} y={EP_F(3.6) + 0.1} attach="n" size={13} color={Theme.blue}>t = f₀(x)</Text>
        <Text x={0} y={0} attach="s" size={12} color={Theme.green}>可行的 x</Text>
        {P.element}
      </Mafs>
      <div className="wrow">
        <button className="wbtn" onClick={() => P.setPoint([P.x, EP_F(P.x)])}>把 t 压到底</button>
        <button className="wbtn primary" onClick={() => P.setPoint([xs, ps])}>跳到最优 (x*, t*)</button>
      </div>
      <div className="wstat">
        <span className="chip info">新目标 t = {P.y.toFixed(3)}</span>
        <span className="chip info">f₀(x) = {EP_F(P.x).toFixed(3)}</span>
        <span className={`chip ${gap < 1e-3 ? 'good' : 'bad'}`}>t − f₀(x) = {gap.toFixed(3)} {gap < 1e-3 ? '（约束 f₀(x) ≤ t 是紧的）' : '（t 还能再往下压）'}</span>
        <span className="chip good">t* = p* = {ps.toFixed(3)}</span>
      </div>
      <div className="legend-inline">点 (x, t) 只能在“上境图”（黑色曲线上方）且 x 可行（绿色带）。最小化 t 就是把点往下按，最后一定贴到曲线上，此时 t = f₀(x)。</div>
    </>
  )
}
export function Ch04Transforms() {
  const [tab, setTab] = useState('slack')
  return (
    <Widget title="等价变换：松弛变量 & 上境图形式" hint="松弛变量：拖动 x 看每个 sᵢ 的符号如何对应“在不在半平面里”。上境图：拖动 (x, t)，再按“压到底”——最小化 t 会自动让 t = f₀(x)。">
      <Tabs tabs={[{ value: 'slack', label: '引入松弛变量 slack' }, { value: 'epi', label: '上境图形式 epigraph' }]} value={tab} set={setTab} />
      {tab === 'slack' ? <SlackPanel /> : <EpigraphPanel />}
    </Widget>
  )
}
