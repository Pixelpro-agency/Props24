import { Link } from 'react-router-dom';
import type { LeaseDetail } from '../../types/leaseDetail';

export function LeaseParticipantsTab({ detail }: { detail: LeaseDetail }) {
    return (
        <section className="rounded border border-gray-200 bg-white p-4 text-sm">
            <h2 className="font-semibold">Proprietà e partecipanti</h2>
            {detail.property && <Link to={`/properties/units/${detail.property.id}`} className="mt-2 block text-blue-700">{detail.property.formData.PropertyTitle || 'Unità senza nome'}</Link>}
            <h3 className="mt-4 font-semibold">Inquilini</h3>
            {detail.tenants.map((tenant) => <Link key={tenant.id} to={`/tenants/${tenant.id}`} className="block text-blue-700">{tenant.type === 'company' ? tenant.companyName : `${tenant.firstName} ${tenant.lastName}`}</Link>)}
            <h3 className="mt-4 font-semibold">Garanti</h3>
            {detail.guarantors.length === 0 ? <p className="mt-2 text-gray-500">Nessun garante.</p> : detail.guarantors.map((contact) => <p key={contact.id}>{contact.type === 'company' ? contact.companyName : `${contact.firstName} ${contact.lastName}`}</p>)}
        </section>
    );
}
