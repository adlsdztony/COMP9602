// 第 10 章交互组件：灵敏度分析与对偶应用
import { useState } from 'react'
import { Mafs, Plot, Point, Line, Polygon, Vector, Text, Theme } from 'mafs'
import { Coordinates } from './coordinates.jsx'
import { Widget, Slider, M, Tabs } from '../components/index.jsx'

const f2 = (v) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(2)
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }
const cap = { fontSize: 13, color: '#555', marginBottom: 4 }

/* ------------------------------------------------------------------ */
/* 1. 扰动函数 p*(u) 与全局/局部灵敏度                                   */
/*    min x1²+2x2²  s.t. 3 − x1 − x2 ≤ u                                */
/* ------------------------------------------------------------------ */
const pU = (u) => (u >= 3 ? 0 : (2 / 3) * (3 - u) ** 2)
const lamU = (u) => (u >= 3 ? 0 : (4 / 3) * (3 - u))

export function Ch10Perturb() {
  const [u, setU] = useState(-1)
  const [u0, setU0] = useState(0)
  const lin = 6 - 4 * u // 全局下界 p*(0) − λ* u
  const tan0 = (v) => pU(u0) - lamU(u0) * (v - u0)
  return (
    <Widget title="扰动函数 p*(u)：λ* 是它在 u=0 处的（负）斜率" hint="问题：min x₁²+2x₂²，约束 3−x₁−x₂ ≤ u。u>0 表示放松约束，u<0 表示收紧。黑色粗曲线是 p*(u)，红色直线是全局下界 p*(0) − λ*u（λ*=4）。拖动 u：红线永远在曲线下方（全局灵敏度不等式）；在 u=0 附近两者几乎重合（局部灵敏度）。再拖动“切点 u₀”看任意点的切线斜率 = −λ*(u₀)。">
      <Mafs viewBox={{ x: [-3, 5], y: [-4, 26] }} height={320} preserveAspectRatio="contain">
        <Coordinates.Cartesian xAxis={{ lines: 1 }} yAxis={{ lines: 5 }} />
        <Plot.OfX y={pU} color={Theme.blue} weight={3} />
        <Plot.OfX y={(v) => 6 - 4 * v} color={Theme.red} />
        <Plot.OfX y={tan0} color={Theme.violet} style="dashed" />
        <Point x={0} y={6} color={Theme.red} />
        <Text x={0} y={6} attach="ne" size={12} color={Theme.red}>(0, p*(0)=6)</Text>
        <Line.Segment point1={[u, lin]} point2={[u, pU(u)]} color={Theme.green} weight={3} />
        <Point x={u} y={pU(u)} color={Theme.blue} />
        <Point x={u} y={lin} color={Theme.red} />
        <Point x={u0} y={pU(u0)} color={Theme.violet} />
        <Text x={-2.2} y={-2} size={12} color={Theme.red}>p*(0) − λ* u</Text>
        <Text x={3.6} y={3} size={12} color={Theme.blue}>p*(u)</Text>
      </Mafs>
      <div className="wrow">
        <Slider label={<span>扰动 <M>{'u'}</M></span>} value={u} set={setU} min={-2.5} max={4.5} />
        <Slider label={<span>切点 <M>{'u_0'}</M></span>} value={u0} set={setU0} min={-2.5} max={4.5} />
      </div>
      <div className="wstat">
        <span className="chip info">p*(u) = {f2(pU(u))}</span>
        <span className="chip info">下界 6 − 4u = {f2(lin)}</span>
        <span className="chip good">p*(u) − 下界 = {f2(pU(u) - lin)} ≥ 0 ✓</span>
        <span className={`chip ${u < 0 ? 'bad' : 'good'}`}>{u < 0 ? `收紧约束：p* 至少增加 λ*|u| = ${f2(-4 * u)}` : `放松约束：p* 至多减少约 λ*u = ${f2(4 * u)}（一阶估计）`}</span>
        <span className="chip info">λ*(u₀) = −dp*/du = {f2(lamU(u0))}</span>
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 2. 影子价格：生产计划 LP                                             */
/*    max 3x1+5x2  s.t. x1 ≤ b1, 2x2 ≤ b2, 3x1+2x2 ≤ b3, x ≥ 0           */
/* ------------------------------------------------------------------ */
const SA = [[1, 0], [0, 2], [3, 2], [-1, 0], [0, -1]]
const SC = [3, 5]
function solveLP(b) {
  const B = [...b, 0, 0]
  const feas = (x) => SA.every((a, i) => a[0] * x[0] + a[1] * x[1] <= B[i] + 1e-9)
  const verts = []
  for (let i = 0; i < SA.length; i++)
    for (let j = i + 1; j < SA.length; j++) {
      const [a, c] = [SA[i], SA[j]]
      const det = a[0] * c[1] - a[1] * c[0]
      if (Math.abs(det) < 1e-12) continue
      const x = [(B[i] * c[1] - a[1] * B[j]) / det, (a[0] * B[j] - B[i] * c[0]) / det]
      if (feas(x)) verts.push(x)
    }
  let best = null, val = -Infinity
  for (const v of verts) { const z = SC[0] * v[0] + SC[1] * v[1]; if (z > val + 1e-9) { val = z; best = v } }
  // 按极角排序得到多边形
  const cx = verts.reduce((s, v) => s + v[0], 0) / (verts.length || 1)
  const cy = verts.reduce((s, v) => s + v[1], 0) / (verts.length || 1)
  const uniq = verts.filter((v, k) => verts.findIndex((w) => Math.hypot(w[0] - v[0], w[1] - v[1]) < 1e-7) === k)
  uniq.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx))
  return { x: best, z: val, poly: uniq }
}
const RES = ['工厂 1 工时 b₁', '工厂 2 工时 b₂', '工厂 3 工时 b₃']

