import React, { useState, useEffect, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Role, PermissionLevel } from '../types';
import Card from './ui/Card';
import { X, PlusCircle, Trash2, Loader2, Save } from 'lucide-react';

const ALL_APP_PATHS = [
    { path: "/", label: "Panel de Control" },
    { path: "/ingredients", label: "Ingredientes" },
    { path: "/produits", label: "Productos" },
    { path: "/ventes", label: "Tomar Pedido" },
    { path: "/para-llevar", label: "Pedidos para llevar" },
    { path: "/cocina", label: "Cocina" },
    { path: "/historique", label: "Historial de Ventas" },
    { path: "/rapports", label: "Informes" },
    { path: "/site-editor", label: "Editor del Sitio" },
];

const UserManagementModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { roles, saveRoles, refreshData } = useRestaurantData();
    const [editedRoles, setEditedRoles] = useState<Role[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEditedRoles(JSON.parse(JSON.stringify(roles)));
        }
    }, [isOpen, roles]);

    const validationError = useMemo(() => {
        const pins = new Set<string>();
        for (const role of editedRoles) {
            if (!role.name.trim()) {
                return 'El nombre del rol no puede estar vacío.';
            }
            if (!/^\d{6}$/.test(role.pin)) {
                return `El PIN para "${role.name}" debe tener 6 dígitos.`;
            }
            if (pins.has(role.pin)) {
                return `El PIN ${role.pin} está duplicado. Los PINs deben ser únicos.`;
            }
            pins.add(role.pin);
        }
        return null;
    }, [editedRoles]);

    const handleRoleChange = (roleId: string, field: keyof Role, value: any) => {
        setEditedRoles(prev => prev.map(r => r.id === roleId ? { ...r, [field]: value } : r));
    };

    const handlePermissionChange = (roleId: string, path: string, level: PermissionLevel) => {
        setEditedRoles(prev => prev.map(r => {
            if (r.id === roleId) {
                const newPermissions = { ...r.permissions, [path]: level };
                if (path === '/ventes') {
                    newPermissions['/commande/:tableId'] = level;
                }
                return { ...r, permissions: newPermissions };
            }
            return r;
        }));
    };
    
    const handleAddRole = () => {
        const newId = `new_role_${Date.now()}`;
        const newRole: Role = {
            id: newId,
            name: 'Nuevo Rol',
            pin: '000000',
            permissions: ALL_APP_PATHS.reduce((acc, p) => ({ ...acc, [p.path]: 'none' }), { '/commande/:tableId': 'none' }),
        };
        setEditedRoles(prev => [...prev, newRole]);
    };

    const handleDeleteRole = (roleId: string) => {
        if (roleId === 'admin') {
            alert('No se puede eliminar el rol de Administrador.');
            return;
        }
        if (window.confirm('¿Está seguro de que desea eliminar este rol?')) {
            setEditedRoles(prev => prev.filter(r => r.id !== roleId));
        }
    };
    
    const handleSave = async () => {
        if (validationError) {
            alert(validationError);
            return;
        }
        setIsSaving(true);
        try {
            await saveRoles(editedRoles);
            await refreshData();
            onClose();
        } catch (error) {
            alert('Error al guardar los cambios.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Gestionar Usuarios y Roles</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    {editedRoles.map(role => (
                        <div key={role.id} className="p-4 border rounded-lg dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium">Nombre del Rol</label>
                                    <input
                                        type="text"
                                        value={role.name}
                                        onChange={e => handleRoleChange(role.id, 'name', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                        disabled={role.id === 'admin'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">PIN de Acceso (6 dígitos)</label>
                                    <input
                                        type="text"
                                        value={role.pin}
                                        onChange={e => handleRoleChange(role.id, 'pin', e.target.value)}
                                        maxLength={6}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button onClick={() => handleDeleteRole(role.id)} disabled={role.id === 'admin'} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                            <h4 className="font-semibold mb-2">Permisos de Acceso a Pestañas</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                                {ALL_APP_PATHS.map(p => (
                                    <div key={p.path} className="flex items-center justify-between">
                                        <label className="text-sm">{p.label}</label>
                                        <select
                                            value={role.permissions[p.path] || 'none'}
                                            onChange={e => handlePermissionChange(role.id, p.path, e.target.value as PermissionLevel)}
                                            className="text-xs rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                            disabled={role.id === 'admin'}
                                        >
                                            <option value="editor">Editor</option>
                                            <option value="readonly">Solo Lectura</option>
                                            <option value="none">Sin Acceso</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                     <button onClick={handleAddRole} className="flex items-center justify-center w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Añadir nuevo rol
                    </button>
                </div>
                
                {validationError && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-md text-sm">
                        {validationError}
                    </div>
                )}

                <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-600">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                    <button type="button" onClick={handleSave} disabled={isSaving || !!validationError} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default UserManagementModal;