import { describe, it, expect } from 'vitest'
import { generateQR, verifyQR, timeStep } from '../src/crypto'

describe('QR crypto (fixed)', () => {
  it('generates and verifies QR with async', async () => {
    const secret = 'mysecret'
    const roll = 'S123'
    const ts = timeStep()
    const qr = await generateQR(roll, secret, ts)
    expect(await verifyQR(qr, secret)).toBe(true)
  })
})
