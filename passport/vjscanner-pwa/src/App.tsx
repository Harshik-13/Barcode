import { useEffect, useState, useCallback, useRef } from 'react'
import { verifyQR } from './shared/crypto'
import CameraScanner from './components/CameraScanner'
import GoogleLogin from './components/GoogleLogin'
import InstallPrompt from './components/InstallPrompt'
import ReportsView from './components/ReportsView'
import { storeScanLog, getUnsyncedLogs, storeKeys, getUnsyncedValidLogs, markLogsSyncedByIds } from './idb'
import { loadHostelData, isAuthorizedForHostel, getHostelStats } from './hostelData'

export default function App(){
  const [loggedIn, setLoggedIn] = useState(false)
  const [token, setToken] = useState('')
  const [qr, setQr] = useState('')
  const [status, setStatus] = useState<'idle'|'valid'|'expired'|'invalid'|'not-authorized'|'next'|'duplicate'|'already-used'>('idle')
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState('')
  const authDisabled = import.meta.env.VITE_DISABLE_AUTH === 'true'
  const [hostelDataLoaded, setHostelDataLoaded] = useState(false)
  const [availableHostels, setAvailableHostels] = useState<Array<{hostelId: string, count: number}>>([])
  const [selectedHostel, setSelectedHostel] = useState<string>(
    localStorage.getItem('selected_hostel') || import.meta.env.VITE_HOSTEL_ID || 'BH1'
  )
  const [verifyKind, setVerifyKind] = useState<'hostel'>('hostel')
  const [verifyValue, setVerifyValue] = useState<string>(
    localStorage.getItem('verify_value') || ''
  )
  const membershipCache = (window as any)._membershipCache || ((window as any)._membershipCache = new Map<string, Set<string>>())
  
  // New UI states
  const [menuOpen, setMenuOpen] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<string>('')
  const [todayStats, setTodayStats] = useState({ total: 0, valid: 0, invalid: 0, notAuth: 0 })
  const [lastScanRoll, setLastScanRoll] = useState('')
  const [lastScanName, setLastScanName] = useState('')
  const [lastScanType, setLastScanType] = useState<'qr'|'barcode'>('qr')
  const [userEmail, setUserEmail] = useState('')
  const [enableFloatAnimation, setEnableFloatAnimation] = useState<boolean>(
    // Prefer env default if provided, else fallback to localStorage (default true)
    (import.meta.env.VITE_ENABLE_FLOAT_ANIMATION ?? '') !== 'false' &&
    localStorage.getItem('enable_float_animation') !== 'false'
  )
  const [enableSounds, setEnableSounds] = useState<boolean>(
    localStorage.getItem('enable_sounds') !== 'false' // default true
  )
  const [isScanning, setIsScanning] = useState(false) // Cooldown state
  const [showHistory, setShowHistory] = useState(false) // History modal state
  const [historyLogs, setHistoryLogs] = useState<Array<any>>([]) // Scan history
  const [showReports, setShowReports] = useState(false) // Reports view state
  // Meal/Food type selection
  type FoodType = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner'
  // Meal time configuration (read from env with sensible defaults)
  // Env vars (HH:mm format) - example: VITE_BREAKFAST_START=07:30
  const env = import.meta.env
  const parseTimeToMinutes = (s: string | undefined, fallback: string) => {
    const str = (s || fallback).trim()
    const parts = str.split(':').map(p => parseInt(p, 10))
    const hh = Number.isFinite(parts[0]) ? parts[0] : 0
    const mm = parts.length > 1 && Number.isFinite(parts[1]) ? parts[1] : 0
    return Math.max(0, Math.min(23, hh)) * 60 + Math.max(0, Math.min(59, mm))
  }

  const DEFAULTS = {
    BREAKFAST_START: '07:30', BREAKFAST_END: '09:30',
    LUNCH_START: '12:00', LUNCH_END: '14:00',
    SNACKS_START: '16:00', SNACKS_END: '18:00',
    DINNER_START: '19:30', DINNER_END: '21:30',
    GRACE_MINUTES: '30'
  }

  const computeFoodType = (d = new Date()): FoodType => {
    const minutes = d.getHours() * 60 + d.getMinutes()
    const grace = parseInt(env.VITE_MEAL_GRACE_MINUTES || DEFAULTS.GRACE_MINUTES, 10) || 0

    const bStart = parseTimeToMinutes(env.VITE_BREAKFAST_START, DEFAULTS.BREAKFAST_START) - grace
    const bEnd = parseTimeToMinutes(env.VITE_BREAKFAST_END, DEFAULTS.BREAKFAST_END) + grace

    const lStart = parseTimeToMinutes(env.VITE_LUNCH_START, DEFAULTS.LUNCH_START) - grace
    const lEnd = parseTimeToMinutes(env.VITE_LUNCH_END, DEFAULTS.LUNCH_END) + grace

    const sStart = parseTimeToMinutes(env.VITE_SNACKS_START, DEFAULTS.SNACKS_START) - grace
    const sEnd = parseTimeToMinutes(env.VITE_SNACKS_END, DEFAULTS.SNACKS_END) + grace

    const dStart = parseTimeToMinutes(env.VITE_DINNER_START, DEFAULTS.DINNER_START) - grace
    const dEnd = parseTimeToMinutes(env.VITE_DINNER_END, DEFAULTS.DINNER_END) + grace

    const inRange = (start: number, end: number) => {
      // clamp within 0..(24*60-1)
      const s = Math.max(0, start)
      const e = Math.min(24 * 60 - 1, end)
      return minutes >= s && minutes <= e
    }

    if (inRange(bStart, bEnd)) return 'Breakfast'
    if (inRange(lStart, lEnd)) return 'Lunch'
    if (inRange(sStart, sEnd)) return 'Snacks'
    if (inRange(dStart, dEnd)) return 'Dinner'
    // Fallback: pick nearest by minutes (simple fallback to Dinner or Breakfast)
    if (minutes < 12 * 60) return 'Breakfast'
    return 'Dinner'
  }
  const [autoFood, setAutoFood] = useState<boolean>(localStorage.getItem('auto_food') !== 'false')
  const [foodType, setFoodType] = useState<FoodType>((localStorage.getItem('food_type') as FoodType) || computeFoodType())
  // Reports state
  const [reportDay, setReportDay] = useState<string>('') // YYYY-MM-DD
  const [reportBatch, setReportBatch] = useState<string>('') // e.g., 2023 or 2023,2024
  const [reportFood, setReportFood] = useState<'' | FoodType>('')
  const [reportRows, setReportRows] = useState<any[]>([])

  // Load hostel data on startup
  useEffect(() => {
    try {
      loadHostelData()
      const stats = getHostelStats()
      console.log('📋 Hostel data loaded:', stats)
      setAvailableHostels(stats)
      setHostelDataLoaded(true)
    } catch (err) {
      console.error('❌ Failed to load hostel data:', err)
      setError('Failed to load hostel data')
    }
  }, [])

  // Save selected hostel to localStorage
  useEffect(() => {
    localStorage.setItem('selected_hostel', selectedHostel)
  }, [selectedHostel])

  // Persist verify context
  useEffect(() => {
    localStorage.setItem('verify_kind', verifyKind)
    localStorage.setItem('verify_value', verifyValue)
  }, [verifyKind, verifyValue])

  // Persist float animation preference
  useEffect(() => {
    localStorage.setItem('enable_float_animation', String(enableFloatAnimation))
  }, [enableFloatAnimation])

  // Persist sound preference
  useEffect(() => {
    localStorage.setItem('enable_sounds', String(enableSounds))
  }, [enableSounds])

  // Persistent AudioContext to avoid browser limitations
  const audioContextRef = useRef<AudioContext | null>(null)
  // Track last processed code to suppress repeated holds and show NEXT... after 3s
  const lastProcessedCodeRef = useRef<string | null>(null)
  const sameQrHoldStartRef = useRef<number | null>(null)
  // Track last VALID scan per roll+foodType+day to detect duplicates/already-used
  // Key format: "ROLL|FOODTYPE|YYYY-MM-DD" -> timestamp
  const lastValidByRollFoodDayRef = useRef<Map<string, number>>(new Map())
  
  // Helper to generate unique key for duplicate detection
  const getDuplicateKey = (roll: string, food: FoodType, ts: number) => {
    const date = new Date(ts).toISOString().split('T')[0] // YYYY-MM-DD
    return `${roll.toUpperCase()}|${food.toUpperCase()}|${date}`
  }
  
  // Initialize AudioContext once
  useEffect(() => {
    if (enableSounds && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [enableSounds])

  // Auto-select food type based on time of day
  useEffect(() => {
    if (!autoFood) return
    const apply = () => setFoodType(computeFoodType())
    apply()
    const t = setInterval(apply, 60 * 1000)
    return () => clearInterval(t)
  }, [autoFood])

  // Persist meal preferences
  useEffect(() => {
    localStorage.setItem('auto_food', String(autoFood))
  }, [autoFood])
  useEffect(() => {
    localStorage.setItem('food_type', foodType)
  }, [foodType])

  // Online listener to try real-time uploads
  useEffect(() => {
    const onOnline = () => {
      console.log('🔄 Network online: attempting to upload pending scans')
      uploadPendingScans().catch(() => {})
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  // Periodic sync every 1 second if there are pending VALID logs
  const isSyncingRef = useRef(false)
  useEffect(() => {
    const t = setInterval(async () => {
      if (!navigator.onLine) return
      if (isSyncingRef.current) return
      try {
        const pending = await getUnsyncedValidLogs()
        if (pending.length) await uploadPendingScans()
      } catch {}
    }, 1000)
    return () => clearInterval(t)
  }, [])

  async function uploadPendingScans() {
    try {
      if (isSyncingRef.current) return { uploaded: 0 }
      isSyncingRef.current = true
      // Only VALID unsynced logs are considered delta since last success
      const pendingPairs = await getUnsyncedValidLogs()
      if (!pendingPairs.length) return { uploaded: 0 }
      const pending = pendingPairs.map(p => p.log)
      const ids = pendingPairs.map(p => p.id)
      const body = { logs: pending }
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/scans/upload`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
      })
      if (res.ok) {
        await markLogsSyncedByIds(ids)
        const j = await res.json()
        console.log(`✅ Uploaded ${j.count} scans`)
        return { uploaded: j.count }
      }
      console.warn('Upload pending scans failed with HTTP', res.status)
      return { uploaded: 0 }
    } catch (e) {
      console.warn('Upload pending scans error', e)
      return { uploaded: 0 }
    } finally {
      isSyncingRef.current = false
    }
  }

  function appendFood(meta: any): any {
    return { ...(meta || {}), foodType }
  }

  async function maybeUploadPending() {
    if (navigator.onLine) {
      await uploadPendingScans()
    }
  }

  // Sound effects using Web Audio API with persistent context
  const playSound = useCallback(async (type: 'valid' | 'invalid' | 'expired' | 'not-authorized') => {
    if (!enableSounds || !audioContextRef.current) return
    
    try {
      const audioContext = audioContextRef.current
      
      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Different sounds for different statuses
      if (type === 'valid') {
        // Success sound: Two-tone rising (like Google Pay)
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } else if (type === 'invalid') {
      // Error sound: Low buzzer
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } else if (type === 'expired') {
      // Warning sound: Mid-tone beep
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.25)
    } else {
      // Not authorized: Two short beeps
      oscillator.frequency.setValueAtTime(330, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(330, audioContext.currentTime + 0.15)
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.15)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    }
    } catch (error) {
      console.error('Sound playback error:', error)
    }
  }, [enableSounds])

  // Check if already logged in
  useEffect(() => {
    if (authDisabled) {
      setLoggedIn(true)
      setUserEmail('dev@vnrvjiet.in')
      return
    }
    const stored = localStorage.getItem('scanner_token')
    const storedEmail = localStorage.getItem('scanner_email')
    if (stored) {
      setToken(stored)
      setLoggedIn(true)
      if (storedEmail) setUserEmail(storedEmail)
    }
  }, [authDisabled])

  // Get hostel icon based on hostel ID
  const getHostelIcon = (hostelId: string): string => {
    if (hostelId.startsWith('GH')) return '👧' // Girls hostel
    if (hostelId.startsWith('BH')) return '👦' // Boys hostel
    return '🏢' // Default
  }

  // Get hostel display name
  const getHostelDisplayName = (hostelId: string): string => {
    if (hostelId === 'BH1') return 'Boys Main'
    if (hostelId === 'GH1') return 'Girls Main'
    return hostelId
  }


  useEffect(() => {
    // Register service worker with background sync capability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/src/sw.ts').catch(() => {})
    }
  }, [])

  async function ensureMembership(kind: string, value: string): Promise<Set<string>> {
    const key = `${kind}:${value}`
    const cached = membershipCache.get(key)
    if (cached) return cached
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sync/memberships?kind=${encodeURIComponent(kind)}&value=${encodeURIComponent(value)}`)
      if (res.ok) {
        const j = await res.json()
        const set = new Set<string>(j.rolls || [])
        membershipCache.set(key, set)
        return set
      }
    } catch {}
    return new Set()
  }

  const updateTodayStats = useCallback((scanStatus: string) => {
    setTodayStats(prev => ({
      total: prev.total + 1,
      valid: prev.valid + (scanStatus === 'valid' ? 1 : 0),
      invalid: prev.invalid + (scanStatus === 'invalid' || scanStatus === 'expired' ? 1 : 0),
      notAuth: prev.notAuth + (scanStatus === 'not-authorized' ? 1 : 0)
    }))
  }, [])

  const handleScan = useCallback(async (text: string) => {
    // Cooldown check - prevent rapid scans
    if (isScanning) {
      console.log('⏸️ Scan cooldown active, ignoring scan')
      return
    }

    // Same-QR suppression: if the exact same code keeps coming, ignore it
    // Show "NEXT..." only if held continuously for >= 3 seconds
    const nowMs = Date.now()
    if (lastProcessedCodeRef.current && text === lastProcessedCodeRef.current) {
      if (!sameQrHoldStartRef.current) sameQrHoldStartRef.current = nowMs
      const heldFor = nowMs - sameQrHoldStartRef.current
      if (heldFor >= 3000) {
        if (status !== 'next') {
          setStatus('next')
          setMessage('NEXT... (scan a different QR)')
        }
      }
      return
    } else {
      // New QR detected, clear NEXT state and reset timer
      sameQrHoldStartRef.current = null
      if (status === 'next') {
        setStatus('idle')
        setMessage('')
      }
    }

    // Record this code as the current processed one so repeated frames are suppressed
    lastProcessedCodeRef.current = text
    
    setQr(text)
    
    // Update scan time
  const now = new Date()
  setLastScanTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    
    // Detect if this is a barcode (simple roll number) or QR code (with pipes)
    const isBarcode = !text.includes('|')
    let roll: string
    let rollForDisplay: string
    let name = ''
    
  if (isBarcode) {
      // Barcode: just the roll number - normalize for display and lookup
      roll = text.trim()
      rollForDisplay = roll.toUpperCase()
      
      // Validate college roll number format (should start with letter(s) and contain numbers)
      // Example formats: 22A91A0501, A1234, etc.
      const isValidFormat = /^[A-Z0-9]{6,15}$/i.test(rollForDisplay)
      if (!isValidFormat) {
        console.log('❌ Invalid roll number format:', rollForDisplay)
        setStatus('invalid')
        setMessage(`Invalid roll number format: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`)
        updateTodayStats('invalid')
        if (enableSounds) playSound('invalid')
        return
      }
      
      setLastScanType('barcode')
      console.log('📊 Barcode scanned:', rollForDisplay)
    } else {
      // QR code: extract roll from first part - keep original for HMAC verification
      const parts = text.split('|')
      roll = parts[0].trim() // Keep original case for HMAC verification
      rollForDisplay = roll.toUpperCase() // Normalize for display
      // Extract name if it's QR v2 (has name in second position and it's not a timestamp)
      if (parts.length >= 2 && parts[1] && !parts[1].match(/^\d+$/)) {
        name = parts[1]
      }
      setLastScanType('qr')
      console.log('📱 QR code scanned:', rollForDisplay)
    }
    
    setLastScanRoll(rollForDisplay)
    setLastScanName(name)
    
    // Authorization check - always use hostel roster
    if (!isAuthorizedForHostel(rollForDisplay, selectedHostel)) {
      setStatus('not-authorized')
      setMessage('Not in hostel roster')
      playSound('not-authorized')
      updateTodayStats('not-authorized')
      await storeScanLog({
        roll: rollForDisplay,
        mode: 'Hostel In',
        hostel_id: selectedHostel,
        timestamp: Date.now(),
        status: 'not-authorized',
        metadata: appendFood({ online: false, reason: 'Not in hostel roster', scanType: isBarcode ? 'barcode' : 'qr' })
      })
      await maybeUploadPending()
      return
    }
    
    // For barcodes, skip HMAC verification and just validate membership
    if (isBarcode) {
      // Duplicate / Already-used detection (based on last valid time for this roll+food+day)
      const nowTs = Date.now()
      const dupKey = getDuplicateKey(rollForDisplay, foodType, nowTs)
      const lastValidTs = lastValidByRollFoodDayRef.current.get(dupKey)
      
      if (lastValidTs) {
        const diff = nowTs - lastValidTs
        if (diff < 10000) {
          setStatus('duplicate')
          const firstName = name ? name.split(' ')[0] : ''
          setMessage(`DUPLICATE within 10s • ${firstName ? firstName + ' ' : ''}(${rollForDisplay})`)
          updateTodayStats('invalid')
          if (enableSounds) playSound('expired')
          await storeScanLog({
            roll: rollForDisplay,
            mode: 'Hostel In',
            hostel_id: selectedHostel,
            timestamp: nowTs,
            status: 'duplicate',
            metadata: appendFood({ online: false, verify: 'hostel', value: selectedHostel, scanType: 'barcode' })
          })
          await maybeUploadPending()
          lastProcessedCodeRef.current = text
          return
        } else {
          setStatus('already-used')
          const firstName = name ? name.split(' ')[0] : ''
          const secondsAgo = Math.floor(diff/1000)
          setMessage(`ALREADY USED ${secondsAgo}s ago • ${firstName ? firstName + ' ' : ''}(${rollForDisplay})`)
          updateTodayStats('invalid')
          if (enableSounds) playSound('invalid')
          await storeScanLog({
            roll: rollForDisplay,
            mode: 'Hostel In',
            hostel_id: selectedHostel,
            timestamp: nowTs,
            status: 'already-used',
            metadata: appendFood({ online: false, verify: 'hostel', value: selectedHostel, scanType: 'barcode' })
          })
          await maybeUploadPending()
          lastProcessedCodeRef.current = text
          return
        }
      }

      // First valid for this roll+food+day in this session
      setStatus('valid')
      const firstName = name ? name.split(' ')[0] : ''
      setMessage(`Entry authorized • ${firstName ? firstName + ' ' : ''}(${rollForDisplay})`)
      updateTodayStats('valid')
      if (enableSounds) playSound('valid')
      setIsScanning(true)
      setTimeout(() => setIsScanning(false), 500)
      lastValidByRollFoodDayRef.current.set(dupKey, nowTs)
      await storeScanLog({
        roll: rollForDisplay,
        mode: 'Hostel In',
        hostel_id: selectedHostel,
        timestamp: nowTs,
        status: 'valid',
        metadata: appendFood({ online: false, verify: 'hostel', value: selectedHostel, scanType: 'barcode' })
      })
      await maybeUploadPending()
      lastProcessedCodeRef.current = text
      return
    }
    
    // For QR codes, do HMAC verification
    // Check for demo secret first (for dev/testing)
    const localSecret = localStorage.getItem('demo_secret_' + rollForDisplay)
    if (localSecret) {
      console.log('🔧 Dev Mode: Using demo secret for roll:', rollForDisplay)
      const isValid = await verifyQR(text, localSecret)
      if (isValid) {
        // Duplicate / Already-used detection (per roll+food+day)
        const nowTs = Date.now()
        const dupKey = getDuplicateKey(rollForDisplay, foodType, nowTs)
        const lastValidTs = lastValidByRollFoodDayRef.current.get(dupKey)
        
        if (lastValidTs) {
          const diff = nowTs - lastValidTs
          if (diff < 10000) {
            setStatus('duplicate')
            const firstName = name ? name.split(' ')[0] : ''
            setMessage(`DUPLICATE within 10s • ${firstName ? firstName + ' ' : ''}(${rollForDisplay})`)
            updateTodayStats('invalid')
            if (enableSounds) playSound('expired')
          } else {
            setStatus('already-used')
            const firstName = name ? name.split(' ')[0] : ''
            const secondsAgo = Math.floor(diff/1000)
            setMessage(`ALREADY USED ${secondsAgo}s ago • ${firstName ? firstName + ' ' : ''}(${rollForDisplay})`)
            updateTodayStats('invalid')
            if (enableSounds) playSound('invalid')
          }
          await storeScanLog({
            roll: rollForDisplay,
            mode: 'Hostel In',
            hostel_id: selectedHostel,
            timestamp: nowTs,
            status: (nowTs - lastValidTs) < 10000 ? 'duplicate' : 'already-used',
            metadata: appendFood({ online: false, verify: 'hostel', value: selectedHostel, scanType: 'qr', demo: true })
          })
          await maybeUploadPending()
          lastProcessedCodeRef.current = text
        } else {
          setStatus('valid')
          const firstName = name ? name.split(' ')[0] : ''
          setMessage(`Entry authorized (demo mode) • ${firstName ? firstName + ' ' : ''}(${rollForDisplay})`)
          updateTodayStats('valid')
          if (enableSounds) playSound('valid')
          setIsScanning(true)
          setTimeout(() => setIsScanning(false), 500)
          lastValidByRollFoodDayRef.current.set(dupKey, nowTs)
          await storeScanLog({
            roll: rollForDisplay,
            mode: 'Hostel In',
            hostel_id: selectedHostel,
            timestamp: nowTs,
            status: 'valid',
            metadata: appendFood({ online: false, verify: 'hostel', value: selectedHostel, scanType: 'qr', demo: true })
          })
          await maybeUploadPending()
          lastProcessedCodeRef.current = text
        }
      } else {
        setStatus('invalid')
        setMessage('Invalid QR code (demo secret mismatch)')
        updateTodayStats('invalid')
        if (enableSounds) playSound('invalid')
        await storeScanLog({
        roll: rollForDisplay,
        mode: 'Hostel In',
        hostel_id: selectedHostel,
        timestamp: Date.now(),
        status: (isValid ? 'valid' : 'invalid'),
        metadata: appendFood({ online: false, verify: 'hostel', value: selectedHostel, scanType: 'qr', demo: true })
        })
        await maybeUploadPending()
        lastProcessedCodeRef.current = text
      }
      return
    }
    
    // Try online verification if no demo secret
    try{
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/verify/online`,{
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ qr: text })
      })
      const j = await res.json()
      let finalStatus = j.status
      
      console.log('🔍 Verification response:', j)
      
      if (j.status === 'valid') {
        // Duplicate / Already-used detection (per roll+food+day)
        const nowTs = Date.now()
        const dupKey = getDuplicateKey(rollForDisplay, foodType, nowTs)
        const lastValidTs = lastValidByRollFoodDayRef.current.get(dupKey)
        
        if (lastValidTs) {
          const diff = nowTs - lastValidTs
          if (diff < 10000) {
            setStatus('duplicate')
            const firstName = name ? name.split(' ')[0] : ''
            setMessage(`DUPLICATE within 10s • ${firstName ? firstName + ' ' : ''}(${rollForDisplay})`)
            finalStatus = 'invalid'
            if (enableSounds) playSound('expired')
          } else {
            setStatus('already-used')
            const firstName = name ? name.split(' ')[0] : ''
            const secondsAgo = Math.floor(diff/1000)
            setMessage(`ALREADY USED ${secondsAgo}s ago • ${firstName ? firstName + ' ' : ''}(${rollForDisplay})`)
            finalStatus = 'invalid'
            if (enableSounds) playSound('invalid')
          }
        } else {
          setStatus('valid')
          const firstName = name ? name.split(' ')[0] : ''
          setMessage(`Entry authorized • ${firstName ? firstName + ' ' : ''}(${rollForDisplay})`)
          if (enableSounds) playSound('valid')
          setIsScanning(true)
          setTimeout(() => setIsScanning(false), 500)
          lastValidByRollFoodDayRef.current.set(dupKey, nowTs)
        }
      } else if (j.status === 'expired') {
        setStatus('expired')
        const timeDiff = j.diff ? ` (${j.diff} steps ago)` : ''
        setMessage(`QR expired${timeDiff} - Roll: ${rollForDisplay}`)
        finalStatus = 'invalid'
        if (enableSounds) playSound('expired')
      } else {
        setStatus('invalid')
        // Provide detailed error message
        let errorDetail = `Roll: ${rollForDisplay}`
        if (j.reason === 'student_not_found') {
          errorDetail += ' | Student not in database'
        } else if (j.reason === 'hmac_mismatch') {
          errorDetail += ' | Invalid signature (HMAC mismatch)'
        } else if (j.error === 'bad qr format') {
          errorDetail += ' | Bad QR format'
        } else {
          errorDetail += ' | Verification failed'
        }
        setMessage(`Invalid QR: ${errorDetail}`)
        finalStatus = 'invalid'
        if (enableSounds) playSound('invalid')
      }
      updateTodayStats(finalStatus)
      await storeScanLog({
        roll: rollForDisplay,
        mode: 'Hostel In',
        hostel_id: selectedHostel,
        timestamp: Date.now(),
        status: (status === 'duplicate' || status === 'already-used') ? status : j.status,
        metadata: appendFood({ online: true, verify: 'hostel', value: selectedHostel, scanType: 'qr', apiResponse: j })
      })
      await maybeUploadPending()
      lastProcessedCodeRef.current = text
      return
    }catch(err: any){
      console.error('❌ Verification API error:', err)
      // offline: try local verification using cached keys
      const localSecret = localStorage.getItem('demo_secret_' + rollForDisplay)
      const isValid = localSecret && await verifyQR(text, localSecret)
      let errorMsg = ''
      if (isValid) {
        // Duplicate / Already-used detection (per roll+food+day)
        const nowTs = Date.now()
        const dupKey = getDuplicateKey(rollForDisplay, foodType, nowTs)
        const lastValidTs = lastValidByRollFoodDayRef.current.get(dupKey)
        
        if (lastValidTs) {
          const diff = nowTs - lastValidTs
          if (diff < 10000) {
            setStatus('duplicate')
            const firstName = name ? name.split(' ')[0] : ''
            setMessage(`DUPLICATE within 10s • ${firstName ? firstName + ' ' : ''}(${rollForDisplay})`)
            if (enableSounds) playSound('expired')
          } else {
            setStatus('already-used')
            const firstName = name ? name.split(' ')[0] : ''
            const secondsAgo = Math.floor(diff/1000)
            setMessage(`ALREADY USED ${secondsAgo}s ago • ${firstName ? firstName + ' ' : ''}(${rollForDisplay})`)
            if (enableSounds) playSound('invalid')
          }
          updateTodayStats('invalid')
          await storeScanLog({
            roll: rollForDisplay,
            mode: 'Hostel In',
            hostel_id: selectedHostel,
            timestamp: nowTs,
            status: (nowTs - lastValidTs) < 10000 ? 'duplicate' : 'already-used',
            metadata: appendFood({ online: false, verify: 'hostel', value: selectedHostel, scanType: 'qr', error: errorMsg })
          })
          await maybeUploadPending()
          lastProcessedCodeRef.current = text
        } else {
          setStatus('valid')
          const firstName = name ? name.split(' ')[0] : ''
          setMessage(`Entry authorized (offline mode) • ${firstName ? firstName + ' ' : ''}(${rollForDisplay})`)
          if (enableSounds) playSound('valid')
          setIsScanning(true)
          setTimeout(() => setIsScanning(false), 500)
          updateTodayStats('valid')
          lastValidByRollFoodDayRef.current.set(dupKey, nowTs)
          await storeScanLog({
            roll: rollForDisplay,
            mode: 'Hostel In',
            hostel_id: selectedHostel,
            timestamp: nowTs,
            status: 'valid',
            metadata: appendFood({ online: false, verify: 'hostel', value: selectedHostel, scanType: 'qr', error: errorMsg })
          })
          await maybeUploadPending()
          lastProcessedCodeRef.current = text
        }
      } else {
        setStatus('invalid')
        errorMsg = err?.message || 'Unknown error'
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'Not configured'
        setMessage(`Network Error - Roll: ${rollForDisplay} | API: ${apiUrl} | ${errorMsg}`)
        if (enableSounds) playSound('invalid')
        updateTodayStats('invalid')
        await storeScanLog({
        roll: rollForDisplay,
        mode: 'Hostel In',
        hostel_id: selectedHostel,
        timestamp: Date.now(),
        status: (isValid ? 'valid' : 'invalid'),
        metadata: appendFood({ online: false, verify: 'hostel', value: selectedHostel, scanType: 'qr', error: errorMsg })
        })
        await maybeUploadPending()
        lastProcessedCodeRef.current = text
      }
    }
  }, [verifyKind, selectedHostel, verifyValue, updateTodayStats, enableSounds, playSound, isScanning, status])

  async function loadHistory() {
    try {
      const logs = await getUnsyncedLogs()
      // Sort by timestamp descending (newest first) and filter for valid scans only
      const validLogs = logs
        .filter(log => log.status === 'valid')
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100) // Show last 100 valid scans
      setHistoryLogs(validLogs)
      setShowHistory(true)
    } catch (err) {
      console.error('Failed to load history:', err)
      setMessage('Failed to load scan history')
    }
  }

  async function syncNow() {
    setMessage('Syncing...')
    // Upload logs using batch API
    try {
      const pendingPairs = await getUnsyncedValidLogs()
      if (pendingPairs.length) {
        const pending = pendingPairs.map(p => p.log)
        const ids = pendingPairs.map(p => p.id)
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/scans/upload`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ logs: pending })
        })
        if (res.ok) {
          await markLogsSyncedByIds(ids)
          setMessage(`Uploaded ${pending.length} valid logs`)
        }
      }
    } catch (e) {
      setMessage('Upload failed; will retry via background sync')
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready
        try { await (reg as any).sync?.register('sync-logs') } catch {}
      }
    }
    // Download hostel keys
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sync/hostel-keys?hostelId=${selectedHostel}`)
      if (res.ok) {
        const j = await res.json()
        const keys = j.bundle.map((k: any) => ({ roll: k.roll, secret_b64: k.secret_b64 }))
        await storeKeys(keys)
        setMessage(m => (m ? m + ' • ' : '') + `Fetched ${keys.length} keys`)
      }
    } catch {}
  }

  function handleLoginSuccess(jwtToken: string, email: string) {
    localStorage.setItem('scanner_token', jwtToken)
    setToken(jwtToken)
    setUserEmail(email)
    setLoggedIn(true)
    
    // Set default hostel based on permissions
    const allowedHostels = getAllowedHostels()
    if (allowedHostels !== 'ALL' && allowedHostels.length > 0) {
      setSelectedHostel(allowedHostels[0])
    }
  }

  function getAllowedHostels(): string[] | 'ALL' {
    const stored = localStorage.getItem('scanner_hostels')
    if (!stored) return 'ALL'
    try {
      const parsed = JSON.parse(stored)
      return parsed === 'ALL' ? 'ALL' : parsed
    } catch {
      return 'ALL'
    }
  }

  function isHostelAllowed(hostelId: string): boolean {
    const allowed = getAllowedHostels()
    return allowed === 'ALL' || allowed.includes(hostelId)
  }

  function handleLogout() {
    localStorage.removeItem('scanner_token')
    localStorage.removeItem('scanner_email')
    setLoggedIn(false)
    setToken('')
    setUserEmail('')
    setMenuOpen(false)
  }

  const getContextLabel = () => {
    const hostel = availableHostels.find(h => h.hostelId === selectedHostel)
    return `${selectedHostel} - ${hostel?.count || 0} students • Food: ${foodType}`
  }

  // Login screen
  if (!loggedIn && !authDisabled) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 20,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: 40, 
          borderRadius: 16, 
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          maxWidth: 400,
          width: '100%'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: 28, color: '#333' }}>🛡️ VJ Scanner</h1>
          <p style={{ margin: '0 0 30px 0', color: '#666', fontSize: 15 }}>
            Security App for authorized personnel
          </p>
          <GoogleLogin onSuccess={handleLoginSuccess} onError={(msg) => setError(msg)} />
          {error && <div style={{ color: 'red', marginTop: 15, fontSize: 14 }}>{error}</div>}
        </div>
      </div>
    )
  }

  // Loading screen
  if (!hostelDataLoaded) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, color: '#333' }}>Loading...</h1>
          <p style={{ color: '#666' }}>Preparing scanner</p>
        </div>
      </div>
    )
  }

  // Main scanner interface
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#f5f5f5',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{ 
        background: '#2c3e50',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            🛡️ VJ Scanner
          </h1>
          <div style={{ 
            fontSize: 13, 
            opacity: 0.9, 
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ fontSize: 16 }}>{getHostelIcon(selectedHostel)}</span>
            <span>{getHostelDisplayName(selectedHostel)}</span>
          </div>
        </div>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ 
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: 28,
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1
          }}
        >
          ☰
        </button>
      </div>

      {/* Context Indicator */}
      <div style={{ 
        background: '#34495e',
        color: 'white',
        padding: '8px 16px',
        fontSize: 13,
        textAlign: 'center'
      }}>
        📋 Current: {getContextLabel()}
      </div>

      {/* Camera Section - Reduced size for mobile */}
      <div style={{ 
        flex: '0 0 auto',
        minHeight: '280px',
        maxHeight: '35vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        padding: '10px'
      }}>
        <CameraScanner key="scanner-main" onDetected={handleScan} />
      </div>

      {/* Results Section - Takes remaining space */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        overflowY: 'auto',
        minHeight: 0
      }}>
        {status === 'idle' ? (
          <div style={{ 
            textAlign: 'center',
            color: '#999',
            padding: '40px 20px'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
            <div style={{ fontSize: 18 }}>Ready to scan</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Point camera at QR code or barcode</div>
          </div>
        ) : (
          <div style={{ 
            background: (
              status === 'valid' ? '#d4edda' :
              status === 'expired' ? '#fff3cd' :
              status === 'invalid' ? '#f8d7da' :
              status === 'duplicate' ? '#fff3cd' :
              status === 'already-used' ? '#f8d7da' :
              status === 'next' ? '#cfe2ff' : '#cfe2ff'
            ),
            border: `3px solid ${(
              status === 'valid' ? '#28a745' :
              status === 'expired' ? '#ffc107' :
              status === 'invalid' ? '#dc3545' :
              status === 'duplicate' ? '#ffc107' :
              status === 'already-used' ? '#dc3545' : '#0d6efd'
            )}`,
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              {status === 'valid' && '✅ VALID ENTRY'}
              {status === 'expired' && '🟡 EXPIRED'}
              {status === 'invalid' && '🔴 INVALID'}
              {status === 'not-authorized' && '🔵 NOT AUTHORIZED'}
              {status === 'duplicate' && '🟡 DUPLICATE'}
              {status === 'already-used' && '🔴 ALREADY USED'}
              {status === 'next' && '🔵 NEXT...'}
            </div>
            
            {/* Static roll display in bottom section */}
            <div style={{ fontSize: 20, marginBottom: 8 }}>
              <strong>Roll:</strong> {lastScanRoll}
            </div>
            
            {lastScanName && (
              <div style={{ fontSize: 18, marginBottom: 8 }}>
                <strong>Name:</strong> {lastScanName}
              </div>
            )}
            
            <div style={{ fontSize: 16, marginBottom: 8 }}>
              <strong>Time:</strong> {lastScanTime}
            </div>
            
            <div style={{ fontSize: 16, marginBottom: 8 }}>
              <strong>Type:</strong> {lastScanType === 'qr' ? '📱 QR Code' : '📊 Barcode'}
            </div>
            
            {message && (
              <div style={{ fontSize: 15, color: '#555', marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.5)', borderRadius: 6 }}>
                {message}
              </div>
            )}
            
            {/* Debug info for invalid QR codes */}
            {(status === 'invalid' || status === 'expired') && qr && (
              <details style={{ marginTop: 12, fontSize: 12 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: 8 }}>
                  🔍 Debug Info
                </summary>
                <div style={{ padding: 8, background: 'rgba(255,255,255,0.7)', borderRadius: 4, fontFamily: 'monospace' }}>
                  <div style={{ marginBottom: 4 }}><strong>Raw QR:</strong></div>
                  <div style={{ wordBreak: 'break-all', fontSize: 11 }}>{qr}</div>
                </div>
              </details>
            )}
          </div>
        )}

        {/* Scan Counter */}
        <div style={{ 
          marginTop: 16,
          padding: 12,
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontSize: 14
        }}>
          <strong>Today's Scans: {todayStats.total}</strong>
          <span style={{ marginLeft: 16, color: '#28a745' }}>✓ {todayStats.valid}</span>
          <span style={{ marginLeft: 12, color: '#dc3545' }}>✗ {todayStats.invalid}</span>
          <span style={{ marginLeft: 12, color: '#0d6efd' }}>⊘ {todayStats.notAuth}</span>
        </div>
      </div>

      {/* Floating Roll Number Bubble - Animates from bottom to top of screen */}
      {enableFloatAnimation && status !== 'idle' && lastScanRoll && (
        <div
          key={`float-${lastScanRoll}-${lastScanTime}`}
          style={{
            position: 'fixed',
            bottom: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            pointerEvents: 'none',
            animation: 'floatToTop 2.5s ease-out forwards'
          }}
        >
          <div style={{
            padding: '16px 24px',
            borderRadius: 999,
            background: 'white',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            fontSize: 28,
            fontWeight: 700,
            color: (status === 'valid' ? '#28a745' : (status === 'expired' || status === 'duplicate' ? '#856404' : (status === 'invalid' || status === 'already-used' ? '#dc3545' : '#0d6efd'))),
            border: `3px solid ${status === 'valid' ? '#28a745' : (status === 'expired' || status === 'duplicate' ? '#ffc107' : (status === 'invalid' || status === 'already-used' ? '#dc3545' : '#0d6efd'))}`,
            whiteSpace: 'nowrap'
          }}>
            {(lastScanName ? `${lastScanName.split(' ')[0]} (${lastScanRoll})` : lastScanRoll) + (status === 'next' ? ' - NEXT...' : '')}
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes floatToTop {
          0% {
            transform: translateX(-50%) translateY(0) scale(1);
            opacity: 1;
          }
          15% {
            transform: translateX(-50%) translateY(-50px) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(-80vh) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>

      {/* Hamburger Menu */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <div 
            onClick={() => setMenuOpen(false)}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }}
          />
          
          {/* Menu Panel */}
          <div style={{ 
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '85%',
            maxWidth: 360,
            background: 'white',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            overflowY: 'auto'
          }}>
            {/* Menu Header */}
            <div style={{ 
              background: '#2c3e50',
              color: 'white',
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>⚙️ Settings</h2>
              <button 
                onClick={() => setMenuOpen(false)}
                style={{ 
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: 24,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* User Section */}
            <div style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>👤 Logged in as:</div>
              <div style={{ fontSize: 14, marginBottom: 12 }}>{userEmail || 'security@vnrvjiet.in'}</div>
              <button 
                onClick={handleLogout}
                style={{ 
                  padding: '8px 16px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Logout
              </button>
            </div>

            {/* Verification Context */}
            <div style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>📋 Verification Context</h3>
              
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: 8, cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="verifyKind" 
                  value="hostel"
                  checked={verifyKind === 'hostel'}
                  onChange={() => setVerifyKind('hostel')}
                  style={{ marginRight: 8 }}
                />
                <span>Hostel</span>
              </label>

              {verifyKind === 'hostel' && (
                <div style={{ marginLeft: 24, marginBottom: 12 }}>
                  <select 
                    value={selectedHostel}
                    onChange={(e) => setSelectedHostel(e.target.value)}
                    style={{ 
                      width: '100%',
                      padding: 8,
                      fontSize: 14,
                      borderRadius: 4,
                      border: '1px solid #ccc'
                    }}
                  >
                    {availableHostels
                      .filter(h => isHostelAllowed(h.hostelId))
                      .map(h => (
                        <option key={h.hostelId} value={h.hostelId}>
                          {h.hostelId === 'BH1' ? 'Boys Main Hostel' : 
                           h.hostelId === 'GH1' ? 'Girls Main Hostel' : h.hostelId} ({h.count})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Meal Type Selection */}
            <div style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>🍽️ Meal Type</h3>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: 12 }}>
                <input 
                  type="checkbox" 
                  checked={autoFood}
                  onChange={(e) => setAutoFood(e.target.checked)}
                  style={{ marginRight: 10, width: 18, height: 18, cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Auto-select by time of day</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    Current: <strong>{foodType}</strong>
                  </div>
                </div>
              </label>

              {!autoFood && (
                <div style={{ marginLeft: 8 }}>
                  {(['Breakfast','Lunch','Snacks','Dinner'] as const).map(ft => (
                    <label key={ft} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="foodType" 
                        value={ft}
                        checked={foodType === ft}
                        onChange={() => setFoodType(ft)}
                        style={{ marginRight: 8 }}
                      />
                      <span>{ft}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Activity */}
            <div style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>📊 Today's Activity</h3>
              <div style={{ fontSize: 14, marginBottom: 6 }}>• Total Scans: <strong>{todayStats.total}</strong></div>
              <div style={{ fontSize: 14, marginBottom: 6, color: '#28a745' }}>• Valid: <strong>{todayStats.valid}</strong></div>
              <div style={{ fontSize: 14, marginBottom: 6, color: '#dc3545' }}>• Invalid: <strong>{todayStats.invalid}</strong></div>
              <div style={{ fontSize: 14, marginBottom: 12, color: '#0d6efd' }}>• Not Authorized: <strong>{todayStats.notAuth}</strong></div>
              
              <button 
                onClick={loadHistory}
                style={{ 
                  width: '100%',
                  padding: '10px 16px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  marginBottom: 8
                }}
              >
                View Full History
              </button>
              
              <button 
                onClick={() => setShowReports(true)}
                style={{ 
                  width: '100%',
                  padding: '10px 16px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                📊 View Reports
              </button>
            </div>

            {/* UI Preferences */}
            <div style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>🎨 UI Preferences</h3>
              
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: 16 }}>
                <input 
                  type="checkbox" 
                  checked={enableFloatAnimation}
                  onChange={(e) => setEnableFloatAnimation(e.target.checked)}
                  style={{ marginRight: 10, width: 18, height: 18, cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Floating Roll Animation</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    Animate roll number bubble when scan occurs
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={enableSounds}
                  onChange={(e) => setEnableSounds(e.target.checked)}
                  style={{ marginRight: 10, width: 18, height: 18, cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Enable Sound Effects</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    Play sounds for scan results (like Google Pay)
                  </div>
                </div>
              </label>
            </div>

            {/* Sync Status */}
            <div style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>🔄 Sync Status</h3>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                Last sync: Just now
              </div>
              
              <button 
                onClick={syncNow}
                style={{ 
                  width: '100%',
                  padding: '10px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Sync Now
              </button>
            </div>

            {/* Reports */}
            <div style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>📈 Quick Preview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Day</div>
                  <input 
                    type="date"
                    value={reportDay}
                    onChange={(e) => setReportDay(e.target.value)}
                    style={{ width: '100%', padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Student Batch (e.g., 2023 or 2023,2024)</div>
                  <input 
                    type="text"
                    placeholder="2023,2024"
                    value={reportBatch}
                    onChange={(e) => setReportBatch(e.target.value)}
                    style={{ width: '100%', padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Food Type</div>
                  <select 
                    value={reportFood}
                    onChange={(e) => setReportFood(e.target.value as any)}
                    style={{ width: '100%', padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
                  >
                    <option value="">Any</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={async () => {
                  try {
                    const q = new URLSearchParams()
                    if (reportDay) q.set('day', reportDay)
                    if (reportBatch) q.set('studentBatch', reportBatch)
                    if (reportFood) q.set('foodType', reportFood)
                    q.set('limit', '200')
                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/scans?${q.toString()}`)
                    const j = await res.json()
                    if (j.ok) setReportRows(j.rows || [])
                  } catch (e) {
                    console.warn('fetch reports failed', e)
                  }
                }}
                style={{ 
                  width: '100%',
                  padding: '10px 16px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  marginTop: 12
                }}
              >
                Fetch
              </button>
              {reportRows.length > 0 && (
                <>
                  <div style={{ marginTop: 12, fontSize: 13, color: '#28a745', fontWeight: 600 }}>
                    Found {reportRows.length} records
                  </div>
                  <div style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
                    {reportRows.slice(0, 5).map((r, idx) => (
                      <div key={idx} style={{ padding: 8, borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                        <div><strong>{r.roll}</strong> • {new Date(r.timestamp).toLocaleTimeString()} • {r.status}</div>
                        <div style={{ color: '#666' }}>{r.mode} • {r.hostel_id} • {(r.metadata?.foodType || '')}</div>
                      </div>
                    ))}
                    {reportRows.length > 5 && (
                      <div style={{ padding: 8, textAlign: 'center', fontSize: 12, color: '#666' }}>
                        ...and {reportRows.length - 5} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Dev/Debug Tools */}
            <div style={{ padding: 16 }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>🔧 Dev Tools</h3>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                Set demo secret for testing QR codes
              </div>
              <input 
                type="text"
                placeholder="Enter roll number"
                id="demo-roll-input"
                style={{ 
                  width: '100%',
                  padding: 8,
                  fontSize: 13,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  marginBottom: 8
                }}
              />
              <button 
                onClick={() => {
                  const rollInput = document.getElementById('demo-roll-input') as HTMLInputElement
                  const roll = rollInput.value.trim()
                  if (!roll) {
                    alert('Please enter a roll number')
                    return
                  }
                  const demoSecret = `demo_secret_${roll}`
                  localStorage.setItem(`demo_secret_${roll}`, demoSecret)
                  alert(`✅ Demo secret set for ${roll}\n\nSecret: ${demoSecret}\n\nNow scan QR codes from this roll in the passport app.`)
                  rollInput.value = ''
                }}
                style={{ 
                  width: '100%',
                  padding: '10px 16px',
                  background: '#ffc107',
                  color: '#000',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Set Demo Secret
              </button>
            </div>
          </div>
        </>
      )}

      {/* History Modal */}
      {showHistory && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.7)', 
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setShowHistory(false)}
        >
          <div 
            style={{ 
              background: 'white', 
              borderRadius: 12, 
              maxWidth: 600, 
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '2px solid #eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                ✅ Valid Scans History
              </h2>
              <button 
                onClick={() => setShowHistory(false)}
                style={{ 
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ 
              padding: 16, 
              overflowY: 'auto',
              flex: 1
            }}>
              {historyLogs.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 40, 
                  color: '#666' 
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                  <div>No valid scans recorded yet</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {historyLogs.map((log, idx) => {
                    const date = new Date(log.timestamp)
                    const timeStr = date.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })
                    const dateStr = date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                    
                    return (
                      <div 
                        key={idx}
                        style={{ 
                          padding: 12,
                          background: '#f8f9fa',
                          borderRadius: 8,
                          borderLeft: '4px solid #28a745',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: 16,
                            marginBottom: 4,
                            color: '#333'
                          }}>
                            {log.roll}
                          </div>
                          <div style={{ 
                            fontSize: 13, 
                            color: '#666',
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap'
                          }}>
                            <span>🏠 {log.hostel_id}</span>
                            <span>📱 {log.metadata?.scanType || 'qr'}</span>
                            {log.metadata?.demo && <span>🔧 Demo</span>}
                            {log.metadata?.online === false && <span>📡 Offline</span>}
                          </div>
                        </div>
                        <div style={{ 
                          textAlign: 'right',
                          fontSize: 12,
                          color: '#666'
                        }}>
                          <div style={{ fontWeight: 600 }}>{timeStr}</div>
                          <div>{dateStr}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ 
              padding: 16, 
              borderTop: '1px solid #eee',
              background: '#f8f9fa',
              fontSize: 13,
              color: '#666',
              textAlign: 'center'
            }}>
              Showing last {historyLogs.length} valid scans
            </div>
          </div>
        </div>
      )}

      {/* Reports View */}
      {showReports && <ReportsView onClose={() => setShowReports(false)} />}

      {/* PWA Install Prompt */}
      {loggedIn && <InstallPrompt />}
    </div>
  )
}
