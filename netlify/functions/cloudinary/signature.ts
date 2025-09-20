import { generateUploadSignature, isCloudinaryConfigured } from '../_shared/cloudinary';
import { jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/cloudinary/signature' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
        return methodNotAllowed(['POST']);
    }

    if (!isCloudinaryConfigured()) {
        return jsonResponse({ message: 'Cloudinary is not configured' }, { status: 500 });
    }

    try {
        const payload = generateUploadSignature();
        return jsonResponse(payload);
    } catch (error) {
        console.error('cloudinary/signature: failed to generate signature', error);
        return jsonResponse({ message: 'Unable to generate signature' }, { status: 500 });
    }
}
