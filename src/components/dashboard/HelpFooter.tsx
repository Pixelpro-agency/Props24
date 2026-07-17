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
                    className="missing-route px-1 rounded hover:underline transition-colors duration-150"
                    style={{ color: '#ca8a04', backgroundColor: '#fef08a', borderColor: '#eab308' }}
                >
                    Centro Supporto
                </a>{' '}
                o{' '}
                <a
                    href="/contact"
                    className="missing-route px-1 rounded hover:underline transition-colors duration-150"
                    style={{ color: '#ca8a04', backgroundColor: '#fef08a', borderColor: '#eab308' }}
                >
                    Contattaci
                </a>
                .
            </p>
        </div>
    );
}
