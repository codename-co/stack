export const of = (name: string): string => {
  if (/^[aeyuioh]/.test(name?.toLowerCase())) {
    return `d'${name}`
  } else {
    return `de ${name}`
  }
}
