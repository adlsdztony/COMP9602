// 第 14 章 次梯度法 Subgradient Methods —— 交互组件
import { useState, useMemo, useRef } from 'react'
import { Mafs, Coordinates, Plot, Point, Line, Polygon, Polyline, Text, Theme, useMovablePoint } from 'mafs'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'

// Mafs 外的 SVG 用中性配色（Mafs 的 CSS 变量只在 .MafsView 内有效）
const C = { ink: '#1d1d1f', gray: '#636366', light: '#aeaeb2', orange: '#ff9500', red: '#ff3b30', green: '#34c759', brown: '#a2845e' }
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]
const norm = (a) => Math.hypot(a[0], a[1])

function LogChart({ series, xMax, yMin, yMax, xLabel, yLabel, height = 210 }) {
  const W = 600, H = height, L = 52, R = 12, T = 12, B = 34
  const ly0 = Math.log10(yMin), ly1 = Math.log10(yMax)
  const sx = (x) => L + (x / xMax) * (W - L - R)
  const sy = (y) => {
    const v = Math.log10(Math.min(Math.max(y, yMin), yMax))
    return T + (1 - (v - ly0) / (ly1 - ly0)) * (H - T - B)
  }
  const ticks = []
  for (let e = Math.ceil(ly0); e <= Math.floor(ly1); e++) ticks.push(e)
  const stepX = xMax <= 40 ? 5 : xMax <= 120 ? 20 : xMax <= 300 ? 50 : 100
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
        <polyline key={i} fill="none" stroke={s.color} strokeWidth={s.width || 2} strokeDasharray={s.dash ? '5 4' : undefined} opacity={s.opacity ?? 1}
          points={s.pts.map((p) => `${sx(p[0])},${sy(p[1])}`).join(' ')} />
      ))}
      {series.filter((s) => s.label).map((s, i) => (
        <g key={'l' + i}>
          <line x1={W - 190} x2={W - 170} y1={T + 10 + i * 16} y2={T + 10 + i * 16} stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dash ? '5 4' : undefined} />
          <text x={W - 165} y={T + 14 + i * 16} fontSize="11" fill={C.ink}>{s.label}</text>
        </g>
      ))}
    </svg>
  )
}

/* ================= 1. 一维：支撑线与次微分 ================= */
const FUNCS1D = {
  abs: { label: '|x|', pieces: [{ f: (x) => x, d: () => 1 }, { f: (x) => -x, d: () => -1 }], kinks: [0], vx: [-2.5, 2.5], vy: [-1, 2.5] },
  max: { label: 'max{½x², x+½}', pieces: [{ f: (x) => 0.5 * x * x, d: (x) => x }, { f: (x) => x + 0.5, d: () => 1 }], kinks: [1 - Math.SQRT2, 1 + Math.SQRT2], vx: [-2.5, 3.2], vy: [-1, 4] },
  pwl: { label: 'max{−x−1, 0.3x, 2x−2}', pieces: [{ f: (x) => -x - 1, d: () => -1 }, { f: (x) => 0.3 * x, d: () => 0.3 }, { f: (x) => 2 * x - 2, d: () => 2 }], kinks: [-1 / 1.3, 2 / 1.7], vx: [-2.5, 2.5], vy: [-1, 2.5] },
}

