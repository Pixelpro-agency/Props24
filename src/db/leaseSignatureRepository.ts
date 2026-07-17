import { generateId, getJsonDb, saveJsonDb } from './jsonDb';
import { saveLeaseContractSnapshot } from './leaseContractRepository';
import { LeaseNotFoundError, LeaseSignatureError } from './databaseErrors';
import type { LeaseSignatureSigner } from './database.types';

function now() { return new Date().toISOString(); }

function addActivity(lease: ReturnType<typeof getJsonDb>['leases'][number], description: string) {
    return { ...lease, updatedAt: now(), activity: [...lease.activity, { id: generateId('lease-activity'), type: 'signature' as const, description, createdAt: now() }] };
}

function signerName(db: ReturnType<typeof getJsonDb>, role: LeaseSignatureSigner['role'], id: string | null): string {
    if (role === 'landlord') {
        const user = db.userProfile as { firstName?: string; lastName?: string; name?: string; companyName?: string };
        return user.companyName || user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Locatore';
    }
    if (role === 'tenant') {
        const t = db.tenants.find((item) => item.id === id);
        return t ? (t.type === 'company' ? t.companyName : `${t.firstName} ${t.lastName}`.trim()) : 'Inquilino';
    }
    const g = db.contacts.find((item) => item.id === id);
    return g ? (g.type === 'company' ? g.companyName : `${g.firstName} ${g.lastName}`.trim()) : 'Garante';
}

export function startLocalSignatureProcess(leaseId: string) {
    const snapshot = saveLeaseContractSnapshot(leaseId);
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === leaseId);
    if (!lease) throw new LeaseNotFoundError();
    if (lease.archived || lease.status === 'terminata') throw new LeaseSignatureError('La firma locale non può essere avviata per questa locazione.');
    if (lease.signatureProcess) throw new LeaseSignatureError('La procedura di firma locale è già attiva.');
    const signers: LeaseSignatureSigner[] = [
        { key: 'landlord', role: 'landlord', entityId: null, nameSnapshot: signerName(db, 'landlord', null), status: 'pending', signedAt: null, signatureDataUrl: null },
        ...lease.tenantIds.map((id) => ({ key: `tenant-${id}`, role: 'tenant' as const, entityId: id, nameSnapshot: signerName(db, 'tenant', id), status: 'pending' as const, signedAt: null, signatureDataUrl: null })),
        ...lease.guarantorIds.map((id) => ({ key: `guarantor-${id}`, role: 'guarantor' as const, entityId: id, nameSnapshot: signerName(db, 'guarantor', id), status: 'pending' as const, signedAt: null, signatureDataUrl: null })),
    ];
    const nextLease = addActivity({ ...lease, signatureProcess: { status: 'in_progress', startedAt: now(), completedAt: null, contractDocumentId: snapshot.id, signers } }, 'Procedura di firma locale avviata.');
    return saveJsonDb({ ...db, leases: db.leases.map((item) => item.id === leaseId ? nextLease : item) }).leases.find((item) => item.id === leaseId)!;
}

export function signLocalLease(leaseId: string, signerKey: string, signatureDataUrl: string) {
    if (!signatureDataUrl.startsWith('data:image/png;base64,')) throw new LeaseSignatureError('La firma deve essere in formato PNG.');
    if (signatureDataUrl.length > 500 * 1024) throw new LeaseSignatureError('La firma supera 500 KB.');
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === leaseId);
    if (!lease) throw new LeaseNotFoundError();
    if (!lease.signatureProcess || lease.signatureProcess.status === 'completed') throw new LeaseSignatureError('Procedura di firma non disponibile.');
    const signer = lease.signatureProcess.signers.find((item) => item.key === signerKey);
    if (!signer) throw new LeaseSignatureError('Firmatario non trovato.');
    if (signer.status === 'signed') throw new LeaseSignatureError('Firmatario già firmato.');
    const signers = lease.signatureProcess.signers.map((item) => item.key === signerKey ? { ...item, status: 'signed' as const, signedAt: now(), signatureDataUrl } : item);
    const completed = signers.every((item) => item.status === 'signed');
    const nextLease = addActivity({ ...lease, signatureProcess: { ...lease.signatureProcess, signers, status: completed ? 'completed' : 'in_progress', completedAt: completed ? now() : null } }, 'Firma locale registrata.');
    return saveJsonDb({ ...db, leases: db.leases.map((item) => item.id === leaseId ? nextLease : item) }).leases.find((item) => item.id === leaseId)!;
}

export function resetLocalSignatureProcess(leaseId: string) {
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === leaseId);
    if (!lease) throw new LeaseNotFoundError();
    const nextLease = addActivity({ ...lease, signatureProcess: null }, 'Procedura di firma locale annullata.');
    return saveJsonDb({ ...db, leases: db.leases.map((item) => item.id === leaseId ? nextLease : item) }).leases.find((item) => item.id === leaseId)!;
}
