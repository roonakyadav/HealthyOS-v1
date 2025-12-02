import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Medication } from '@/types'
import { z } from 'zod'

export const medicationSchema = z.object({
    medicine_name: z.string().min(1, 'Medicine name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    frequency: z.string().min(1, 'Frequency is required'),
    duration: z.string().min(1, 'Duration is required'),
    notes: z.string().optional(),
})

export type MedicationFormData = z.infer<typeof medicationSchema>

const supabase = createSupabaseBrowserClient()

export function useMedications(visitId: string) {
    return useQuery({
        queryKey: ['medications', visitId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('medications')
                .select('*')
                .eq('visit_id', visitId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as Medication[]
        },
        enabled: !!visitId,
    })
}

export function useCreateMedication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            visit_id,
            medicine_name,
            dosage,
            frequency,
            duration,
            notes
        }: {
            visit_id: string;
            medicine_name: string;
            dosage: string;
            frequency: string;
            duration: string;
            notes?: string;
        }) => {
            const { data, error } = await supabase
                .from('medications')
                .insert([{
                    visit_id,
                    medicine_name,
                    dosage,
                    frequency,
                    duration,
                    notes,
                }])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['medications', variables.visit_id] })
        },
    })
}

export function useUpdateMedication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            id,
            medicine_name,
            dosage,
            frequency,
            duration,
            notes
        }: {
            id: string;
            medicine_name: string;
            dosage: string;
            frequency: string;
            duration: string;
            notes?: string;
        }) => {
            const { error } = await supabase
                .from('medications')
                .update({
                    medicine_name,
                    dosage,
                    frequency,
                    duration,
                    notes,
                })
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['medications'] })
        },
    })
}

export function useDeleteMedication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('medications')
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medications'] })
        },
    })
}
