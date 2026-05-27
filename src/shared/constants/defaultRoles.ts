/** Catálogo inicial de roles globales. */
export const DEFAULT_ROLES = [
  { slug: 'administrator', label: 'Administrator' },
  { slug: 'player', label: 'Player' },
] as const;

export const ROLE_SLUG_ADMINISTRATOR = 'administrator' as const;
export const ROLE_SLUG_PLAYER = 'player' as const;

export type DefaultRoleSlug = (typeof DEFAULT_ROLES)[number]['slug'];
