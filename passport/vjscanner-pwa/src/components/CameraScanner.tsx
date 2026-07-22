import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'

type Props = { onDetected: (text: string) => void }

// Global singleton to prevent multiple scanners
let globalScanner: Html5QrcodeScanner | null = null
let globalIsInitializing = false

export default function CameraScanner({ onDetected }: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const onDetectedRef = useRef(onDetected)
  const initAttemptedRef = useRef(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  
  // Keep the callback ref updated
  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  useEffect(() => {
    if (!elRef.current) return
    
    // Prevent multiple initialization attempts
    if (initAttemptedRef.current) {
      console.log('Init already attempted for this component instance')
      return
    }
    initAttemptedRef.current = true

    // If a global scanner already exists and is initializing, don't create another
    if (globalIsInitializing) {
      console.log('Scanner initialization already in progress globally')
      return
    }

    // If a global scanner already exists and is rendered, don't create another
    if (globalScanner) {
      console.log('Scanner already exists globally, reusing')
      return
    }

    console.log('Creating new scanner instance')
    globalIsInitializing = true

    // Calculate qrbox size based on viewport to ensure rectangular on all devices
    const viewportWidth = Math.min(window.innerWidth - 40, 360)
    const qrboxWidth = Math.min(viewportWidth * 0.85, 300)
    const qrboxHeight = qrboxWidth * 0.5 // Keep 2:1 aspect ratio for better barcode scanning

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 30, // Increased FPS for faster scanning
        qrbox: { width: qrboxWidth, height: qrboxHeight },
        // Enable both QR codes and common barcode formats
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
        // Better settings for barcode scanning
        aspectRatio: 1.777778, // 16:9 ratio
        disableFlip: false, // Allow flipped scanning
        // Continuous video scanning (not click-to-capture)
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true, // Flash light for better scanning
      },
      false
    )
    
    globalScanner = scanner
    globalIsInitializing = false

    try {
      scanner.render(
        (decodedText) => {
          setCameraError(null) // Clear any errors on successful scan
          onDetectedRef.current(decodedText)
        },
        (errorMessage) => {
          // Ignore verbose scanning errors, but catch camera permission/hardware errors
          if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission')) {
            setCameraError('📷 Camera permission denied. Please allow camera access in your browser settings.')
          } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('Could not start video source')) {
            setCameraError('📷 Camera is already in use by another browser tab or app. Please close other apps using the camera and refresh this page.')
          } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('Requested device not found')) {
            setCameraError('📷 No camera found on this device. Please check your camera connection.')
          } else if (errorMessage.includes('NotSupportedError') || errorMessage.includes('navigator.mediaDevices')) {
            setCameraError('📷 Camera access is not supported in this browser. Please use a modern browser like Chrome or Safari.')
          }
          // Ignore scanning errors (QR not found, etc.)
        }
      )
      console.log('Scanner rendered successfully')
    } catch (error) {
      // Handle initialization errors
      console.error('Scanner initialization error:', error)
      const errorStr = String(error)
      
      if (errorStr.includes('NotAllowedError') || errorStr.includes('Permission')) {
        setCameraError('📷 Camera permission denied. Please allow camera access in your browser settings.')
      } else if (errorStr.includes('NotReadableError') || errorStr.includes('Could not start video source')) {
        setCameraError('📷 Camera is already in use by another browser tab or app. Please close other apps using the camera and refresh this page.')
      } else if (errorStr.includes('NotFoundError') || errorStr.includes('Requested device not found')) {
        setCameraError('📷 No camera found on this device. Please check your camera connection.')
      } else if (errorStr.includes('NotSupportedError') || errorStr.includes('navigator.mediaDevices')) {
        setCameraError('📷 Camera access is not supported in this browser. Please use a modern browser like Chrome or Safari.')
      } else {
        setCameraError('📷 Failed to initialize camera. Please refresh the page and try again.')
      }
    }

    // Cleanup only when component unmounts for real (not React strict mode double mount)
    return () => {
      // Delay cleanup to handle React strict mode double mount
      const timer = setTimeout(() => {
        if (globalScanner) {
          console.log('Cleaning up scanner')
          globalScanner.clear().catch(() => {})
          globalScanner = null
          globalIsInitializing = false
        }
      }, 100)
      
      // Clear the timeout if component remounts quickly
      return clearTimeout(timer)
    }
  }, []) // Empty dependency array - only run once per mount

  return (
    <>
      <style>{`
        /* Override html5-qrcode fullscreen mobile styles */
        #qr-reader {
          max-width: 100% !important;
          width: 100% !important;
        }
        #qr-reader video {
          max-height: 280px !important;
          object-fit: cover !important;
        }
        #qr-reader__dashboard_section_swaplink {
          display: none !important;
        }
        #qr-reader__dashboard_section_csr {
          max-height: 280px !important;
        }
        #qr-reader__scan_region {
          max-height: 280px !important;
        }
        /* Make camera controls more compact */
        #qr-reader__header_message {
          font-size: 12px !important;
          padding: 4px !important;
        }
        #qr-reader select {
          font-size: 13px !important;
          padding: 6px !important;
        }
        #qr-reader button {
          font-size: 13px !important;
          padding: 8px 12px !important;
        }
      `}</style>
      
      {/* Camera Error Display */}
      {cameraError && (
        <div style={{
          background: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          fontSize: '14px',
          lineHeight: '1.5',
          color: '#856404'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Camera Error</div>
          <div>{cameraError}</div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#ffc107',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            Refresh Page
          </button>
        </div>
      )}
      
      <div id="qr-reader" ref={elRef} style={{ width: '100%', maxWidth: '100%' }} />
    </>
  )
}
