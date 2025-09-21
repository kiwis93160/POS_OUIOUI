import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { LogIn, Menu, X, Phone, MapPin, Mail } from 'lucide-react';
import LoginModal from '../components/LoginModal';
import CustomerOrderStatus from '../components/CustomerOrderStatus';
import { defaultImageAssets } from '../components/ImageAssets';
import OrderHistoryModal from '../components/OrderHistoryModal';
import { customerOrderHistoryService } from '../services/customerOrderHistoryService';
import type { HistoricCommande } from '../types';
import Section from '../components/ui/Section';

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

const MesCommandes: React.FC<{
    history: HistoricCommande[];
    onOrderClick: (order: HistoricCommande) => void;
}> = ({ history, onOrderClick }) => (
    <div className="p-4 bg-black/60 rounded-lg max-w-lg w-full mt-8">
        <h3 className="text-xl font-bold text-center mb-4 text-white" style={{ fontFamily: "'Lilita One', sans-serif" }}>
            Mes Commandes Récentes
        </h3>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {history.map(order => (
                <button
                    key={order.id}
                    onClick={() => onOrderClick(order)}
                    className="w-full flex justify-between items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-left"
                >
                    <div>
                        <p className="font-bold text-white">Commande du {new Date(order.date).toLocaleDateString('fr-FR')}</p>
                        <p className="text-sm text-gray-300">{order.items.length} article(s)</p>
                    </div>
                    <div className="font-semibold text-yellow-400">{formatCOP(order.total)}</div>
                </button>
            ))}
        </div>
    </div>
);


