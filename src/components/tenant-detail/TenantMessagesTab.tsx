import { Mail, MessageSquare, ExternalLink } from 'lucide-react';
import type { TenantMessage } from '../../types/tenantDetail';

interface TenantMessagesTabProps {
    messages: TenantMessage[];
}

export function TenantMessagesTab({ messages }: TenantMessagesTabProps) {
    if (!messages || messages.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Nessun messaggio</h3>
                <p className="text-sm text-gray-500">Non ci sono messaggi per questo inquilino.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
                {messages.map((msg) => (
                    <div key={msg.id} className="p-5 hover:bg-gray-50 transition-colors flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1 gap-2">
                                <h4 className="font-semibold text-gray-900 truncate" title={msg.subject}>
                                    {msg.subject}
                                </h4>
                                <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">{msg.date}</span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {msg.preview}
                            </p>
                            <button className="text-sm text-[#72a333] font-medium hover:text-[#638e2c] flex items-center gap-1.5 transition-colors">
                                Rispondi
                                <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-center">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    Visualizza tutti i messaggi
                </button>
            </div>
        </div>
    );
}
