import React, { useMemo, useState } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import Card from '../components/ui/Card';
import type { Vente } from '../types';
import { Eye, X } from 'lucide-react';

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

interface CommandeHistorique {
  commande_id: string;
  date_vente: string;
  table_nom: string;
  total_vente: number;
  total_cout: number;
  total_benefice: number;
  items: Vente[];
}

const DetailsModal: React.FC<{ 
    commande: CommandeHistorique, 
    onClose: () => void,
    getProduitById: (id: number) => any
}> = ({ commande, onClose, getProduitById }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Detalles del pedido</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>ID Pedido:</strong> {commande.commande_id}</p>
                    <p><strong>Fecha:</strong> {new Date(commande.date_vente).toLocaleString('es-ES')}</p>
                    <p><strong>Mesa:</strong> {commande.table_nom}</p>
                </div>

                <div className="flex-grow overflow-y-auto border-t border-b dark:border-gray-700">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Producto</th>
                                <th className="py-2 px-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cant.</th>
                                <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Costo</th>
                                <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Beneficio</th>
                                <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Precio Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {commande.items.map(item => {
                                const produit = getProduitById(item.produit_id);
                                return (
                                    <tr key={item.id}>
                                        <td className="py-3 px-4 font-medium">{produit?.nom_produit || 'Producto eliminado'}</td>
                                        <td className="py-3 px-4 text-center">{item.quantite}</td>
                                        <td className="py-3 px-4 text-right text-orange-500">{formatCOP(item.cout_total_calcule)}</td>
                                        <td className="py-3 px-4 text-right font-semibold text-green-500">{formatCOP(item.benefice_calcule)}</td>
                                        <td className="py-3 px-4 text-right">{formatCOP(item.prix_total_vente)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 pt-4 border-t dark:border-gray-600 space-y-2 text-right font-semibold">
                    <p>Total Venta: <span className="text-blue-500">{formatCOP(commande.total_vente)}</span></p>
                    <p>Costo Total: <span className="text-orange-500">{formatCOP(commande.total_cout)}</span></p>
                    <p>Beneficio Total: <span className="text-green-500">{formatCOP(commande.total_benefice)}</span></p>
                </div>

                 <div className="flex justify-end mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cerrar</button>
                </div>
            </Card>
        </div>
    );
};

const History: React.FC = () => {
    const { ventes, getProduitById, loading } = useRestaurantData();
    const [selectedCommande, setSelectedCommande] = useState<CommandeHistorique | null>(null);

    const commandesHistorique = useMemo(() => {
        if (!ventes.length) return [];
        
        const sortedVentes = [...ventes].sort((a, b) => new Date(b.date_vente).getTime() - new Date(a.date_vente).getTime());

        const commandesMap = new Map<string, CommandeHistorique>();

        sortedVentes.forEach(vente => {
            if (!vente.commande_id) return; // Ignorer les anciennes données sans ID de commande
            
            if (!commandesMap.has(vente.commande_id)) {
                commandesMap.set(vente.commande_id, {
                    commande_id: vente.commande_id,
                    date_vente: vente.date_vente,
                    table_nom: vente.table_nom || 'Desconocida',
                    total_vente: 0,
                    total_cout: 0,
                    total_benefice: 0,
                    items: []
                });
            }
            const commande = commandesMap.get(vente.commande_id)!;
            commande.total_vente += vente.prix_total_vente;
            commande.total_cout += vente.cout_total_calcule;
            commande.total_benefice += vente.benefice_calcule;
            commande.items.push(vente);
        });

        return Array.from(commandesMap.values());
    }, [ventes]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Historial de Ventas</h1>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 hidden md:table">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                             <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha y Hora</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mesa</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Venta</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Costo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Beneficio</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-8">Cargando historial...</td></tr>
                            ) : commandesHistorique.length === 0 ? (
                                 <tr><td colSpan={6} className="text-center py-8 text-gray-500">No hay pedidos finalizados.</td></tr>
                            ) : (
                                commandesHistorique.map((commande) => (
                                    <tr key={commande.commande_id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(commande.date_vente).toLocaleString('es-ES')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{commande.table_nom}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-blue-600 dark:text-blue-400">{formatCOP(commande.total_vente)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 dark:text-orange-400">{formatCOP(commande.total_cout)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">{formatCOP(commande.total_benefice)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button onClick={() => setSelectedCommande(commande)} className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <Eye size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                     <div className="grid grid-cols-1 gap-4 md:hidden">
                        {loading ? (
                            <p className="text-center py-8">Cargando historial...</p>
                        ) : commandesHistorique.length === 0 ? (
                            <p className="text-center py-8 text-gray-500">No hay pedidos finalizados.</p>
                        ) : (
                            commandesHistorique.map((commande) => (
                                <div key={commande.commande_id} className="p-4 rounded-lg shadow bg-white dark:bg-gray-800">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{commande.table_nom}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(commande.date_vente).toLocaleString('es-ES')}</p>
                                        </div>
                                        <button onClick={() => setSelectedCommande(commande)} className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <Eye size={20} />
                                        </button>
                                    </div>
                                    <div className="mt-4 pt-2 border-t dark:border-gray-700 text-sm">
                                        <p><strong>Total:</strong> <span className="font-semibold text-blue-500">{formatCOP(commande.total_vente)}</span></p>
                                        <p><strong>Costo:</strong> <span className="text-orange-500">{formatCOP(commande.total_cout)}</span></p>
                                        <p><strong>Beneficio:</strong> <span className="font-semibold text-green-500">{formatCOP(commande.total_benefice)}</span></p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Card>
            {selectedCommande && (
                <DetailsModal 
                    commande={selectedCommande} 
                    onClose={() => setSelectedCommande(null)}
                    getProduitById={getProduitById}
                />
            )}
        </div>
    );
};

export default History;