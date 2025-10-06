// src/utils/password.ts
export function generateRandomPassword(length = 12) {
  const lowers = 'abcdefghijkmnopqrstuvwxyz'
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const nums = '23456789'
  const symbols = '!@#$%^&*_-+=?'
  const all = lowers + uppers + nums + symbols

  const pick = (pool: string) => pool[Math.floor(Math.random() * pool.length)]

  // ensure at least one of each
  const initial = [
    pick(lowers),
    pick(uppers),
    pick(nums),
    pick(symbols),
  ]

  const remaining = Array.from({ length: Math.max(4, length) - initial.length }, () => pick(all))
  const passwordArr = [...initial, ...remaining]

  // Fisher–Yates shuffle
  for (let i = passwordArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[passwordArr[i], passwordArr[j]] = [passwordArr[j], passwordArr[i]]
  }

  return passwordArr.join('')
}
