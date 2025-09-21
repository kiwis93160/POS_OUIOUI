import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { ChefHat, LogIn, X } from 'lucide-react';
import Card from './ui/Card';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const { login } = useRestaurantData();
    const navigate = useNavigate();
    const [pin, setPin] = useState<string[]>(Array(6).fill(''));
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    
    useEffect(() => {
        if (isOpen) {
            // Réinitialiser l'état et focus lors de l'ouverture du modal
            setPin(Array(6).fill(''));
            setError('');
            setIsSubmitting(false);
            setTimeout(() => inputRefs.current[0]?.focus(), 100); // Timeout pour la transition
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const { value } = e.target;
        if (/^[0-9]$/.test(value) || value === '') {
            const newPin = [...pin];
            newPin[index] = value;
            setPin(newPin);

            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d{6}$/.test(pasteData)) {
            const newPin = pasteData.split('');
            setPin(newPin);
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async () => {
        const fullPin = pin.join('');
        if (fullPin.length !== 6) {
            setError('El PIN debe tener 6 dígitos.');
            return;
        }
        
        setIsSubmitting(true);
        setError('');

        try {
            const role = await login(fullPin);
            if (role) {
                onClose(); // Fermer le modal en cas de succès
                // Naviguer vers la page appropriée
                const { permissions } = role;
                if (permissions['/'] !== 'none') navigate('/');
                else if (permissions['/ventes'] !== 'none') navigate('/ventes');
                else if (permissions['/cocina'] !== 'none') navigate('/cocina');
                else navigate('/'); // Fallback
            } else {
                setError('PIN incorrecto. Inténtelo de nuevo.');
                setPin(Array(6).fill(''));
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError('Ocurrió un error al iniciar sesión.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <X size={24} />
                </button>
                <div className="text-center">
                    <ChefHat size={40} className="mx-auto text-blue-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Acceso al Sistema</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Ingrese su PIN para continuar</p>
                    
                    <div className="flex justify-center space-x-2 sm:space-x-3 mb-6" onPaste={handlePaste}>
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => { inputRefs.current[index] = el; }}
                                type="password"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-3xl font-bold rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                disabled={isSubmitting}
                            />
                        ))}
                    </div>

                    {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}
                
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || pin.join('').length !== 6}
                        className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
                    >
                        <LogIn className="mr-2" size={20} />
                        {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default LoginModal;