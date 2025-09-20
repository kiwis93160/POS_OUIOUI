import categoriesHandler from './categories';
import ingredientsHandler from './ingredients';
import productsHandler from './products';
import purchasesHandler from './purchases';
import recipesHandler from './recipes';
import salesHandler from './sales';
import siteAssetsHandler from './site-assets';
import tablesHandler from './tables';
import { notFound } from '../_shared/response';

type DataHandler = (request: Request) => Promise<Response>;

const ROUTES: Record<string, DataHandler> = {
    categories: categoriesHandler,
    ingredients: ingredientsHandler,
    products: productsHandler,
    purchases: purchasesHandler,
    recipes: recipesHandler,
    sales: salesHandler,
    'site-assets': siteAssetsHandler,
    tables: tablesHandler,
};

const BASE_PATHS = ['/.netlify/functions/data', '/data'];

const stripTrailingSlash = (pathname: string): string => {
    if (pathname.length > 1 && pathname.endsWith('/')) {
        return pathname.replace(/\/+$/, '');
    }
    return pathname;
};

const resolveRouteKey = (pathname: string): string | null => {
    const normalisedPath = stripTrailingSlash(pathname);
    for (const base of BASE_PATHS) {
        if (normalisedPath === base) {
            return null;
        }
        if (normalisedPath.startsWith(`${base}/`)) {
            const remainder = normalisedPath.slice(base.length + 1);
            if (remainder.length === 0 || remainder.includes('/')) {
                return null;
            }
            return remainder;
        }
    }
    return null;
};

export const config = { path: '/data/*' };

export default async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const routeKey = resolveRouteKey(url.pathname);
    if (!routeKey) {
        return notFound();
    }

    const routeHandler = ROUTES[routeKey];
    if (!routeHandler) {
        return notFound();
    }

    return routeHandler(request);
}
