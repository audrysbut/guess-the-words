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

export function isShareSupported(): boolean {
  return typeof navigator.share === 'function' && /Mobi|Android/i.test(navigator.userAgent)
}

export async function shareInviteLink(url: string, text: string): Promise<void> {
  if (!navigator.share) return
  try {
    await navigator.share({ title: 'Atspėk Žodžius', text, url })
  } catch {
    // user cancelled
  }
}
