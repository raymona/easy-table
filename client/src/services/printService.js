import { jsPDF } from 'jspdf';
import { groupItemsByCourse } from '../utils/orderHelpers';

// ── Constants ───────────────────────────────────────────────────────────────
const PAGE_WIDTH = 80; // mm — standard thermal receipt width
const MARGIN = 4;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FONT = 'Courier';

const SIZE = { header: 14, subheader: 12, body: 9, small: 7 };
const LINE = { header: 6, body: 4, small: 3 };

// ── Helpers ─────────────────────────────────────────────────────────────────

function createDoc(height = 500) {
  const doc = new jsPDF({ unit: 'mm', format: [PAGE_WIDTH, height] });
  doc.setFont(FONT, 'normal');
  return doc;
}

function dashedLine(doc, y) {
  doc.setFontSize(SIZE.body);
  doc.text('-'.repeat(44), MARGIN, y);
  return y + LINE.body;
}

function doubleLine(doc, y) {
  doc.setFontSize(SIZE.body);
  doc.text('='.repeat(44), MARGIN, y);
  return y + LINE.body;
}

function centerText(doc, text, y, size = SIZE.body) {
  doc.setFontSize(size);
  const width = doc.getTextWidth(text);
  doc.text(text, (PAGE_WIDTH - width) / 2, y);
}

function rightText(doc, text, y, size = SIZE.body) {
  doc.setFontSize(size);
  const width = doc.getTextWidth(text);
  doc.text(text, PAGE_WIDTH - MARGIN - width, y);
}

function leftRight(doc, left, right, y, size = SIZE.body) {
  doc.setFontSize(size);
  doc.text(left, MARGIN, y);
  const rw = doc.getTextWidth(right);
  doc.text(right, PAGE_WIDTH - MARGIN - rw, y);
  return y + LINE.body;
}

function wrapText(doc, text, maxWidth, size = SIZE.body) {
  doc.setFontSize(size);
  return doc.splitTextToSize(text, maxWidth);
}

