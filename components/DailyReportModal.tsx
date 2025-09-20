import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import Card from './ui/Card';
import { X, Loader2, MessageCircle } from 'lucide-react';
import type { DailyReportData } from '../types';

interface DailyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose }) => {
    const { generateDailyReportData } = useRestaurantData();
    const [reportData, setReportData] = useState<DailyReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            generateDailyReportData()
                .then(data => {
                    setReportData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error generating report:", err);
                    setLoading(false);
                });
        }
    }, [isOpen, generateDailyReportData]);

    const formatReportForWhatsapp = (data: DailyReportData): string => {
        let message = `*📊 Rapport Journalier - ${data.generationDate}*\n\n`;
        message += `*💰 Ventes Totales:* ${formatCOP(data.totalSales)}\n`;
        message += `*👥 Clients Servis:* ${data.customerCount}\n\n`;

        message += `*👨‍🍳 Actividad del Personal:*\n`;
        message += `  - Première connexion Cuisine: ${data.staffActivity.cocinaFirstLogin || 'N/A'}\n`;
        message += `  - Première connexion Serveur: ${data.staffActivity.meseroFirstLogin || 'N/A'}\n\n`;

        message += `*📦 Produits Vendus:*\n`;
        if(data.productsSold.length > 0) {
            data.productsSold.forEach(category => {
                message += `\n*-- ${category.categoryName} --*\n`;
                category.items.forEach(item => {
                    message += `  - ${item.quantity}x ${item.productName}\n`;
                });
            });
        } else {
            message += `_Aucun produit vendu._\n`;
        }


        message += `\n*📈 État de l'Inventaire:*\n`;
        message += `  - Ingrédients en stock bas: ${data.inventoryStatus.lowStockIngredients}\n`;
        if (data.inventoryStatus.lowStockIngredientsDetails.length > 0) {
            message += `  *Détail:*\n`;
            data.inventoryStatus.lowStockIngredientsDetails.forEach(ing => {
                message += `    - ${ing.nom}`;
                if (ing.date_below_minimum) {
                    message += ` (desde el ${new Date(ing.date_below_minimum).toLocaleDateString('es-ES')})\n`;
                } else {
                    message += '\n';
                }
            });
        }
        
        return message;
    };

    const handleSendToWhatsapp = () => {
        if (!reportData) return;
        const message = formatReportForWhatsapp(reportData);
        const phoneNumber = '573226314841'; // As requested
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Rapport du Jour</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button>
                </div>
                {loading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : reportData ? (
                    <>
                        <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4 text-sm">
                            <p><strong>Généré le:</strong> {reportData.generationDate}</p>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <p className="font-semibold text-gray-500 dark:text-gray-400">Ventes du jour</p>
                                    <p className="text-xl font-bold">{formatCOP(reportData.totalSales)}</p>
                                </div>
                                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <p className="font-semibold text-gray-500 dark:text-gray-400">Clients</p>
                                    <p className="text-xl font-bold">{reportData.customerCount}</p>
                                </div>
                            </div>
                             <div>
                                <h3 className="font-bold text-lg mb-2">Actividad del Personal</h3>
                                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-1">
                                    <p><strong>Première connexion Cuisine:</strong> {reportData.staffActivity.cocinaFirstLogin || 'N/A'}</p>
                                    <p><strong>Première connexion Serveur:</strong> {reportData.staffActivity.meseroFirstLogin || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-2">Produits Vendus</h3>
                                {reportData.productsSold.length > 0 ? reportData.productsSold.map(category => (
                                    <div key={category.categoryName} className="mb-2">
                                        <p className="font-semibold text-blue-600 dark:text-blue-400">{category.categoryName}</p>
                                        <ul className="list-disc list-inside pl-2 text-gray-700 dark:text-gray-300">
                                            {category.items.map(item => (
                                                <li key={item.productName}>{item.quantity}x {item.productName}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )) : <p className="text-gray-500">Aucun produit vendu aujourd'hui.</p>}
                            </div>
                             <div>
                                <h3 className="font-bold text-lg mb-2">État de l'Inventaire</h3>
                                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <p><strong>Ingrédients en stock bas:</strong> <span className={reportData.inventoryStatus.lowStockIngredients > 0 ? "text-red-500 font-bold" : ""}>{reportData.inventoryStatus.lowStockIngredients}</span></p>
                                    {reportData.inventoryStatus.lowStockIngredientsDetails.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs">
                                            <ul className="list-disc list-inside">
                                                {reportData.inventoryStatus.lowStockIngredientsDetails.map(ing => (
                                                    <li key={ing.nom}>
                                                        {ing.nom} 
                                                        {ing.date_below_minimum && 
                                                            <span className="text-gray-500 dark:text-gray-400"> (desde el {new Date(ing.date_below_minimum).toLocaleDateString('es-ES')})</span>
                                                        }
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t dark:border-gray-600 flex justify-end">
                            <button onClick={handleSendToWhatsapp} className="flex items-center px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600">
                                <MessageCircle size={18} className="mr-2" /> Envoyer par WhatsApp
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-red-500">Impossible de générer le rapport.</p>
                )}
            </Card>
        </div>
    );
};

export default DailyReportModal;