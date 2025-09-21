import React, { useState } from 'react';
import Card from './ui/Card';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Table as TableIcon, Edit, Trash2, PlusCircle, X } from 'lucide-react';
import type { Table, TablePayload } from '../types';
import TableModal from './TableModal';

interface ManageTablesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ManageTablesModal: React.FC<ManageTablesModalProps> = ({ isOpen, onClose }) => {
    const { tables, addTable, updateTable, deleteTable } = useRestaurantData();
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [tableToEdit, setTableToEdit] = useState<Table | null>(null);

    if (!isOpen) return null;

    const handleOpenTableModal = (table: Table | null) => {
        setTableToEdit(table);
        setIsTableModalOpen(true);
    };

    const handleCloseTableModal = () => {
        setIsTableModalOpen(false);
        setTableToEdit(null);
    };

    const handleSaveTable = async (data: TablePayload, isNew: boolean) => {
        if (isNew) {
            await addTable(data);
        } else {
            await updateTable(data.id, { nom: data.nom, capacite: data.capacite });
        }
    };

    const handleDeleteTable = async (table: Table) => {
        if (window.confirm(`¿Está seguro de que desea eliminar la mesa "${table.nom}"?`)) {
            try {
                await deleteTable(table.id);
            } catch (error: any) {
                alert(`Error: ${error.message}`);
            }
        }
    };

    const displayedTables = tables
        .filter(table => table.id < 90)
        .sort((a, b) => a.id - b.id);

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Gestionar Mesas</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                        {displayedTables.map(table => (
                            <div key={table.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center">
                                    <TableIcon className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" />
                                    <div>
                                        <p className="font-semibold">{table.nom}</p>
                                        <p className="text-sm text-gray-500">Capacidad: {table.capacite}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleOpenTableModal(table)} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="Modificar Mesa">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDeleteTable(table)} className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="Eliminar Mesa">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t dark:border-gray-600 flex justify-between items-center">
                        <button onClick={() => handleOpenTableModal(null)} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                            <PlusCircle size={18} className="mr-2" />
                            Añadir Nueva Mesa
                        </button>
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                            Cerrar
                        </button>
                    </div>
                </Card>
            </div>
            {isTableModalOpen && (
                <TableModal 
                    isOpen={isTableModalOpen}
                    onClose={handleCloseTableModal}
                    onSave={handleSaveTable}
                    existingTable={tableToEdit}
                    allTables={tables}
                />
            )}
        </>
    );
};

export default ManageTablesModal;
