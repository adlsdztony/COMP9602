// 第 8 章交互组件：对偶问题、几何解释、LP 对偶、Slater、博弈
import { useMemo, useState } from 'react'
import { Mafs, Plot, Point, Line, Polygon, Circle, Text, Theme, useMovablePoint } from 'mafs'
import { Coordinates } from './coordinates.jsx'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'

const fmt = (v, d = 3) => (Number.isFinite(v) ? v.toFixed(d) : v > 0 ? '+∞' : '−∞')

/* ============ 1. 几何解释：集合 G、支撑线、g(λ)、p*、d* ============ */
function ellipsePts(cx, cy, rx, ry, ang, n = 72) {
  const a = []
  for (let k = 0; k < n; k++) {
    const th = (2 * Math.PI * k) / n
    const x = rx * Math.cos(th), y = ry * Math.sin(th)
    a.push([cx + x * Math.cos(ang) - y * Math.sin(ang), cy + x * Math.sin(ang) + y * Math.cos(ang)])
  }
  return a
}
const G_PRESETS = {
  convex: { label: '凸（强对偶）', pts: ellipsePts(1.0, 2.0, 1.8, 1.0, -0.35) },
  banana: {
    label: '非凸（有间隙）',
    pts: [[-1.6, 1.3], [-1.0, 1.55], [-0.4, 1.75], [0, 1.8], [0.5, 1.7], [1.0, 1.3], [1.4, 0.8], [1.7, 0.45], [1.9, 0.4], [2.0, 0.7],
      [1.9, 1.8], [1.6, 2.8], [1.2, 3.4], [0.6, 3.6], [0, 3.4], [-0.6, 2.8], [-1.2, 2.0], [-1.6, 1.5]],
  },
  noslater: { label: '凸但 Slater 不成立', pts: ellipsePts(1.2, 2.0, 1.2, 1.2, 0) },
}
// min t over polygon ∩ {u' <= u}
function minTLeft(pts, u) {
  let best = Infinity
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const [a, b] = pts[i], [c, d] = pts[(i + 1) % n]
    if (a <= u + 1e-12) best = Math.min(best, b)
    if ((a - u) * (c - u) < 0) {
      const s = (u - a) / (c - a)
      best = Math.min(best, b + s * (d - b))
    }
  }
  return best
}
const gOf = (pts, lam) => {
  let best = Infinity, arg = pts[0]
  for (const p of pts) { const v = p[1] + lam * p[0]; if (v < best) { best = v; arg = p } }
  return [best, arg]
}
const GLMAX = 5

