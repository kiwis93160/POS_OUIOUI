import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRestaurantData } from '../hooks/useRestaurantData';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { userRole, loading } = useRestaurantData();
    const location = useLocation();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    }
    
    if (!userRole) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;