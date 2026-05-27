import { ImageKind } from '@prisma/client';
import { assertImageKind } from '../images/image.service.js';

export type ResolvedAvatar = {
  avatarImageId: number | null;
  avatarUrl: string | null;
};

export async function resolveAvatarForCreate(
  avatarImageId: number | undefined,
): Promise<ResolvedAvatar> {
  if (avatarImageId == null) {
    return { avatarImageId: null, avatarUrl: null };
  }
  const img = await assertImageKind(avatarImageId, ImageKind.avatar);
  return { avatarImageId: img.id, avatarUrl: img.publicUrl };
}

/** Admin PATCH: `undefined` = no change, `null` = clear library avatar (initials). */
export async function resolveAvatarForAdmin(
  avatarImageId: number | null | undefined,
): Promise<ResolvedAvatar | undefined> {
  if (avatarImageId === undefined) return undefined;
  if (avatarImageId === null) return { avatarImageId: null, avatarUrl: null };
  return resolveAvatarForCreate(avatarImageId);
}
