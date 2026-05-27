import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ImageKind } from '@prisma/client';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { getSupabaseStorageClient } from '../../config/supabase.js';
import { env } from '../../shared/config/env.js';
import { ALLOWED_IMAGE_MIMES } from './image.upload.js';
import { resolveImageDisplayName } from './image.display-name.js';
import { STORAGE_WEBP_EXT, normalizeUploadToWebp } from './image.webp.js';
import { imagesRepository } from './images.repository.js';
import { formatSupabaseStorageError } from './storage-error.js';

/** Respuesta admin tras subir a la librería (`images` + Supabase `library/`). */
export type LibraryImageUploadDto = {
  id: number;
  uuid: string;
  kind: string;
  display_name: string;
  public_url: string;
  storage_path: string;
  created_at: string;
};

function assertAllowedUploadMime(
  mimetype: string,
): asserts mimetype is (typeof ALLOWED_IMAGE_MIMES)[number] {
  if (!ALLOWED_IMAGE_MIMES.includes(mimetype as (typeof ALLOWED_IMAGE_MIMES)[number])) {
    throw new AppError('Unsupported image type', HttpError.BAD_REQUEST);
  }
}

/** Elimina el objeto por path relativo al bucket (`library/…` o legado `questions/…`). */
export async function deleteStoredImage(storagePath: string): Promise<void> {
  let supabase;
  try {
    supabase = getSupabaseStorageClient();
  } catch (e) {
    console.error('[images] Supabase client unavailable:', e);
    throw new AppError('Image storage is not configured', HttpError.SERVICE_UNAVAILABLE);
  }

  const normalized = storagePath.replace(/^\/+/, '');
  const basename = path.basename(normalized);
  if (!basename || basename === '.' || basename === '..') {
    throw new AppError('Invalid storage path', HttpError.BAD_REQUEST);
  }

  const { data, error } = await supabase.storage.from(env.questionsImagesBucket).remove([normalized]);

  if (error) {
    console.error('[images] Supabase remove failed:', error.message);
    throw new AppError(
      `Storage delete failed: ${formatSupabaseStorageError(error.message)}`,
      HttpError.BAD_GATEWAY,
    );
  }

  const removed = data?.[0];
  if (!removed) {
    throw new AppError('Object not found in storage', HttpError.NOT_FOUND);
  }

  console.info('[images] deleted', normalized);
}

/** Quita objeto en Storage y fila en `images` (solo rutas `library/`). */
export async function deleteLibraryImageById(id: number): Promise<void> {
  const row = await imagesRepository.findById(id);
  if (!row) {
    throw new AppError('Image not found', HttpError.NOT_FOUND);
  }
  if (row.kind === ImageKind.avatar) {
    const inUse = await imagesRepository.countProfilesUsingAvatarImage(id);
    if (inUse > 0) {
      throw new AppError(
        'Cannot delete avatar image while user profiles reference it',
        HttpError.CONFLICT,
      );
    }
  }
  const p = row.storagePath.trim();
  if (!p.startsWith('library/')) {
    throw new AppError('Only library images can be deleted by id', HttpError.BAD_REQUEST);
  }
  await deleteStoredImage(p);
  await imagesRepository.deleteById(id);
}

/**
 * Sube a `library/{uuid}.webp`, persiste fila en tabla `images`.
 */
export async function uploadLibraryImage(params: {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
  labelFromBody?: string;
  kind?: ImageKind;
}): Promise<LibraryImageUploadDto> {
  let supabase;
  try {
    supabase = getSupabaseStorageClient();
  } catch (e) {
    console.error('[images] Supabase client unavailable:', e);
    throw new AppError('Image storage is not configured', HttpError.SERVICE_UNAVAILABLE);
  }

  assertAllowedUploadMime(params.mimetype);
  const normalized = await normalizeUploadToWebp(params.buffer, params.mimetype);

  const uuid = randomUUID();
  const kind = params.kind ?? ImageKind.generic;
  const folder = kind === ImageKind.avatar ? 'avatars' : 'generic';
  const storagePath = `library/${folder}/${uuid}.${STORAGE_WEBP_EXT}`;

  const { error } = await supabase.storage
    .from(env.questionsImagesBucket)
    .upload(storagePath, normalized.buffer, {
      contentType: normalized.contentType,
      upsert: false,
    });

  if (error) {
    console.error('[images] library upload failed:', error.message);
    throw new AppError(
      `Storage upload failed: ${formatSupabaseStorageError(error.message)}`,
      HttpError.BAD_GATEWAY,
    );
  }

  const { data: pub } = supabase.storage.from(env.questionsImagesBucket).getPublicUrl(storagePath);
  const displayName = resolveImageDisplayName(params.labelFromBody, params.originalname);

  const row = await imagesRepository.create({
    uuid,
    kind,
    displayName,
    publicUrl: pub.publicUrl,
    storagePath,
  });

  console.info(
    '[images] library uploaded',
    storagePath,
    normalized.convertedFromPng ? '(PNG→WebP)' : '(WebP recompressed)',
    `display_name=${displayName}`,
  );

  return {
    id: row.id,
    uuid: row.uuid,
    kind: row.kind,
    display_name: row.displayName,
    public_url: row.publicUrl,
    storage_path: row.storagePath,
    created_at: row.createdAt.toISOString(),
  };
}

export async function assertImageKind(
  imageId: number,
  expected: ImageKind,
): Promise<{ id: number; publicUrl: string; displayName: string }> {
  const row = await imagesRepository.findById(imageId);
  if (!row) {
    throw new AppError('Image not found', HttpError.NOT_FOUND);
  }
  if (row.kind !== expected) {
    throw new AppError(
      expected === ImageKind.avatar
        ? 'Image is not an avatar catalog entry'
        : 'Image is not a generic question asset',
      HttpError.BAD_REQUEST,
    );
  }
  return { id: row.id, publicUrl: row.publicUrl, displayName: row.displayName };
}