export function Ch14SupportLines() {
  const [which, setWhich] = useState('abs')
  const F = FUNCS1D[which]
  const [x0raw, setX0] = useState(0)
  const [g, setG] = useState(0.4)
  const kink = F.kinks.find((k) => Math.abs(k - x0raw) < 0.05)
  const x0 = kink !== undefined ? kink : x0raw
  const f = (x) => Math.max(...F.pieces.map((p) => p.f(x)))
  const fx = f(x0)
  const act = F.pieces.filter((p) => p.f(x0) >= fx - 1e-9)
  const lo = Math.min(...act.map((p) => p.d(x0))), hi = Math.max(...act.map((p) => p.d(x0)))
  // 数值检验 f(y) >= f(x0) + g (y - x0)
  let worst = Infinity
  for (let y = F.vx[0] - 3; y <= F.vx[1] + 3; y += 0.01) worst = Math.min(worst, f(y) - fx - g * (y - x0))
  const ok = worst >= -1e-6
  const fan = hi - lo > 1e-9 ? Array.from({ length: 7 }, (_, i) => lo + ((hi - lo) * i) / 6) : [lo]
  // 下方 g 轴
  const gW = 560, gx = (v) => 20 + ((v + 2.5) / 5) * (gW - 40)
  return (
    <Widget title="次梯度 = 支撑线的斜率 Supporting lines"
      hint="滑动 x 到拐点（会自动吸附），再滑动 g：只要直线 f(x)+g(y−x) 整条位于函数图像下方，g 就是一个 subgradient。灰色扇形是拐点处所有支撑线；下方横轴上的粗线段就是次微分 ∂f(x)。试试在光滑点上改变 g，看看为什么只有一个斜率可行。">
      <Tabs tabs={Object.entries(FUNCS1D).map(([k, v]) => ({ value: k, label: v.label }))} value={which} set={(k) => { setWhich(k); setX0(FUNCS1D[k].kinks[0]); setG(0) }} />
      <Mafs viewBox={{ x: F.vx, y: F.vy }} height={300} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        {fan.map((s, i) => <Plot.OfX key={i} y={(y) => fx + s * (y - x0)} color={Theme.indigo} opacity={0.25} weight={1.2} />)}
        <Plot.OfX y={f} color={Theme.blue} weight={3} />
        <Plot.OfX y={(y) => fx + g * (y - x0)} color={ok ? Theme.green : Theme.red} weight={2.5} />
        <Point x={x0} y={fx} color={Theme.orange} />
        <Text x={x0} y={fx} attach="s" size={13}>{`x = ${x0.toFixed(2)}`}</Text>
      </Mafs>
      <svg viewBox={`0 0 ${gW} 54`} style={{ width: '100%', height: 'auto', marginTop: 8 }}>
        <line x1={20} x2={gW - 20} y1={26} y2={26} stroke={C.light} />
        {[-2, -1, 0, 1, 2].map((v) => (
          <g key={v}><line x1={gx(v)} x2={gx(v)} y1={22} y2={30} stroke={C.light} /><text x={gx(v)} y={46} fontSize="11" textAnchor="middle" fill={C.gray}>{v}</text></g>
        ))}
        <line x1={gx(lo)} x2={gx(hi) + (hi - lo < 1e-9 ? 0.01 : 0)} y1={26} y2={26} stroke={C.ink} strokeWidth="7" strokeLinecap="round" />
        <circle cx={gx(Math.max(-2.5, Math.min(2.5, g)))} cy={26} r={6} fill={ok ? C.green : C.red} />
        <text x={gx(lo)} y={14} fontSize="11" textAnchor="middle" fill={C.ink}>∂f(x) = [{lo.toFixed(2)}, {hi.toFixed(2)}]</text>
      </svg>
      <div className="wrow">
        <Slider label="x" value={x0raw} set={setX0} min={F.vx[0] + 0.2} max={F.vx[1] - 0.2} step={0.01} fmt={() => x0.toFixed(2)} />
        <Slider label="g（直线斜率）" value={g} set={setG} min={-2.5} max={2.5} step={0.01} />
      </div>
      <div className="wrow">
        {F.kinks.map((k, i) => <button key={i} className="wbtn" onClick={() => setX0(k)}>跳到拐点 x = {k.toFixed(2)}</button>)}
      </div>
      <div className="wstat">
        <span className={'chip ' + (ok ? 'good' : 'bad')}>{ok ? 'g 是 subgradient（直线在图像下方）' : 'g 不是 subgradient（直线穿过了图像）'}</span>
        <span className="chip info">{hi - lo > 1e-9 ? '拐点：∂f(x) 是一个区间，f 在此不可微' : '光滑点：∂f(x) = {f′(x)}，唯一'}</span>
        <span className={'chip ' + (lo <= 1e-9 && hi >= -1e-9 ? 'good' : '')}>{lo <= 1e-9 && hi >= -1e-9 ? '0 ∈ ∂f(x) ⇒ x 是全局最小点' : '0 ∉ ∂f(x) ⇒ x 不是最小点'}</span>
      </div>
    </Widget>
  )
}

