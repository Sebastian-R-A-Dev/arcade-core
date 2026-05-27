export const IMAGE_KIND_GENERIC = 'generic' as const;
export const IMAGE_KIND_AVATAR = 'avatar' as const;

export const IMAGE_KINDS = [IMAGE_KIND_GENERIC, IMAGE_KIND_AVATAR] as const;
export type ImageKindSlug = (typeof IMAGE_KINDS)[number];
