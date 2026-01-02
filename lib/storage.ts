import * as FileSystem from 'expo-file-system';

import { supabase } from './supabase';

function sanitizeFileName(name: string) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
}

// Lightweight base64 decoder (avoids relying on atob/Buffer in RN)
export function base64ToUint8Array(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = base64.replace(/\s/g, '');
  if (str.length % 4 !== 0) {
    // Pad if needed
    str += '='.repeat(4 - (str.length % 4));
  }

  const output: number[] = [];
  let i = 0;

  while (i < str.length) {
    const enc1 = chars.indexOf(str.charAt(i++));
    const enc2 = chars.indexOf(str.charAt(i++));
    const enc3 = chars.indexOf(str.charAt(i++));
    const enc4 = chars.indexOf(str.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output.push(chr1);
    if (enc3 !== 64) output.push(chr2);
    if (enc4 !== 64) output.push(chr3);
  }

  return new Uint8Array(output);
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export async function uploadFileToBucket(opts: {
  bucket: string;
  prefix: string;
  uri: string;
  name: string;
  mimeType?: string;
  path?: string;
  upsert?: boolean;
}): Promise<{ publicUrl: string; path: string }>
{
  const safeName = sanitizeFileName(opts.name || 'file');
  const path = opts.path ?? `${opts.prefix}/${Date.now()}_${randomSuffix()}_${safeName}`;

  const base64 = await FileSystem.readAsStringAsync(opts.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = base64ToUint8Array(base64);

  const { error } = await supabase.storage.from(opts.bucket).upload(path, bytes, {
    contentType: opts.mimeType || 'application/octet-stream',
    upsert: opts.upsert ?? false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(opts.bucket).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}
