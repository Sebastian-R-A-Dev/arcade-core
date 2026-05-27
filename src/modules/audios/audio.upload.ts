import multer from 'multer';

export const ALLOWED_AUDIO_MIMES = ['audio/mpeg', 'audio/mp3'] as const;

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    const mimeOk = ALLOWED_AUDIO_MIMES.includes(
      file.mimetype as (typeof ALLOWED_AUDIO_MIMES)[number],
    );
    const ext = file.originalname?.toLowerCase().endsWith('.mp3');
    if (!mimeOk && !ext) {
      cb(new Error('Only .mp3 files are allowed (audio/mpeg)'));
      return;
    }
    if (!file.originalname?.toLowerCase().endsWith('.mp3')) {
      cb(new Error('File must have a .mp3 extension'));
      return;
    }
    cb(null, true);
  },
});
