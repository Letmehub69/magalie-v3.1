import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('fr-CA', {
    dateStyle: 'long',
  }).format(new Date(date))
}

export function generateDossierNumber() {
  return `QC-${Math.floor(100000 + Math.random() * 900000)}`
}