export function Ch10ShadowPrice() {
  const [b, setB] = useState([4, 12, 18])
  const sol = solveLP(b)
  const h = 1e-4
  const price = b.map((_, i) => (solveLP(b.map((v, j) => (j === i ? v + h : v))).z - sol.z) / h)
  const plus1 = b.map((_, i) => solveLP(b.map((v, j) => (j === i ? v + 1 : v))).z - sol.z)
  const setBi = (i) => (v) => setB(b.map((w, j) => (j === i ? v : w)))
  const z = sol.z
  const x = sol.x || [0, 0]
  const used = [x[0], 2 * x[1], 3 * x[0] + 2 * x[1]]
  return (
    <Widget title="影子价格 Shadow price：多 1 单位资源，利润能多多少？" hint="经典生产问题：两种产品产量 x₁,x₂，利润 3x₁+5x₂；三个工厂的工时分别限制 x₁ ≤ b₁、2x₂ ≤ b₂、3x₁+2x₂ ≤ b₃。写成最小化 −利润 后，每个约束的最优对偶变量 λᵢ* 就是“影子价格”。试试：把 b₃ 从 18 增加 1，利润恰好增加 λ₃* = 1；增加 b₁（没用满的资源）利润不变，λ₁* = 0（互补松弛！）。再把 b₂ 一直调大，看价格什么时候突变。">
      <div style={grid2}>
        <Mafs viewBox={{ x: [-0.5, 8], y: [-0.5, 10] }} height={300} preserveAspectRatio="contain">
          <Coordinates.Cartesian subdivisions={1} />
          {sol.poly.length > 2 && <Polygon points={sol.poly} color={Theme.indigo} fillOpacity={0.15} />}
          <Line.Segment point1={[b[0], -0.5]} point2={[b[0], 10]} color={Theme.blue} style="dashed" />
          <Line.Segment point1={[-0.5, b[1] / 2]} point2={[8, b[1] / 2]} color={Theme.green} style="dashed" />
          <Line.ThroughPoints point1={[0, b[2] / 2]} point2={[b[2] / 3, 0]} color={Theme.orange} style="dashed" />
          {z > 0 && <Line.ThroughPoints point1={[0, z / 5]} point2={[z / 3, 0]} color={Theme.red} />}
          <Point x={x[0]} y={x[1]} color={Theme.red} />
          <Text x={x[0]} y={x[1]} attach="ne" size={12} color={Theme.red}>x* ({f2(x[0])}, {f2(x[1])})</Text>
          <Text x={b[0]} y={9.3} attach="e" size={11} color={Theme.blue}>x₁=b₁</Text>
          <Text x={7.2} y={b[1] / 2} attach="n" size={11} color={Theme.green}>2x₂=b₂</Text>
        </Mafs>
        <div>
          <div style={cap}>每种资源的状态与价格</div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}><th>资源</th><th>已用 / 上限</th><th>λᵢ*（斜率）</th><th>+1 单位实际增益</th></tr></thead>
            <tbody>
              {b.map((bi, i) => {
                const tight = Math.abs(used[i] - bi) < 1e-6
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td>{RES[i]}</td>
                    <td style={{ color: tight ? '#ff3b30' : '#34c759' }}>{f2(used[i])} / {f2(bi)} {tight ? '（用满）' : '（有剩余）'}</td>
                    <td><b>{f2(price[i])}</b></td>
                    <td>{f2(plus1[i])}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="wstat"><span className="chip info">最大利润 = {f2(z)}</span><span className="chip good">有剩余的资源 ⇒ 价格 = 0</span></div>
        </div>
      </div>
      <div className="wrow">
        {b.map((bi, i) => <Slider key={i} label={RES[i]} value={bi} set={setBi(i)} min={i === 2 ? 6 : 1} max={i === 1 ? 20 : i === 2 ? 26 : 8} step={0.5} fmt={(v) => v.toFixed(1)} />)}
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 3. 例 II：盒约束 LP 的“隐式”对偶                                     */
/*    min c^T x  s.t. a^T x = b,  −1 ≤ x ≤ 1，a=(1,2)                   */
/* ------------------------------------------------------------------ */
const AV = [1, 2]
export function Ch10BoxDual() {
  const [th, setTh] = useState(3.6)
  const [b, setB] = useState(0.8)
  const c = [Math.cos(th), Math.sin(th)]
  // 线段 x1 + 2 x2 = b 与盒子的交
  const lo = Math.max(-1, b - 2), hi = Math.min(1, b + 2)
  const P1 = [lo, (b - lo) / 2], P2 = [hi, (b - hi) / 2]
  const v1 = c[0] * P1[0] + c[1] * P1[1], v2 = c[0] * P2[0] + c[1] * P2[1]
  const xs = v1 <= v2 ? P1 : P2
  const pstar = Math.min(v1, v2)
  const g = (nu) => -b * nu - Math.abs(nu * AV[0] + c[0]) - Math.abs(nu * AV[1] + c[1])
  const bps = [-c[0] / AV[0], -c[1] / AV[1]]
  const nus = bps.reduce((best, n) => (g(n) > g(best) ? n : best), bps[0])
  const dstar = g(nus)
  return (
    <Widget title="把盒约束藏进定义域：对偶变成无约束的 max −bν − ‖Aᵀν + c‖₁" hint="左图：原问题。可行集 = 直线 x₁+2x₂=b 落在方盒 [−1,1]² 里的那一段（绿色线段），红箭头是 −c（目标下降方向）。右图：隐式写法得到的对偶函数 g(ν)，它是分段线性的凹函数、没有任何约束。试试转动 c 和移动 b：右图最高点永远等于左图的最优值 p*（强对偶）。">
      <div style={grid2}>
        <div>
          <div style={cap}>原问题（x 空间）</div>
          <Mafs viewBox={{ x: [-2, 2], y: [-1.7, 1.7] }} height={260} preserveAspectRatio="contain">
            <Coordinates.Cartesian subdivisions={2} />
            <Polygon points={[[-1, -1], [1, -1], [1, 1], [-1, 1]]} color={Theme.indigo} fillOpacity={0.1} />
            <Line.ThroughPoints point1={[0, b / 2]} point2={[2, (b - 2) / 2]} color={Theme.green} style="dashed" opacity={0.5} />
            {hi >= lo && <Line.Segment point1={P1} point2={P2} color={Theme.green} weight={4} />}
            <Vector tail={[0, 0]} tip={[-0.8 * c[0], -0.8 * c[1]]} color={Theme.red} />
            <Text x={-0.8 * c[0]} y={-0.8 * c[1]} attach="e" size={12} color={Theme.red}>−c</Text>
            {hi >= lo && <Point x={xs[0]} y={xs[1]} color={Theme.red} />}
            {hi >= lo && <Text x={xs[0]} y={xs[1]} attach="n" size={12} color={Theme.red}>x*</Text>}
          </Mafs>
        </div>
        <div>
          <div style={cap}>对偶函数 g(ν)（无约束）</div>
          <Mafs viewBox={{ x: [-4, 4], y: [-8, 3] }} height={260} preserveAspectRatio="contain">
            <Coordinates.Cartesian subdivisions={1} />
            <Plot.OfX y={g} color={Theme.violet} />
            <Line.Segment point1={[-4, pstar]} point2={[4, pstar]} color={Theme.red} style="dashed" />
            <Point x={nus} y={dstar} color={Theme.violet} />
            <Text x={nus} y={dstar} attach="n" size={12} color={Theme.violet}>ν*</Text>
          </Mafs>
        </div>
      </div>
      <div className="wrow">
        <Slider label={<span>c 的方向角</span>} value={th} set={setTh} min={0} max={6.28} />
        <Slider label={<M>{'b'}</M>} value={b} set={setB} min={-2.8} max={2.8} />
      </div>
      <div className="wstat">
        <span className="chip info">c = ({f2(c[0])}, {f2(c[1])})</span>
        <span className="chip info">x* = ({f2(xs[0])}, {f2(xs[1])})</span>
        <span className="chip info">p* = cᵀx* = {f2(pstar)}</span>
        <span className="chip info">ν* = {f2(nus)}，d* = g(ν*) = {f2(dstar)}</span>
        <span className={`chip ${Math.abs(pstar - dstar) < 1e-6 ? 'good' : 'bad'}`}>p* − d* = {f2(pstar - dstar)}</span>
      </div>
    </Widget>
  )
}

/* ------------------------------------------------------------------ */
/* 4. 部分拉格朗日松弛                                                  */
/*    min (x1−2)²+(x2−2)²  s.t. f1 = x1+x2−2 ≤ 0（松弛）, f2 = x1−0.5 ≤ 0（保留）*/
/* ------------------------------------------------------------------ */
export function Ch10PartialDual() {
  const [lam, setLam] = useState(0.3)
  const [mode, setMode] = useState('partial')
  const xt = mode === 'partial' ? [Math.min(0.5, 2 - lam / 2), 2 - lam / 2] : [2 - lam / 2, 2 - lam / 2]
  const L = (x, l) => (x[0] - 2) ** 2 + (x[1] - 2) ** 2 + l * (x[0] + x[1] - 2)
  const gt = (l) => L([Math.min(0.5, 2 - l / 2), 2 - l / 2], l)
  const g1 = (l) => L([2 - l / 2, 2 - l / 2], l) // 只用 λ1 且 λ2=0 的完整对偶切片（对比）
  const val = mode === 'partial' ? gt(lam) : g1(lam)
  const feas = xt[0] + xt[1] <= 2 + 1e-9 && xt[0] <= 0.5 + 1e-9
  return (
    <Widget title="部分拉格朗日松弛：只把“难”约束放进目标，“好”约束留作定义域" hint="原问题：min (x₁−2)²+(x₂−2)²，约束 x₁+x₂ ≤ 2（被松弛，乘子 λ）与 x₁ ≤ 0.5（保留，阴影区域）。拖动 λ：绿点是在保留约束下最小化 L̃ 得到的 x̃(λ)；右图是部分对偶函数 g̃(λ)，其最大值恰为 p* = 2.5（λ'=1）。切到“完全不保留”对比：若把 x₁ ≤ 0.5 也扔掉、又不给它乘子，得到的只是另一个问题的对偶，最大值 2 < p*。">
      <Tabs tabs={[{ value: 'partial', label: '部分松弛：保留 x₁ ≤ 0.5' }, { value: 'drop', label: '对比：直接丢掉 x₁ ≤ 0.5' }]} value={mode} set={setMode} />
      <div style={grid2}>
        <Mafs viewBox={{ x: [-1, 3], y: [-0.5, 3] }} height={260} preserveAspectRatio="contain">
          <Coordinates.Cartesian subdivisions={2} />
          {mode === 'partial' && <Polygon points={[[-1, -0.5], [0.5, -0.5], [0.5, 3], [-1, 3]]} color={Theme.blue} fillOpacity={0.12} weight={1} />}
          <Line.ThroughPoints point1={[0, 2]} point2={[2, 0]} color={Theme.orange} style="dashed" />
          <Text x={2.3} y={-0.2} size={11} color={Theme.orange}>x₁+x₂=2（松弛）</Text>
          <Point x={2} y={2} color={Theme.indigo} />
          <Text x={2} y={2} attach="ne" size={11} color={Theme.indigo}>(2,2)</Text>
          <Point x={0.5} y={1.5} color={Theme.red} />
          <Text x={0.5} y={1.5} attach="w" size={11} color={Theme.red}>x*</Text>
          <Point x={xt[0]} y={xt[1]} color={Theme.green} />
          <Text x={xt[0]} y={xt[1]} attach="se" size={11} color={Theme.green}>x̃(λ)</Text>
        </Mafs>
        <Mafs viewBox={{ x: [-0.3, 6], y: [-1, 4] }} height={260} preserveAspectRatio="contain">
          <Coordinates.Cartesian subdivisions={1} />
          <Plot.OfX y={gt} domain={[0, 6]} color={Theme.violet} opacity={mode === 'partial' ? 1 : 0.3} />
          <Plot.OfX y={g1} domain={[0, 6]} color={Theme.pink} opacity={mode === 'drop' ? 1 : 0.3} />
          <Line.Segment point1={[-0.3, 2.5]} point2={[6, 2.5]} color={Theme.red} style="dashed" />
          <Text x={5} y={2.5} attach="n" size={11} color={Theme.red}>p* = 2.5</Text>
          <Point x={lam} y={val} color={mode === 'partial' ? Theme.violet : Theme.pink} />
        </Mafs>
      </div>
      <div className="wrow">
        <Slider label={<M>{'\\lambda'}</M>} value={lam} set={setLam} min={0} max={6} step={0.05} />
      </div>
      <div className="wstat">
        <span className="chip info">x̃(λ) = ({f2(xt[0])}, {f2(xt[1])})</span>
        <span className={`chip ${feas ? 'good' : 'bad'}`}>{feas ? '原问题可行' : '原问题不可行'}</span>
        <span className="chip info">{mode === 'partial' ? 'g̃(λ)' : 'g(λ, 0)'} = {f2(val)} ≤ p* = 2.5</span>
        {mode === 'partial' && <span className={`chip ${Math.abs(lam - 1) < 0.03 ? 'good' : 'info'}`}>{Math.abs(lam - 1) < 0.03 ? 'λ′ = 1：g̃ 取到最大值 2.5 = p*，x̃ = x*' : 'g̃ 最大值在 λ′ = 1'}</span>}
        <span className="chip info">完整对偶最优：λ₁* = 1，λ₂* = 2，d* = 2.5</span>
      </div>
    </Widget>
  )
}
