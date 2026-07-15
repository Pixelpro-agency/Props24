export function HelpFooter() {
    return (
        <div className="border-t border-gray-200 mt-6 pt-5">
            <p className="text-base text-gray-700">
                <span className="font-bold">Bisogno di Aiuto?</span>{' '}
                Visita il nostro{' '}
                <a
                    href="/support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline transition-colors duration-150"
                >
                    Centro Supporto
                </a>{' '}
                o{' '}
                <a
                    href="/contact"
                    className="text-blue-600 hover:underline transition-colors duration-150"
                >
                    Contattaci
                </a>
                .
            </p>
        </div>
    );
}
