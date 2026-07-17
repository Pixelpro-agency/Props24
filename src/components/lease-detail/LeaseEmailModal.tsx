import { useEffect, useMemo, useState } from 'react';
import { getLeaseEmailRecipients, prepareLeaseEmail } from '../../db/leaseCommunicationRepository';
import { getJsonDb } from '../../db/jsonDb';
import { Modal } from '../property-form/ui/Modal';
import { Button } from '../ui/Button';
import { errorMessage } from './shared';

interface Props {
    isOpen: boolean;
    leaseIds: string[];
    defaultSubject: string;
    defaultBody: string;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function LeaseEmailModal({ isOpen, leaseIds, defaultSubject, defaultBody, onClose, onSuccess, onError }: Props) {
    const [subject, setSubject] = useState(defaultSubject);
    const [body, setBody] = useState(defaultBody);
    const [saving, setSaving] = useState(false);
    const [localError, setLocalError] = useState('');
    const recipients = useMemo(() => getLeaseEmailRecipients(leaseIds), [leaseIds, isOpen]);
    const missing = useMemo(() => {
        const db = getJsonDb();
        const tenantIds = new Set(db.leases.filter((lease) => leaseIds.includes(lease.id)).flatMap((lease) => lease.tenantIds));
        return db.tenants.filter((tenant) => tenantIds.has(tenant.id) && !tenant.email.trim());
    }, [leaseIds, isOpen]);

    useEffect(() => {
        setSubject(defaultSubject);
        setBody(defaultBody);
        setLocalError('');
    }, [defaultSubject, defaultBody, isOpen]);

    const submit = () => {
        if (recipients.length === 0) {
            setLocalError('Nessun destinatario con email.');
            return;
        }
        if (!subject.trim() || !body.trim()) {
            setLocalError('Oggetto e corpo sono obbligatori.');
            return;
        }
        setSaving(true);
        try {
            const result = prepareLeaseEmail({ leaseIds, subject, body });
            window.location.href = result.mailtoUrl;
            onSuccess('Bozza email preparata nel client di posta.');
            onClose();
        } catch (error) {
            const message = errorMessage(error);
            setLocalError(message);
            onError(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={saving ? () => undefined : onClose} title="Prepara email" maxWidth="2xl" footer={<><Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button><Button type="button" onClick={submit} loading={saving}>Prepara</Button></>}>
            <div className="space-y-4 text-sm">
                <div><p className="font-medium">Destinatari</p>{recipients.length === 0 ? <p className="text-gray-500">Nessun destinatario.</p> : recipients.map((recipient) => <p key={recipient.email}>{recipient.name} - {recipient.email}</p>)}</div>
                {missing.length > 0 && <div><p className="font-medium">Senza email</p>{missing.map((tenant) => <p key={tenant.id}>{tenant.type === 'company' ? tenant.companyName : `${tenant.firstName} ${tenant.lastName}`}</p>)}</div>}
                <label className="grid gap-1"><span>Oggetto</span><input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded border px-3 py-2" /></label>
                <label className="grid gap-1"><span>Corpo</span><textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-40 rounded border px-3 py-2" /></label>
                {localError && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{localError}</p>}
            </div>
        </Modal>
    );
}
