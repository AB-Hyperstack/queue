'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  isBluetoothSupported,
  connectPrinter,
  disconnectPrinter,
  printTicket,
  type PrinterConnection,
  type TicketPrintData,
} from '@/lib/utils/printer';

export type PrinterStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'unsupported';

interface UsePrinterReturn {
  /** Current connection status */
  status: PrinterStatus;
  /** Whether Web Bluetooth is available (false on iOS Safari, Firefox) */
  supported: boolean;
  /** Name of the connected Bluetooth device */
  deviceName: string | null;
  /** Open browser pairing dialog and connect. Must be called from a click handler. */
  connect: () => Promise<void>;
  /** Disconnect from the current printer. */
  disconnect: () => void;
  /** Print a ticket. Returns true if successful, false on failure. */
  print: (data: TicketPrintData) => Promise<boolean>;
}

export function usePrinter(): UsePrinterReturn {
  const [status, setStatus] = useState<PrinterStatus>(() =>
    isBluetoothSupported() ? 'disconnected' : 'unsupported'
  );
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const connRef = useRef<PrinterConnection | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connRef.current) {
        disconnectPrinter(connRef.current);
      }
    };
  }, []);

  const connect = useCallback(async () => {
    setStatus('connecting');
    try {
      const conn = await connectPrinter();
      connRef.current = conn;
      setDeviceName(conn.device.name ?? 'Printer');
      setStatus('connected');

      // Listen for unexpected disconnection (printer turned off, out of range)
      conn.device.addEventListener('gattserverdisconnected', () => {
        connRef.current = null;
        setStatus('disconnected');
        setDeviceName(null);
      });
    } catch (err) {
      console.error('Printer connection failed:', err);
      setStatus('error');
      // Recover to disconnected after 3s so user can retry
      setTimeout(() => setStatus('disconnected'), 3000);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (connRef.current) {
      disconnectPrinter(connRef.current);
      connRef.current = null;
    }
    setStatus('disconnected');
    setDeviceName(null);
  }, []);

  const print = useCallback(async (data: TicketPrintData): Promise<boolean> => {
    if (!connRef.current) return false;
    try {
      await printTicket(connRef.current, data);
      return true;
    } catch (err) {
      console.error('Print failed:', err);
      return false;
    }
  }, []);

  return {
    status,
    supported: status !== 'unsupported',
    deviceName,
    connect,
    disconnect,
    print,
  };
}
