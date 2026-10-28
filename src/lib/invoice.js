import { calculatePrice } from './pricing'
import { formatDate } from './dates'

// jsPDF is ~300kb so it's only downloaded when someone actually clicks "Invoice"
export async function downloadInvoice(booking, { rooms = [], services = [] } = {}) {
  const { jsPDF } = await import('jspdf')
  const room = rooms.find((r) => r.id === booking.roomId)
  const chosen = services.filter((s) => (booking.services || []).includes(s.id))
  const rate = room?.price ?? 0
  const price = calculatePrice({ rate, checkIn: booking.checkIn, checkOut: booking.checkOut, services: chosen, guests: booking.guests })
  const money = (n) => `${n.toFixed(2)} TND`

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const left = 50
  let y = 60

  doc.setFillColor(28, 126, 117)
  doc.rect(0, 0, 595, 8, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(24, 68, 65)
  doc.text('Kuriat Bay Resort', left, y)
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(90)
  doc.text('Zone touristique Skanes, Monastir 5000, Tunisia', left, (y += 16))
  doc.text('hello@kuriatbay.tn  ·  +216 73 000 000', left, (y += 13))

  doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(30)
  doc.text('INVOICE', 545, 60, { align: 'right' })
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(90)
  doc.text(`No. INV-${booking.id.toUpperCase()}`, 545, 76, { align: 'right' })
  doc.text(`Date: ${formatDate(booking.checkedOutOn || booking.checkOut)}`, 545, 89, { align: 'right' })

  y += 40
  doc.setFontSize(10).setTextColor(120).text('BILLED TO', left, y)
  doc.setFontSize(11).setTextColor(30)
  doc.text(booking.guestName, left, (y += 16))
  doc.text(booking.email, left, (y += 14))
  if (booking.phone) doc.text(booking.phone, left, (y += 14))

  doc.setFontSize(10).setTextColor(120).text('STAY', 330, y - 30)
  doc.setFontSize(11).setTextColor(30)
  doc.text(booking.roomName, 330, y - 14)
  doc.text(`${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)}`, 330, y)
  doc.text(`${booking.guests} guest(s), ${price.nights} night(s)`, 330, (y += 14))

  // table
  y += 36
  doc.setFillColor(238, 251, 248)
  doc.rect(left, y - 14, 495, 22, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(10)
  doc.text('Description', left + 8, y)
  doc.text('Amount', 537, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')

  const row = (label, amount) => {
    y += 24
    doc.text(label, left + 8, y)
    doc.text(money(amount), 537, y, { align: 'right' })
    doc.setDrawColor(230).line(left, y + 8, 545, y + 8)
  }
  row(`${booking.roomName}: ${price.nights} night(s) x ${money(rate)}`, price.roomTotal)
  price.services.forEach((s) => row(s.name, s.amount))
  row('Taxes (7%)', price.tax)

  y += 30
  doc.setFont('helvetica', 'bold').setFontSize(13)
  doc.text('Total paid', 380, y)
  doc.text(money(booking.total ?? price.total), 537, y, { align: 'right' })

  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(130)
  doc.text(`Paid by card${booking.cardLast4 ? ` ending in ${booking.cardLast4}` : ''}. Thank you for staying with us!`, left, 780)
  doc.text('Student project - this is not a real invoice.', left, 794)

  doc.save(`kuriat-bay-invoice-${booking.id}.pdf`)
}
