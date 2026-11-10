// 第 7 章交互组件：Lagrangian 与 Lagrange dual function
import { useMemo, useState } from 'react'
import { Mafs, Plot, Point, Line, Polygon, Circle, Text, Theme } from 'mafs'
import { Coordinates } from './coordinates.jsx'
import { Widget, Slider, Tabs, M } from '../components/index.jsx'

/* ---------------- 共用：一维问题预设 ---------------- */
const PRESETS1D = {
  convex: {
    label: '凸问题',
    f0: (x) => (x - 2) ** 2,
    f1: (x) => x - 1,
    xb: 1, // 可行域 x <= xb
    f0tex: 'f_0(x)=(x-2)^2',
    f1tex: 'f_1(x)=x-1\\le 0',
  },
  nonconvex: {
    label: '非凸问题',
    f0: (x) => (x * x - 2.25) ** 2 / 5 + (1.5 - x) / 3,
    f1: (x) => x,
    xb: 0,
    f0tex: 'f_0(x)=\\tfrac15(x^2-2.25)^2+\\tfrac13(1.5-x)',
    f1tex: 'f_1(x)=x\\le 0',
  },
}
const XMIN = -3, XMAX = 4.5, NX = 1500
const LMAX = 4

function usePreset1D(key) {
  return useMemo(() => {
    const P = PRESETS1D[key]
    const xs = [], f0s = [], f1s = []
    for (let i = 0; i <= NX; i++) {
      const x = XMIN + (XMAX - XMIN) * i / NX
      xs.push(x); f0s.push(P.f0(x)); f1s.push(P.f1(x))
    }
    // p* = min f0 over feasible grid points
    let pstar = Infinity, xstar = 0
    for (let i = 0; i <= NX; i++) if (f1s[i] <= 1e-12 && f0s[i] < pstar) { pstar = f0s[i]; xstar = xs[i] }
    const gAt = (lam) => {
      let best = Infinity, bx = 0
      for (let i = 0; i <= NX; i++) { const v = f0s[i] + lam * f1s[i]; if (v < best) { best = v; bx = xs[i] } }
      return [best, bx]
    }
    const lams = [], gs = []
    let dstar = -Infinity, lstar = 0
    for (let k = 0; k <= 400; k++) {
      const l = LMAX * k / 400
      const g = gAt(l)[0]
      lams.push(l); gs.push(g)
      if (g > dstar) { dstar = g; lstar = l }
    }
    const gInterp = (l) => {
      const k = Math.max(0, Math.min(399, Math.floor(l / LMAX * 400)))
      const a = (l - lams[k]) / (lams[k + 1] - lams[k])
      return gs[k] * (1 - a) + gs[k + 1] * a
    }
    return { P, pstar, xstar, gAt, gInterp, dstar, lstar }
  }, [key])
}

const fmt = (v, d = 3) => (Number.isFinite(v) ? v.toFixed(d) : v > 0 ? '+∞' : '−∞')

