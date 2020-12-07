import { differenceInDays, format, parseISO } from 'date-fns'
// import { fr } from 'date-fns/locale'

export const isValid = (date: Date | undefined): boolean => {
  if (!date) {
    return false
  }
  try {
    return !isNaN(date.getTime())
  } catch (err) {
    return false
  }
}

export const dateToString = (dateStr: string) => {
  const date = parseISO(dateStr)
  if (!isValid(date)) {
    return '⁇'
  }
  return format(date, 'd MMM yyyy') // , { locale: fr })
}

export const dateAgo = (dateStr: string) => {
  const date = parseISO(dateStr)
  if (!isValid(date)) {
    return '⁇'
  }
  const now = new Date()
  const diff = differenceInDays(now, date)

  switch (diff) {
    case 0:
      return `today`
    case 1:
      return 'yesterday'
    default:
      return `${diff} days ago`
  }
}

export const timeAgo = (dateStr: string) => {
  const date = parseISO(dateStr)
  if (!isValid(date)) {
    return '⁇'
  }
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hrs = Math.floor(min / 60)
  const day = Math.floor(hrs / 24)
  const mth = Math.floor(day / 30)
  const yrs = Math.floor(day / 365)

  switch (true) {
    case yrs >= 1:
      return `${yrs} year${yrs > 1 ? 's' : ''} ago`
    case mth >= 1:
      return `${mth} months ago`
    case day >= 1:
      return `${day} day${day > 1 ? 's' : ''} ago`
    case hrs >= 1:
      return `${hrs}h ago`
    case min >= 2:
      return `${min}m ago`
    default:
      return `just now`
  }
}
