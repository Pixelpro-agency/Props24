import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import type { LeaseFormData } from '../types/lease.types';
import { leaseApi } from '../services/leaseApi';

interface UseLeaseFormReturn {
    form: UseFormReturn<LeaseFormData>;
    saveDraftMutation: any;
    submitLeaseMutation: any;
    handleSaveDraft: () => void;
}

export const useLeaseForm = (): UseLeaseFormReturn => {
    const queryClient = useQueryClient();

    const form = useForm<LeaseFormData>({
        defaultValues: {
            LeaseDraft: 1,
            LeaseDurationType: 'fixed',
            LeaseFirstBill: false,
            LeaseVatType: '0',
            LeaseIrpfType: '0',
            LeasePaymentTiming: 'anticipato',
            LeaseUpdateType: 'no_review',
            LeaseUpdateAuto: false,
            LeaseRinnovoTacito: true,
            PaymentItems: []
        }
    });

    const { getValues } = form;

    const saveDraftMutation = useMutation({
        mutationFn: leaseApi.saveDraft,
        onSuccess: (data) => {
            console.log('Draft saved successfully:', data);
            // Update URL with draft ID here if needed
        },
        onError: (error) => {
            console.error('Failed to save draft:', error);
        }
    });

    const submitLeaseMutation = useMutation({
        mutationFn: leaseApi.createLease,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leases'] });
            // Redirect or show success
        }
    });

    const handleSaveDraft = useCallback(() => {
        saveDraftMutation.mutate(getValues());
    }, [getValues, saveDraftMutation]);

    // Auto-save logic (Task 15)
    useEffect(() => {
        const interval = setInterval(() => {
            const values = getValues();
            // Only auto-save if property and lease type are set
            if (values.PropertyID && values.LeaseType) {
                saveDraftMutation.mutate(values);
            }
        }, 120000); // 120 seconds

        return () => clearInterval(interval);
    }, [getValues, saveDraftMutation]);

    // Watchers for dynamic calculations can go here
    // const rent = watch('LeaseRentHC');
    // const maintenance = watch('LeaseMaintenance');

    // useEffect(() => {
    //   const total = (Number(rent) || 0) + (Number(maintenance) || 0);
    //   setValue('LeaseMonthlyAmount', total);
    // }, [rent, maintenance, setValue]);

    return {
        form,
        saveDraftMutation,
        submitLeaseMutation,
        handleSaveDraft
    };
};
