// Fake payment helpers (bonus feature). Nothing real is charged, ever.

export function luhnCheck(cardNumber) {
  const digits = String(cardNumber).replace(/\s+/g, '')
  if (!/^\d{13,19}$/.test(digits)) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

export function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

// MM/YY, must be this month or later
export function isExpiryValid(value, now = new Date()) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value || '')
  if (!match) return false
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return false
  const thisMonth = now.getFullYear() * 12 + now.getMonth()
  return year * 12 + (month - 1) >= thisMonth
}

// same idea as Stripe test cards: this one always gets declined
export const DECLINED_CARD = '4000000000000002'
