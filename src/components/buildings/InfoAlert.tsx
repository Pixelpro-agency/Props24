import { Info } from 'lucide-react';

interface InfoAlertProps {
    className?: string;
}

export function InfoAlert({ className = '' }: InfoAlertProps) {
    return (
        <div
            className={`bg-blue-50 border-l-4 border-blue-400 rounded-r-md p-4 ${className}`}
        >
            <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-semibold text-blue-800 text-sm mb-2">
                        Informazione
                    </h4>
                    <div className="space-y-1.5 text-sm text-blue-700">
                        <p>
                            Questa sezione è destinata ai proprietari di edifici o
                            immobili suddivisi in unità individuali.
                        </p>
                        <p>
                            Consente di inserire le quote millesimali o applicare
                            criteri di ripartizione personalizzati per suddividere
                            equamente le spese comuni tra le diverse unità.
                        </p>
                        <p>
                            Dovrai creare unità, appartamenti, garage, ecc. nella
                            sezione{' '}
                            <a
                                href="/properties/units"
                                className="text-blue-600 font-medium hover:underline"
                            >
                                Proprietà
                            </a>{' '}
                            prima di poter riempire questa scheda.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
