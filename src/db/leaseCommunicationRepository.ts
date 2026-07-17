import { generateId, getJsonDb, saveJsonDb } from './jsonDb';
import type { MessageRecord } from './database.types';
import { LeaseCommunicationError } from './databaseErrors';

function tenantName(tenant: ReturnType<typeof getJsonDb>['tenants'][number]): string {
    return tenant.type === 'company' ? tenant.companyName : `${tenant.firstName} ${tenant.lastName}`.trim();
}

export function getLeaseEmailRecipients(leaseIds: string[]) {
    const db = getJsonDb();
    const seen = new Set<string>();
    const recipients: Array<{ name: string; email: string; tenantIds: string[] }> = [];
    db.leases.filter((lease) => leaseIds.includes(lease.id)).forEach((lease) => {
        lease.tenantIds.forEach((tenantId) => {
            const tenant = db.tenants.find((item) => item.id === tenantId);
            const email = tenant?.email.trim();
            if (!tenant || !email) return;
            const key = email.toLowerCase();
            const existing = recipients.find((item) => item.email.toLowerCase() === key);
            if (existing) existing.tenantIds = Array.from(new Set([...existing.tenantIds, tenantId]));
            else if (!seen.has(key)) {
                seen.add(key);
                recipients.push({ name: tenantName(tenant), email, tenantIds: [tenantId] });
            }
        });
    });
    return recipients;
}

export function prepareLeaseEmail(input: { leaseIds: string[]; subject: string; body: string }): { mailtoUrl: string; records: MessageRecord[] } {
    const ids = Array.from(new Set(input.leaseIds));
    if (ids.length === 0 || !input.subject.trim() || !input.body.trim()) throw new LeaseCommunicationError('Oggetto, testo e locazione sono obbligatori.');
    const recipients = getLeaseEmailRecipients(ids);
    if (recipients.length === 0) throw new LeaseCommunicationError('Nessun destinatario email disponibile.');
    const db = getJsonDb();
    const now = new Date().toISOString();
    const records: MessageRecord[] = ids.map((leaseId) => ({
        id: generateId('message'),
        entityType: 'lease',
        entityId: leaseId,
        channel: 'email',
        status: 'prepared',
        recipientTenantIds: Array.from(new Set(recipients.flatMap((item) => item.tenantIds))),
        recipients: recipients.map(({ name, email }) => ({ name, email })),
        subject: input.subject,
        body: input.body,
        createdAt: now,
    }));
    const leases = db.leases.map((lease) => ids.includes(lease.id) ? { ...lease, activity: [...lease.activity, { id: generateId('lease-activity'), type: 'communication' as const, description: 'Bozza email preparata.', createdAt: now }], updatedAt: now } : lease);
    saveJsonDb({ ...db, leases, messages: [...db.messages, ...records] });
    const param = recipients.length > 1 ? `bcc=${encodeURIComponent(recipients.map((item) => item.email).join(','))}` : `to=${encodeURIComponent(recipients[0].email)}`;
    return { mailtoUrl: `mailto:?${param}&subject=${encodeURIComponent(input.subject)}&body=${encodeURIComponent(input.body)}`, records };
}

export function listLeaseCommunications(leaseId: string): MessageRecord[] {
    return getJsonDb().messages.filter((message) => message.entityType === 'lease' && message.entityId === leaseId);
}