function formatTime(ts) {
  const d = new Date(ts);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${h12}:${m} ${ampm}  ${month}/${day}/${d.getFullYear()}`;
}

function openPDF(doc) {
  const url = doc.output('bloburl');
  window.open(url, '_blank');
}

// ── Kitchen Ticket PDF ──────────────────────────────────────────────────────

/**
 * Generate a kitchen ticket PDF and open in new tab.
 * @param {{
 *   tableId: number|null,
 *   tabName: string|null,
 *   serverName: string,
 *   timestamp: number,
 *   courseFired: string|null,
 *   items: Array<{name, quantity, course, seatNum, cookTemp, mods, addOns, allergies, notes}>
 * }} data
 */
export function generateKitchenTicketPDF(data) {
  const doc = createDoc();
  let y = 8;

  // Header
  doc.setFont(FONT, 'bold');
  centerText(doc, '** KITCHEN **', y, SIZE.header);
  y += LINE.header + 1;

  y = dashedLine(doc, y);

  // Table / Tab label
  const label = data.tableId != null ? `Table ${data.tableId}` : `Tab: ${data.tabName || 'Tab'}`;
  doc.setFont(FONT, 'bold');
  centerText(doc, label, y, SIZE.subheader);
  y += LINE.header;

  // Server + time
  doc.setFont(FONT, 'normal');
  doc.setFontSize(SIZE.body);
  doc.text(`Server: ${data.serverName}`, MARGIN, y);
  y += LINE.body;

  doc.setFontSize(SIZE.small);
  doc.text(formatTime(data.timestamp), MARGIN, y);
  y += LINE.small + 1;

  if (data.courseFired) {
    y = dashedLine(doc, y);
    doc.setFont(FONT, 'bold');
    centerText(doc, `*** FIRE ${data.courseFired.toUpperCase()} ***`, y, SIZE.subheader);
    y += LINE.header;
  }

  y = dashedLine(doc, y);

  // Group items by course
  const grouped = groupItemsByCourse(data.items);

  for (const [course, items] of grouped) {
    // Course header
    if (course) {
      doc.setFont(FONT, 'bold');
      doc.setFontSize(SIZE.body);
      centerText(doc, `=== ${course.toUpperCase()} ===`, y, SIZE.body);
      y += LINE.body + 1;
    }

    for (const item of items) {
      doc.setFont(FONT, 'bold');
      doc.setFontSize(SIZE.body);

      // Item line: qty x name   S{seat}
      let itemLine = `${item.quantity || 1}x ${item.name}`;
      if (item.seatNum != null) {
        const seatStr = `S${item.seatNum}`;
        const gap = CONTENT_WIDTH - doc.getTextWidth(itemLine) - doc.getTextWidth(seatStr);
        if (gap > 2) {
          doc.text(itemLine, MARGIN, y);
          rightText(doc, seatStr, y, SIZE.body);
        } else {
          doc.text(itemLine, MARGIN, y);
          y += LINE.body;
          rightText(doc, seatStr, y, SIZE.body);
        }
      } else {
        doc.text(itemLine, MARGIN, y);
      }
      y += LINE.body;

      doc.setFont(FONT, 'normal');
      doc.setFontSize(SIZE.small);

      // Cook temp
      if (item.cookTemp) {
        doc.setFont(FONT, 'bold');
        doc.text(`   ** ${item.cookTemp} **`, MARGIN, y);
        doc.setFont(FONT, 'normal');
        y += LINE.small;
      }

      // Mods
      if (item.mods?.length > 0) {
        for (const mod of item.mods) {
          const modText = typeof mod === 'string' ? mod : `${mod.prefix || ''} ${mod.value || ''}`.trim();
          if (modText) {
            const lines = wrapText(doc, `   MOD: ${modText}`, CONTENT_WIDTH - 4, SIZE.small);
            for (const line of lines) {
              doc.text(line, MARGIN, y);
              y += LINE.small;
            }
          }
        }
      }

      // Add-ons
      if (item.addOns?.length > 0) {
        for (const ao of item.addOns) {
          const aoName = typeof ao === 'string' ? ao : ao.name;
          doc.text(`   ADD: ${aoName}`, MARGIN, y);
          y += LINE.small;
        }
      }

      // Allergies — prominent
      if (item.allergies?.length > 0) {
        doc.setFont(FONT, 'bold');
        const allergyText = `   !! ALLERGY: ${item.allergies.join(', ')} !!`;
        const lines = wrapText(doc, allergyText, CONTENT_WIDTH - 4, SIZE.small);
        for (const line of lines) {
          doc.text(line, MARGIN, y);
          y += LINE.small;
        }
        doc.setFont(FONT, 'normal');
      }

      // Notes
      if (item.notes?.length > 0) {
        for (const note of item.notes) {
          if (note) {
            const lines = wrapText(doc, `   NOTE: ${note}`, CONTENT_WIDTH - 4, SIZE.small);
            for (const line of lines) {
              doc.text(line, MARGIN, y);
              y += LINE.small;
            }
          }
        }
      }

      y += 1; // gap between items
    }
    y += 1; // gap between courses
  }

  y = dashedLine(doc, y);

  // Item count
  const totalItems = data.items.reduce((s, i) => s + (i.quantity || 1), 0);
  rightText(doc, `Items: ${totalItems}`, y, SIZE.body);
  y += LINE.body + 2;

  openPDF(doc);
}

// ── Guest Cheque PDF ────────────────────────────────────────────────────────

/**
 * Generate a guest cheque PDF and open in new tab.
 * @param {{
 *   restaurantName: string,
 *   tableId: number|null,
 *   tabName: string|null,
 *   serverName: string,
 *   timestamp: number,
 *   seats: Object|null,
 *   items: Array|null,
 *   subtotal: number,
 *   discount: {label: string, amount: number}|null,
 *   taxRate: number,
 *   tax: number,
 *   total: number,
 *   splitMode: 'full'|'bySeat'|'even',
 *   splitCount: number|null,
 * }} data
 */
export function generateGuestChequePDF(data) {
  const doc = createDoc();
  let y = 8;

  // Restaurant name
  doc.setFont(FONT, 'bold');
  centerText(doc, data.restaurantName || 'EASY TABLE', y, SIZE.header);
  y += LINE.header + 1;

  y = dashedLine(doc, y);

  // Table / Tab
  const label = data.tableId != null ? `Table ${data.tableId}` : `Tab: ${data.tabName || 'Tab'}`;
  doc.setFont(FONT, 'bold');
  doc.setFontSize(SIZE.body);
  doc.text(label, MARGIN, y);
  y += LINE.body;

  // Server + time
  doc.setFont(FONT, 'normal');
  doc.setFontSize(SIZE.body);
  doc.text(`Server: ${data.serverName}`, MARGIN, y);
  y += LINE.body;

  doc.setFontSize(SIZE.small);
  doc.text(formatTime(data.timestamp), MARGIN, y);
  y += LINE.small + 2;

  y = dashedLine(doc, y);

  // ── Split by seat: one section per seat ──
  if (data.splitMode === 'bySeat' && data.seats) {
    const taxRate = data.taxRate || 0.13;
    for (const [seatNum, items] of Object.entries(data.seats)) {
      if (!items || items.length === 0) continue;

      doc.setFont(FONT, 'bold');
      doc.setFontSize(SIZE.body);
      centerText(doc, `--- Seat ${seatNum} ---`, y, SIZE.body);
      y += LINE.body + 1;

      doc.setFont(FONT, 'normal');
      let seatSubtotal = 0;
      for (const item of items) {
        const price = item.price * (item.quantity || 1);
        seatSubtotal += price;
        y = renderChequeItem(doc, item, price, y);
      }

      y += 1;
      const seatTax = Math.round(seatSubtotal * taxRate * 100) / 100;
      const seatTotal = seatSubtotal + seatTax;

      y = leftRight(doc, 'Subtotal:', `$${seatSubtotal.toFixed(2)}`, y);
      y = leftRight(doc, `Tax (${(taxRate * 100).toFixed(0)}%):`, `$${seatTax.toFixed(2)}`, y);
      doc.setFont(FONT, 'bold');
      y = leftRight(doc, 'TOTAL:', `$${seatTotal.toFixed(2)}`, y, SIZE.body);
      doc.setFont(FONT, 'normal');

      y = dashedLine(doc, y);
      y += 1;
    }
  } else {
    // ── Full bill or even split ──
    if (data.seats) {
      // Table — show items grouped by seat
      for (const [seatNum, items] of Object.entries(data.seats)) {
        if (!items || items.length === 0) continue;

        doc.setFont(FONT, 'bold');
        doc.setFontSize(SIZE.small);
        doc.text(`Seat ${seatNum}`, MARGIN, y);
        y += LINE.small + 1;

        doc.setFont(FONT, 'normal');
        for (const item of items) {
          const price = item.price * (item.quantity || 1);
          y = renderChequeItem(doc, item, price, y);
        }
        y += 1;
      }
    } else if (data.items) {
      // Tab — flat list
      doc.setFont(FONT, 'normal');
      for (const item of data.items) {
        const price = item.price * (item.quantity || 1);
        y = renderChequeItem(doc, item, price, y);
      }
      y += 1;
    }

    y = dashedLine(doc, y);

    // Totals
    y = leftRight(doc, 'Subtotal:', `$${data.subtotal.toFixed(2)}`, y);

    if (data.discount) {
      y = leftRight(doc, `Discount (${data.discount.label}):`, `-$${data.discount.amount.toFixed(2)}`, y);
    }

    const taxLabel = `Tax (${((data.taxRate || 0.13) * 100).toFixed(0)}%):`;
    y = leftRight(doc, taxLabel, `$${data.tax.toFixed(2)}`, y);

    y = doubleLine(doc, y);

    doc.setFont(FONT, 'bold');
    y = leftRight(doc, 'TOTAL:', `$${data.total.toFixed(2)}`, y, SIZE.subheader);
    doc.setFont(FONT, 'normal');

    // Even split info
    if (data.splitMode === 'even' && data.splitCount > 1) {
      y += 2;
      const perPerson = (data.total / data.splitCount).toFixed(2);
      centerText(doc, `Split ${data.splitCount} ways: $${perPerson} each`, y, SIZE.body);
      y += LINE.body;
    }
  }

  // Footer
  y += 4;
  centerText(doc, 'Thank you for dining with us!', y, SIZE.body);
  y += LINE.body + 1;
  centerText(doc, formatTime(data.timestamp), y, SIZE.small);

  openPDF(doc);
}

// ── Render a single cheque item line ────────────────────────────────────────

function renderChequeItem(doc, item, price, y) {
  doc.setFontSize(SIZE.body);
  const qty = item.quantity || 1;
  const nameStr = qty > 1 ? `${qty}x ${item.name}` : item.name;
  const priceStr = item.isComped ? '$0.00 COMP' : `$${price.toFixed(2)}`;

  y = leftRight(doc, nameStr, priceStr, y, SIZE.body);

  // Mods / add-ons as sub-lines
  doc.setFontSize(SIZE.small);
  if (item.mods?.length > 0) {
    for (const mod of item.mods) {
      const modText = typeof mod === 'string' ? mod : `${mod.prefix || ''} ${mod.value || ''}`.trim();
      if (modText) {
        doc.text(`  ${modText}`, MARGIN, y);
        y += LINE.small;
      }
    }
  }
  if (item.addOns?.length > 0 || item.selectedAddOns?.length > 0) {
    const addOns = item.addOns || item.selectedAddOns || [];
    for (const ao of addOns) {
      const aoName = typeof ao === 'string' ? ao : ao.name;
      const aoPrice = typeof ao === 'object' && ao.price ? ` +$${ao.price.toFixed(2)}` : '';
      doc.text(`  + ${aoName}${aoPrice}`, MARGIN, y);
      y += LINE.small;
    }
  }

  return y;
}
