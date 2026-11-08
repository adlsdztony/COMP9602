// 第 9 章交互组件：KKT 条件与互补松弛
import { useState, useEffect, useRef } from 'react'
import { Mafs, Coordinates, Plot, Point, Line, Polygon, Circle, Ellipse, Vector, Text, Theme, useMovablePoint } from 'mafs'
import { Widget, Slider, M } from '../components/index.jsx'

const f2 = (v) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(2)

/* ------------------------------------------------------------------ */
/* 1. KKT 几何：-∇f0 是否落在活跃约束梯度张成的锥里                     */
/* ------------------------------------------------------------------ */
// 可行域：f1 = x1+2x2-4 ≤ 0, f2 = 3x1+x2-6 ≤ 0, f3 = -x1 ≤ 0, f4 = -x2 ≤ 0
const KA = [[1, 2], [3, 1], [-1, 0], [0, -1]]
const KB = [4, 6, 0, 0]
const KNAME = ['f₁', 'f₂', 'f₃', 'f₄']
const KCORNERS = [[0, 0], [2, 0], [1.6, 1.2], [0, 2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]
const fval = (i, p) => dot(KA[i], p) - KB[i]
const feasible = (p, tol = 1e-7) => KA.every((_, i) => fval(i, p) <= tol)
const projLine = (i, p) => {
  const a = KA[i]
  const t = fval(i, p) / dot(a, a)
  return [p[0] - t * a[0], p[1] - t * a[1]]
}
function projPoly(p) {
  if (feasible(p)) return p
  let best = null, bd = Infinity
  const cands = [...KCORNERS, ...KA.map((_, i) => projLine(i, p))]
  for (const q of cands) {
    if (!feasible(q, 1e-6)) continue
    const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2
    if (d < bd) { bd = d; best = q }
  }
  return best || [0, 0]
}
function snapKKT([x, y]) {
  let q = projPoly([x, y])
  for (let it = 0; it < 2; it++) {
    for (let i = 0; i < 4; i++) {
      const dist = -fval(i, q) / Math.hypot(...KA[i])
      if (dist < 0.13) q = projLine(i, q)
    }
    q = projPoly(q)
  }
  // 吸附到角点
  for (const c of KCORNERS) if (Math.hypot(q[0] - c[0], q[1] - c[1]) < 0.16) q = c
  return q
}

export function Ch09KKTGeometry() {
  const x = useMovablePoint([0.6, 0.6], { color: Theme.blue, constrain: snapKKT })
  const c = useMovablePoint([3, 2.6], { color: Theme.orange })
  const p = [x.x, x.y]
  const g = [2 * (c.x - p[0]), 2 * (c.y - p[1])] // = -∇f0
  const act = [0, 1, 2, 3].filter((i) => Math.abs(fval(i, p)) < 1e-4)
  let lam = [], res = Math.hypot(...g)
  if (act.length === 1) {
    const a = KA[act[0]]
    const l = dot(g, a) / dot(a, a)
    lam = [l]
    res = Math.hypot(g[0] - l * a[0], g[1] - l * a[1])
  } else if (act.length >= 2) {
    const [a1, a2] = [KA[act[0]], KA[act[1]]]
    const det = a1[0] * a2[1] - a2[0] * a1[1]
    const l1 = (g[0] * a2[1] - a2[0] * g[1]) / det
    const l2 = (a1[0] * g[1] - g[0] * a1[1]) / det
    lam = [l1, l2]
    res = 0
  }
  const gn = Math.hypot(...g)
  const stat = res < 0.12 + 0.03 * gn
  const dualOK = lam.every((l) => l >= -1e-6)
  const kkt = stat && dualOK
  const unit = (v, L) => { const n = Math.hypot(...v) || 1; return [v[0] / n * L, v[1] / n * L] }
  const gArrow = unit(g, Math.min(1.3, 0.25 + gn * 0.35))
  const actDirs = act.map((i) => unit(KA[i], 0.9))
  let cone = null
  if (actDirs.length === 2) {
    const [d1, d2] = actDirs.map((d) => unit(d, 3))
    cone = <Polygon points={[p, [p[0] + d1[0], p[1] + d1[1]], [p[0] + d1[0] + d2[0], p[1] + d1[1] + d2[1]], [p[0] + d2[0], p[1] + d2[1]]]} color={Theme.green} fillOpacity={0.15} weight={0} />
  } else if (actDirs.length === 1) {
    const d = unit(actDirs[0], 4)
    cone = <Line.Segment point1={p} point2={[p[0] + d[0], p[1] + d[1]]} color={Theme.green} weight={6} opacity={0.35} />
  }
  const jump = () => x.setPoint(projPoly([c.x, c.y]))
  return (
    <Widget title="KKT 的几何：−∇f₀ 必须落在活跃约束梯度的锥里" hint="黑色点是候选解 x（只能在可行多边形内拖动，靠近边/角会自动吸附）；橙点是目标中心 c，f₀(x)=‖x−c‖²。试试：把 x 拖到边上、角上，观察红色箭头 −∇f₀ 是否落进绿色锥（活跃约束梯度 ∇fᵢ 的非负组合）。只有落进锥里且 λ≥0，KKT 才成立。">
      <Mafs viewBox={{ x: [-1, 4.2], y: [-1, 3.4] }} height={360} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Polygon points={KCORNERS.map((q) => q)} color={Theme.indigo} fillOpacity={0.12} />
        {[0.6, 1.2, 1.8, 2.4].map((r) => <Circle key={r} center={[c.x, c.y]} radius={r} color={Theme.orange} fillOpacity={0} strokeStyle="dashed" weight={1} />)}
        <Circle center={[c.x, c.y]} radius={Math.max(Math.hypot(c.x - p[0], c.y - p[1]), 1e-3)} color={Theme.orange} fillOpacity={0} weight={2} />
        {cone}
        {act.map((i, k) => (
          <g key={i}>
            <Vector tail={p} tip={[p[0] + actDirs[k][0], p[1] + actDirs[k][1]]} color={Theme.green} weight={3} />
            <Text x={p[0] + actDirs[k][0] * 1.15} y={p[1] + actDirs[k][1] * 1.15} size={13} color={Theme.green}>∇{KNAME[i]}</Text>
          </g>
        ))}
        {gn > 1e-3 && <Vector tail={p} tip={[p[0] + gArrow[0], p[1] + gArrow[1]]} color={Theme.red} weight={3} />}
        {gn > 1e-3 && <Text x={p[0] + gArrow[0]} y={p[1] + gArrow[1]} attach="e" size={13} color={Theme.red}>−∇f₀</Text>}
        <Text x={0.9} y={0.45} size={12} color={Theme.indigo}>可行域</Text>
        <Text x={c.x} y={c.y} attach="ne" size={12} color={Theme.orange}>c</Text>
        {c.element}
        {x.element}
      </Mafs>
      <div className="wrow">
        <button className="wbtn" onClick={jump}>把 x 移到真正的最优点（c 在可行域上的投影）</button>
      </div>
      <div className="wstat">
        <span className="chip info">x = ({f2(p[0])}, {f2(p[1])})</span>
        <span className="chip info">f₀(x) = {f2((p[0] - c.x) ** 2 + (p[1] - c.y) ** 2)}</span>
        <span className="chip info">活跃约束：{act.length ? act.map((i) => KNAME[i]).join(', ') : '无（内点）'}</span>
        {act.length > 0 && <span className={`chip ${dualOK ? 'good' : 'bad'}`}>λ = ({lam.map((l) => f2(l)).join(', ')}) {dualOK ? '≥ 0 ✓' : '有负分量 ✗'}</span>}
        <span className={`chip ${stat ? 'good' : 'bad'}`}>{stat ? '−∇f₀ 可由活跃 ∇fᵢ 表示 ✓' : `梯度条件不满足（残差 ${f2(res)}）✗`}</span>
        <span className={`chip ${kkt ? 'good' : 'bad'}`}>{kkt ? 'KKT 成立 ⇒ 这是最优解（凸问题）' : 'KKT 不成立 ⇒ 不是最优解'}</span>
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 2. 互补松弛：一维问题  min (x-a)^2  s.t. x ≤ b                         */
/* ------------------------------------------------------------------ */
export function Ch09CompSlack() {
  const [a, setA] = useState(2.5)
  const [b, setB] = useState(1)
  const xs = Math.min(a, b)
  const lam = Math.max(0, 2 * (a - b))
  const f1 = xs - b
  const active = Math.abs(f1) < 1e-9
  const pstar = (xs - a) ** 2
  const g = (l) => l * (a - b) - (l * l) / 4
  return (
    <Widget title="互补松弛：约束活跃 ⇔ λ 可以非零" hint="问题：min (x−a)²，约束 x ≤ b（即 f₁(x)=x−b ≤ 0）。拖动 a（无约束时的最低点）和 b（约束边界）。试试把 a 拖到 b 左边：约束变成“不活跃”，λ* 立刻变成 0；把 a 拖到 b 右边：约束“活跃”，λ* = 2(a−b) > 0。不管哪种情况，乘积 λ*·f₁(x*) 永远是 0。">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>原问题：f₀(x) 与可行域（灰色阴影区域 x ≤ b）</div>
          <Mafs viewBox={{ x: [-3, 5], y: [-1, 7] }} height={260} preserveAspectRatio={false}>
            <Coordinates.Cartesian subdivisions={1} />
            <Polygon points={[[-3, -1], [b, -1], [b, 7], [-3, 7]]} color={Theme.blue} fillOpacity={0.08} weight={0} />
            <Line.Segment point1={[b, -1]} point2={[b, 7]} color={Theme.blue} style="dashed" />
            <Plot.OfX y={(x) => (x - a) ** 2} color={Theme.orange} />
            <Point x={a} y={0} color={Theme.orange} />
            <Text x={a} y={0} attach="s" size={12} color={Theme.orange}>a</Text>
            <Point x={xs} y={pstar} color={Theme.green} />
            <Text x={xs} y={pstar} attach="n" size={13} color={Theme.green}>x*</Text>
          </Mafs>
        </div>
        <div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>对偶函数 g(λ) = λ(a−b) − λ²/4（λ ≥ 0）</div>
          <Mafs viewBox={{ x: [-0.5, 8], y: [-6, 7] }} height={260} preserveAspectRatio={false}>
            <Coordinates.Cartesian subdivisions={1} />
            <Plot.OfX y={g} domain={[0, 8]} color={Theme.violet} />
            <Line.Segment point1={[-0.5, pstar]} point2={[8, pstar]} color={Theme.green} style="dashed" />
            <Point x={lam} y={g(lam)} color={Theme.violet} />
            <Text x={lam} y={g(lam)} attach="n" size={13} color={Theme.violet}>λ*</Text>
          </Mafs>
        </div>
      </div>
      <div className="wrow">
        <Slider label={<M>{'a'}</M>} value={a} set={setA} min={-2} max={4} />
        <Slider label={<M>{'b'}</M>} value={b} set={setB} min={-1} max={3} />
      </div>
      <div className="wstat">
        <span className="chip info">x* = min(a,b) = {f2(xs)}</span>
        <span className={`chip ${active ? 'bad' : 'good'}`}>f₁(x*) = x*−b = {f2(f1)} → {active ? '约束活跃（tight）' : '约束不活跃（slack）'}</span>
        <span className={`chip ${lam > 0 ? 'bad' : 'good'}`}>λ* = max(0, 2(a−b)) = {f2(lam)}</span>
        <span className="chip good">λ*·f₁(x*) = {f2(lam * f1)} ✓</span>
        <span className="chip info">p* = {f2(pstar)}，d* = g(λ*) = {f2(g(lam))}（强对偶）</span>
        <span className="chip info">由 λ* 恢复：x = a − λ*/2 = {f2(a - lam / 2)}</span>
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 3. 从对偶解恢复原问题解：min x1²+2x2²  s.t. x1+x2 ≥ 3                 */
/* ------------------------------------------------------------------ */
export function Ch09DualRecover() {
  const [lam, setLam] = useState(1.5)
  const x = [lam / 2, lam / 4]
  const feas = x[0] + x[1] >= 3 - 1e-9
  const f0 = x[0] ** 2 + 2 * x[1] ** 2
  const g = (l) => 3 * l - (3 / 8) * l * l
  const cs = lam * (3 - x[0] - x[1])
  return (
    <Widget title="固定 λ，最小化 Lagrangian：x(λ) 什么时候正好是原问题最优解？" hint="对每个 λ，令 ∇ₓL=0 得到 x(λ)=(λ/2, λ/4)（绿点，沿绿色射线移动）。右图是对偶函数 g(λ)。试试把 λ 拖到 4：x(λ) 恰好落在约束线上、互补松弛成立、g(λ)=f₀(x)=6，对偶间隙为 0。λ<4 时 x(λ) 不可行；λ>4 时虽然可行，但 λ·f₁ ≠ 0。">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        <Mafs viewBox={{ x: [-1, 5], y: [-1.5, 3.5] }} height={260} preserveAspectRatio={false}>
          <Coordinates.Cartesian subdivisions={1} />
          <Polygon points={[[3 + 1.5, -1.5], [5, -1.5], [5, 3.5], [-0.5, 3.5]]} color={Theme.blue} fillOpacity={0.08} weight={0} />
          <Line.ThroughPoints point1={[0, 3]} point2={[3, 0]} color={Theme.blue} />
          <Text x={4.2} y={-1.1} size={12} color={Theme.blue}>x₁+x₂ ≥ 3</Text>
          {[1, 3, 6, 10].map((c) => <Ellipse key={c} center={[0, 0]} radius={[Math.sqrt(c), Math.sqrt(c / 2)]} color={Theme.orange} fillOpacity={0} strokeStyle={c === 6 ? 'solid' : 'dashed'} weight={c === 6 ? 2 : 1} />)}
          <Line.Segment point1={[0, 0]} point2={[4, 2]} color={Theme.green} style="dashed" />
          <Point x={2} y={1} color={Theme.red} />
          <Text x={2} y={1} attach="se" size={12} color={Theme.red}>x*=(2,1)</Text>
          <Point x={x[0]} y={x[1]} color={Theme.green} />
          <Text x={x[0]} y={x[1]} attach="nw" size={12} color={Theme.green}>x(λ)</Text>
        </Mafs>
        <Mafs viewBox={{ x: [-0.5, 8.5], y: [-1, 8] }} height={260} preserveAspectRatio={false}>
          <Coordinates.Cartesian subdivisions={1} />
          <Plot.OfX y={g} domain={[0, 8.5]} color={Theme.violet} />
          <Line.Segment point1={[-0.5, 6]} point2={[8.5, 6]} color={Theme.red} style="dashed" />
          <Text x={7.5} y={6} attach="n" size={12} color={Theme.red}>p* = 6</Text>
          <Point x={lam} y={g(lam)} color={Theme.violet} />
          <Text x={lam} y={g(lam)} attach="s" size={12} color={Theme.violet}>g(λ)</Text>
        </Mafs>
      </div>
      <div className="wrow">
        <Slider label={<M>{'\\lambda'}</M>} value={lam} set={setLam} min={0} max={8} step={0.05} />
      </div>
      <div className="wstat">
        <span className="chip info">x(λ) = ({f2(x[0])}, {f2(x[1])})</span>
        <span className={`chip ${feas ? 'good' : 'bad'}`}>x₁+x₂ = {f2(x[0] + x[1])} {feas ? '≥ 3 可行' : '< 3 不可行'}</span>
        <span className={`chip ${Math.abs(cs) < 0.02 ? 'good' : 'bad'}`}>λ·(3−x₁−x₂) = {f2(cs)}</span>
        <span className="chip info">g(λ) = {f2(g(lam))}，f₀(x(λ)) = {f2(f0)}</span>
        <span className={`chip ${Math.abs(lam - 4) < 0.03 ? 'good' : 'info'}`}>{Math.abs(lam - 4) < 0.03 ? 'λ* = 4：KKT 全部成立，x(λ*) = x*' : '对偶间隙 p* − g(λ) = ' + f2(6 - g(lam))}</span>
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Water-filling                                                    */
/* ------------------------------------------------------------------ */
function waterLevel(N, P) {
  const s = [...N].sort((u, v) => u - v)
  let acc = 0
  for (let K = 1; K <= s.length; K++) {
    acc += s[K - 1]
    const w = (P + acc) / K
    if (K === s.length || w <= s[K]) return w
  }
  return s[0]
}

export function Ch09WaterFilling() {
  const [N, setN] = useState([0.8, 2.0, 1.3, 2.9])
  const [P, setP] = useState(2.5)
  const [anim, setAnim] = useState(null)
  const timer = useRef(null)
  useEffect(() => {
    if (anim === null) return
    timer.current = setTimeout(() => {
      if (anim >= P) setAnim(null)
      else setAnim(Math.min(P, anim + P / 60))
    }, 40)
    return () => clearTimeout(timer.current)
  }, [anim, P])
  const Pc = anim === null ? P : anim
  const w = waterLevel(N, Pc)
  const p = N.map((n) => Math.max(0, w - n))
  const lam = 1 / w
  const mu = N.map((n, i) => (p[i] > 1e-9 ? 0 : lam - 1 / n))
  const cap = p.reduce((s, pi, i) => s + Math.log(1 + pi / N[i]), 0)
  const W = 560, H = 260, padL = 40, padB = 30
  const top = Math.max(...N, w, 3.5) * 1.12
  const ys = (v) => H - padB - (v / top) * (H - padB - 12)
  const bw = (W - padL - 20) / N.length
  const cols = ['#1d1d1f', '#636366', '#aeaeb2', '#ff9500']
  const setNi = (i) => (v) => setN(N.map((n, j) => (j === i ? v : n)))
  return (
    <Widget title="Water-filling：往高低不平的池底倒水" hint="每根柱子是一个信道，灰色地板高度 = 噪声 Nᵢ（课本 Example 5.2 记作 αᵢ），橙色水深 = 分配的功率 pᵢ。总水量 = 总功率 P。试试：增大 P，看水位 1/λ 上升、新的信道被“淹没”开始分到功率；把某个 Nᵢ 调高到水面以上，看它的 pᵢ 变 0、对应 μᵢ 变正。">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto', background: '#fafafa', borderRadius: 10, border: '1px solid #e5e5ea' }}>
        <line x1={padL} y1={ys(0)} x2={W - 10} y2={ys(0)} stroke="#999" />
        {[0, 1, 2, 3, 4, 5, 6].filter((t) => t <= top).map((t) => (
          <g key={t}>
            <line x1={padL - 4} y1={ys(t)} x2={padL} y2={ys(t)} stroke="#999" />
            <text x={padL - 8} y={ys(t) + 4} fontSize="11" textAnchor="end" fill="#777">{t}</text>
          </g>
        ))}
        {N.map((n, i) => {
          const x0 = padL + 10 + i * bw
          return (
            <g key={i}>
              {p[i] > 0 && <rect x={x0} y={ys(w)} width={bw - 20} height={ys(n) - ys(w)} fill="#ff9500" opacity="0.45" />}
              <rect x={x0} y={ys(n)} width={bw - 20} height={ys(0) - ys(n)} fill="#aeaeb2" />
              <rect x={x0} y={ys(n) - 3} width={bw - 20} height={3} fill={cols[i]} />
              <text x={x0 + (bw - 20) / 2} y={ys(n) + 16} fontSize="12" textAnchor="middle" fill="#fff">N{i + 1}={n.toFixed(2)}</text>
              <text x={x0 + (bw - 20) / 2} y={H - 10} fontSize="12" textAnchor="middle" fill={p[i] > 0 ? '#1d1d1f' : '#ff3b30'}>p{i + 1}={p[i].toFixed(2)}</text>
            </g>
          )
        })}
        <line x1={padL} y1={ys(w)} x2={W - 10} y2={ys(w)} stroke="#ff9500" strokeDasharray="6 4" strokeWidth="2" />
        <text x={W - 12} y={ys(w) - 6} fontSize="12" textAnchor="end" fill="#c26a00">水位 1/λ = {w.toFixed(2)}</text>
      </svg>
      <div className="wrow">
        <Slider label="总功率 P" value={P} set={(v) => { setAnim(null); setP(v) }} min={0} max={6} />
        <button className="wbtn" onClick={() => setAnim(0)}>▶ 从 0 开始倒水</button>
      </div>
      <div className="wrow">
        {N.map((n, i) => <Slider key={i} label={<M>{`N_${i + 1}`}</M>} value={n} set={setNi(i)} min={0.2} max={4} />)}
      </div>
      <div className="wstat">
        <span className="chip info">P = {Pc.toFixed(2)}</span>
        <span className="chip info">λ* = 1/水位 = {lam.toFixed(3)}</span>
        <span className="chip good">Σpᵢ = {p.reduce((s, v) => s + v, 0).toFixed(2)} = P（总功率约束活跃）</span>
        {mu.map((m, i) => <span key={i} className={`chip ${p[i] > 0 ? 'good' : 'bad'}`}>{p[i] > 0 ? `p${i + 1}>0 ⇒ μ${i + 1}=0` : `p${i + 1}=0 ⇒ μ${i + 1}=λ−1/N${i + 1}=${m.toFixed(3)} ≥ 0`}</span>)}
        <span className="chip info">总容量 Σlog(1+pᵢ/Nᵢ) = {cap.toFixed(3)}</span>
      </div>
    </Widget>
  )
}