/* ---------------- 1. 滑动 λ：L(x,λ)、g(λ) 与 p* ---------------- */
export function Ch07LagrangianSlider() {
  const [key, setKey] = useState('convex')
  const [lam, setLam] = useState(0.5)
  const { P, pstar, xstar, gAt, gInterp, dstar, lstar } = usePreset1D(key)
  const [g, xl] = gAt(lam)
  const viol = P.f1(xl)
  return (
    <Widget
      title="滑动 λ：Lagrangian 的最小值 g(λ) 永远不超过 p*"
      hint="左图：灰色 f₀，橙色虚线是惩罚项 λf₁(x)，黑色是 L(x,λ)=f₀+λf₁，绿色阴影是可行域。黑点是 L 的最低点，高度就是 g(λ)。右图：g(λ) 随 λ 的整条曲线。试试把 λ 从 0 慢慢调大：违反约束的区域被“抬高”，黑点被推回可行域；无论怎么调，黑点高度都不超过绿色的 p*。再切到“非凸问题”看看对偶间隙。"
    >
      <Tabs tabs={Object.entries(PRESETS1D).map(([k, v]) => ({ value: k, label: v.label }))} value={key} set={setKey} />
      <div style={{ fontSize: 14, margin: '4px 0 8px' }}>
        <M>{'\\min\\ ' + P.f0tex + '\\quad \\text{s.t. }' + P.f1tex}</M>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: '1 1 340px', minWidth: 0 }}>
          <Mafs viewBox={{ x: [-2.8, 4.2], y: [-4, 6] }} height={320} preserveAspectRatio="contain" pan={false}>
            <Coordinates.Cartesian subdivisions={false} />
            <Polygon points={[[XMIN, -10], [P.xb, -10], [P.xb, 12], [XMIN, 12]]} color={Theme.green} fillOpacity={0.08} strokeOpacity={0} />
            <Plot.OfX y={P.f0} color="#8e8e93" />
            <Plot.OfX y={(x) => lam * P.f1(x)} color={Theme.orange} style="dashed" weight={2} />
            <Plot.OfX y={(x) => P.f0(x) + lam * P.f1(x)} color={Theme.blue} weight={3} />
            <Line.ThroughPoints point1={[0, pstar]} point2={[1, pstar]} color={Theme.green} style="dashed" weight={1.5} />
            <Line.ThroughPoints point1={[0, g]} point2={[1, g]} color={Theme.blue} style="dashed" weight={1.5} />
            <Point x={xstar} y={pstar} color={Theme.green} />
            <Point x={xl} y={g} color={Theme.blue} />
            <Text x={-2.7} y={pstar} attach="ne" size={13} color={Theme.green}>p*</Text>
            <Text x={-2.7} y={g} attach="se" size={13} color={Theme.blue}>g(λ)</Text>
            <Text x={P.xb} y={5.5} attach="w" size={12} color={Theme.green}>可行 feasible</Text>
          </Mafs>
        </div>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <Mafs viewBox={{ x: [-0.3, LMAX + 0.2], y: [-4, 3] }} height={320} preserveAspectRatio="contain" pan={false}>
            <Coordinates.Cartesian subdivisions={false} />
            <Plot.OfX y={gInterp} domain={[0, LMAX]} color={Theme.violet} weight={3} />
            <Line.ThroughPoints point1={[0, pstar]} point2={[1, pstar]} color={Theme.green} style="dashed" />
            <Point x={lstar} y={dstar} color={Theme.red} />
            <Point x={lam} y={g} color={Theme.blue} />
            <Text x={LMAX} y={pstar} attach="n" size={13} color={Theme.green}>p*</Text>
            <Text x={lstar} y={dstar} attach="s" size={13} color={Theme.red}>d*</Text>
            <Text x={LMAX - 0.2} y={-3.5} attach="n" size={12}>横轴 λ，纵轴 g(λ)</Text>
          </Mafs>
        </div>
      </div>
      <div className="wrow">
        <Slider label={<M>{'\\lambda'}</M>} value={lam} set={setLam} min={0} max={LMAX} step={0.01} />
      </div>
      <div className="wstat">
        <span className="chip info">λ = {lam.toFixed(2)}</span>
        <span className="chip info">L 的最小点 x = {xl.toFixed(2)}</span>
        <span className={'chip ' + (viol > 1e-9 ? 'bad' : 'good')}>f₁(x) = {viol.toFixed(2)} {viol > 1e-9 ? '（违反约束）' : '（满足约束）'}</span>
        <span className="chip info">g(λ) = {fmt(g)}</span>
        <span className="chip good">p* = {fmt(pstar)}</span>
        <span className={'chip ' + (g <= pstar + 1e-9 ? 'good' : 'bad')}>g(λ) ≤ p* ✓</span>
        <span className="chip info">d* = max g = {fmt(dstar)}（λ≈{lstar.toFixed(2)}）</span>
        <span className={'chip ' + (pstar - dstar > 1e-3 ? 'bad' : 'good')}>间隙 p*−d* = {fmt(Math.max(0, pstar - dstar))}</span>
      </div>
    </Widget>
  )
}