export function Ch08Geometry() {
  const [key, setKey] = useState('banana')
  const [lam, setLam] = useState(0.6)
  const [showA, setShowA] = useState(false)
  const pts = G_PRESETS[key].pts
  const info = useMemo(() => {
    const pstar = minTLeft(pts, 0)
    let dstar = -Infinity, lstar = 0
    for (let k = 0; k <= 5000; k++) {
      const l = (GLMAX * k) / 5000
      const g = gOf(pts, l)[0]
      if (g > dstar) { dstar = g; lstar = l }
    }
    const umin = Math.min(...pts.map((p) => p[0]))
    const Apoly = [[umin, 6]]
    for (let k = 0; k <= 200; k++) {
      const u = umin + ((4 - umin) * k) / 200
      Apoly.push([u, Math.min(minTLeft(pts, u), 6)])
    }
    Apoly.push([4, 6])
    return { pstar, dstar, lstar, Apoly, umin }
  }, [key])
  const [g, arg] = gOf(pts, lam)
  const gap = info.pstar - info.dstar
  return (
    <Widget
      title="几何解释：支撑线 t + λu = g(λ) 的截距就是 g(λ)"
      hint="灰色区域是 𝒢 = {(f₁(x), f₀(x))}。黑色直线的斜率是 −λ，它被“往下推”到刚好碰到 𝒢，与 t 轴的交点高度就是 g(λ)。绿点 p* 是 𝒢 在 u ≤ 0 部分的最低点。试试：在“非凸”预设下拖动 λ，截距最高只能到 d*，够不到 p*（间隙）；切到“凸”预设，在某个 λ 时截距正好等于 p*。最后试“Slater 不成立”：λ 越大越接近 p*，但永远取不到——支撑线在 (0,p*) 处是竖直的。"
    >
      <Tabs tabs={Object.entries(G_PRESETS).map(([k, v]) => ({ value: k, label: v.label }))} value={key} set={setKey} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: '1 1 340px', minWidth: 0 }}>
          <Mafs viewBox={{ x: [-2.5, 3.5], y: [-1, 4.2] }} height={340} preserveAspectRatio="contain" pan={false}>
            <Coordinates.Cartesian subdivisions={false} />
            {showA && <Polygon points={info.Apoly} color={Theme.orange} fillOpacity={0.12} strokeOpacity={0} />}
            {showA && <Plot.OfX y={(u) => minTLeft(pts, u)} domain={[info.umin + 0.001, 3.5]} color={Theme.red} weight={2.5} />}
            <Polygon points={pts} color="#8e8e93" fillOpacity={0.25} weight={1.5} />
            <Line.ThroughPoints point1={[0, g]} point2={[1, g - lam]} color={Theme.blue} weight={2} />
            <Point x={arg[0]} y={arg[1]} color={Theme.blue} />
            <Point x={0} y={g} color={Theme.blue} />
            <Point x={0} y={info.pstar} color={Theme.green} />
            <Point x={0} y={info.dstar} color={Theme.red} />
            <Text x={0} y={info.pstar} attach="ne" size={13} color={Theme.green}>p*</Text>
            <Text x={0} y={g} attach="sw" size={13} color={Theme.blue}>g(λ)</Text>
            <Text x={0} y={info.dstar} attach="se" size={13} color={Theme.red}>d*</Text>
            <Text x={3.3} y={0} attach="n" size={13}>u</Text>
            <Text x={0} y={4.1} attach="e" size={13}>t</Text>
            {showA && <Text x={3.0} y={3.8} attach="w" size={13} color={Theme.orange}>𝒜</Text>}
          </Mafs>
        </div>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <Mafs viewBox={{ x: [-0.3, GLMAX + 0.2], y: [-1, 4.2] }} height={340} preserveAspectRatio="contain" pan={false}>
            <Coordinates.Cartesian subdivisions={false} />
            <Plot.OfX y={(l) => gOf(pts, l)[0]} domain={[0, GLMAX]} color={Theme.violet} weight={3} />
            <Line.ThroughPoints point1={[0, info.pstar]} point2={[1, info.pstar]} color={Theme.green} style="dashed" />
            <Point x={lam} y={g} color={Theme.blue} />
            <Point x={info.lstar} y={info.dstar} color={Theme.red} />
            <Text x={GLMAX} y={info.pstar} attach="n" size={13} color={Theme.green}>p*</Text>
            <Text x={GLMAX - 0.1} y={-0.6} attach="w" size={12}>横轴 λ，纵轴 g(λ)</Text>
          </Mafs>
        </div>
      </div>
      <div className="wrow">
        <Slider label={<M>{'\\lambda'}</M>} value={lam} set={setLam} min={0} max={GLMAX} step={0.01} />
        <label style={{ fontSize: 14 }}><input type="checkbox" checked={showA} onChange={(e) => setShowA(e.target.checked)} /> 显示集合 𝒜 与 P(u)（红色边界）</label>
      </div>
      <div className="wstat">
        <span className="chip info">直线斜率 = −λ = {(-lam).toFixed(2)}</span>
        <span className="chip info">g(λ) = {fmt(g)}</span>
        <span className="chip good">p* = {fmt(info.pstar)}</span>
        <span className="chip info">d* = {fmt(info.dstar)}（λ* ≈ {info.lstar.toFixed(2)}{key === 'noslater' ? '，λ 越大越接近，取不到' : ''}）</span>
        <span className={'chip ' + (gap > 2e-3 ? 'bad' : 'good')}>{gap > 2e-3 ? `对偶间隙 p*−d* = ${gap.toFixed(3)}` : '强对偶：d* = p*（数值）'}</span>
      </div>
    </Widget>
  )
}

