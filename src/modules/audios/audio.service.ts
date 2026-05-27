import { randomUUID } from 'node:crypto';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { getSupabaseStorageClient } from '../../config/supabase.js';
import { env } from '../../shared/config/env.js';
import { ALLOWED_AUDIO_MIMES } from './audio.upload.js';
import { resolveAudioDisplayName } from './audio.display-name.js';
import { audiosRepository } from './audios.repository.js';
import { formatSupabaseStorageError } from '../images/storage-error.js';

export type AppAudioDto = {
  id: number;
  uuid: string;
  display_name: string;
  public_url: string;
  storage_path: string;
  created_at: string;
};

function isAllowedAudioUpload(mimetype: string, originalname?: string): boolean {
  if (ALLOWED_AUDIO_MIMES.includes(mimetype as (typeof ALLOWED_AUDIO_MIMES)[number])) {
    return true;
  }
  return originalname?.toLowerCase().endsWith('.mp3') ?? false;
}

export async function uploadAppAudio(params: {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
  labelFromBody?: string;
}): Promise<AppAudioDto> {
  let supabase;
  try {
    supabase = getSupabaseStorageClient();
  } catch (e) {
    console.error('[audios] Supabase client unavailable:', e);
    throw new AppError('Audio storage is not configured', HttpError.SERVICE_UNAVAILABLE);
  }

  if (!isAllowedAudioUpload(params.mimetype, params.originalname)) {
    throw new AppError('Only audio/mpeg (.mp3) is allowed', HttpError.BAD_REQUEST);
  }

  const uuid = randomUUID();
  const storagePath = `tracks/${uuid}.mp3`;

  const { error } = await supabase.storage
    .from(env.audiosForAppsBucket)
    .upload(storagePath, params.buffer, {
      contentType: 'audio/mpeg',
      upsert: false,
    });

  if (error) {
    console.error('[audios] upload failed:', error.message);
    throw new AppError(
      `Storage upload failed: ${formatSupabaseStorageError(error.message)}`,
      HttpError.BAD_GATEWAY,
    );
  }

  const { data: pub } = supabase.storage.from(env.audiosForAppsBucket).getPublicUrl(storagePath);
  const displayName = resolveAudioDisplayName(params.labelFromBody, params.originalname);

  const row = await audiosRepository.create({
    uuid,
    displayName,
    publicUrl: pub.publicUrl,
    storagePath,
  });

  console.info('[audios] uploaded', storagePath, `display_name=${displayName}`);

  return {
    id: row.id,
    uuid: row.uuid,
    display_name: row.displayName,
    public_url: row.publicUrl,
    storage_path: row.storagePath,
    created_at: row.createdAt.toISOString(),
  };
}

export async function listAppAudios(query = ''): Promise<AppAudioDto[]> {
  const rows = await audiosRepository.searchByDisplayName(query, 200);
  return rows.map((row) => ({
    id: row.id,
    uuid: row.uuid,
    display_name: row.displayName,
    public_url: row.publicUrl,
    storage_path: row.storagePath,
    created_at: row.createdAt.toISOString(),
  }));
}
