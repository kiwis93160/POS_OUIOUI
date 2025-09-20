import React, { useState, useRef, useEffect } from 'react';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Card from './Card';
import { Lock } from 'lucide-react';

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { authenticateAdmin } = useRestaurantData();
    const [pin, setPin] = useState<string[]>(['', '', '', '']);
    const [error, setError] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Timeout to allow modal transition to finish before focusing
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
            setPin(['', '', '', '']);
            setError(false);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const { value } = e.target;
        // Allow only single digit numbers
        if (/^[0-9]$/.test(value) || value === '') {
            const newPin = [...pin];
            newPin[index] = value;
            setPin(newPin);

            if (value && index < 3) {
                inputRefs.current[index + 1]?.focus();
            }

            // If the last digit is filled, check the pin
            if (newPin.every(digit => digit !== '') && index === 3) {
                 checkPin(newPin.join(''));
            }
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const checkPin = async (fullPin: string) => {
        const success = await authenticateAdmin(fullPin);
        if (success) {
            onSuccess();
        } else {
            setError(true);
            setTimeout(() => {
                setError(false);
                setPin(['', '', '', '']);
                inputRefs.current[0]?.focus();
            }, 800);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className={`w-full max-w-xs sm:max-w-sm transform transition-transform duration-300 ${error ? 'animate-shake' : ''}`}>
                <div className="text-center">
                    <Lock size={32} className="mx-auto text-yellow-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Por favor, ingrese el código de acceso.</p>
                    <div className="flex justify-center space-x-2 sm:space-x-3">
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => { inputRefs.current[index] = el; }}
                                type="password"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-2xl font-bold rounded-md border-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                pattern="[0-9]*"
                                inputMode="numeric"
                            />
                        ))}
                    </div>
                     <button onClick={onClose} className="mt-6 text-sm text-gray-500 hover:underline">Cancelar</button>
                </div>
                 <style>{`
                    .animate-shake {
                        animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
                        transform: translate3d(0, 0, 0);
                        backface-visibility: hidden;
                        perspective: 1000px;
                    }
                    @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); }
                        20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                        40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                `}</style>
            </Card>
        </div>
    );
};

export default PasswordModal;