import React from 'react';

interface EmptyStateProps {
    message: string;
    highlightedText?: string;
    action?: {
        label: string;
        href: string;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, highlightedText, action }) => {

    const formattedMessage = () => {
        if (!highlightedText) return message;

        const parts = message.split(highlightedText);
        return (
            <>
                {parts[0]}
                <strong className="font-semibold text-gray-800">{highlightedText}</strong>
                {parts[1]}
            </>
        );
    };

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center my-8 shadow-inner">
            <div className="text-xl text-gray-600 mb-6 lead">
                {formattedMessage()}
            </div>

            {action && (
                <a
                    href={action.href}
                    className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded transition-colors"
                >
                    {action.label}
                </a>
            )}
        </div>
    );
};