const Login: React.FC = () => {
    const { userRole, siteAssets, loading } = useRestaurantData();
    const navigate = useNavigate();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [customerOrderId, setCustomerOrderId] = useState<string | null>(null);
    const [orderHistory, setOrderHistory] = useState<HistoricCommande[]>([]);
    const [selectedHistoricOrder, setSelectedHistoricOrder] = useState<HistoricCommande | null>(null);
    
    const currentAssets = (loading || !siteAssets.landingPageBackground || !siteAssets.restaurantLogo) 
        ? defaultImageAssets 
        : siteAssets;

    useEffect(() => {
        if (userRole) navigate('/');
    }, [userRole, navigate]);

    const loadHistory = useCallback(() => {
        setOrderHistory(customerOrderHistoryService.getHistory());
    }, []);

    useEffect(() => {
        const storedOrderId = sessionStorage.getItem('customerOrderId');
        if (storedOrderId) {
            setCustomerOrderId(storedOrderId);
        } else {
            loadHistory();
        }
    }, [loadHistory]);

    const handleOrderComplete = useCallback(() => {
        sessionStorage.removeItem('customerOrderId');
        setCustomerOrderId(null);
        loadHistory();
    }, [loadHistory]);

    const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
    }, []);

    const navLinks = [
        { href: "#accueil", label: "Accueil" },
        { href: "#apropos", label: "Conócenos" },
        { href: "#menu", label: "Nuestro Menú" },
        { href: "#contact", label: "Contacto" },
    ];

    return (
        <>
            <div 
                className="bg-cover bg-center text-white"
                style={{ backgroundImage: `url(${currentAssets.landingPageBackground})` }}
            >
                <div className="bg-black/40 min-h-screen flex flex-col">
                    <header className="fixed top-0 left-0 w-full z-30 bg-black/30 transition-colors">
                         <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
                            <div className="flex items-center">
                                <img src={currentAssets.restaurantLogo} alt="Logo du restaurant" className="h-12 w-12 object-contain" />
                                <h1 className="text-2xl text-white font-bold ml-3" style={{ fontFamily: "'Lilita One', sans-serif" }}>OUIOUITACOS</h1>
                            </div>
                            <nav className="hidden md:flex items-center space-x-8">
                                {navLinks.map(link => (
                                    <a key={link.href} href={link.href} onClick={(e) => handleSmoothScroll(e, link.href.substring(1))} className="font-semibold hover:text-yellow-400 transition-colors">{link.label}</a>
                                ))}
                            </nav>
                             <div className="flex items-center">
                                <button onClick={() => setIsLoginModalOpen(true)} className="p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Iniciar sesión">
                                    <LogIn size={20} />
                                </button>
                                <button className="md:hidden ml-4 p-2" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                                    {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
                                </button>
                            </div>
                        </div>
                        {isMobileMenuOpen && (
                             <nav className="md:hidden bg-black/50 py-4">
                                {navLinks.map(link => (
                                     <a key={link.href} href={link.href} onClick={(e) => handleSmoothScroll(e, link.href.substring(1))} className="block text-center py-2 font-semibold hover:text-yellow-400 transition-colors">{link.label}</a>
                                ))}
                            </nav>
                        )}
                    </header>

                    <main className="flex-grow">
                        <section id="accueil" className={`min-h-screen flex flex-col items-center text-center px-4 pt-24 md:pt-32 ${customerOrderId ? 'justify-start' : 'justify-center'}`}>
                            {customerOrderId ? (
                                <CustomerOrderStatus orderId={customerOrderId} onComplete={handleOrderComplete} />
                            ) : (
                                <>
                                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                                       <a href="#menu" onClick={(e) => handleSmoothScroll(e, 'menu')} className="inline-block bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-full text-lg uppercase hover:bg-yellow-400 transition-colors shadow-lg">
                                           Explorer le Menu
                                       </a>
                                       <button onClick={() => navigate('/commande-client')} className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg uppercase hover:bg-blue-500 transition-colors shadow-lg">
                                           Pedir Ahora
                                       </button>
                                    </div>
                                    {orderHistory.length > 0 && (
                                        <MesCommandes history={orderHistory} onOrderClick={setSelectedHistoricOrder} />
                                    )}
                                </>
                            )}
                        </section>

                        <Section id="apropos" title="Conócenos">
                           <div className="max-w-3xl mx-auto text-center text-lg leading-relaxed text-gray-200">
                                <p className="mb-4">
                                    En <span className="font-bold text-yellow-400">OUIOUITACOS</span>, creemos que la buena comida une a la gente. Nacimos de la pasión por los sabores auténticos y el deseo de crear un espacio donde cada visita sea una experiencia memorable.
                                </p>
                                <p>
                                    Utilizamos solo los ingredientes más frescos, provenientes de proveedores locales que comparten nuestro compromiso con la calidad. Desde nuestras pizzas artesanales hasta nuestras jugosas hamburguesas, cada plato está preparado con amor y dedicación.
                                </p>
                            </div>
                        </Section>

                        <Section id="menu" title="Nuestro Menú">
                            <div className="max-w-4xl mx-auto text-center text-lg text-gray-200">
                                <p className="mb-8">
                                    Nuestro menú es una celebración de la diversidad culinaria, diseñado para satisfacer todos los antojos.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="bg-black/20 p-6 rounded-lg">
                                        <h3 className="text-2xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Lilita One', sans-serif" }}>Entradas y Platos Fuertes</h3>
                                        <p>Comienza con nuestras deliciosas bruschettas o papas cheddar y sumérgete en una variedad de platos principales que incluyen lasañas, salmón a la plancha y nuestras famosas pizzas y hamburguesas.</p>
                                    </div>
                                    <div className="bg-black/20 p-6 rounded-lg">
                                        <h3 className="text-2xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Lilita One', sans-serif" }}>Postres Caseros</h3>
                                        <p>Ninguna comida está completa sin un toque dulce. Disfruta de nuestro cremoso tiramisú o un rico mousse de chocolate, todos preparados en casa con los mejores ingredientes.</p>
                                    </div>
                                    <div className="bg-black/20 p-6 rounded-lg">
                                        <h3 className="text-2xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Lilita One', sans-serif" }}>Bebidas Refrescantes</h3>
                                        <p>Desde una limonada natural recién hecha hasta un mojito perfectamente equilibrado, nuestra selección de bebidas es el acompañamiento ideal para tu comida.</p>
                                    </div>
                                </div>
                                <a href="#accueil" onClick={(e) => { e.preventDefault(); navigate('/commande-client'); }} className="mt-12 inline-block bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-full text-lg uppercase hover:bg-yellow-400 transition-colors shadow-lg">
                                    Ver el menú completo y Pedir
                                </a>
                            </div>
                        </Section>

                        <Section id="contact" title="Contacto">
                            <div className="max-w-3xl mx-auto text-center grid grid-cols-1 md:grid-cols-3 gap-8 text-lg">
                                <div className="flex flex-col items-center min-h-24">
                                    <MapPin size={32} className="text-yellow-400 mb-2"/>
                                    <h3 className="font-bold mb-1">Dirección</h3>
                                    <p className="text-gray-300">Calle Falsa 123, Ciudad</p>
                                </div>
                                <div className="flex flex-col items-center min-h-24">
                                    <Phone size={32} className="text-yellow-400 mb-2"/>
                                    <h3 className="font-bold mb-1">Teléfono</h3>
                                    <p className="text-gray-300">+57 300 123 4567</p>
                                </div>
                                <div className="flex flex-col items-center min-h-24">
                                    <Mail size={32} className="text-yellow-400 mb-2"/>
                                    <h3 className="font-bold mb-1">Email</h3>
                                    <p className="text-gray-300">contacto@ouiouitacos.com</p>
                                </div>
                            </div>
                        </Section>
                    </main>
                    
                    <footer className="bg-black/50 text-center py-6">
                        <p>&copy; {new Date().getFullYear()} Resto Pro. Tous droits réservés.</p>
                    </footer>
                </div>
            </div>
            
            <LoginModal 
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
            <OrderHistoryModal
                isOpen={!!selectedHistoricOrder}
                onClose={() => setSelectedHistoricOrder(null)}
                commande={selectedHistoricOrder}
            />
        </>
    );
};

export default Login;