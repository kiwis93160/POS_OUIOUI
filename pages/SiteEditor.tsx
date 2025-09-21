import React, { useState } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import Card from '../components/ui/Card';
import { Upload, RotateCcw, Image as ImageIcon, Loader2, Download, Aperture } from 'lucide-react';
import { defaultImageAssets } from '../components/ImageAssets';

const resizeImage = (file: File, maxWidth: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
             if (!event.target?.result) {
                return reject(new Error("No se pudo leer el archivo de imagen."));
            }
            img.src = event.target.result as string;
            img.onload = () => {
                if (img.width <= maxWidth) {
                    resolve(file);
                    return;
                }

                const canvas = document.createElement('canvas');
                const scale = maxWidth / img.width;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('No se pudo obtener el contexto del lienzo.'));
                }

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpeg";
                        const resizedFile = new File([blob], newFileName, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(resizedFile);
                    } else {
                        reject(new Error('La conversión de lienzo a Blob falló.'));
                    }
                }, 'image/jpeg', 0.85); // Comprimir a JPEG con 85% de calidad
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const SiteEditor: React.FC = () => {
    const { siteAssets, updateSiteAsset, refreshData, loading } = useRestaurantData();
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingBackground, setIsUploadingBackground] = useState(false);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, handler: (file: File) => void) => {
        if (e.target.files && e.target.files[0]) {
            handler(e.target.files[0]);
        }
    };

    // --- LOGO HANDLERS ---
    const handleLogoUpload = async (file: File) => {
        setIsUploadingLogo(true);
        try {
            const resizedFile = await resizeImage(file, 512);
            await updateSiteAsset('restaurantLogo', resizedFile);
        } catch (error) {
            console.error("Erreur lors du téléchargement du logo :", error);
            alert("Une erreur est survenue. Le logo est peut-être trop grand ou dans un format non pris en charge.");
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleLogoReset = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir réinitialiser le logo par défaut ?")) {
            setIsUploadingLogo(true);
            try {
                await updateSiteAsset('restaurantLogo', defaultImageAssets.restaurantLogo);
                await refreshData();
            } catch (error) {
                console.error("Erreur lors de la réinitialisation du logo :", error);
            } finally {
                setIsUploadingLogo(false);
            }
        }
    };

    // --- BACKGROUND HANDLERS ---
    const handleBackgroundUpload = async (file: File) => {
        setIsUploadingBackground(true);
        try {
            const resizedFile = await resizeImage(file, 1920);
            await updateSiteAsset('landingPageBackground', resizedFile);
        } catch (error) {
            console.error("Erreur lors du téléchargement de l'image de fond :", error);
            alert("Une erreur est survenue. L'image est peut-être trop grande ou dans un format non pris en charge.");
        } finally {
            setIsUploadingBackground(false);
        }
    };
    
    const handleBackgroundReset = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir réinitialiser l'image de fond par défaut ?")) {
            setIsUploadingBackground(true);
            try {
                await updateSiteAsset('landingPageBackground', defaultImageAssets.landingPageBackground);
                await refreshData();
            } catch (error) {
                console.error("Erreur lors de la réinitialisation de l'image de fond :", error);
            } finally {
                setIsUploadingBackground(false);
            }
        }
    };
    
    const handleDownloadTemplate = () => {
        const width = 1920;
        const height = 3000;
        const safeMargin = 100;
        const safeWidth = width - (safeMargin * 2);
        const safeHeight = height - (safeMargin * 2);

        const svgContent = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #f0f0f0;">
    <style>
        .title { font-family: 'Arial', sans-serif; font-size: 48px; font-weight: bold; fill: #333; }
        .subtitle { font-family: 'Arial', sans-serif; font-size: 24px; fill: #555; }
        .text { font-family: 'Arial', sans-serif; font-size: 18px; fill: #666; }
        .box { stroke: #aaa; stroke-width: 2; fill: rgba(0, 0, 0, 0.05); }
        .button { stroke: #f00; stroke-width: 3; fill: rgba(255, 0, 0, 0.1); }
        .safe-zone { stroke: #00f; stroke-width: 4; stroke-dasharray: 15, 10; fill: none; }
        .info-text { font-family: 'Arial', sans-serif; font-size: 20px; font-weight: bold; fill: #00f; }
    </style>
    
    <text x="${width/2}" y="60" text-anchor="middle" class="title">Modèle d'Arrière-plan (1920x3000px)</text>
    <text x="${width/2}" y="100" text-anchor="middle" class="subtitle">NE PAS INCLURE CE TEXTE/CADRE DANS LE DESIGN FINAL</text>

    <!-- Zone de Sécurité -->
    <rect x="${safeMargin}" y="${safeMargin}" width="${safeWidth}" height="${safeHeight}" class="safe-zone" />
    <text x="${width/2}" y="${safeMargin + 40}" text-anchor="middle" class="info-text">ZONE DE SÉCURITÉ : Gardez les textes &amp; visuels importants ici.</text>
    <text x="${width/2}" y="${height - safeMargin - 20}" text-anchor="middle" class="info-text">Les éléments hors de ce cadre могут быть обрезаны на маленьких экранах.</text>

    <!-- Header Section -->
    <rect x="0" y="0" width="${width}" height="80" class="box" />
    <text x="100" y="50" class="subtitle">Logo &amp; Titre</text>
    <text x="${width - 400}" y="50" class="text">Navigation: Accueil | Conócenos | Menú | Contacto</text>
    <text x="${width - 100}" y="50" class="text">Connexion</text>

    <!-- Hero Section -->
    <rect x="0" y="80" width="${width}" height="800" class="box" />
    <text x="${width/2}" y="200" text-anchor="middle" class="subtitle">Zone d'Accueil</text>
    
    <!-- Zone des boutons d'action -->
    <rect x="${(width/2) - 350}" y="450" width="300" height="60" rx="30" class="button" />
    <text x="${(width/2) - 200}" y="490" text-anchor="middle" fill="#f00">Bouton 'Explorer le Menu'</text>
    <rect x="${(width/2) + 50}" y="450" width="300" height="60" rx="30" class="button" />
    <text x="${(width/2) + 200}" y="490" text-anchor="middle" fill="#f00">Bouton 'Pedir Ahora'</text>
    
    <!-- Zone de l'historique des commandes -->
    <rect x="${(width/2) - 250}" y="550" width="500" height="200" class="box" />
    <text x="${width/2}" y="650" text-anchor="middle" class="text">Zone "Mes Commandes"</text>
    
    <!-- Section Conócenos -->
    <rect x="0" y="900" width="${width}" height="500" class="box" />
    <text x="${width/2}" y="980" text-anchor="middle" class="title">Conócenos</text>

    <!-- Section Nuestro Menú -->
    <rect x="0" y="1450" width="${width}" height="600" class="box" />
    <text x="${width/2}" y="1530" text-anchor="middle" class="title">Nuestro Menú</text>

    <!-- Section Contacto -->
    <rect x="0" y="2100" width="${width}" height="400" class="box" />
    <text x="${width/2}" y="2180" text-anchor="middle" class="title">Contacto</text>
</svg>`;
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_background_1920x3000.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Éditeur du Site</h1>
            
            <Card>
                <div className="relative">
                    <h2 className="text-2xl font-semibold mb-2">Logo du Restaurant</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Téléchargez le logo de votre restaurant. Il sera affiché sur la page d'accueil et dans la barre de navigation.
                    </p>
                    <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center mb-6 overflow-hidden">
                        {siteAssets.restaurantLogo ? (
                            <img src={siteAssets.restaurantLogo} alt="Aperçu du logo" className="w-full h-full object-contain p-4" />
                        ) : (
                            <Aperture className="w-16 h-16 text-gray-400" />
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                        <label className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer w-full sm:w-auto">
                            <Upload className="w-4 h-4 mr-2" />
                            <span>Changer le logo</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, handleLogoUpload)} />
                        </label>
                         <button 
                            onClick={handleLogoReset}
                            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 w-full sm:w-auto"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Réinitialiser
                        </button>
                    </div>
                    {isUploadingLogo && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center rounded-md">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <div className="relative">
                    <h2 className="text-2xl font-semibold mb-2">Arrière-plan de la Page d'Accueil</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Téléchargez une seule image (PNG, JPG) qui servira de fond pour toute la page d'accueil.
                        Cette image défilera avec le contenu.
                    </p>
                    <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center mb-6 overflow-hidden">
                        {siteAssets.landingPageBackground ? (
                            <img src={siteAssets.landingPageBackground} alt="Aperçu de l'arrière-plan" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="w-16 h-16 text-gray-400" />
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                        <label className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer w-full sm:w-auto">
                            <Upload className="w-4 h-4 mr-2" />
                            <span>Changer l'image</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, handleBackgroundUpload)} />
                        </label>
                         <button 
                            onClick={handleBackgroundReset}
                            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 w-full sm:w-auto"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Réinitialiser
                        </button>
                        <button 
                            onClick={handleDownloadTemplate}
                            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full sm:w-auto"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger le Modèle
                        </button>
                    </div>
                    {isUploadingBackground && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center rounded-md">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default SiteEditor;
