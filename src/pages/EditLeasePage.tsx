import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { LeaseForm } from '../landlord/leases/components/LeaseForm';
import { useLeaseDetail } from '../hooks/useLeaseDetail';

export function EditLeasePage() {
    const { id } = useParams();
    const { detail } = useLeaseDetail(id);

    if (!detail) {
        return (
            <div className="mx-auto max-w-4xl p-6">
                <h1 className="text-2xl font-semibold text-gray-900">Locazione non trovata</h1>
                <Link to="/leases" className="mt-4 inline-flex text-blue-700 hover:underline">Torna alle locazioni</Link>
            </div>
        );
    }

    if (detail.lease.archived) {
        return <BlockedEdit message="Ripristina la locazione prima di modificarla" leaseId={detail.lease.id} />;
    }

    if (detail.lease.signatureProcess) {
        return <BlockedEdit message="Annulla la procedura di firma locale prima di modificare il contratto" leaseId={detail.lease.id} />;
    }

    if (detail.lease.status === 'terminata') {
        return <BlockedEdit message="Le condizioni contrattuali di una locazione terminata non possono essere modificate" leaseId={detail.lease.id} />;
    }

    return (
        <div className="mx-auto max-w-7xl p-4 font-sans md:p-6 lg:p-8">
            <div className="mb-8 flex items-end justify-between border-b border-gray-200 pb-3">
                <h1 className="m-0 flex items-center gap-2 text-3xl font-normal text-[#333]">
                    <Link to={`/leases/${detail.lease.id}`} className="text-gray-300 hover:text-gray-500" aria-label="Indietro">
                        <ChevronLeft className="h-7 w-7" />
                    </Link>
                    Modifica locazione
                </h1>
            </div>
            <LeaseForm mode="edit" leaseId={detail.lease.id} initialValues={detail.lease.formData} />
        </div>
    );
}

function BlockedEdit({ message, leaseId }: { message: string; leaseId: string }) {
    return (
        <div className="mx-auto max-w-4xl p-6">
            <h1 className="text-2xl font-semibold text-gray-900">Modifica non disponibile</h1>
            <p className="mt-3 text-gray-700">{message}.</p>
            <Link to={`/leases/${leaseId}`} className="mt-4 inline-flex text-blue-700 hover:underline">Torna al dettaglio</Link>
        </div>
    );
}
