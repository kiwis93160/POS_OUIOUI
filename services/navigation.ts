import { PagePermissions, PermissionLevel } from '../types';

export const getPermissionLevel = (
    permissions: Partial<PagePermissions> | undefined,
    path: string
): PermissionLevel => {
    if (!permissions) {
        return 'none';
    }

    return permissions[path] ?? 'none';
};

export const getDefaultPath = (
    permissions: Partial<PagePermissions> | undefined,
    fallback: string = '/login'
): string => {
    if (getPermissionLevel(permissions, '/') !== 'none') return '/';
    if (getPermissionLevel(permissions, '/ventes') !== 'none') return '/ventes';
    if (getPermissionLevel(permissions, '/cocina') !== 'none') return '/cocina';

    return fallback;
};
