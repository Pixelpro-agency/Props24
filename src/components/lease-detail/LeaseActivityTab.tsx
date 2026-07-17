import type { LeaseDetail } from '../../types/leaseDetail';

export function LeaseActivityTab({ detail }: { detail: LeaseDetail }) {
    return (
        <section className="rounded border border-gray-200 bg-white p-4 text-sm">
            {detail.lease.activity.length === 0 ? 'Nessuna attività.' : [...detail.lease.activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((item) => (
                <p key={item.id} className="border-b py-2">{new Date(item.createdAt).toLocaleString('it-IT')} - {item.type} - {item.description}</p>
            ))}
        </section>
    );
}
