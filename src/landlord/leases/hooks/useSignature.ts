import { useMutation } from '@tanstack/react-query';
import { signatureApi } from '../services/signatureApi';

export const useSignature = () => {
    const startSignatureMutation = useMutation({
        mutationFn: signatureApi.startSignatureProcess
    });

    const sendCodeMutation = useMutation({
        mutationFn: signatureApi.sendVerificationCode
    });

    const verifySignatureMutation = useMutation({
        mutationFn: ({ leaseId, code, signatureBase30 }: { leaseId: number, code: string, signatureBase30: string }) =>
            signatureApi.verifyAndSign(leaseId, code, signatureBase30)
    });

    const resetSignatureMutation = useMutation({
        mutationFn: signatureApi.resetSignatureProcess
    });

    return {
        startSignature: startSignatureMutation.mutate,
        isStarting: startSignatureMutation.isPending,

        sendCode: sendCodeMutation.mutate,
        isSendingCode: sendCodeMutation.isPending,

        verifyAndSign: verifySignatureMutation.mutateAsync,
        isVerifying: verifySignatureMutation.isPending,

        resetSignature: resetSignatureMutation.mutate,
        isResetting: resetSignatureMutation.isPending
    };
};
