// Shared crypto utilities (browser-friendly)
export function timeStep(now = Date.now()) {
  return Math.floor(now / 15000).toString()
}

export async function generateHmac(secret: string, data: string) {
  // browser Web Crypto
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export async function verifyQR(qr: string, secret: string) {
  const parts = qr.split('|')
  if (parts.length === 3) {
    const [roll, ts, hash] = parts
    const expected = await generateHmac(secret, roll + ts)
    return expected === hash
  } else if (parts.length === 4) {
    const [roll, name, ts, hash] = parts
    const expected = await generateHmac(secret, roll + name + ts)
    return expected === hash
  }
  return false
}
