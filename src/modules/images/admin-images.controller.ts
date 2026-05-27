import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { ImageKind } from '@prisma/client';
import type { UploadImageParsedBody } from './image.validation.js';
import type { AdminListImagesQuery } from './image.validation.js';
import { imagesRepository } from './images.repository.js';
import { uploadLibraryImage, deleteLibraryImageById } from './image.service.js';

function toListItemDto(row: {
  id: number;
  uuid: string;
  kind: ImageKind;
  displayName: string;
  publicUrl: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    uuid: row.uuid,
    kind: row.kind,
    display_name: row.displayName,
    public_url: row.publicUrl,
    created_at: row.createdAt.toISOString(),
  };
}

export const adminImagesController = {
  async list(
    req: Request<unknown, unknown, unknown, AdminListImagesQuery>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const q = req.query.q ?? '';
      const kind = req.query.kind
        ? req.query.kind === 'avatar'
          ? ImageKind.avatar
          : ImageKind.generic
        : undefined;
      const rows = await imagesRepository.searchByDisplayName(q, kind, 100);
      res.json({ data: rows.map(toListItemDto) });
    } catch (err) {
      next(err);
    }
  },

  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError(
          'Missing image file: send multipart field named "image"',
          HttpError.BAD_REQUEST,
        );
      }
      const body = req.body as UploadImageParsedBody;
      const data = await uploadLibraryImage({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        labelFromBody: body.labelFromBody,
        kind: body.kind === 'avatar' ? ImageKind.avatar : ImageKind.generic,
      });
      res.status(HttpError.CREATED).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async removeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await deleteLibraryImageById(id);
      res.json({ data: { deleted: true, id } });
    } catch (err) {
      next(err);
    }
  },
};