/* ================= 2D 分段线性函数 f(x) = max_i (a_i^T x + b_i) ================= */
const PA = [[1, 0.3], [-0.9, 0.7], [0.1, -1], [-0.7, -0.6], [0.5, 0.9]]
const PB = [0, 0.3, -0.2, 0.1, -0.5]
const fPWL = (x) => Math.max(...PA.map((a, i) => dot(a, x) + PB[i]))
const gPWL = (x) => {
  let j = 0, best = -Infinity
  PA.forEach((a, i) => { const v = dot(a, x) + PB[i]; if (v > best) { best = v; j = i } })
  return PA[j]
}
function solve2(a, b, c, d, e, f) { const det = a * d - b * c; return [(e * d - b * f) / det, (a * f - e * c) / det] }
const PWL_OPT = (() => {
  let best = null, bv = Infinity
  for (let i = 0; i < PA.length; i++) for (let j = i + 1; j < PA.length; j++) for (let k = j + 1; k < PA.length; k++) {
    const p = solve2(PA[i][0] - PA[j][0], PA[i][1] - PA[j][1], PA[i][0] - PA[k][0], PA[i][1] - PA[k][1], PB[j] - PB[i], PB[k] - PB[i])
    if (!isFinite(p[0])) continue
    const v = fPWL(p)
    if (v < bv) { bv = v; best = p }
  }
  return { x: best, f: bv }
})()
const G_PWL = Math.max(...PA.map(norm))

// 用半平面裁剪框得到水平集 {x : a_i^T x + b_i <= c}
function clip(poly, a, b) {
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length]
    const vp = dot(a, P) - b, vq = dot(a, Q) - b
    if (vp <= 0) out.push(P)
    if (vp * vq < 0) { const t = vp / (vp - vq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]) }
  }
  return out
}
const levelSet = (c) => PA.reduce((poly, a, i) => clip(poly, a, c - PB[i]), [[-6, -6], [6, -6], [6, 6], [-6, 6]])
const LEVELS = [0.25, 0.5, 1, 1.5, 2.2, 3].map((d) => levelSet(PWL_OPT.f + d))

const RULES = [
  { value: 'const', label: '常数步长 α', par: [0.02, 1, 0.3], step: (p) => p, name: 'α' },
  { value: 'len', label: '常数步长度 γ/‖g‖', par: [0.02, 1, 0.3], step: (p, k, g) => p / norm(g), name: 'γ' },
  { value: 'sq', label: '平方可和 a/(1+k)', par: [0.1, 5, 1], step: (p, k) => p / (1 + k), name: 'a' },
  { value: 'dim', label: '不可和递减 a/√k', par: [0.05, 2, 0.5], step: (p, k) => p / Math.sqrt(k), name: 'a' },
  { value: 'polyak', label: 'Polyak (f−f*)/‖g‖²', par: [0.2, 2, 1], step: (p, k, g, fx) => (p * (fx - PWL_OPT.f)) / dot(g, g), name: '系数' },
]

function runSubgrad(rule, p, x1, K) {
  const R = RULES.find((r) => r.value === rule)
  let x = [...x1], fbest = Infinity, sa = 0, sa2 = 0
  const xs = [x], fk = [], fb = [], bound = []
  const R0 = norm([x1[0] - PWL_OPT.x[0], x1[1] - PWL_OPT.x[1]])
  for (let k = 1; k <= K; k++) {
    const fx = fPWL(x)
    fbest = Math.min(fbest, fx)
    fk.push([k, fx - PWL_OPT.f]); fb.push([k, fbest - PWL_OPT.f])
    const g = gPWL(x)
    const a = R.step(p, k, g, fx)
    sa += a; sa2 += a * a
    bound.push([k, (R0 * R0 + G_PWL * G_PWL * sa2) / (2 * sa)])
    x = [x[0] - a * g[0], x[1] - a * g[1]]
    xs.push(x)
  }
  return { xs, fk, fb, bound, fbest }
}

