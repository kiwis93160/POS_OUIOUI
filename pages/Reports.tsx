import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import Card from '../components/ui/Card';
import { Download, Filter, Clock } from 'lucide-react';

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${header}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const formatDuration = (start?: string, end?: string): string => {
    if (!start || !end) return 'N/A';
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    if (durationMs < 0) return 'N/A';
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const Reports: React.FC = () => {
    const { ventes, produits, getProduitById, loading } = useRestaurantData();

    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);

    const [startDate, setStartDate] = useState(lastMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [selectedProduitId, setSelectedProduitId] = useState<string>('all');

    const filteredVentes = useMemo(() => {
        return ventes.filter(v => {
            const saleDate = new Date(v.date_vente);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const isDateInRange = saleDate >= start && saleDate <= end;
            const isProductMatch = selectedProduitId === 'all' || v.produit_id === Number(selectedProduitId);
            
            return isDateInRange && isProductMatch;
        });
    }, [ventes, startDate, endDate, selectedProduitId]);

    const reportStats = useMemo(() => {
        const totalVentes = filteredVentes.reduce((sum, v) => sum + v.prix_total_vente, 0);
        const totalBenefices = filteredVentes.reduce((sum, v) => sum + v.benefice_calcule, 0);
        const totalQuantite = filteredVentes.reduce((sum, v) => sum + v.quantite, 0);
        const averageMargin = totalVentes > 0 ? (totalBenefices / totalVentes) * 100 : 0;
        return { totalVentes, totalBenefices, totalQuantite, averageMargin };
    }, [filteredVentes]);

    const groupedOrders = useMemo(() => {
        const commandesMap = new Map<string, {
            date_vente: string;
            table_nom: string;
            produitsMap: Map<number, number>;
            total_vente: number;
            total_benefice: number;
            date_envoi_cuisine?: string;
            date_servido?: string;
        }>();

        for (const vente of filteredVentes) {
            let commande = commandesMap.get(vente.commande_id);

            if (!commande) {
                commande = {
                    date_vente: vente.date_vente,
                    table_nom: vente.table_nom || 'Desconocida',
                    produitsMap: new Map(),
                    total_vente: 0,
                    total_benefice: 0,
                    date_envoi_cuisine: vente.date_envoi_cuisine,
                    date_servido: vente.date_servido,
                };
                commandesMap.set(vente.commande_id, commande);
            }
            
            const currentQty = commande.produitsMap.get(vente.produit_id) || 0;
            commande.produitsMap.set(vente.produit_id, currentQty + vente.quantite);
            
            commande.total_vente += vente.prix_total_vente;
            commande.total_benefice += vente.benefice_calcule;
        }

        return Array.from(commandesMap.values()).sort((a,b) => new Date(b.date_vente).getTime() - new Date(a.date_vente).getTime()).map(cmd => {
            const date = new Date(cmd.date_vente);
            const hour = date.getHours();
            const timeSlot = `${hour}h-${hour + 1}h`;
            
            return {
                id: cmd.date_vente + cmd.table_nom,
                date: date.toLocaleDateString('es-ES'),
                heure: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit'}),
                table: cmd.table_nom,
                produits: Array.from(cmd.produitsMap.entries()).map(([id, qty]) => `${getProduitById(id)?.nom_produit || 'N/A'} x${qty}`),
                totalVente: cmd.total_vente,
                benefice: cmd.total_benefice,
                duration: formatDuration(cmd.date_envoi_cuisine, cmd.date_servido),
                timeSlot: timeSlot,
            };
        });
    }, [filteredVentes, getProduitById]);
    
    const handleExport = () => {
        if (filteredVentes.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }
        
        const sortedVentes = [...filteredVentes].sort((a, b) => {
            if (a.commande_id < b.commande_id) return -1;
            if (a.commande_id > b.commande_id) return 1;
            return new Date(a.date_vente).getTime() - new Date(b.date_vente).getTime();
        });

        let lastCommandeId: string | null = null;
        const dataToExport = sortedVentes.map(vente => {
            const isSameOrderAsPrevious = vente.commande_id === lastCommandeId;
            const date = new Date(vente.date_vente);
            const hour = date.getHours();
            
            const row = {
                fecha: isSameOrderAsPrevious ? '' : date.toLocaleDateString('es-ES'),
                hora: isSameOrderAsPrevious ? '' : date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit'}),
                franja_horaria: isSameOrderAsPrevious ? '' : `${hour}h-${hour + 1}h`,
                mesa: isSameOrderAsPrevious ? '' : vente.table_nom || 'Para Llevar',
                duracion_servicio: isSameOrderAsPrevious ? '' : formatDuration(vente.date_envoi_cuisine, vente.date_servido),
                producto: getProduitById(vente.produit_id)?.nom_produit || 'N/A',
                cantidad: vente.quantite,
                precio_unitario_cop: Math.round(vente.prix_total_vente / vente.quantite),
                total_producto_cop: Math.round(vente.prix_total_vente),
                beneficio_producto_cop: Math.round(vente.benefice_calcule),
            };
            
            lastCommandeId = vente.commande_id;
            
            return row;
        });
        
        exportToCSV(dataToExport, `informe_ventas_detallado_${startDate}_al_${endDate}`);
    };

    if (loading) return <div className="text-center p-8">Cargando informes...</div>;
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Informes y Estadísticas</h1>
            
            <Card title="Filtros" icon={<Filter />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Fecha de inicio</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm sm:text-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Fecha de fin</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm sm:text-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Producto</label>
                        <select value={selectedProduitId} onChange={e => setSelectedProduitId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm sm:text-sm">
                            <option value="all">Todos los productos</option>
                            {produits.map(p => <option key={p.id} value={p.id}>{p.nom_produit}</option>)}
                        </select>
                    </div>
                </div>
            </Card>
            
            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-semibold">Resultados del período</h2>
                     <button onClick={handleExport} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full md:w-auto justify-center">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar a CSV
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Ingresos</p><p className="text-2xl font-bold">{formatCOP(reportStats.totalVentes)}</p></div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Beneficios</p><p className="text-2xl font-bold">{formatCOP(reportStats.totalBenefices)}</p></div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Artículos Vendidos</p><p className="text-2xl font-bold">{reportStats.totalQuantite}</p></div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Margen Promedio</p><p className="text-2xl font-bold">{Math.round(reportStats.averageMargin)} %</p></div>
                </div>
            </Card>
            
            <Card title="Detalle de Pedidos">
                <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 hidden md:table">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                             <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Franja Horaria</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Mesa</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Productos</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Duración</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Venta</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                             {groupedOrders.length > 0 ? groupedOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">{order.date}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-mono">{order.timeSlot}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{order.table}</td>
                                    <td className="px-4 py-4 text-sm"><ul className="list-disc list-inside">{order.produits.map((p, i) => <li key={i}>{p}</li>)}</ul></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-mono flex items-center"><Clock size={14} className="mr-1.5"/>{order.duration}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 dark:text-blue-400">{formatCOP(order.totalVente)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Ningún pedido coincide.</td></tr>
                            )}
                        </tbody>
                    </table>
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {groupedOrders.map(order => (
                            <div key={order.id} className="p-4 rounded-lg shadow bg-white dark:bg-gray-800">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold">{order.table}</h3>
                                    <div className="text-right">
                                        <span className="text-sm text-gray-500">{order.date}</span>
                                        <span className="text-xs font-semibold text-blue-500 block">{order.timeSlot}</span>
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <h4 className="font-semibold">Productos:</h4>
                                    <ul className="list-disc list-inside text-sm">{order.produits.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                </div>
                                <div className="flex justify-between items-center border-t dark:border-gray-700 pt-2 text-sm">
                                    <div>
                                        <p><strong>Total:</strong> <span className="font-semibold text-blue-500">{formatCOP(order.totalVente)}</span></p>
                                    </div>
                                    <div className="font-mono flex items-center text-lg"><Clock size={16} className="mr-1.5"/>{order.duration}</div>
                                </div>
                            </div>
                        ))}
                         {groupedOrders.length === 0 && <p className="text-center py-8 text-gray-500">Ningún pedido coincide.</p>}
                    </div>
                </div>
            </Card>

        </div>
    );
};

export default Reports;