/* ============ 2. LP 原问题与对偶问题并排 ============ */
// 约束统一写成 a·z <= b
function feasiblePoly(cons, box) {
  const all = cons.concat([[[1, 0], box[0][1]], [[-1, 0], -box[0][0]], [[0, 1], box[1][1]], [[0, -1], -box[1][0]]])
  const pts = []
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const [a1, b1] = all[i], [a2, b2] = all[j]
    const det = a1[0] * a2[1] - a1[1] * a2[0]
    if (Math.abs(det) < 1e-12) continue
    const x = (b1 * a2[1] - a1[1] * b2) / det, y = (a1[0] * b2 - b1 * a2[0]) / det
    if (all.every(([a, b]) => a[0] * x + a[1] * y <= b + 1e-9)) pts.push([x, y])
  }
  if (!pts.length) return []
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
  return pts.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx))
}
function vertexOpt(cons, obj, sense) {
  // 只在真实约束（不含 box）的顶点上找最优
  let best = sense === 'min' ? Infinity : -Infinity, arg = null
  for (let i = 0; i < cons.length; i++) for (let j = i + 1; j < cons.length; j++) {
    const [a1, b1] = cons[i], [a2, b2] = cons[j]
    const det = a1[0] * a2[1] - a1[1] * a2[0]
    if (Math.abs(det) < 1e-12) continue
    const x = (b1 * a2[1] - a1[1] * b2) / det, y = (a1[0] * b2 - b1 * a2[0]) / det
    if (!cons.every(([a, b]) => a[0] * x + a[1] * y <= b + 1e-9)) continue
    const v = obj[0] * x + obj[1] * y
    if (sense === 'min' ? v < best : v > best) { best = v; arg = [x, y] }
  }
  return [best, arg]
}
const A_LP = [[1, 2], [3, 1]], B_LP = [4, 6]
export function Ch08LPPair() {
  const [c1, setC1] = useState(3)
  const [c2, setC2] = useState(2)
  const xp = useMovablePoint([3, 3], { color: Theme.orange })
  const yd = useMovablePoint([0.3, 0.3], { color: Theme.red })
  // primal: A x >= b, x >= 0  ->  -A x <= -b, -x <= 0
  const pc = [[[-A_LP[0][0], -A_LP[0][1]], -B_LP[0]], [[-A_LP[1][0], -A_LP[1][1]], -B_LP[1]], [[-1, 0], 0], [[0, -1], 0]]
  // dual: A^T y <= c, y >= 0
  const dc = [[[A_LP[0][0], A_LP[1][0]], c1], [[A_LP[0][1], A_LP[1][1]], c2], [[-1, 0], 0], [[0, -1], 0]]
  const ppoly = feasiblePoly(pc, [[-0.5, 7], [-0.5, 8]])
  const dpoly = feasiblePoly(dc, [[-0.3, 3], [-0.3, 2.2]])
  const [pstar, xstar] = vertexOpt(pc, [c1, c2], 'min')
  const [dstar, ystar] = vertexOpt(dc, B_LP, 'max')
  const pf = pc.every(([a, b]) => a[0] * xp.x + a[1] * xp.y <= b + 1e-9)
  const df = dc.every(([a, b]) => a[0] * yd.x + a[1] * yd.y <= b + 1e-9)
  const cx = c1 * xp.x + c2 * xp.y, by = B_LP[0] * yd.x + B_LP[1] * yd.y
  return (
    <Widget
      title="LP 原问题与对偶问题并排：任何可行对都满足 cᵀx ≥ bᵀy"
      hint="左：原问题 min cᵀx s.t. Ax ⪰ b, x ⪰ 0（灰色可行域，向右上无界）。右：对偶 max bᵀy s.t. Aᵀy ⪯ c, y ⪰ 0。拖动橙点 x 与红点 y，虚线是经过该点的目标等值线。只要两点都可行，cᵀx 总 ≥ bᵀy（弱对偶）；点“跳到最优”后两者相等（LP 强对偶）。再拖 c₁、c₂：原问题的可行域不变但目标变了，对偶问题的可行域在变。"
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div style={{ fontSize: 13, textAlign: 'center' }}><M>{`\\min\\ ${c1.toFixed(1)}x_1+${c2.toFixed(1)}x_2\\ \\ \\text{s.t. } x_1+2x_2\\ge4,\\ 3x_1+x_2\\ge6,\\ x\\succeq0`}</M></div>
          <Mafs viewBox={{ x: [-0.5, 7], y: [-0.5, 8] }} height={300} preserveAspectRatio="contain" pan={false}>
            <Coordinates.Cartesian subdivisions={false} />
            {ppoly.length > 2 && <Polygon points={ppoly} color="#8e8e93" fillOpacity={0.2} weight={1} />}
            <Line.ThroughPoints point1={[xp.x, xp.y]} point2={[xp.x + c2, xp.y - c1]} color={Theme.orange} style="dashed" />
            {xstar && <Point x={xstar[0]} y={xstar[1]} color={Theme.green} />}
            {xstar && <Text x={xstar[0]} y={xstar[1]} attach="sw" size={12} color={Theme.green}>x*</Text>}
            {xp.element}
          </Mafs>
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div style={{ fontSize: 13, textAlign: 'center' }}><M>{`\\max\\ 4y_1+6y_2\\ \\ \\text{s.t. } y_1+3y_2\\le ${c1.toFixed(1)},\\ 2y_1+y_2\\le ${c2.toFixed(1)},\\ y\\succeq0`}</M></div>
          <Mafs viewBox={{ x: [-0.3, 3], y: [-0.3, 2.2] }} height={300} preserveAspectRatio="contain" pan={false}>
            <Coordinates.Cartesian subdivisions={false} />
            {dpoly.length > 2 && <Polygon points={dpoly} color="#8e8e93" fillOpacity={0.2} weight={1} />}
            <Line.ThroughPoints point1={[yd.x, yd.y]} point2={[yd.x + 6, yd.y - 4]} color={Theme.red} style="dashed" />
            {ystar && <Point x={ystar[0]} y={ystar[1]} color={Theme.green} />}
            {ystar && <Text x={ystar[0]} y={ystar[1]} attach="ne" size={12} color={Theme.green}>y*</Text>}
            {yd.element}
          </Mafs>
        </div>
      </div>
      <div className="wrow">
        <Slider label={<M>{'c_1'}</M>} value={c1} set={setC1} min={0.5} max={5} step={0.1} fmt={(v) => v.toFixed(1)} />
        <Slider label={<M>{'c_2'}</M>} value={c2} set={setC2} min={0.5} max={5} step={0.1} fmt={(v) => v.toFixed(1)} />
        <button className="wbtn primary" onClick={() => { if (xstar) xp.setPoint(xstar); if (ystar) yd.setPoint(ystar) }}>跳到最优</button>
      </div>
      <div className="wstat">
        <span className={'chip ' + (pf ? 'good' : 'bad')}>x {pf ? '原可行' : '原不可行'}</span>
        <span className={'chip ' + (df ? 'good' : 'bad')}>y {df ? '对偶可行' : '对偶不可行'}</span>
        <span className="chip info">cᵀx = {cx.toFixed(3)}</span>
        <span className="chip info">bᵀy = {by.toFixed(3)}</span>
        {pf && df && <span className={'chip ' + (cx - by < 1e-3 ? 'good' : 'info')}>间隙 cᵀx − bᵀy = {(cx - by).toFixed(3)} ≥ 0</span>}
        <span className="chip good">p* = {fmt(pstar)}，d* = {fmt(dstar)}</span>
      </div>
    </Widget>
  )
}

