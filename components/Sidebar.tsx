import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRestaurantData } from '../hooks/useRestaurantData';
// FIX: Replaced non-existent 'Chair' icon with 'Armchair' as 'Chair' is not an exported member of 'lucide-react'.
import { LayoutDashboard, Package, UtensilsCrossed, BarChart3, History, Soup, LogOut, Brush, ShoppingBag, Armchair, FileText } from 'lucide-react';
import DailyReportModal from './DailyReportModal';

interface SidebarProps {
    isOpen: boolean;
    closeSidebar: () => void;
}

interface NavItemProps {
    to: string;
    icon: React.ElementType;
    label: string;
    notifications?: Array<{
        count: number;
        color: string;
    }>;
}

const allNavItems = [
    { to: "/", icon: LayoutDashboard, label: "Panel de Control" },
    { to: "/ingredients", icon: Package, label: "Ingredientes" },
    { to: "/produits", icon: UtensilsCrossed, label: "Productos" },
    // FIX: Replaced non-existent 'Chair' icon with 'Armchair'.
    { to: "/ventes", icon: Armchair, label: "Tomar Pedido" },
    { to: "/para-llevar", icon: ShoppingBag, label: "Pedidos para llevar" },
    { to: "/cocina", icon: Soup, label: "Cocina" },
    { to: "/historique", icon: History, label: "Historial de Ventas" },
    { to: "/rapports", icon: BarChart3, label: "Informes" },
    { to: "/site-editor", icon: Brush, label: "Editor del Sitio" },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { tables, kitchenOrders, readyTakeawayOrders, pendingTakeawayOrders, currentUserRole, logout, siteAssets, ingredients } = useRestaurantData();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const readyOrdersCount = useMemo(() => {
        // Exclure la table "Para Llevar" (id 99) du décompte.
        return tables.filter(t => t.isReady && t.id !== 99).length;
    }, [tables]);

    const kitchenOrdersCount = useMemo(() => kitchenOrders.length, [kitchenOrders]);
    const readyTakeawayOrdersCount = useMemo(() => readyTakeawayOrders.length, [readyTakeawayOrders]);
    const pendingTakeawayOrdersCount = useMemo(() => pendingTakeawayOrders.length, [pendingTakeawayOrders]);
    
    const lowStockIngredientsCount = useMemo(() => {
        return ingredients.filter(i => i.stock_actuel <= i.stock_minimum).length;
    }, [ingredients]);

    const navItems = useMemo(() => {
        if (!currentUserRole) return [];
        return allNavItems.filter(item => {
            const path = item.to.split('/:')[0];
            return currentUserRole.permissions[path] !== 'none' && currentUserRole.permissions[path] !== undefined;
        });
    }, [currentUserRole]);

    const handleLinkClick = (path: string) => {
        closeSidebar();
        navigate(path);
    };
    
    const handleLogout = () => {
        closeSidebar();
        logout();
        navigate('/login');
    };

    const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, notifications = [] }) => {
        const isActive = location.pathname.startsWith(to.split('/:')[0]) && (to !== "/" || location.pathname === "/");

        return (
            <button
                onClick={() => handleLinkClick(to)}
                className={`flex items-center w-full px-4 py-3 text-lg rounded-lg transition-colors duration-200 text-left ${
                    isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
                <div className="relative mr-4 flex-shrink-0">
                    <Icon className="w-6 h-6" />
                     {notifications.length > 0 && (
                        <div className="absolute -top-2 -right-3 flex items-center space-x-1">
                            {notifications.map((notif, index) => (
                                notif.count > 0 && (
                                    <span key={index} className={`flex h-5 w-5 items-center justify-center rounded-full ${notif.color} text-xs font-bold text-white ring-2 ring-gray-800`}>
                                        {notif.count}
                                    </span>
                                )
                            ))}
                        </div>
                    )}
                </div>
                <span className="flex-grow">{label}</span>
            </button>
        );
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={closeSidebar}
            ></div>
            <aside
                className={`fixed top-0 left-0 h-full bg-gray-800 text-white w-64 p-4 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-center py-4 border-b border-gray-700">
                    <img src={siteAssets.restaurantLogo} alt="Logo du restaurant" className="h-10 w-10 object-contain" />
                    <h2 className="ml-3 text-2xl font-bold">OUIOUITACOS</h2>
                </div>
                <nav className="flex-grow flex flex-col space-y-2 mt-4">
                    {navItems.map(item => {
                        const notifications = [];
                        if (item.to === '/ingredients' && lowStockIngredientsCount > 0) {
                             notifications.push({ count: lowStockIngredientsCount, color: 'bg-yellow-500' });
                        }
                        if (item.to === '/ventes' && readyOrdersCount > 0) {
                            notifications.push({ count: readyOrdersCount, color: 'bg-red-500' });
                        }
                        if (item.to === '/cocina' && kitchenOrdersCount > 0) {
                            notifications.push({ count: kitchenOrdersCount, color: 'bg-blue-500' });
                        }
                        if (item.to === '/para-llevar') {
                            if (pendingTakeawayOrdersCount > 0) {
                                notifications.push({ count: pendingTakeawayOrdersCount, color: 'bg-red-500' });
                            }
                            if (readyTakeawayOrdersCount > 0) {
                                notifications.push({ count: readyTakeawayOrdersCount, color: 'bg-blue-500' });
                            }
                        }

                        return (
                            <NavItem 
                                key={item.to} 
                                to={item.to} 
                                icon={item.icon} 
                                label={item.label} 
                                notifications={notifications}
                            />
                        );
                    })}
                </nav>
                <div className="mt-auto">
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex items-center w-full px-4 py-3 text-lg rounded-lg transition-colors duration-200 text-left text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                        <FileText className="w-6 h-6 mr-4 flex-shrink-0" />
                        <span className="flex-1">Rapport du Jour</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-lg rounded-lg transition-colors duration-200 text-left text-gray-300 hover:bg-red-800 hover:text-white"
                    >
                        <LogOut className="w-6 h-6 mr-4 flex-shrink-0" />
                        <span className="flex-1">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
            {isReportModalOpen && (
                <DailyReportModal 
                    isOpen={isReportModalOpen} 
                    onClose={() => setIsReportModalOpen(false)} 
                />
            )}
        </>
    );
};

export default Sidebar;