/* ---------------- 2. g 是一族仿射函数的下包络 → 凹 ---------------- */
export function Ch07ConcaveEnvelope() {
  const [key, setKey] = useState('nonconvex')
  const [x0, setX0] = useState(-1)
  const { P, gInterp } = usePreset1D(key)
  const sampleXs = useMemo(() => {
    const a = []
    for (let i = 0; i <= 26; i++) a.push(-2.6 + i * 0.22)
    return a
  }, [])
  const a0 = P.f0(x0), b0 = P.f1(x0)
  return (
    <Widget
      title="为什么 g(λ) 一定是凹的：一族直线的下包络"
      hint="把 x 固定，L(x,λ)=f₀(x)+λf₁(x) 关于 λ 就是一条直线（斜率 f₁(x)，截距 f₀(x)）。灰线是很多个 x 对应的直线，棕色粗线是它们的逐点最小值 = g(λ)。拖动 x₀ 选中一条红线：它永远在棕线上方（或相切）。直线的下包络必然“向下弯”= 凹，哪怕原问题非凸。"
    >
      <Tabs tabs={Object.entries(PRESETS1D).map(([k, v]) => ({ value: k, label: v.label }))} value={key} set={setKey} />
      <Mafs viewBox={{ x: [-0.2, LMAX + 0.2], y: [-5, 4] }} height={330} preserveAspectRatio="contain" pan={false}>
        <Coordinates.Cartesian subdivisions={false} />
        {sampleXs.map((x, i) => (
          <Line.Segment key={i} point1={[0, P.f0(x)]} point2={[LMAX, P.f0(x) + LMAX * P.f1(x)]} color="#aeaeb2" weight={1} opacity={0.7} />
        ))}
        <Plot.OfX y={gInterp} domain={[0, LMAX]} color={Theme.violet} weight={4} />
        <Line.Segment point1={[0, a0]} point2={[LMAX, a0 + LMAX * b0]} color={Theme.red} weight={2.5} />
        <Text x={LMAX - 0.1} y={3.5} attach="w" size={12}>横轴 λ</Text>
      </Mafs>
      <div className="wrow">
        <Slider label={<M>{'x_0'}</M>} value={x0} set={setX0} min={-2.6} max={3.5} step={0.01} />
      </div>
      <div className="wstat">
        <span className="chip bad">红线：λ ↦ {a0.toFixed(2)} + λ·({b0.toFixed(2)})</span>
        <span className="chip info">斜率 = f₁(x₀) = {b0.toFixed(2)}</span>
        <span className="chip good">棕线 g(λ) = 所有直线的最小值 → 凹</span>
      </div>
    </Widget>
  )
}

