import { getSupabaseClient } from './_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from './_shared/response';
import { generateUploadSignature, isCloudinaryConfigured, uploadImageToCloudinary } from './_shared/cloudinary';

export const config = { path: '/site-assets' };

interface SiteAssetJsonPayload {
    key: string;
    data: string;
}

const getTableName = () => process.env.SUPABASE_SITE_ASSETS_TABLE ?? process.env.VITE_SUPABASE_SITE_ASSETS_TABLE ?? 'site_assets';

export default async function handler(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204 });
    }

    if (request.method !== 'PUT') {
        return methodNotAllowed(['PUT']);
    }

    const contentType = request.headers.get('content-type') ?? '';
    const supabase = (() => {
        try {
            return getSupabaseClient();
        } catch (error) {
            console.error('site-assets: Supabase configuration error', error);
            throw new Error('Server configuration error');
        }
    })();

    const tableName = getTableName();

    try {
        if (contentType.includes('application/json')) {
            let payload: SiteAssetJsonPayload;
            try {
                payload = await parseJson<SiteAssetJsonPayload>(request);
            } catch (error) {
                return badRequest('Invalid JSON body');
            }

            if (!payload.key || typeof payload.data !== 'string') {
                return badRequest('Missing asset key or data');
            }

            const { error } = await supabase
                .from(tableName)
                .upsert({ key: payload.key, value: payload.data }, { onConflict: 'key' });

            if (error) {
                console.error('site-assets: Supabase upsert error', error);
                return internalError('Unable to save asset');
            }

            return new Response(null, { status: 204 });
        }

        const formData = await request.formData();
        const key = formData.get('key');
        const file = formData.get('image');

        if (typeof key !== 'string' || !(file instanceof File)) {
            return badRequest('Missing form fields for asset upload');
        }

        if (!isCloudinaryConfigured()) {
            try {
                const buffer = Buffer.from(await file.arrayBuffer());
                const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
                const { error } = await supabase
                    .from(tableName)
                    .upsert({ key, value: dataUrl }, { onConflict: 'key' });
                if (error) {
                    console.error('site-assets: Supabase upsert error (base64 fallback)', error);
                    return internalError('Unable to save asset');
                }
                return new Response(null, { status: 204 });
            } catch (error) {
                console.error('site-assets: base64 fallback failed', error);
                return internalError();
            }
        }

        try {
            // Ensure signature generation throws early if configuration missing
            generateUploadSignature();
        } catch (error) {
            console.error('site-assets: Cloudinary configuration error', error);
            return internalError('Media storage is not configured');
        }

        const uploadResult = await uploadImageToCloudinary(file, { folder: 'site-assets' });

        const { error } = await supabase
            .from(tableName)
            .upsert({ key, value: uploadResult.secure_url }, { onConflict: 'key' });

        if (error) {
            console.error('site-assets: Supabase upsert error (cloudinary)', error);
            return internalError('Unable to save asset');
        }

        return jsonResponse({ publicId: uploadResult.public_id, url: uploadResult.secure_url });
    } catch (error) {
        if (error instanceof Error && error.message === 'Server configuration error') {
            return internalError(error.message);
        }
        console.error('site-assets: unexpected error', error);
        return internalError();
    }
}