export function Ch14SubgradMethod() {
  const [rule, setRule] = useState('const')
  const R = RULES.find((r) => r.value === rule)
  const [par, setPar] = useState({ const: 0.3, len: 0.3, sq: 1, dim: 0.5, polyak: 1 })
  const [K, setK] = useState(100)
  const start = useMovablePoint([-2.6, 2.2], { color: Theme.orange })
  const p = par[rule]
  const res = useMemo(() => runSubgrad(rule, p, start.point, K), [rule, p, start.x, start.y, K])
  const floor = rule === 'const' ? (G_PWL * G_PWL * p) / 2 : rule === 'len' ? (G_PWL * p) / 2 : null
  const last = res.fk[res.fk.length - 1][1]
  let ups = 0
  for (let i = 1; i < res.fk.length; i++) if (res.fk[i][1] > res.fk[i - 1][1] + 1e-12) ups++
  return (
    <Widget title="次梯度法实验室 Subgradient method lab"
      hint="f(x) = max 五个仿射函数（灰色折线框是等高线）。拖动橙色起点，选择步长规则并调参数。观察：路径常常来回锯齿；下方图中细线 f(x⁽ᵏ⁾)−f* 上下跳动（不是下降法），粗线 f_best 单调下降；虚线是理论上界。试试把常数步长 α 从 0.05 调到 1，看最终“地板”如何变高。">
      <Tabs tabs={RULES.map((r) => ({ value: r.value, label: r.label }))} value={rule} set={setRule} />
      <Mafs viewBox={{ x: [-3.2, 3.2], y: [-2.6, 3] }} height={340} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        {LEVELS.map((poly, i) => <Polygon key={i} points={poly} color={Theme.indigo} fillOpacity={0.03} weight={1} />)}
        <Polyline points={res.xs.slice(0, 201)} color={Theme.red} weight={1.5} />
        {res.xs.slice(0, 41).map((q, i) => <Point key={i} x={q[0]} y={q[1]} color={Theme.red} opacity={0.6} />)}
        <Point x={PWL_OPT.x[0]} y={PWL_OPT.x[1]} color={Theme.green} />
        <Text x={PWL_OPT.x[0]} y={PWL_OPT.x[1]} attach="se" size={13} color={Theme.green}>x*</Text>
        {start.element}
      </Mafs>
      <div className="wrow">
        <Slider label={R.name} value={p} set={(v) => setPar({ ...par, [rule]: v })} min={R.par[0]} max={R.par[1]} step={0.01} />
        <Slider label="迭代次数 K" value={K} set={setK} min={10} max={500} step={10} fmt={(v) => v.toFixed(0)} />
      </div>
      <LogChart xMax={K} yMin={1e-5} yMax={30} xLabel="迭代 k" yLabel="f − f*"
        series={[
          { pts: res.fk, color: C.light, width: 1.2, label: 'f(x⁽ᵏ⁾) − f*' },
          { pts: res.fb, color: C.red, width: 2.5, label: 'f_best⁽ᵏ⁾ − f*' },
          { pts: res.bound, color: C.ink, dash: true, width: 1.5, label: '上界 (R²+G²Σα²)/(2Σα)' },
        ]} />
      <div className="wstat">
        <span className="chip info">f* = {PWL_OPT.f.toFixed(4)}</span>
        <span className="chip">K 步后 f_best − f* = {(res.fbest - PWL_OPT.f).toExponential(2)}</span>
        <span className="chip">最后一步 f − f* = {last.toExponential(2)}</span>
        <span className={'chip ' + (ups > 0 ? 'bad' : 'good')}>f 上升的步数：{ups}（非下降法）</span>
        {floor !== null && <span className="chip">理论极限 {rule === 'const' ? 'G²α/2' : 'Gγ/2'} = {floor.toFixed(3)}（G = {G_PWL.toFixed(2)}）</span>}
        {floor === null && <span className="chip good">此规则理论上 f_best → f*</span>}
      </div>
    </Widget>
  )
}

