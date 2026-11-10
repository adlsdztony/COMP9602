import { Coordinates as MafsCoordinates, useTransformContext } from 'mafs'

function readableAxis(axis, scale) {
  if (axis === false || axis?.lines === false) return axis
  const step = axis?.lines || 1
  const ratio = 44 / (Math.abs(scale) * step)
  if (!Number.isFinite(ratio) || ratio <= 1) return axis
  const magnitude = 10 ** Math.floor(Math.log10(ratio))
  const multiple = [1, 2, 5, 10].find((n) => n * magnitude >= ratio) * magnitude
  return { ...axis, lines: step * multiple }
}

function Cartesian({ xAxis, yAxis, ...props }) {
  const { viewTransform } = useTransformContext()
  return <MafsCoordinates.Cartesian {...props}
    xAxis={readableAxis(xAxis, viewTransform[0])}
    yAxis={readableAxis(yAxis, viewTransform[4])}
  />
}

// Equal world units can expose a larger range in narrow panels. Space tick
// labels by pixels so those extra coordinates remain readable after resizing.
export const Coordinates = { ...MafsCoordinates, Cartesian }
