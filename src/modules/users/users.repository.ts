import type { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';

export type UserWithProfile = Prisma.UserGetPayload<{
  include: { profile: true };
}>;

const profileInclude = {
  profile: { include: { avatarImage: true } },
  role: true,
  app: { select: { name: true } },
} as const;

export type UserWithProfileAndRole = Prisma.UserGetPayload<{
  include: typeof profileInclude;
}>;

export type UserWithProfileRoleApp = UserWithProfileAndRole;

export type CreateUserWithProfileInput = {
  appId: number;
  roleId: number;
  email: string;
  passwordHash: string;
  nickname: string;
  isActive?: boolean;
  avatarImageId?: number | null;
  avatarUrl?: string | null;
};

export const usersRepository = {
  async findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByIdWithProfile(id: number): Promise<UserWithProfile | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  },

  async findByIdWithRole(id: number): Promise<UserWithProfileAndRole | null> {
    return prisma.user.findUnique({
      where: { id },
      include: profileInclude,
    });
  },

  async findByEmailAndApp(
    email: string,
    appId: number,
  ): Promise<UserWithProfileAndRole | null> {
    return prisma.user.findUnique({
      where: {
        email_appId: { email, appId },
      },
      include: profileInclude,
    });
  },

  async findProfileByNicknameAndApp(
    appId: number,
    nickname: string,
    excludeUserId?: number,
  ) {
    return prisma.userProfile.findFirst({
      where: {
        appId,
        nickname,
        ...(excludeUserId != null ? { userId: { not: excludeUserId } } : {}),
      },
    });
  },

  async createWithProfile({
    appId,
    roleId,
    email,
    passwordHash,
    nickname,
    isActive = true,
    avatarImageId = null,
    avatarUrl = null,
  }: CreateUserWithProfileInput): Promise<UserWithProfileRoleApp> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          appId,
          roleId,
          email,
          password: passwordHash,
          isActive,
          profile: {
            create: {
              appId,
              nickname,
              avatarImageId,
              avatarUrl,
            },
          },
          progress: {
            create: {
              level: 0,
              xp: 0,
              gamesPlayed: 0,
            },
          },
        },
        include: profileInclude,
      });
      return user;
    });
  },

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
  },

  async updateById(
    userId: number,
    data: {
      email?: string;
      appId?: number;
      roleId?: number;
      nickname?: string;
      isActive?: boolean;
      avatarImageId?: number | null;
      avatarUrl?: string | null;
    },
  ): Promise<UserWithProfileRoleApp> {
    const { nickname, avatarImageId, avatarUrl, ...userData } = data;
    return prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      if (!current) {
        throw new Error('User not found');
      }

      const nextAppId = userData.appId ?? current.appId;
      const nextNickname = nickname ?? current.profile?.nickname;

      if (
        nextNickname !== undefined ||
        userData.appId !== undefined ||
        avatarImageId !== undefined ||
        avatarUrl !== undefined
      ) {
        await tx.userProfile.upsert({
          where: { userId },
          create: {
            userId,
            appId: nextAppId,
            nickname: nextNickname ?? 'User',
            avatarImageId: avatarImageId ?? null,
            avatarUrl: avatarUrl ?? null,
          },
          update: {
            appId: nextAppId,
            ...(nickname !== undefined ? { nickname } : {}),
            ...(avatarImageId !== undefined ? { avatarImageId } : {}),
            ...(avatarUrl !== undefined ? { avatarUrl } : {}),
          },
        });
      }

      return tx.user.update({
        where: { id: userId },
        data: userData,
        include: profileInclude,
      });
    });
  },

  async deleteById(userId: number): Promise<void> {
    await prisma.user.delete({ where: { id: userId } });
  },

  async findManyForAdminList() {
    return prisma.user.findMany({
      include: {
        profile: { include: { avatarImage: true } },
        app: { select: { name: true } },
        role: true,
      },
      orderBy: { id: 'asc' },
    });
  },
};
