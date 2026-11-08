export async function copyInviteLink(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }
}

export function isMobile(): boolean {
  return /Mobi|Android/i.test(navigator.userAgent)
}

export function isShareSupported(): boolean {
  return typeof navigator.share === 'function' && isMobile()
}

export function isDesktop(): boolean {
  return !isMobile()
}

export async function shareInviteLink(url: string, text: string): Promise<void> {
  if (!navigator.share) return
  try {
    await navigator.share({ title: 'Atspėk Žodžius', text, url })
  } catch {
    // user cancelled
  }
}

export async function generateQRDataURL(url: string): Promise<string> {
  const QRCodeLib = await import('qrcode')
  return QRCodeLib.toDataURL(url, {
    width: 320,
    margin: 2,
    color: { dark: '#0f0f1a', light: '#ffffff' },
  })
}

export async function shareQRCode(url: string, text: string): Promise<void> {
  if (typeof navigator.share !== 'function') {
    await copyInviteLink(url)
    return
  }
  try {
    const dataUrl = await generateQRDataURL(url)
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], 'game-invite-qr.png', { type: 'image/png' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title: 'Atspėk Žodžius', text, files: [file] })
      return
    }
    // Fallback: share the link instead
    await navigator.share({ title: 'Atspėk Žodžius', text, url })
  } catch {
    // user cancelled or unsupported — copy link
    try {
      await copyInviteLink(url)
    } catch {
      // ignore
    }
  }
}

export function isDesktopShareSupported(): boolean {
  return isDesktop() && typeof navigator.share === 'function'
}