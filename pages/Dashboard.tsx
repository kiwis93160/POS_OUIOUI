import React, { useMemo, useState } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import Card from '../components/ui/Card';
import { DollarSign, BarChart2, Package, CalendarDays, Users, Table, Soup } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import UserManagementModal from '../components/UserManagementModal';

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));
const formatNumber = (value: number) => new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

const formatK = (value: number): string => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1).replace('.0', '')}M`;
    }
    if (value >= 1000) {
        return `${Math.round(value / 1000)}k`;
    }
    return Math.round(value).toString();
};

const CustomLegendWithTitle = (props: any) => {
    const { payload } = props;
    return (
        <div className="flex flex-col items-start justify-center h-full pl-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Distribución de ventas por producto</h3>
            <ul className="space-y-2">
                {payload.map((entry: any, index: number) => (
                    <li key={`item-${index}`} className="flex items-center text-sm w-full">
                        <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-600 dark:text-gray-400 flex-1">{entry.value}</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCOP(entry.payload.value)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const Dashboard: React.FC = () => {
    const { ingredients, ventes, loading, getProduitById, userRole, tables, kitchenOrders } = useRestaurantData();
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const stats = useMemo(() => {
        const totalVentes = ventes.reduce((sum, v) => sum + v.prix_total_vente, 0);
        const totalBenefices = ventes.reduce((sum, v) => sum + v.benefice_calcule, 0);
        
        const inHouseTables = tables.filter(t => t.id < 90);
        const occupiedTables = inHouseTables.filter(t => t.statut === 'occupee').length;
        const totalTables = inHouseTables.length;
        const currentGuests = inHouseTables.reduce((acc, t) => acc + (t.couverts || 0), 0);
        const ordersInKitchen = kitchenOrders.length;
        const readyOrders = inHouseTables.filter(t => t.isReady).length;

        return { totalVentes, totalBenefices, occupiedTables, totalTables, currentGuests, ordersInKitchen, readyOrders };
    }, [ventes, tables, kitchenOrders]);

    const comparisonSalesByDay = useMemo(() => {
        const today = new Date();
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - i);
            return {
                name: d.toLocaleDateString('es-ES', { weekday: 'short' }),
                Ventas: 0,
                Beneficios: 0,
                'Ventas S-1': 0,
                'Beneficios S-1': 0,
            };
        }).reverse();

        const dayMap = new Map<string, typeof days[0]>();
        days.forEach(day => dayMap.set(day.name, day));

        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(today.getDate() - 14);
        fourteenDaysAgo.setHours(0, 0, 0, 0);

        ventes.forEach(v => {
            const saleDate = new Date(v.date_vente);
            if (saleDate >= fourteenDaysAgo) {
                const diffTime = today.getTime() - saleDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
                const dayName = saleDate.toLocaleDateString('es-ES', { weekday: 'short' });
                
                const dayData = dayMap.get(dayName);
                if (dayData) {
                    if (diffDays < 7) {
                        dayData.Ventas = Math.round(dayData.Ventas + v.prix_total_vente);
                        dayData.Beneficios = Math.round(dayData.Beneficios + v.benefice_calcule);
                    } else if (diffDays < 14) {
                        dayData['Ventas S-1'] = Math.round(dayData['Ventas S-1'] + v.prix_total_vente);
                        dayData['Beneficios S-1'] = Math.round(dayData['Beneficios S-1'] + v.benefice_calcule);
                    }
                }
            }
        });

        return Array.from(dayMap.values());
    }, [ventes]);

    const monthlySalesComparisonData = useMemo(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        const prevMonthDate = new Date(currentYear, currentMonth, 1);
        prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        const prevMonthYear = prevMonthDate.getFullYear();
        const prevMonth = prevMonthDate.getMonth();

        const maxDays = 31;
        const results = Array.from({ length: maxDays }, (_, i) => ({
            name: `${i + 1}`,
            'Mes Actual': 0,
            'Mes Anterior': 0,
        }));

        ventes.forEach(v => {
            const saleDate = new Date(v.date_vente);
            const saleYear = saleDate.getFullYear();
            const saleMonth = saleDate.getMonth();
            const dayOfMonth = saleDate.getDate();

            if (saleYear === currentYear && saleMonth === currentMonth) {
                results[dayOfMonth - 1]['Mes Actual'] = Math.round(results[dayOfMonth - 1]['Mes Actual'] + v.prix_total_vente);
            } else if (saleYear === prevMonthYear && saleMonth === prevMonth) {
                results[dayOfMonth - 1]['Mes Anterior'] = Math.round(results[dayOfMonth - 1]['Mes Anterior'] + v.prix_total_vente);
            }
        });

        const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        return results.slice(0, daysInCurrentMonth);
    }, [ventes]);


    const salesByProduct = useMemo(() => {
        const productSales = new Map<string, number>();
        ventes.forEach(v => {
            const produit = getProduitById(v.produit_id);
            if (produit) {
                const currentSales = productSales.get(produit.nom_produit) || 0;
                productSales.set(produit.nom_produit, Math.round(currentSales + v.prix_total_vente));
            }
        });
        return Array.from(productSales.entries()).map(([name, value]) => ({ name, value }));
    }, [ventes, getProduitById]);
    
    const lowStockIngredients = useMemo(() => {
        return ingredients
            .filter(i => i.stock_actuel <= i.stock_minimum)
            .sort((a, b) => {
                if (a.date_below_minimum && b.date_below_minimum) {
                    return new Date(a.date_below_minimum).getTime() - new Date(b.date_below_minimum).getTime();
                }
                if (a.date_below_minimum) return -1;
                if (b.date_below_minimum) return 1;
                return 0;
            });
    }, [ingredients]);

    if (loading) return <div className="text-center p-8">Cargando datos...</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0', '#00D9E9', '#FF66C3', '#4CAF50'];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 bg-opacity-80 p-4 rounded-md border border-gray-600">
                    <p className="label text-white font-bold">{`Día ${label}`}</p>
                    {payload.map((pld: any) => (
                         <p key={pld.name} style={{ color: pld.color }}>{`${pld.name}: ${formatCOP(pld.value)}`}</p>
                    ))}
                </div>
            );
        }
        return null;
    };


    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Panel de Control</h1>
                {userRole === 'admin' && (
                    <button onClick={() => setIsUserModalOpen(true)} className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 w-full md:w-auto justify-center">
                        <Users className="w-5 h-5 mr-2" />
                        Gestionar Usuarios
                    </button>
                )}
            </div>

            <Card title="Statut Actuel">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                        <Table size={24} className="mx-auto text-blue-500 mb-1"/>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tables Occupées</p>
                        <p className="text-2xl font-bold">{stats.occupiedTables} / {stats.totalTables}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                        <Users size={24} className="mx-auto text-green-500 mb-1"/>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Clients Actuels</p>
                        <p className="text-2xl font-bold">{stats.currentGuests}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                        <Soup size={24} className="mx-auto text-orange-500 mb-1"/>
                            <p className="text-xs text-gray-500 dark:text-gray-400">En Cuisine</p>
                        <p className="text-2xl font-bold">{stats.ordersInKitchen}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                            <Soup size={24} className="mx-auto text-red-500 mb-1"/>
                            <p className="text-xs text-red-600 dark:text-red-400">Commandes Prêtes</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.readyOrders}</p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card title="Ingresos Totales (Histórico)" icon={<DollarSign />}>
                    <p className="text-4xl font-bold text-green-500">{formatCOP(stats.totalVentes)}</p>
                </Card>
                <Card title="Beneficio Total (Histórico)" icon={<BarChart2 />}>
                    <p className="text-4xl font-bold text-blue-500">{formatCOP(stats.totalBenefices)}</p>
                </Card>
                <Card title="Estado del Inventario" icon={<Package />}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="text-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                                    <p className="text-xl font-bold">{ingredients.length}</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                                    <p className="text-xs text-red-600 dark:text-red-400">Bajo Mínimo</p>
                                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{lowStockIngredients.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                                {lowStockIngredients.length > 0 && (
                                <div>
                                    <div className="grid grid-cols-3 gap-2 px-1 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400 border-b dark:border-gray-600 mb-1">
                                        <span>Fecha</span>
                                        <span>Ingrediente</span>
                                        <span className="text-right">Restante</span>
                                    </div>
                                    <div className="space-y-1 max-h-24 overflow-y-auto text-sm pr-2">
                                        {lowStockIngredients.map(i => (
                                                <div key={i.id} className="grid grid-cols-3 gap-2 text-yellow-800 dark:text-yellow-200 items-center px-1">
                                                <span className="text-xs font-mono">
                                                    {i.date_below_minimum ? new Date(i.date_below_minimum).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '-'}
                                                </span>
                                                <span className="truncate pr-2">{i.nom}</span>
                                                <span className="font-semibold whitespace-nowrap text-right">{`${Math.round(i.stock_actuel)} ${i.unite}`}</span>
                                                </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
            
            <Card>
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <CalendarDays className="mr-3 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{`Ventas del mes (vs. mes anterior)`}</h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                            <div className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: '#8884d8' }} />
                            <span>Mes Actual</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-1 mr-2 bg-red-500" />
                            <span>Mes Anterior</span>
                        </div>
                    </div>
                </div>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={monthlySalesComparisonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={formatK} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="Mes Actual" fill="#8884d8" name="Mes Actual" />
                            <Line type="monotone" dataKey="Mes Anterior" stroke="#ff0000" name="Mes Anterior" strokeWidth={2}/>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <div className="w-full">
                <Card title="Ventas de los últimos 7 días (vs. semana anterior)">
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={comparisonSalesByDay}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={value => formatNumber(value as number)} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="Beneficios S-1" fill="#8884d8" name="Beneficios (Semana pasada)" />
                                <Bar dataKey="Beneficios" fill="#82ca9d" name="Beneficios (Esta semana)" />
                                <Line type="monotone" dataKey="Ventas" stroke="#0000ff" name="Ventas (Esta semana)" strokeWidth={2}/>
                                <Line type="monotone" dataKey="Ventas S-1" stroke="#ff0000" name="Ventas (Semana pasada)" strokeWidth={2}/>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
                
            <div className="w-full">
                <Card>
                     <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie 
                                    data={salesByProduct} 
                                    cx="45%" 
                                    cy="50%" 
                                    labelLine={false} 
                                    label={false}
                                    outerRadius="85%" 
                                    fill="#8884d8" 
                                    dataKey="value" 
                                    nameKey="name" 
                                >
                                    {salesByProduct.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCOP(value)} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff' }}/>
                                <Legend 
                                    content={<CustomLegendWithTitle />}
                                    layout="vertical" 
                                    verticalAlign="middle" 
                                    align="right" 
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
            {isUserModalOpen && (
                <UserManagementModal
                    isOpen={isUserModalOpen}
                    onClose={() => setIsUserModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Dashboard;