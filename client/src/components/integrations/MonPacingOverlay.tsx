import React, { useEffect, useState } from 'react';
import { Box, Button, Group, Loader, Paper, Text, Title } from '@mantine/core';

interface MonPacingQRPayload {
  url: string;
  id: string; // matchId used by mon-pacing
  token: string; // interop token
}

function loadEnabled(): boolean {
  try { return localStorage.getItem('enableMonPacingIntegration') === 'true'; } catch { return false; }
}

function saveEnabled(val: boolean) {
  try { localStorage.setItem('enableMonPacingIntegration', String(val)); } catch {}
}

function loadMatchId(): string | null {
  try { return localStorage.getItem('monPacing.matchId'); } catch { return null; }
}

function saveMatchId(id: string) {
  try { localStorage.setItem('monPacing.matchId', id); } catch {}
}

function loadCachedQR(): MonPacingQRPayload | null {
  try {
    const raw = localStorage.getItem('monPacing.qrPayload');
    return raw ? JSON.parse(raw) as MonPacingQRPayload : null;
  } catch { return null; }
}

function saveCachedQR(p: MonPacingQRPayload) {
  try { localStorage.setItem('monPacing.qrPayload', JSON.stringify(p)); } catch {}
}

function getServerBase(): string {
  // Prefer explicit Vite var if provided
  const envOrigin = (import.meta as any).env?.VITE_SERVER_ORIGIN as string | undefined;
  if (envOrigin) return envOrigin.replace(/\/$/, '');
  // Default to same-origin as the served app (works behind reverse proxies / LB on port 80)
  return window.location.origin.replace(/\/$/, '');
}

async function fetchQrPayload(matchId?: string): Promise<MonPacingQRPayload> {
  const serverBase = getServerBase();
  const body: any = { baseUrl: serverBase };
  if (matchId) body.matchId = matchId;
  const resp = await fetch(`${serverBase}/api/interop/mon-pacing/qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error(`QR endpoint error: ${resp.status}`);
  return await resp.json();
}

function loadCorner(): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' {
  try { return (localStorage.getItem('monPacing.corner') as any) || 'bottom-left'; } catch { return 'bottom-left'; }
}

export const MonPacingOverlay: React.FC<{ corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }>
  = ({ corner = loadCorner() }) => {
  const [enabled] = useState<boolean>(loadEnabled());
  const [payload, setPayload] = useState<MonPacingQRPayload | null>(loadCachedQR());
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    saveEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const existingId = loadMatchId() || undefined;
        const p = await fetchQrPayload(existingId);
        if (cancelled) return;
        setPayload(p);
        saveCachedQR(p);
        if (!existingId) saveMatchId(p.id);
        // Build QR content as JSON string
        const content = JSON.stringify(p);
        try {
          const mod: any = await import('qrcode');
          const dataUrl = await mod.toDataURL(content, { errorCorrectionLevel: 'M', margin: 1, width: 200 });
          if (!cancelled) setQrDataUrl(dataUrl);
        } catch (e) {
          // Fallback: no QR lib installed; leave dataUrl null
          if (!cancelled) setQrDataUrl(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to fetch QR payload');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  if (!enabled) return null;

  const posClass = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  }[corner];

  async function copyJson() {
    if (!payload) return;
    const text = JSON.stringify(payload);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setError('Failed to copy to clipboard');
    }
  }

  return (
    <div className={`absolute ${posClass} z-50`} style={{ pointerEvents: 'auto' }}>
      <Paper shadow="md" p="sm" radius="md" withBorder style={{ background: 'rgba(0,0,0,0.7)' }}>
        <Group wrap="nowrap" gap="xs" align="flex-start">
          {loading ? (
            <Loader size="sm" color="yellow" />
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt="Mon-Pacing QR" style={{ width: 120, height: 120 }} />
          ) : (
            <Box>
              <Text c="yellow.3" size="xs">QR module not installed; showing raw data</Text>
              <pre style={{ maxWidth: 220, maxHeight: 120, overflow: 'auto', color: '#ddd', fontSize: 10 }}>
                {payload ? JSON.stringify(payload, null, 2) : 'No payload'}
              </pre>
            </Box>
          )}
          <Box>
            <Title order={6} c="gray.0">Mon-Pacing Link</Title>
            {error && <Text c="red.4" size="xs">{error}</Text>}
            {payload && (
              <Button size="xs" onClick={copyJson} color={copied ? 'teal' : 'blue'} mt={4}>
                {copied ? 'Copied' : 'Copy JSON'}
              </Button>
            )}
            <Button size="xs" variant="light" mt={4} onClick={() => window.location.reload()}>Refresh</Button>
          </Box>
        </Group>
      </Paper>
    </div>
  );
};

export default MonPacingOverlay;
