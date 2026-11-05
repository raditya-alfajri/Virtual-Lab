// Teks layar digital, mengikuti layer `reading` di digital-balance.svg dan
// stopwatch.svg: huruf mono, hijau layar, rata kanan.
export const SCREEN_TEXT = '#7FE3C5'
export const SCREEN_FONT = 'JetBrains Mono, Courier New, monospace'

type Props = { text: string; width: number; height: number }

// Mengisi kotak layar (ukuran dalam koordinat panggung) yang sudah tergambar.
export default function Readout({ text, width, height }: Props) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      className="block"
    >
      <text
        x={width - 10}
        y={height / 2}
        fill={SCREEN_TEXT}
        fontFamily={SCREEN_FONT}
        fontSize={Math.round(height * 0.55)}
        fontWeight={600}
        textAnchor="end"
        dominantBaseline="central"
      >
        {text}
      </text>
    </svg>
  )
}
