/**
 * ExpertModeContext — Condivide lo stato expert mode tra Sidebar e Navbar.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

interface ExpertModeContextValue {
    expertMode: boolean;
    setExpertMode: (value: boolean) => void;
}

const ExpertModeContext = createContext<ExpertModeContextValue>({
    expertMode: false,
    setExpertMode: () => { },
});

export function ExpertModeProvider({ children }: { children: ReactNode }) {
    const [expertMode, setExpertMode] = useState(false);

    return (
        <ExpertModeContext.Provider value={{ expertMode, setExpertMode }}>
            {children}
        </ExpertModeContext.Provider>
    );
}

export function useExpertMode() {
    return useContext(ExpertModeContext);
}