/* ================= 3. 投影次梯度法 ================= */
const CT = [2, 1.6]
const fL1 = (x) => Math.abs(x[0] - CT[0]) + Math.abs(x[1] - CT[1])
const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0)
const SETS = {
  line: {
    label: '直线 2x₁ + x₂ = 1（仿射集）',
    P: (z) => { const a = [2, 1], t = (dot(a, z) - 1) / 5; return [z[0] - t * a[0], z[1] - t * a[1]] },
    opt: () => { let best = null, bv = Infinity; for (let s = -4; s <= 4; s += 0.0005) { const x = [s, 1 - 2 * s]; const v = fL1(x); if (v < bv - 1e-12) { bv = v; best = x } } return best },
  },
  disk: {
    label: '圆盘 ‖x‖₂ ≤ 1.2',
    P: (z) => { const r = norm(z); return r <= 1.2 ? z : [(1.2 * z[0]) / r, (1.2 * z[1]) / r] },
    opt: () => { let best = null, bv = Infinity; for (let i = 0; i < 20000; i++) { const t = (2 * Math.PI * i) / 20000; const x = [1.2 * Math.cos(t), 1.2 * Math.sin(t)]; const v = fL1(x); if (v < bv) { bv = v; best = x } } return best },
  },
  box: {
    label: '方框 −1 ≤ xᵢ ≤ 1',
    P: (z) => [Math.max(-1, Math.min(1, z[0])), Math.max(-1, Math.min(1, z[1]))],
    opt: () => [1, 1],
  },
}
const SET_OPT = Object.fromEntries(Object.entries(SETS).map(([k, v]) => [k, v.opt()]))

export function Ch14Projected() {
  const [set, setSet] = useState('line')
  const S = SETS[set]
  const [a, setA] = useState(0.8)
  const [k, setK] = useState(1)
  const start = useMovablePoint([-2, -1.5], { color: Theme.orange })
  const xstar = SET_OPT[set]
  const fstar = fL1(xstar)
  const iters = useMemo(() => {
    let x = [...start.point]
    const out = []
    for (let i = 1; i <= 80; i++) {
      const g = [sgn(x[0] - CT[0]), sgn(x[1] - CT[1])]
      const al = a / Math.sqrt(i)
      const z = [x[0] - al * g[0], x[1] - al * g[1]]
      const xn = S.P(z)
      out.push({ x, z, xn })
      x = xn
    }
    return out
  }, [set, a, start.x, start.y])
  const cur = iters[k - 1]
  const dz = norm([cur.z[0] - xstar[0], cur.z[1] - xstar[1]])
  const dp = norm([cur.xn[0] - xstar[0], cur.xn[1] - xstar[1]])
  let fbest = Infinity
  for (let i = 1; i < k; i++) fbest = Math.min(fbest, fL1(iters[i].x))
  fbest = Math.min(fbest, fL1(cur.xn))
  const diamond = (r) => [[CT[0] + r, CT[1]], [CT[0], CT[1] + r], [CT[0] - r, CT[1]], [CT[0], CT[1] - r]]
  const circ = Array.from({ length: 80 }, (_, i) => [1.2 * Math.cos((2 * Math.PI * i) / 80), 1.2 * Math.sin((2 * Math.PI * i) / 80)])
  return (
    <Widget title="投影次梯度法 Projected subgradient"
      hint="目标 f(x) = ‖x − c‖₁（菱形是等高线，c 在可行集外）。每一步：先走一个普通次梯度步得到灰点 z = x − αg（可能跑出可行集），再投影回可行集得到下一个点 P(z)。点“下一步”观察；注意右侧数值：投影后到 x* 的距离不会变大。">
      <Tabs tabs={Object.entries(SETS).map(([key, v]) => ({ value: key, label: v.label }))} value={set} set={(s) => { setSet(s); setK(1) }} />
      <Mafs viewBox={{ x: [-3, 3.6], y: [-2.6, 3] }} height={340} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        {[fstar - 1, fstar, fstar + 1, fstar + 2].filter((r) => r > 0).map((r) => <Polygon key={r} points={diamond(r)} color={Theme.indigo} fillOpacity={0} weight={1} />)}
        {set === 'line' && <Line.ThroughPoints point1={[0, 1]} point2={[1, -1]} color={Theme.blue} weight={3} />}
        {set === 'disk' && <Polygon points={circ} color={Theme.blue} fillOpacity={0.08} />}
        {set === 'box' && <Polygon points={[[-1, -1], [1, -1], [1, 1], [-1, 1]]} color={Theme.blue} fillOpacity={0.08} />}
        <Point x={CT[0]} y={CT[1]} color={Theme.violet} />
        <Text x={CT[0]} y={CT[1]} attach="ne" size={12} color={Theme.violet}>c</Text>
        <Polyline points={[iters[0].x, ...iters.slice(0, k).map((s) => s.xn)]} color={Theme.red} weight={1.5} />
        <Line.Segment point1={cur.x} point2={cur.z} color={Theme.indigo} weight={2} />
        <Line.Segment point1={cur.z} point2={cur.xn} color={Theme.orange} style="dashed" weight={2} />
        <Point x={cur.z[0]} y={cur.z[1]} color={Theme.indigo} />
        <Text x={cur.z[0]} y={cur.z[1]} attach="nw" size={12}>z = x − αg</Text>
        <Point x={cur.xn[0]} y={cur.xn[1]} color={Theme.red} />
        <Text x={cur.xn[0]} y={cur.xn[1]} attach="se" size={12} color={Theme.red}>P(z)</Text>
        <Point x={xstar[0]} y={xstar[1]} color={Theme.green} />
        <Text x={xstar[0]} y={xstar[1]} attach="sw" size={12} color={Theme.green}>x*</Text>
        {start.element}
      </Mafs>
      <div className="wrow">
        <button className="wbtn primary" onClick={() => setK(Math.min(80, k + 1))}>下一步 →</button>
        <button className="wbtn" onClick={() => setK(Math.min(80, k + 10))}>+10 步</button>
        <button className="wbtn" onClick={() => setK(1)}>重置</button>
        <Slider label={<M>{'\\alpha_k = a/\\sqrt{k}'}</M>} value={a} set={setA} min={0.1} max={2} step={0.05} />
      </div>
      <div className="wstat">
        <span className="chip info">第 k = {k} 步，α = {(a / Math.sqrt(k)).toFixed(3)}</span>
        <span className="chip">‖z − x*‖ = {dz.toFixed(3)}</span>
        <span className={'chip ' + (dp <= dz + 1e-9 ? 'good' : 'bad')}>‖P(z) − x*‖ = {dp.toFixed(3)} ≤ ‖z − x*‖</span>
        <span className="chip">f_best − f* = {(fbest - fstar).toExponential(2)}</span>
      </div>
    </Widget>
  )
}

