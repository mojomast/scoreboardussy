import { Router, Request, Response } from 'express';
import { createRoom, findRoomByCode, deleteRoom, updateRoomActivity } from '../rooms/store';
import QRCode from 'qrcode';

function getBaseUrl(req: Request): string {
  // Prefer PUBLIC_URL if provided
  const env = process.env.PUBLIC_URL?.replace(/\/$/, '');
  if (env) return env;
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

const router = Router();

// Create new room
router.post('/', (req: Request, res: Response) => {
  try {
    const room = createRoom();
    const base = getBaseUrl(req);

    // Generate URLs with room code
    const controlUrl = `${base}/room/${room.code}/control`;
    const displayUrl = `${base}/room/${room.code}`;

    res.json({
      id: room.id,
      code: room.code,
      urls: {
        control: controlUrl,
        display: displayUrl
      },
      createdAt: new Date(room.createdAt).toISOString()
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room info by code (public endpoint for QR scans)
router.get('/:code/info', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const room = findRoomByCode(code.toUpperCase());

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Update activity
    updateRoomActivity(room.id);

    const base = getBaseUrl(req);
    const controlUrl = `${base}/room/${room.code}/control`;
    const displayUrl = `${base}/room/${room.code}`;

    res.json({
      code: room.code,
      urls: {
        control: controlUrl,
        display: displayUrl
      },
      createdAt: new Date(room.createdAt).toISOString()
    });
  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({ error: 'Failed to get room info' });
  }
});

// Generate QR code for room (returns PNG image)
router.get('/:code/qr', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { type = 'display' } = req.query;

    const room = findRoomByCode(code.toUpperCase());

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const base = getBaseUrl(req);
    const url = type === 'control'
      ? `${base}/room/${room.code}/control`
      : `${base}/room/${room.code}`;

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(qrBuffer);
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Generate QR code data URL (for embedding in frontend)
router.get('/:code/qr-data', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { type = 'display' } = req.query;

    const room = findRoomByCode(code.toUpperCase());

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const base = getBaseUrl(req);
    const url = type === 'control'
      ? `${base}/room/${room.code}/control`
      : `${base}/room/${room.code}`;

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400
    });

    res.json({
      dataUrl: qrDataUrl,
      url: url,
      type: type
    });
  } catch (error) {
    console.error('Error generating QR data URL:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Delete room by code
router.delete('/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const room = findRoomByCode(code.toUpperCase());

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    deleteRoom(room.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;

