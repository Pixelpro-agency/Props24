import { Star } from 'lucide-react';

export function PremiumBanner() {
    return (
        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-full">
                    <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                </div>
                <div>
                    <h3 className="text-yellow-800 font-medium">Passa a Premium</h3>
                    <p className="text-sm text-yellow-700">Sblocca tutte le funzionalità e gestisci i tuoi immobili senza limiti.</p>
                </div>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md font-medium transition-all hover:scale-105 active:scale-95 shadow-sm whitespace-nowrap text-sm">
                Scopri l'offerta
            </button>
        </div>
    );
}
