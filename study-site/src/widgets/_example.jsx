// 参考示例：所有交互组件都按这个模式写。
import { useState } from 'react'
import { Mafs, Coordinates, Plot, Point, Line, Polygon, Text, Theme, useMovablePoint } from 'mafs'
import { Widget, Slider, M } from '../components/index.jsx'

// 凸组合：拖动 x1, x2，滑动 θ，观察 θx1+(1-θ)x2 在线段上移动
export function ExampleConvexCombo() {
  const a = useMovablePoint([-2, -1], { color: Theme.blue })
  const b = useMovablePoint([2, 1.5], { color: Theme.red })
  const [t, setT] = useState(0.3)
  const p = [t * a.x + (1 - t) * b.x, t * a.y + (1 - t) * b.y]
  return (
    <Widget title="凸组合 Convex combination" hint="拖动两个端点，滑动 θ —— 绿色点永远落在线段上。">
      <Mafs viewBox={{ x: [-4, 4], y: [-2.5, 2.5] }} height={300} preserveAspectRatio={false}>
        <Coordinates.Cartesian subdivisions={2} />
        <Line.Segment point1={a.point} point2={b.point} color={Theme.indigo} />
        <Plot.OfX y={(x) => 0.15 * x * x - 2} color={Theme.orange} />
        <Polygon points={[[-3, 2], [-2, 2.3], [-2.5, 1.5]]} color={Theme.violet} />
        <Point x={p[0]} y={p[1]} color={Theme.green} />
        <Text x={p[0]} y={p[1]} attach="n" size={14}>θx₁+(1−θ)x₂</Text>
        {a.element}
        {b.element}
      </Mafs>
      <div className="wrow">
        <Slider label={<M>{'\\theta'}</M>} value={t} set={setT} min={0} max={1} />
      </div>
      <div className="wstat"><span className="chip info">θ = {t.toFixed(2)}</span><span className="chip good">点 = ({p[0].toFixed(2)}, {p[1].toFixed(2)})</span></div>
    </Widget>
  )
}
