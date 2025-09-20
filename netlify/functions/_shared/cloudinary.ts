import crypto from 'node:crypto';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? process.env.VITE_CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET ?? process.env.VITE_CLOUDINARY_API_SECRET;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET ?? process.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = (): boolean =>
    Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

const buildSignature = (params: Record<string, string>): string => {
    const sorted = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    return crypto.createHash('sha1').update(`${sorted}${CLOUDINARY_API_SECRET}`).digest('hex');
};

export const generateUploadSignature = () => {
    if (!isCloudinaryConfigured()) {
        throw new Error('Cloudinary credentials are not configured.');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const params: Record<string, string> = { timestamp: `${timestamp}` };
    if (CLOUDINARY_UPLOAD_PRESET) {
        params.upload_preset = CLOUDINARY_UPLOAD_PRESET;
    }
    const signature = buildSignature(params);
    return {
        signature,
        timestamp,
        apiKey: CLOUDINARY_API_KEY,
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
    };
};

export interface UploadImageOptions {
    folder?: string;
}

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
}

export const uploadImageToCloudinary = async (file: File, options: UploadImageOptions = {}): Promise<CloudinaryUploadResult> => {
    if (!isCloudinaryConfigured()) {
        throw new Error('Cloudinary credentials are not configured.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Math.floor(Date.now() / 1000);
    const params: Record<string, string> = { timestamp: `${timestamp}` };
    if (options.folder) {
        params.folder = options.folder;
    }
    if (CLOUDINARY_UPLOAD_PRESET) {
        params.upload_preset = CLOUDINARY_UPLOAD_PRESET;
    }

    const signature = buildSignature(params);

    const formData = new FormData();
    formData.append('file', new Blob([buffer]), file.name || 'upload.jpg');
    formData.append('api_key', CLOUDINARY_API_KEY!);
    formData.append('timestamp', `${timestamp}`);
    formData.append('signature', signature);
    if (options.folder) {
        formData.append('folder', options.folder);
    }
    if (CLOUDINARY_UPLOAD_PRESET) {
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Cloudinary upload failed: ${errorBody}`);
    }

    const payload = (await response.json()) as CloudinaryUploadResult;
    return payload;
};
