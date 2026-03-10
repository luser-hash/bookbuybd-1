'use client';
import { useState } from 'react';
import EmergencyForm from '@/components/pages/printing/EmergencyForm';
import EmergencyCheckout from '@/components/pages/printing/EmergencyCheckout';
import EmergencyConfirm from '@/components/pages/printing/EmergencyConfirm';
import EmergencySuccess from '@/components/pages/printing/EmergencySuccess';
import { useSearchParams } from 'next/navigation';
import {
    PrintingDetails,
    PrintingCheckoutForm,
    EMPTY_PRINTING_DETAILS,
    EMPTY_PRINTING_FORM
} from '@/components/pages/printing/printingStore';

type Step = 'form' | 'checkout' | 'confirm' | 'success';

export default function EmergencyPrintingFlow() {
    const searchParams = useSearchParams();
    const isEmergencyParam = searchParams.get('emergency') === 'true';

    const [step, setStep] = useState<Step>('form');
    const [details, setDetails] = useState<PrintingDetails>({
        ...EMPTY_PRINTING_DETAILS,
        isEmergency: isEmergencyParam
    });
    const [form, setForm] = useState<PrintingCheckoutForm>(EMPTY_PRINTING_FORM);
    const [orderRef, setOrderRef] = useState<string>('');

    return (
        <div className="min-h-screen bg-[#f8fafc] py-8 lg:py-12">
            {/* ── Modern Step Indicator ── */}
            {step !== 'success' && (
                <div className="max-w-4xl mx-auto px-4 mb-16 mt-4">
                    <div className="relative flex items-center justify-between">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
                        <div
                            className="absolute top-1/2 left-0 h-0.5 bg-brand-500 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out"
                            style={{
                                width: step === 'form' ? '0%' : step === 'checkout' ? '50%' : '100%'
                            }}
                        />

                        {(['form', 'checkout', 'confirm'] as const).map((s, i) => {
                            const isActive = step === s;
                            const isPast = ['form', 'checkout', 'confirm'].indexOf(step) > i;
                            const labels = { form: 'Print Details', checkout: 'Delivery Info', confirm: 'Review' };
                            const icons = {
                                form: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                ),
                                checkout: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                ),
                                confirm: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )
                            };

                            return (
                                <div key={s} className="relative z-10 flex flex-col items-center group">
                                    <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 border-4 shadow-xl ${isActive ? 'bg-brand-600 border-white text-white scale-110 shadow-brand-200' : isPast ? 'bg-brand-100 border-white text-brand-600 shadow-brand-100/50' : 'bg-white border-gray-50 text-gray-300 shadow-none'}`}>
                                        {icons[s]}
                                    </div>
                                    <div className="absolute top-14 whitespace-nowrap text-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${isActive ? 'text-gray-900' : isPast ? 'text-brand-600' : 'text-gray-300'}`}>
                                            {labels[s]}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Step Router ── */}
            {step === 'form' && (
                <EmergencyForm
                    details={details}
                    onNext={(d: PrintingDetails) => {
                        setDetails(d);
                        setStep('checkout');
                    }}
                />
            )}

            {step === 'checkout' && (
                <EmergencyCheckout
                    form={form}
                    onBack={() => setStep('form')}
                    onNext={(f: PrintingCheckoutForm) => {
                        setForm(f);
                        setStep('confirm');
                    }}
                />
            )}

            {step === 'confirm' && (
                <EmergencyConfirm
                    details={details}
                    form={form}
                    onBack={() => setStep('checkout')}
                    onSubmit={() => {
                        // Mock API submission logic...
                        const refNumber = `EMG-${Math.floor(100000 + Math.random() * 900000)}`;
                        setOrderRef(refNumber);
                        // Complete transition
                        setStep('success');
                    }}
                />
            )}

            {step === 'success' && (
                <EmergencySuccess
                    orderRef={orderRef}
                    onReset={() => {
                        setDetails(EMPTY_PRINTING_DETAILS);
                        setForm(EMPTY_PRINTING_FORM);
                        setStep('form');
                    }}
                />
            )}
        </div>
    );
}