/* ---------------- 3. 二维例子：x1²+x2²，等式 + 不等式 ---------------- */
const PSTAR_Q = 49 / 34
const gQ = (l, m) => -13 * l * l - 8.5 * m * m - 19 * l * m - 9 * l - 7 * m
export function Ch07QuadDual() {
  const [lam, setLam] = useState(0.3)
  const [mu, setMu] = useState(0.2)
  const x1 = -(6 * lam + 3 * mu) / 2, x2 = -(4 * lam + 5 * mu) / 2
  const g = gQ(lam, mu)
  const eq = 3 * x1 + 5 * x2 - 7, ineq = 6 * x1 + 4 * x2 - 9
  const xs = [21 / 34, 35 / 34]
  return (
    <Widget
      title="讲义例子：min x₁²+x₂²，s.t. 3x₁+5x₂=7，6x₁+4x₂≤9"
      hint="左图是 x 平面：灰色圆是 f₀ 的等高线，红线是等式约束，绿色阴影是不等式可行半平面，绿点是原问题最优 x*。黑点是 L(x,λ,μ) 的最小点 x(λ,μ)=−½(6λ+3μ, 4λ+5μ)。右图是固定当前 λ 时 g(λ,μ) 关于 μ 的曲线。试试：把 λ 调回 0，再拖 μ 到 −0.41 附近——黑点正好落到 x* 上，g 也正好碰到 p*。"
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <Mafs viewBox={{ x: [-1.5, 2.5], y: [-1.2, 2.5] }} height={320} preserveAspectRatio="contain" pan={false}>
            <Coordinates.Cartesian subdivisions={2} />
            <Plot.Inequality y={{ '<=': (x) => (9 - 6 * x) / 4 }} color={Theme.green} fillOpacity={0.08} weight={1} />
            {[0.5, 1, Math.sqrt(PSTAR_Q), 1.6, 2.1].map((r, i) => (
              <Circle key={i} center={[0, 0]} radius={r} color="#8e8e93" fillOpacity={0} weight={1} strokeStyle="dashed" />
            ))}
            <Plot.OfX y={(x) => (7 - 3 * x) / 5} color={Theme.red} weight={2.5} />
            <Point x={xs[0]} y={xs[1]} color={Theme.green} />
            <Point x={Math.max(-1.45, Math.min(2.45, x1))} y={Math.max(-1.15, Math.min(2.45, x2))} color={Theme.blue} />
            <Text x={xs[0]} y={xs[1]} attach="ne" size={13} color={Theme.green}>x*</Text>
            <Text x={x1} y={x2} attach="sw" size={13} color={Theme.blue}>x(λ,μ)</Text>
          </Mafs>
        </div>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <Mafs viewBox={{ x: [-1.6, 1.1], y: [-4, 2.2] }} height={320} preserveAspectRatio="contain" pan={false}>
            <Coordinates.Cartesian subdivisions={false} />
            <Plot.OfX y={(m) => gQ(lam, m)} color={Theme.violet} weight={3} />
            <Line.ThroughPoints point1={[0, PSTAR_Q]} point2={[1, PSTAR_Q]} color={Theme.green} style="dashed" />
            <Point x={mu} y={g} color={Theme.blue} />
            <Text x={-1.5} y={PSTAR_Q} attach="ne" size={13} color={Theme.green}>p* = 49/34</Text>
            <Text x={0.9} y={-3.6} attach="nw" size={12}>横轴 μ</Text>
          </Mafs>
        </div>
      </div>
      <div className="wrow">
        <Slider label={<M>{'\\lambda\\ (\\ge 0)'}</M>} value={lam} set={setLam} min={0} max={1.2} step={0.01} />
        <Slider label={<M>{'\\mu\\ (\\text{free})'}</M>} value={mu} set={setMu} min={-1.5} max={1} step={0.01} />
        <button className="wbtn" onClick={() => { setLam(0); setMu(-7 / 17) }}>跳到对偶最优 λ=0, μ=−7/17</button>
      </div>
      <div className="wstat">
        <span className="chip info">x(λ,μ) = ({x1.toFixed(3)}, {x2.toFixed(3)})</span>
        <span className={'chip ' + (Math.abs(eq) < 0.01 ? 'good' : 'bad')}>3x₁+5x₂−7 = {eq.toFixed(3)}</span>
        <span className={'chip ' + (ineq <= 1e-9 ? 'good' : 'bad')}>6x₁+4x₂−9 = {ineq.toFixed(3)}</span>
        <span className="chip info">g(λ,μ) = {g.toFixed(4)}</span>
        <span className="chip good">p* = 49/34 ≈ {PSTAR_Q.toFixed(4)}</span>
        <span className={'chip ' + (g <= PSTAR_Q + 1e-9 ? 'good' : 'bad')}>g ≤ p*，差 {(PSTAR_Q - g).toFixed(4)}</span>
      </div>
    </Widget>
  )
}

