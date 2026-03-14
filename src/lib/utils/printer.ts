/**
 * ESC/POS Bluetooth thermal printer utility for 58mm receipt printers.
 *
 * Uses the Web Bluetooth API (Android Chrome) to connect to BLE thermal printers
 * and print queue tickets with ESC/POS commands.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PrinterConnection {
  device: BluetoothDevice;
  characteristic: BluetoothRemoteGATTCharacteristic;
}

export interface TicketPrintData {
  orgName: string;
  queueName: string;
  displayCode: string; // e.g. "A-001"
  trackUrl: string; // e.g. "https://example.com/track/uuid"
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// ESC/POS command constants
// ---------------------------------------------------------------------------

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
  INIT: [ESC, 0x40], // ESC @  – Initialize printer
  CENTER: [ESC, 0x61, 0x01], // ESC a 1 – Center alignment
  LEFT: [ESC, 0x61, 0x00], // ESC a 0 – Left alignment
  BOLD_ON: [ESC, 0x45, 0x01], // ESC E 1 – Bold on
  BOLD_OFF: [ESC, 0x45, 0x00], // ESC E 0 – Bold off
  SIZE_DOUBLE: [GS, 0x21, 0x11], // GS ! 0x11 – Double width + height
  SIZE_NORMAL: [GS, 0x21, 0x00], // GS ! 0x00 – Normal size
  CUT: [GS, 0x56, 0x01], // GS V 1 – Partial cut
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();

function text(str: string): number[] {
  return Array.from(encoder.encode(str));
}

function feedLines(n: number): number[] {
  return Array(n).fill(LF);
}

/**
 * Build ESC/POS QR code print commands (GS ( k – model 2).
 *
 * Sequence:
 *   1. Set model 2
 *   2. Set module size
 *   3. Set error correction level L
 *   4. Store data
 *   5. Print symbol
 */
function qrCommands(data: string, moduleSize = 6): number[] {
  const dataBytes = encoder.encode(data);
  const storeLen = dataBytes.length + 3; // pL pH = length + 3 overhead bytes
  const pL = storeLen & 0xff;
  const pH = (storeLen >> 8) & 0xff;

  return [
    // 1. Select model 2
    GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00,
    // 2. Set module size
    GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize,
    // 3. Error correction level L (48 = '0')
    GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30,
    // 4. Store data
    GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...Array.from(dataBytes),
    // 5. Print symbol
    GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30,
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Check if Web Bluetooth is available in this browser. */
export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Request the user to select and pair a Bluetooth printer.
 * Must be called from a user gesture (click handler).
 */
export async function connectPrinter(): Promise<PrinterConnection> {
  // Common BLE service/characteristic UUIDs for thermal printers
  const PRINTER_SERVICE = 0xffe0;
  const PRINTER_CHAR = 0xffe1;
  const ALT_SERVICE = 0x18f0;
  const ALT_CHAR = 0x2af1;

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [PRINTER_SERVICE, ALT_SERVICE],
  });

  const server = await device.gatt!.connect();

  // Try primary service, fall back to alternative
  let characteristic: BluetoothRemoteGATTCharacteristic;
  try {
    const service = await server.getPrimaryService(PRINTER_SERVICE);
    characteristic = await service.getCharacteristic(PRINTER_CHAR);
  } catch {
    const service = await server.getPrimaryService(ALT_SERVICE);
    characteristic = await service.getCharacteristic(ALT_CHAR);
  }

  return { device, characteristic };
}

/** Disconnect from the printer. */
export function disconnectPrinter(conn: PrinterConnection): void {
  try {
    conn.device.gatt?.disconnect();
  } catch {
    // Already disconnected – ignore
  }
}

/**
 * Build the full ESC/POS byte sequence for a queue ticket receipt.
 */
export function buildTicketReceipt(data: TicketPrintData): Uint8Array {
  const dateStr = data.timestamp.toISOString().slice(0, 16).replace('T', '  ');
  const separator = '--------------------------------';

  const bytes: number[] = [
    // Initialize
    ...CMD.INIT,

    // Center align
    ...CMD.CENTER,

    // Org name (bold)
    ...CMD.BOLD_ON,
    ...text(data.orgName),
    LF,
    ...CMD.BOLD_OFF,

    // Queue name
    ...text(data.queueName),
    LF,

    // Separator
    ...text(separator),
    LF,
    LF,

    // Ticket number – double size
    ...CMD.SIZE_DOUBLE,
    ...text(data.displayCode),
    LF,
    ...CMD.SIZE_NORMAL,
    LF,

    // QR code
    ...qrCommands(data.trackUrl, 6),
    LF,

    // Timestamp
    ...text(dateStr),
    LF,

    // Feed and cut
    ...feedLines(4),
    ...CMD.CUT,
  ];

  return new Uint8Array(bytes);
}

/**
 * Write bytes to the printer characteristic, chunking to fit
 * the BLE MTU limit (20 bytes). Adds a small delay between chunks
 * to prevent buffer overflow on cheap printers.
 */
export async function printBytes(
  characteristic: BluetoothRemoteGATTCharacteristic,
  data: Uint8Array
): Promise<void> {
  const CHUNK_SIZE = 20;
  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.slice(offset, Math.min(offset + CHUNK_SIZE, data.length));
    await characteristic.writeValueWithoutResponse(chunk);
    // Small delay between chunks
    if (offset + CHUNK_SIZE < data.length) {
      await new Promise((r) => setTimeout(r, 20));
    }
  }
}

/**
 * High-level: build and print a queue ticket receipt.
 */
export async function printTicket(
  conn: PrinterConnection,
  data: TicketPrintData
): Promise<void> {
  const receipt = buildTicketReceipt(data);
  await printBytes(conn.characteristic, receipt);
}
