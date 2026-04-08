import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function generateDossierNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  return `DOS-${year}${month}${day}-${random}`
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePhone(phone: string): boolean {
  const re = /^(\+\d{1,3}[- ]?)?\d{10}$/
  return re.test(phone.replace(/[\s-]/g, ''))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function calculatePensionAlimentaire(
  revenuPayeur: number,
  revenuReceveur: number,
  nombreEnfants: number
): number {
  // Simplified calculation based on Quebec guidelines
  const revenuTotal = revenuPayeur + revenuReceveur
  const pourcentageBase = 0.17 // 17% for one child
  
  if (nombreEnfants === 1) {
    return Math.round(revenuPayeur * pourcentageBase)
  } else if (nombreEnfants === 2) {
    return Math.round(revenuPayeur * 0.25) // 25% for two children
  } else if (nombreEnfants === 3) {
    return Math.round(revenuPayeur * 0.29) // 29% for three children
  } else {
    return Math.round(revenuPayeur * (0.29 + (nombreEnfants - 3) * 0.02))
  }
}

export function generateTimeline(events: any[]): any[] {
  return events
    .map(event => ({
      ...event,
      date: new Date(event.date),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function encryptData(data: string): string {
  // In production, use proper encryption
  // This is just a placeholder
  return btoa(data)
}

export function decryptData(encrypted: string): string {
  // In production, use proper decryption
  // This is just a placeholder
  return atob(encrypted)
}

export function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return password
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount)
}

export function getDaysBetween(date1: Date, date2: Date): number {
  const diff = Math.abs(date1.getTime() - date2.getTime())
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isDateInPast(date: Date): boolean {
  return date.getTime() < Date.now()
}

export function isDateInFuture(date: Date): boolean {
  return date.getTime() > Date.now()
}

export function getAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

export function validatePostalCode(postalCode: string): boolean {
  const re = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
  return re.test(postalCode)
}

export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function mergeObjects<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 }
}

export function isEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) return true
  if (typeof obj === 'string') return obj.trim().length === 0
  if (Array.isArray(obj)) return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

export function isNotEmpty(obj: any): boolean {
  return !isEmpty(obj)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename)
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
}

export function isDocumentFile(filename: string): boolean {
  const ext = getFileExtension(filename)
  return ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)
}

export function isSpreadsheetFile(filename: string): boolean {
  const ext = getFileExtension(filename)
  return ['xls', 'xlsx', 'csv'].includes(ext)
}

export function getFileIcon(filename: string): string {
  const ext = getFileExtension(filename)
  
  if (isImageFile(filename)) return '🖼️'
  if (isDocumentFile(filename)) return '📄'
  if (isSpreadsheetFile(filename)) return '📊'
  if (ext === 'zip' || ext === 'rar') return '📦'
  
  return '📎'
}

export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function deslugify(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

export function getQueryParam(param: string): string | null {
  if (typeof window === 'undefined') return null
  
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(param)
}

export function setQueryParam(param: string, value: string): void {
  if (typeof window === 'undefined') return
  
  const url = new URL(window.location.href)
  url.searchParams.set(param, value)
  window.history.pushState({}, '', url.toString())
}

export function removeQueryParam(param: string): void {
  if (typeof window === 'undefined') return
  
  const url = new URL(window.location.href)
  url.searchParams.delete(param)
  window.history.pushState({}, '', url.toString())
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    return new Promise((resolve, reject) => {
      document.execCommand('copy') ? resolve() : reject()
      textArea.remove()
    })
  }
}

export function downloadFile(data: Blob, filename: string): void {
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function generateQRCodeUrl(text: string, size: number = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`
}

export function getBrowserInfo(): {
  name: string
  version: string
  os: string
  isMobile: boolean
} {
  const ua = navigator.userAgent
  let name = 'Unknown'
  let version = 'Unknown'
  let os = 'Unknown'
  const isMobile = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)
  
  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    name = 'Chrome'
    version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
  } else if (ua.includes('Firefox')) {
    name = 'Firefox'
    version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown'
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari'
    version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown'
  } else if (ua.includes('Edg')) {
    name = 'Edge'
    version = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown'
  }
  
  // OS detection
  if (ua.includes('Windows')) {
    os = 'Windows'
  } else if (ua.includes('Mac')) {
    os = 'macOS'
  } else if (ua.includes('Linux')) {
    os = 'Linux'
  } else if (ua.includes('Android')) {
    os = 'Android'
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS'
  }
  
  return { name, version, os, isMobile }
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

export function getNetworkInfo(): Promise<{
  effectiveType: string
  downlink: number
  rtt: number
}> {
  return new Promise((resolve) => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      resolve({
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
      })
    } else {
      resolve({
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
      })
    }
  })
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

export function generateColorFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = hash % 360
  return `hsl(${hue}, 70%, 60%)`
}

export function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5 ? '#000000' : '#ffffff'
}