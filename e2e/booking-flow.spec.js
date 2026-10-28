import { test, expect } from '@playwright/test'

// full happy path: guest logs in, searches, picks a room, pays, sees the booking
test('guest can search, book and pay for a room', async ({ page }) => {
  // dates far enough in the future that the seed data doesn't block them
  const d = (offset) => {
    const x = new Date()
    x.setDate(x.getDate() + offset)
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  }
  const checkIn = d(120)
  const checkOut = d(123)

  await page.goto('/login')
  await page.getByRole('button', { name: 'Guest' }).click()
  await page.getByRole('button', { name: /^log in$/i }).click()
  await expect(page).toHaveURL(/my-bookings/)

  await page.goto(`/?checkIn=${checkIn}&checkOut=${checkOut}&type=Double`)
  await expect(page.getByRole('heading', { name: /free from/i })).toBeVisible()
  await page.locator('article').first().getByRole('link').click()

  await expect(page.getByLabel('Check-in')).toHaveValue(checkIn)
  await page.getByLabel('Breakfast on the terrace').check()
  await expect(page.getByTestId('price-total')).toBeVisible()
  await page.getByRole('button', { name: 'Continue to checkout' }).click()

  await expect(page).toHaveURL(/checkout/)
  await page.getByLabel('Phone').fill('+216 20 123 456')
  await page.getByRole('button', { name: 'Continue to payment' }).click()

  await page.getByLabel('Name on card').fill('Amira Ben Salah')
  await page.getByLabel('Card number').fill('4242424242424242')
  await page.getByLabel('Expiry (MM/YY)').fill('1230')
  await page.getByLabel('CVC').fill('123')
  await page.getByRole('button', { name: /^pay/i }).click()

  await expect(page.getByRole('heading', { name: "You're all set!" })).toBeVisible()
  await page.getByRole('button', { name: 'See my bookings' }).click()
  await expect(page.getByText('Upcoming').first()).toBeVisible()
})