/* ---------------- 4. Max-cut：建模 + 对偶下界 ---------------- */
const MC_N = 6
const MC_EDGES = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [3, 5], [4, 5], [0, 5]]
const MC_POS = [[60, 150], [150, 60], [150, 240], [290, 60], [290, 240], [380, 150]]
function jacobiEig(A0) {
  const n = A0.length
  const A = A0.map((r) => r.slice())
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] ** 2
    if (off < 1e-20) break
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-15) continue
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q])
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1))
      const c = 1 / Math.sqrt(t * t + 1), s = t * c
      for (let k = 0; k < n; k++) {
        const akp = A[k][p], akq = A[k][q]
        A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq
      }
      for (let k = 0; k < n; k++) {
        const apk = A[p][k], aqk = A[q][k]
        A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk
      }
    }
  }
  return A.map((r, i) => r[i]).sort((a, b) => a - b)
}
export function Ch07MaxCut() {
  const [x, setX] = useState([1, -1, -1, 1, 1, -1])
  const [t, setT] = useState(-2)
  const { Q, sumQ, lmin, best } = useMemo(() => {
    const Q = Array.from({ length: MC_N }, () => Array(MC_N).fill(0))
    MC_EDGES.forEach(([i, j]) => { Q[i][j] = 1; Q[j][i] = 1 })
    const sumQ = 2 * MC_EDGES.length
    const lmin = jacobiEig(Q)[0]
    let best = 0
    for (let mask = 0; mask < 1 << MC_N; mask++) {
      let c = 0
      MC_EDGES.forEach(([i, j]) => { if (((mask >> i) & 1) !== ((mask >> j) & 1)) c++ })
      best = Math.max(best, c)
    }
    return { Q, sumQ, lmin, best }
  }, [])
  let xQx = 0
  for (let i = 0; i < MC_N; i++) for (let j = 0; j < MC_N; j++) xQx += x[i] * Q[i][j] * x[j]
  const cap = MC_EDGES.filter(([i, j]) => x[i] !== x[j]).length
  const capFormula = (sumQ - xQx) / 4
  const feasible = t <= lmin + 1e-9
  const trace = MC_N * t
  const cutBound = (sumQ - trace) / 4
  return (
    <Widget
      title="Max-cut：点击顶点切换 xᵢ = ±1，看割的容量与对偶上界"
      hint="黑色顶点 xᵢ=+1（属于 S），橙色 xᵢ=−1。红色粗边是被割断的边。下方滑块取 Λ = tI：只有 Q−tI ⪰ 0（即 t ≤ λ_min(Q)）时它才是对偶可行的，这时 trace Λ = 6t 是 p* 的下界，换算成最大割容量的上界。试试：把 t 拖到 λ_min 正好处，上界最紧；再往右拖越过 λ_min，对偶不可行，g = −∞，不再给出任何界。"
    >
      <svg viewBox="0 0 440 300" style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto' }}>
        {MC_EDGES.map(([i, j], k) => {
          const cut = x[i] !== x[j]
          return <line key={k} x1={MC_POS[i][0]} y1={MC_POS[i][1]} x2={MC_POS[j][0]} y2={MC_POS[j][1]} stroke={cut ? '#ff3b30' : '#aeaeb2'} strokeWidth={cut ? 4 : 2} strokeDasharray={cut ? '' : '5 4'} />
        })}
        {MC_EDGES.map(([i, j], k) => (
          <text key={'t' + k} x={(MC_POS[i][0] + MC_POS[j][0]) / 2} y={(MC_POS[i][1] + MC_POS[j][1]) / 2 - 6} fontSize="12" textAnchor="middle" fill="#636366">
            xᵢxⱼ={x[i] * x[j]}
          </text>
        ))}
        {MC_POS.map(([px, py], i) => (
          <g key={i} style={{ cursor: 'pointer' }} onClick={() => setX(x.map((v, k) => (k === i ? -v : v)))}>
            <circle cx={px} cy={py} r={20} fill={x[i] === 1 ? '#1d1d1f' : '#ff9500'} stroke="#fff" strokeWidth={3} />
            <text x={px} y={py + 5} fontSize="14" textAnchor="middle" fill="#fff" fontWeight="700">{i + 1}</text>
            <text x={px} y={py + 38} fontSize="12" textAnchor="middle" fill="#636366">{x[i] === 1 ? '+1' : '−1'}</text>
          </g>
        ))}
      </svg>
      <div className="wstat">
        <span className="chip info">割边数（直接数）= {cap}</span>
        <span className="chip info">x<sup>T</sup>Qx = {xQx}</span>
        <span className="chip good">¼ΣQᵢⱼ − ¼xᵀQx = ({sumQ} − {xQx})/4 = {capFormula}</span>
        <span className="chip info">真正的最大割（穷举 64 种）= {best}</span>
      </div>
      <div className="wrow">
        <Slider label={<M>{'\\Lambda = tI,\\ t'}</M>} value={t} set={setT} min={-4} max={1} step={0.01} />
        <button className="wbtn" onClick={() => setT(Math.floor(lmin * 1000) / 1000)}>t = λ_min(Q)</button>
      </div>
      <div className="wstat">
        <span className="chip info">λ_min(Q) = {lmin.toFixed(3)}</span>
        <span className={'chip ' + (feasible ? 'good' : 'bad')}>{feasible ? 'Q − tI ⪰ 0：对偶可行' : 'Q − tI 不半正定：g = −∞'}</span>
        {feasible ? (
          <>
            <span className="chip good">p* ≥ trace Λ = {trace.toFixed(3)}</span>
            <span className="chip good">最大割 ≤ ({sumQ} − {trace.toFixed(2)})/4 = {cutBound.toFixed(3)}</span>
          </>
        ) : (
          <span className="chip bad">没有任何有用的界</span>
        )}
      </div>
    </Widget>
  )
}
