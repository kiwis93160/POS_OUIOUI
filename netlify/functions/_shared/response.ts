export const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
    new Response(JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json',
            ...(init.headers ?? {}),
        },
        ...init,
    });

export const methodNotAllowed = (allowed: string[]): Response =>
    new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
        status: 405,
        headers: {
            'Content-Type': 'application/json',
            Allow: allowed.join(', '),
        },
    });

export const badRequest = (message: string): Response =>
    jsonResponse({ message }, { status: 400 });

export const notFound = (message = 'Not Found'): Response =>
    jsonResponse({ message }, { status: 404 });

export const internalError = (message = 'Unexpected server error'): Response =>
    jsonResponse({ message }, { status: 500 });

export const parseJson = async <T>(request: Request): Promise<T> => {
    try {
        return (await request.json()) as T;
    } catch (error) {
        throw new Error('Invalid JSON body');
    }
};
