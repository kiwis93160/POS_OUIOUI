const NETLIFY_FUNCTIONS_BASE = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE ?? '/.netlify/functions';

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export const isCloudinaryConfigured = (): boolean => Boolean(cloudName && uploadPreset);

export const getCloudinaryCloudName = (): string | undefined => cloudName;

export const getCloudinaryUploadPreset = (): string | undefined => uploadPreset;

export const buildCloudinaryImageUrl = (publicId: string, transformations = 'f_auto,q_auto'): string => {
    if (!cloudName) {
        throw new Error('Cloudinary cloud name is not configured.');
    }

    const normalizedId = publicId.replace(/^\/+/, '');
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${normalizedId}`;
};

export const requestCloudinaryUploadSignature = async (): Promise<{ signature: string; timestamp: number }> => {
    const response = await fetch(`${NETLIFY_FUNCTIONS_BASE}/cloudinary/signature`, { method: 'POST' });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Unable to obtain Cloudinary upload signature.');
    }
    return response.json();
};
