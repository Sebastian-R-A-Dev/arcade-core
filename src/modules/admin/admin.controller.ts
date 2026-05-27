import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { appsService } from '../apps/apps.service.js';
import { rolesController } from '../roles/roles.controller.js';
import { usersService } from '../users/users.service.js';
import type { AdminCreateUserBody, AdminUpdateUserBody } from '../users/users.validation.js';
/** Rutas admin: delegación en servicios de dominio (sin lógica aquí). */
export const adminController = {
  async listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await usersService.listForAdmin();
      res.status(HttpError.OK).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async createUser(
    req: Request<unknown, unknown, AdminCreateUserBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpError.UNAUTHORIZED);
      }
      const data = await usersService.createForAdmin(req.body, req.user.id);
      res.status(HttpError.CREATED).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await usersService.updateForAdmin(id, req.body as AdminUpdateUserBody);
      res.status(HttpError.OK).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.deleteForAdmin(Number(req.params.id));
      res.status(HttpError.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  },

  async resetUserPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpError.UNAUTHORIZED);
      }
      const data = await usersService.resetPasswordForAdmin(Number(req.params.id), req.user.id);
      res.status(HttpError.OK).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async listApps(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await appsService.listApps();
      res.status(HttpError.OK).json({ data });
    } catch (err) {
      next(err);
    }
  },

  listRoles: rolesController.list,
};
