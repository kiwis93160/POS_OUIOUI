import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './hooks/useRestaurantData';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Ingredients from './pages/Ingredients';
import Products from './pages/Products';
import FloorPlan from './pages/FloorPlan';
import Order from './pages/Order';
import Reports from './pages/Reports';
import History from './pages/History';
import Kitchen from './pages/Kitchen';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import CustomerOrder from './pages/CustomerOrder';
import SiteEditor from './pages/SiteEditor';
import Takeaway from './pages/Takeaway'; // Importation de la nouvelle page
import { useRestaurantData } from './hooks/useRestaurantData';

const AppRoutes: React.FC = () => {
    const { currentUserRole } = useRestaurantData();

    if (!currentUserRole) {
        // Ce cas est géré par ProtectedRoute, mais comme solution de repli
        return (
            <Routes>
                <Route path="*" element={<Dashboard />} />
            </Routes>
        );
    }

    const { permissions } = currentUserRole;

    // Aide pour déterminer la page par défaut en fonction des permissions
    const getDefaultPath = () => {
        if (permissions['/'] !== 'none') return '/';
        if (permissions['/ventes'] !== 'none') return '/ventes';
        if (permissions['/cocina'] !== 'none') return '/cocina';
        // Ajouter d'autres solutions de repli si nécessaire
        return '/login'; // Ne devrait pas se produire si connecté
    };

    return (
        <Routes>
            {permissions['/'] !== 'none' && <Route path="/" element={<Dashboard />} />}
            {permissions['/ingredients'] !== 'none' && <Route path="/ingredients" element={<Ingredients />} />}
            {permissions['/produits'] !== 'none' && <Route path="/produits" element={<Products />} />}
            {permissions['/ventes'] !== 'none' && <Route path="/ventes" element={<FloorPlan />} />}
            {permissions['/commande/:tableId'] !== 'none' && <Route path="/commande/:tableId" element={<Order />} />}
            {permissions['/historique'] !== 'none' && <Route path="/historique" element={<History />} />}
            {permissions['/rapports'] !== 'none' && <Route path="/rapports" element={<Reports />} />}
            {permissions['/cocina'] !== 'none' && <Route path="/cocina" element={<Kitchen />} />}
            {permissions['/site-editor'] === 'editor' && <Route path="/site-editor" element={<SiteEditor />} />}
            {permissions['/para-llevar'] !== 'none' && <Route path="/para-llevar" element={<Takeaway />} />}
            
            <Route path="*" element={<Navigate to={getDefaultPath()} replace />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/commande-client" element={<CustomerOrder />} />
          <Route 
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <AppRoutes />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </HashRouter>
    </DataProvider>
  );
};

export default App;