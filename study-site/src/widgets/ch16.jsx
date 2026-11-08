import { useState } from 'react'
import { Mafs, Coordinates, Plot, Point, Line, Polygon, Circle, Text, Theme, useMovablePoint } from 'mafs'
import { Widget, Slider, M } from '../components/index.jsx'

/* ---------- A1 Q1(b): 集合 {(x,y) ≥ 0 : y ≥ sqrt(x/2)} 是否凸？ ---------- */
const inSb = (x, y) => x >= -1e-9 && y >= -1e-9 && y >= Math.sqrt(Math.max(x, 0) / 2) - 1e-9

export function Ch16SetCheck() {
  const a = useMovablePoint([0, 0], { color: Theme.blue })
  const b = useMovablePoint([2, 1], { color: Theme.red })
  const [t, setT] = useState(0.5)
  const p = [t * a.x + (1 - t) * b.x, t * a.y + (1 - t) * b.y]
  const region = [[0, 0]]
  for (let i = 1; i <= 60; i++) { const x = (4.5 * i) / 60; region.push([x, Math.sqrt(x / 2)]) }
  region.push([4.5, 2.6], [0, 2.6])
  const ia = inSb(a.x, a.y), ib = inSb(b.x, b.y), ip = inSb(p[0], p[1])
  return (
    <Widget title="A1 Q1(b)：找反例" hint="绿色区域是 S_b。拖动两个端点（都放在区域里），滑动 θ：只要有一个凸组合点掉出区域，集合就不是凸的。试试默认的 (0,0) 和 (2,1)、θ = 0.5。">
      <Mafs viewBox={{ x: [-0.5, 4.5], y: [-0.4, 2.5] }} height={300} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Polygon points={region} color={Theme.green} fillOpacity={0.18} strokeOpacity={0.3} />
        <Plot.OfX y={(x) => (x >= 0 ? Math.sqrt(x / 2) : NaN)} color={Theme.green} />
        <Line.Segment point1={a.point} point2={b.point} color={Theme.indigo} />
        <Point x={p[0]} y={p[1]} color={ip ? Theme.green : Theme.red} />
        <Text x={3.4} y={0.75} attach="s" size={13}>y = √(x/2)</Text>
        {a.element}
        {b.element}
      </Mafs>
      <div className="wrow"><Slider label={<M>{'\\theta'}</M>} value={t} set={setT} min={0} max={1} /></div>
      <div className="wstat">
        <span className={`chip ${ia ? 'good' : 'bad'}`}>黑点 {ia ? '∈' : '∉'} S_b</span>
        <span className={`chip ${ib ? 'good' : 'bad'}`}>红点 {ib ? '∈' : '∉'} S_b</span>
        <span className={`chip ${ip ? 'good' : 'bad'}`}>组合点 ({p[0].toFixed(2)}, {p[1].toFixed(2)}) {ip ? '∈' : '∉'} S_b</span>
        {ia && ib && !ip && <span className="chip bad">找到反例 → 非凸</span>}
      </div>
    </Widget>
  )
}

/* ---------- A2 Q3(c): 一个线性约束的 QP，拖 λ 看 KKT ---------- */
export function Ch16QPDual() {
  const [lam, setLam] = useState(0)
  const x = [2 - lam, 1 - lam] // x(λ) = -(q + λ a)
  const f0 = 0.5 * (x[0] ** 2 + x[1] ** 2) - 2 * x[0] - x[1]
  const g = -2.5 + 2 * lam - lam * lam
  const viol = x[0] + x[1] - 1 // a^T x - b
  const r = Math.hypot(x[0] - 2, x[1] - 1)
  const ok = Math.abs(lam - 1) < 0.02
  return (
    <Widget title="A2 Q3(c)：拖动 λ，观察 x(λ) 与 g(λ)" hint="x(λ) 是 Lagrangian 的最小点。λ = 0 时就是无约束最优点 (2,1)，违反约束；增大 λ 把它“推”向半平面。试试把 λ 调到 1：x(λ) 正好落在直线上，g(λ) 同时达到最大，等于原问题最优值 −3/2。">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        <Mafs viewBox={{ x: [-1, 3], y: [-1.5, 2] }} height={280} preserveAspectRatio={false}>
          <Coordinates.Cartesian subdivisions={2} />
          <Polygon points={[[-3, 4], [-3, -3], [4, -3]]} color={Theme.blue} fillOpacity={0.1} strokeOpacity={0} />
          <Line.ThroughPoints point1={[0, 1]} point2={[1, 0]} color={Theme.blue} />
          {r > 0.01 && <Circle center={[2, 1]} radius={r} color={Theme.orange} fillOpacity={0} />}
          <Point x={2} y={1} color={Theme.orange} />
          <Text x={2} y={1} attach="ne" size={12}>无约束最优</Text>
          <Point x={x[0]} y={x[1]} color={viol <= 1e-9 ? Theme.green : Theme.red} />
          <Text x={x[0]} y={x[1]} attach="sw" size={12}>x(λ)</Text>
          <Text x={-0.6} y={-1.2} attach="ne" size={12}>x₁+x₂ ≤ 1</Text>
        </Mafs>
        <Mafs viewBox={{ x: [-0.2, 2.5], y: [-4.5, -1] }} height={280} preserveAspectRatio={false}>
          <Coordinates.Cartesian subdivisions={2} />
          <Plot.OfX y={(l) => -2.5 + 2 * l - l * l} color={Theme.violet} />
          <Line.ThroughPoints point1={[0, -1.5]} point2={[1, -1.5]} color={Theme.green} style="dashed" />
          <Point x={lam} y={g} color={Theme.violet} />
          <Text x={1.2} y={-1.5} attach="n" size={12}>p* = −3/2</Text>
          <Text x={lam} y={g} attach="s" size={12}>g(λ)</Text>
        </Mafs>
      </div>
      <div className="wrow"><Slider label={<M>{'\\lambda'}</M>} value={lam} set={setLam} min={0} max={2.5} /></div>
      <div className="wstat">
        <span className="chip info">x(λ) = ({x[0].toFixed(2)}, {x[1].toFixed(2)})</span>
        <span className={`chip ${viol <= 1e-9 ? 'good' : 'bad'}`}>aᵀx − b = {viol.toFixed(2)} {viol <= 1e-9 ? '(可行)' : '(不可行)'}</span>
        <span className="chip info">λ(aᵀx − b) = {(lam * viol).toFixed(2)}</span>
        <span className="chip info">g(λ) = {g.toFixed(3)} ≤ p* = −1.5</span>
        <span className="chip info">f₀(x(λ)) = {f0.toFixed(3)}</span>
        {ok && <span className="chip good">KKT 全部满足：λ* = 1, x* = (1, 0)</span>}
      </div>
    </Widget>
  )
}
