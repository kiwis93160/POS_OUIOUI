import type { PagePermissions, PermissionLevel } from './types';

export const APP_ROUTE_ORDER = [
    '/',
    '/ingredients',
    '/produits',
    '/ventes',
    '/para-llevar',
    '/cocina',
    '/historique',
    '/rapports',
    '/site-editor',
] as const;

const hasRouteAccess = (path: string, level: PermissionLevel | undefined): boolean => {
    if (path === '/site-editor') {
        return level === 'editor';
    }

    return level === 'editor' || level === 'readonly';
};

export const resolveDefaultRoute = (permissions?: PagePermissions | null): string => {
    if (!permissions) {
        return '/login';
    }

    for (const path of APP_ROUTE_ORDER) {
        if (hasRouteAccess(path, permissions[path])) {
            return path;
        }
    }

    return '/login';
};
