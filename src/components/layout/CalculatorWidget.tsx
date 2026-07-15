import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator as CalcIcon, X } from 'lucide-react';

export function CalculatorWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');

    const handleNum = (num: string) => {
        setDisplay(prev => prev === '0' ? num : prev + num);
    };

    const handleOp = (op: string) => {
        setEquation(display + ' ' + op + ' ');
        setDisplay('0');
    };

    const calculate = () => {
        try {
            // Usiamo Function invece di eval per maggiore sicurezza basica nel frontend
            const result = new Function('return ' + equation + display)();
            setDisplay(String(result));
            setEquation('');
        } catch {
            setDisplay('Error');
        }
    };

    const clear = () => {
        setDisplay('0');
        setEquation('');
    };

    const erase = () => {
        setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    };

    const buttonClass = "w-full p-2 text-sm font-medium bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-slate-700 active:bg-gray-200";

    return (
        <div className="relative border-t border-gray-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-12 flex items-center justify-center gap-2 text-slate-500 hover:text-brand-blue hover:bg-blue-50/50 transition-colors"
            >
                <CalcIcon className="w-5 h-5" />
                <span className="text-sm font-medium pr-2">Calcolatrice</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="absolute bottom-full left-0 w-full bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border border-gray-100 rounded-t-xl overflow-hidden z-50"
                    >
                        <div className="p-4 flex flex-col gap-3">
                            {/* Header/Close */}
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Calcolatrice</span>
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Display Area */}
                            <div className="bg-slate-50 p-3 rounded-lg text-right flex flex-col justify-end min-h-[60px] border border-gray-100">
                                <div className="h-4 text-[10px] text-gray-400 font-mono tracking-wider">{equation}</div>
                                <div className="text-xl font-medium text-slate-800 tracking-tight truncate">{display}</div>
                            </div>

                            {/* Grid 4x5 */}
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={clear} className={buttonClass + " text-brand-red"}>CE</button>
                                <button onClick={erase} className={buttonClass}>⌫</button>
                                <button onClick={() => handleOp('/')} className={buttonClass + " text-brand-blue font-bold"}>/</button>
                                <button onClick={() => handleOp('*')} className={buttonClass + " text-brand-blue font-bold"}>*</button>

                                <button onClick={() => handleNum('7')} className={buttonClass}>7</button>
                                <button onClick={() => handleNum('8')} className={buttonClass}>8</button>
                                <button onClick={() => handleNum('9')} className={buttonClass}>9</button>
                                <button onClick={() => handleOp('-')} className={buttonClass + " text-brand-blue font-bold"}>-</button>

                                <button onClick={() => handleNum('4')} className={buttonClass}>4</button>
                                <button onClick={() => handleNum('5')} className={buttonClass}>5</button>
                                <button onClick={() => handleNum('6')} className={buttonClass}>6</button>
                                <button onClick={() => handleOp('+')} className={buttonClass + " text-brand-blue font-bold"}>+</button>

                                <button onClick={() => handleNum('1')} className={buttonClass}>1</button>
                                <button onClick={() => handleNum('2')} className={buttonClass}>2</button>
                                <button onClick={() => handleNum('3')} className={buttonClass}>3</button>
                                <button onClick={calculate} className="w-full p-2 bg-brand-blue hover:bg-blue-500 rounded-md text-white font-bold row-span-2 flex items-center justify-center transition-colors active:bg-blue-600 shadow-sm">=</button>

                                <button onClick={() => handleNum('0')} className={buttonClass + " col-span-2"}>0</button>
                                <button onClick={() => handleNum('.')} className={buttonClass}>.</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