/* ============ 3. Slater 条件判定 ============ */
export function Ch08Slater() {
  const [mode, setMode] = useState('disks')
  const [d, setD] = useState(1.2)
  const [r2, setR2] = useState(1)
  const [s, setS] = useState(0.5)
  const r1 = 1
  let status, strict = null, basic, refined, feasibleDesc, lowest = null
  if (mode === 'disks') {
    const c1 = [-d / 2, 0], c2 = [d / 2, 0]
    const sum = r1 + r2
    if (d < sum - 1e-6) {
      const lo = Math.max(c1[0] - r1, c2[0] - r2), hi = Math.min(c1[0] + r1, c2[0] + r2)
      strict = [(lo + hi) / 2, 0]
      status = 'ok'
      // 最低点：min x2 over intersection
      const cands = []
      const inD = (p, c, r) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 <= r * r + 1e-9
      if (inD([c1[0], -r1], c2, r2)) cands.push([c1[0], -r1])
      if (inD([c2[0], -r2], c1, r1)) cands.push([c2[0], -r2])
      if (d > Math.abs(r1 - r2)) {
        const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
        const h = Math.sqrt(Math.max(0, r1 * r1 - a * a))
        cands.push([c1[0] + a, -h])
      }
      lowest = cands.sort((p, q) => p[1] - q[1])[0]
    } else if (Math.abs(d - sum) <= 1e-6) {
      status = 'tangent'; lowest = [c1[0] + r1, 0]
    } else status = 'infeasible'
    basic = refined = status === 'ok'
    feasibleDesc = status === 'ok' ? '两圆盘交集（有内部）' : status === 'tangent' ? '只有一个切点' : '空集（不可行）'
  } else {
    if (Math.abs(s) < 1 - 1e-6) { status = 'ok'; strict = [s, 0] } else if (Math.abs(Math.abs(s) - 1) <= 1e-6) status = 'tangent'
    else status = 'infeasible'
    basic = false
    refined = status === 'ok'
    feasibleDesc = status === 'ok' ? '圆盘内的一条弦 x₁ = s' : status === 'tangent' ? '只有一个点 (s, 0)' : '空集（不可行）'
  }
  return (
    <Widget
      title="Slater 条件判定：存在严格可行点吗？"
      hint="模式一：两个凸约束 ‖x−c₁‖² ≤ 1、‖x−c₂‖² ≤ r₂²。拖 d 让两圆盘从相交到相切再到分离：相交时能找到同时“严格在里面”的点（Slater 成立）；正好相切时可行集只剩一个点，没有严格可行点（Slater 不成立）。模式二：圆盘 + 两条仿射不等式 x₁ ≤ s 与 −x₁ ≤ −s（等价于 x₁ = s）。基本 Slater 要求所有不等式严格成立，不可能；改进版允许仿射不等式取等号，只要弦穿过圆盘内部就成立。"
    >
      <Tabs tabs={[{ value: 'disks', label: '两个圆盘（非仿射）' }, { value: 'affine', label: '圆盘 + 仿射约束' }]} value={mode} set={setMode} />
      <Mafs viewBox={{ x: [-3, 3], y: [-1.8, 1.8] }} height={300} pan={false}>
        <Coordinates.Cartesian subdivisions={false} />
        {mode === 'disks' ? (
          <>
            <Circle center={[-d / 2, 0]} radius={r1} color={Theme.orange} fillOpacity={0.15} />
            <Circle center={[d / 2, 0]} radius={r2} color={Theme.green} fillOpacity={0.15} />
          </>
        ) : (
          <>
            <Circle center={[0, 0]} radius={1} color={Theme.orange} fillOpacity={0.15} />
            <Line.ThroughPoints point1={[s, 0]} point2={[s, 1]} color={Theme.blue} weight={2} />
            {status !== 'infeasible' && <Line.Segment point1={[s, -Math.sqrt(Math.max(0, 1 - s * s))]} point2={[s, Math.sqrt(Math.max(0, 1 - s * s))]} color={Theme.red} weight={5} />}
          </>
        )}
        {strict && <Point x={strict[0]} y={strict[1]} color={Theme.green} />}
        {strict && <Text x={strict[0]} y={strict[1]} attach="ne" size={12} color={Theme.green}>严格可行点</Text>}
        {status === 'tangent' && mode === 'disks' && <Point x={lowest[0]} y={0} color={Theme.red} />}
        {status === 'tangent' && mode === 'affine' && <Point x={s} y={0} color={Theme.red} />}
      </Mafs>
      <div className="wrow">
        {mode === 'disks' ? (
          <>
            <Slider label="圆心距 d" value={d} set={setD} min={0} max={3.2} step={0.05} fmt={(v) => v.toFixed(2)} />
            <Slider label={<M>{'r_2'}</M>} value={r2} set={setR2} min={0.5} max={1.5} step={0.05} fmt={(v) => v.toFixed(2)} />
            <button className="wbtn" onClick={() => setD(r1 + r2)}>正好相切</button>
          </>
        ) : (
          <>
            <Slider label="s" value={s} set={setS} min={-1.5} max={1.5} step={0.05} fmt={(v) => v.toFixed(2)} />
            <button className="wbtn" onClick={() => setS(1)}>s = 1（相切）</button>
          </>
        )}
      </div>
      <div className="wstat">
        <span className={'chip ' + (status === 'infeasible' ? 'bad' : 'info')}>可行集：{feasibleDesc}</span>
        <span className={'chip ' + (basic ? 'good' : 'bad')}>基本 Slater（所有不等式严格）：{basic ? '成立' : '不成立'}</span>
        <span className={'chip ' + (refined ? 'good' : 'bad')}>改进 Slater（仿射可取等号）：{refined ? '成立' : '不成立'}</span>
        <span className={'chip ' + (refined ? 'good' : 'bad')}>{refined ? '结论：凸问题 ⇒ 强对偶有保证' : '结论：Slater 无法保证强对偶'}</span>
      </div>
      {mode === 'disks' && status === 'tangent' && (
        <div className="wstat">
          <span className="chip info">例：若目标为 min x₂（c₁=(−1,0), c₂=(1,0)），p* = 0；取 λ₁=λ₂=λ 得 g = −1/(8λ)，λ→∞ 时趋于 0 但取不到：对偶最优不可达。</span>
        </div>
      )}
    </Widget>
  )
}

