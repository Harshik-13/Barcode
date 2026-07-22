// Hostel data loader - loads roll numbers for authorized hostels
import BH1Data from '../../hostel-data/BH1-boys-main-hostel.txt?raw'
import GH1Data from '../../hostel-data/GH1-girls-main-hostel.txt?raw'

interface HostelData {
  [hostelId: string]: Set<string>
}

let hostelDataCache: HostelData | null = null

/**
 * Load all hostel data into memory
 * Returns a map of hostelId -> Set of roll numbers
 */
export function loadHostelData(): HostelData {
  if (hostelDataCache) return hostelDataCache

  const data: HostelData = {
    BH1: new Set(
      BH1Data.split('\n')
        .map(line => line.trim().toUpperCase())
        .filter(line => line.length > 0)
    ),
    GH1: new Set(
      GH1Data.split('\n')
        .map(line => line.trim().toUpperCase())
        .filter(line => line.length > 0)
    ),
  }

  hostelDataCache = data
  console.log('✅ Loaded hostel data:', {
    BH1: data.BH1.size,
    GH1: data.GH1.size,
  })

  return data
}

/**
 * Check if a roll number is authorized for a specific hostel
 */
export function isAuthorizedForHostel(roll: string, hostelId: string): boolean {
  const data = loadHostelData()
  const hostelSet = data[hostelId]
  
  if (!hostelSet) {
    console.warn(`⚠️ Unknown hostel ID: ${hostelId}`)
    return false
  }

  return hostelSet.has(roll.trim().toUpperCase())
}

/**
 * Get all authorized roll numbers for a hostel
 */
export function getHostelRolls(hostelId: string): string[] {
  const data = loadHostelData()
  const hostelSet = data[hostelId]
  
  if (!hostelSet) return []
  
  return Array.from(hostelSet)
}

/**
 * Get statistics about loaded hostel data
 */
export function getHostelStats() {
  const data = loadHostelData()
  return Object.entries(data).map(([hostelId, rolls]) => ({
    hostelId,
    count: rolls.size,
  }))
}
