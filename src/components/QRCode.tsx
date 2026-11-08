import { useEffect, useRef } from 'preact/hooks'
import QRCodeLib from 'qrcode'

interface QRCodeProps {
  value: string
  size?: number
}

export default function QRCode({ value, size = 160 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !value) return
    let cancelled = false
    QRCodeLib.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      color: { dark: '#0f0f1a', light: '#ffffff' },
    })
      .then(() => {
        if (cancelled) return
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [value, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      class="qr-canvas"
      aria-label="QR code"
    />
  )
}