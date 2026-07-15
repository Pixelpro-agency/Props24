import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface GreetingHeaderProps {
    /** Nome utente da visualizzare */
    userName: string;
}

export function GreetingHeader({ userName }: GreetingHeaderProps) {
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            return 'Buongiorno';
        } else if (hour >= 12 && hour < 18) {
            return 'Buon pomeriggio';
        } else {
            return 'Buonasera';
        }
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
        >
            <h1 className="text-2xl md:text-3xl font-normal text-gray-800">
                {greeting} <span className="font-semibold">{userName}</span> !
            </h1>
        </motion.div>
    );
}