/* ================= 4. 2D 次微分集合 ================= */
const MAX3 = [[1, 0.5], [-1, 0.5], [0, -1]]
export function Ch14Subdiff2D() {
  const [kind, setKind] = useState('l1')
  const kindRef = useRef(kind)
  kindRef.current = kind
  const pt = useMovablePoint([0.8, 0], {
    color: Theme.orange,
    constrain: ([x, y]) => {
      if (Math.hypot(x, y) < 0.15) return [0, 0]
      if (kindRef.current === 'l1') return [Math.abs(x) < 0.1 ? 0 : x, Math.abs(y) < 0.1 ? 0 : y]
      // max 三片的分界射线：方向 (0,1)、(1,−1)/√2·… 由 a_i^T x 相等给出
      const rays = [[0, 1], [1, -1 / 1.5], [-1, -1 / 1.5]].map((r) => [r[0] / norm(r), r[1] / norm(r)])
      for (const r of rays) {
        const s = x * r[0] + y * r[1]
        if (s > 0 && Math.abs(-x * r[1] + y * r[0]) < 0.1) return [s * r[0], s * r[1]]
      }
      return [x, y]
    },
  })
  const [x, y] = pt.point
  let hull, cands, fval
  if (kind === 'l1') {
    const ix = Math.abs(x) < 1e-9 ? [-1, 1] : [sgn(x), sgn(x)]
    const iy = Math.abs(y) < 1e-9 ? [-1, 1] : [sgn(y), sgn(y)]
    hull = [[ix[0], iy[0]], [ix[1], iy[0]], [ix[1], iy[1]], [ix[0], iy[1]]]
    cands = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
    fval = Math.abs(x) + Math.abs(y)
  } else {
    const vals = MAX3.map((a) => dot(a, [x, y]))
    fval = Math.max(...vals)
    hull = MAX3.filter((a, i) => vals[i] >= fval - 1e-6)
    cands = MAX3
  }
  // 去重
  const uniq = hull.filter((p, i) => hull.findIndex((q) => Math.abs(q[0] - p[0]) < 1e-9 && Math.abs(q[1] - p[1]) < 1e-9) === i)
  const dim = uniq.length === 1 ? '单点 → f 在此可微，∂f = {∇f}' : uniq.length === 2 ? '线段 → 有两片同时“激活”' : '多边形 → 多片同时激活'
  // 0 是否在凸包内
  let zeroIn = false
  if (kind === 'l1') zeroIn = Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9
  else zeroIn = uniq.length === 3
  return (
    <Widget title="二维次微分 ∂f(x) 是一个凸集"
      hint="左图拖动 x（靠近分界线会吸附上去），右图显示 g 空间里的 ∂f(x)：光滑区域是一个点（就是梯度），在分界线上是线段，在多条分界线的交点处是整块多边形。观察何时 0 落进 ∂f(x)——那就是最小点。">
      <Tabs tabs={[{ value: 'l1', label: 'f = ‖x‖₁ = |x₁|+|x₂|' }, { value: 'max', label: 'f = max{x₁+½x₂, −x₁+½x₂, −x₂}' }]} value={kind} set={setKind} />
      <div className="two-col">
        <div>
          <Mafs viewBox={{ x: [-2, 2], y: [-2, 2] }} height={280} preserveAspectRatio={false}>
            <Coordinates.Cartesian subdivisions={2} />
            {kind === 'l1' ? (
              <>
                {[0.5, 1, 1.5].map((r) => <Polygon key={r} points={[[r, 0], [0, r], [-r, 0], [0, -r]]} color={Theme.indigo} fillOpacity={0} weight={1} />)}
              </>
            ) : (
              <>
                <Line.Segment point1={[0, 0]} point2={[0, 3]} color={Theme.indigo} style="dashed" />
                <Line.Segment point1={[0, 0]} point2={[3, -2]} color={Theme.indigo} style="dashed" />
                <Line.Segment point1={[0, 0]} point2={[-3, -2]} color={Theme.indigo} style="dashed" />
                <Text x={1.2} y={1} size={12}>x₁+½x₂ 最大</Text>
                <Text x={-1.2} y={1} size={12}>−x₁+½x₂ 最大</Text>
                <Text x={0} y={-1.5} size={12}>−x₂ 最大</Text>
              </>
            )}
            {pt.element}
          </Mafs>
          <div className="legend-inline" style={{ textAlign: 'center' }}>x 空间</div>
        </div>
        <div>
          <Mafs viewBox={{ x: [-1.6, 1.6], y: [-1.6, 1.6] }} height={280} preserveAspectRatio={false}>
            <Coordinates.Cartesian subdivisions={2} />
            {cands.map((c, i) => <Point key={i} x={c[0]} y={c[1]} color={Theme.indigo} opacity={0.4} />)}
            {uniq.length >= 3 && <Polygon points={uniq} color={Theme.orange} fillOpacity={0.3} />}
            {uniq.length === 2 && <Line.Segment point1={uniq[0]} point2={uniq[1]} color={Theme.orange} weight={5} />}
            {uniq.map((c, i) => <Point key={'u' + i} x={c[0]} y={c[1]} color={Theme.orange} />)}
            <Point x={0} y={0} color={zeroIn ? Theme.green : Theme.red} />
            <Text x={0} y={0} attach="sw" size={12}>0</Text>
          </Mafs>
          <div className="legend-inline" style={{ textAlign: 'center' }}>g 空间：∂f(x)</div>
        </div>
      </div>
      <div className="wstat">
        <span className="chip info">x = ({x.toFixed(2)}, {y.toFixed(2)})，f(x) = {fval.toFixed(3)}</span>
        <span className="chip">∂f(x)：{dim}</span>
        <span className={'chip ' + (zeroIn ? 'good' : 'bad')}>{zeroIn ? '0 ∈ ∂f(x) ⇒ x 是最小点' : '0 ∉ ∂f(x)'}</span>
      </div>
    </Widget>
  )
}