/* ============ 4. 二人零和博弈：LP1 与 LP2 互为对偶 ============ */
export function Ch08Game() {
  const [P, setP] = useState([[1, -1], [-1, 1]])
  const [u1, setU1] = useState(0.3)
  const [v1, setV1] = useState(0.7)
  const setEntry = (i, j) => (val) => setP(P.map((r, a) => r.map((x, b) => (a === i && b === j ? val : x))))
  const colVals = (p) => [p * P[0][0] + (1 - p) * P[1][0], p * P[0][1] + (1 - p) * P[1][1]] // (P^T u)_j
  const rowVals = (q) => [q * P[0][0] + (1 - q) * P[0][1], q * P[1][0] + (1 - q) * P[1][1]] // (P v)_i
  const { p1, ustar, p2, vstar } = useMemo(() => {
    let p1 = Infinity, ustar = 0, p2 = -Infinity, vstar = 0
    for (let k = 0; k <= 4000; k++) {
      const p = k / 4000
      const mx = Math.max(...colVals(p)), mn = Math.min(...rowVals(p))
      if (mx < p1) { p1 = mx; ustar = p }
      if (mn > p2) { p2 = mn; vstar = p }
    }
    return { p1, ustar, p2, vstar }
  }, [P])
  const u = [u1, 1 - u1], v = [v1, 1 - v1]
  const pay = u[0] * (P[0][0] * v[0] + P[0][1] * v[1]) + u[1] * (P[1][0] * v[0] + P[1][1] * v[1])
  return (
    <Widget
      title="二人零和博弈：先出招没有劣势，p₁* = p₂*"
      hint="Pᵢⱼ = 玩家 x 出 i、玩家 y 出 j 时 x 付给 y 的钱。左图：x 先公布混合策略 u=(u₁,1−u₁)，两条直线是 y 每个纯策略得到的 (Pᵀu)ⱼ，y 会挑上包络（最大）；x 选使上包络最低的 u → LP1 值 p₁*。右图：y 先公布 v，x 挑下包络（最小），y 让下包络最高 → LP2 值 p₂*。随意改支付矩阵，两个数总相等——这正是 LP 强对偶。"
    >
      <div className="wrow">
        {[0, 1].map((i) => [0, 1].map((j) => (
          <Slider key={`${i}${j}`} label={<M>{`P_{${i + 1}${j + 1}}`}</M>} value={P[i][j]} set={setEntry(i, j)} min={-3} max={3} step={0.1} fmt={(x) => x.toFixed(1)} />
        )))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <div style={{ fontSize: 13, textAlign: 'center' }}>LP1：x 先出，横轴 u₁</div>
          <Mafs viewBox={{ x: [-0.05, 1.05], y: [-3.3, 3.3] }} height={260} preserveAspectRatio="contain" pan={false}>
            <Coordinates.Cartesian subdivisions={false} xAxis={{ lines: 0.25 }} />
            <Plot.OfX y={(p) => colVals(p)[0]} domain={[0, 1]} color="#aeaeb2" />
            <Plot.OfX y={(p) => colVals(p)[1]} domain={[0, 1]} color="#aeaeb2" style="dashed" />
            <Plot.OfX y={(p) => Math.max(...colVals(p))} domain={[0, 1]} color={Theme.orange} weight={3} />
            <Point x={ustar} y={p1} color={Theme.green} />
            <Text x={ustar} y={p1} attach="n" size={12} color={Theme.green}>p₁*</Text>
          </Mafs>
        </div>
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <div style={{ fontSize: 13, textAlign: 'center' }}>LP2：y 先出，横轴 v₁</div>
          <Mafs viewBox={{ x: [-0.05, 1.05], y: [-3.3, 3.3] }} height={260} preserveAspectRatio="contain" pan={false}>
            <Coordinates.Cartesian subdivisions={false} xAxis={{ lines: 0.25 }} />
            <Plot.OfX y={(q) => rowVals(q)[0]} domain={[0, 1]} color="#aeaeb2" />
            <Plot.OfX y={(q) => rowVals(q)[1]} domain={[0, 1]} color="#aeaeb2" style="dashed" />
            <Plot.OfX y={(q) => Math.min(...rowVals(q))} domain={[0, 1]} color={Theme.red} weight={3} />
            <Point x={vstar} y={p2} color={Theme.green} />
            <Text x={vstar} y={p2} attach="s" size={12} color={Theme.green}>p₂*</Text>
          </Mafs>
        </div>
      </div>
      <div className="wrow">
        <Slider label={<M>{'u_1'}</M>} value={u1} set={setU1} min={0} max={1} step={0.01} />
        <Slider label={<M>{'v_1'}</M>} value={v1} set={setV1} min={0} max={1} step={0.01} />
        <button className="wbtn primary" onClick={() => { setU1(ustar); setV1(vstar) }}>设为 (u*, v*)</button>
      </div>
      <div className="wstat">
        <span className="chip info">期望支付 uᵀPv = {pay.toFixed(3)}</span>
        <span className="chip good">p₁* = {p1.toFixed(3)}（u₁* ≈ {ustar.toFixed(3)}）</span>
        <span className="chip good">p₂* = {p2.toFixed(3)}（v₁* ≈ {vstar.toFixed(3)}）</span>
        <span className={'chip ' + (Math.abs(p1 - p2) < 2e-3 ? 'good' : 'bad')}>{Math.abs(p1 - p2) < 2e-3 ? 'p₁* = p₂*：先后手无差别' : '不相等?'}</span>
      </div>
    </Widget>
  )
}
