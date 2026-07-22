import { describe, it, expect } from 'vitest'
import { generateQR, verifyQR, timeStep } from '../src/crypto'

describe('QR crypto', () => {
  it('generates and verifies QR', () => {
    const secret = 'mysecret'
    const roll = 'S123'
    const ts = timeStep()
    const qr = generateQR(roll, secret, ts)
    expect(verifyQR(qr, secret)).toBe(true)
  })
})
