import multer from 'multer';

/** Solo entrada PNG/WebP; el Storage guarda siempre `.webp` tras normalizeUploadToWebp */
export const ALLOWED_IMAGE_MIMES = ['image/png', 'image/webp'] as const;

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Multer en memoria: el buffer pasa al servicio y de ahí a Supabase sin tocar disco.
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIMES)[number])) {
      cb(new Error('Only image/png and image/webp are allowed'));
      return;
    }
    cb(null, true);
  },
});
