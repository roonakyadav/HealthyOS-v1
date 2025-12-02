import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Visit } from '@/types'
import { z } from 'zod'

export const visitSchema = z.object({
    patient_id: z.string().uuid('Invalid patient ID'),
    doctor_id: z.string().uuid('Invalid doctor ID'),
    date: z.string(),
    symptoms: z.string().optional(),
    diagnosis: z.string().optional(),
    prescription: z.string().optional(),
    notes: z.string().optional(),
})

export type VisitFormData = z.infer<typeof visitSchema>

const supabase = createSupabaseBrowserClient()

export function useTodayVisits() {
    return useQuery({
        queryKey: ['visits', 'today'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
            const { data, error } = await supabase
                .from('visits')
                .select(`
          *,
          patient:patients(*),
          doctor:doctors(*)
        `)
                .eq('date', today)
                .order('created_at', { ascending: true })

            if (error) throw error
            // For now, assume all visits have status 'completed' since schema doesn't have it
            // Todo: Will need to add status field
            return data.map((visit: any) => ({
                ...visit,
                status: 'completed' as const, // Placeholder
            })) as Visit[]
        },
    })
}

export function useVisit(id: string) {
    return useQuery({
        queryKey: ['visit', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('visits')
                .select(`
          *,
          patient:patients(*),
          doctor:doctors(*)
        `)
                .eq('id', id)
                .single()

            if (error) throw error
            return {
                ...data,
                status: 'completed' as const, // Placeholder
            } as Visit
        },
        enabled: !!id,
    })
}

export function useCreateVisit() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ patient_id, doctor_id }: { patient_id: string; doctor_id: string }) => {
            const today = new Date().toISOString().split('T')[0]
            const { data, error } = await supabase
                .from('visits')
                .insert([{
                    patient_id,
                    doctor_id,
                    date: today,
                    symptoms: '',
                    diagnosis: '',
                    prescription: '',
                    notes: '',
                }])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['visits'] })
        },
    })
}

export function useUpdateVisitStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            id,
            status,
            symptoms,
            diagnosis,
            prescription,
            notes
        }: {
            id: string;
            status?: string;
            symptoms?: string;
            diagnosis?: string;
            prescription?: string;
            notes?: string;
        }) => {
            const updateData: any = {}
            if (symptoms !== undefined) updateData.symptoms = symptoms
            if (diagnosis !== undefined) updateData.diagnosis = diagnosis
            if (prescription !== undefined) updateData.prescription = prescription
            if (notes !== undefined) updateData.notes = notes

            // Note: Since status is not in schema, we'll use notes for now or handle elsewhere
            // This is a workaround for missing status column

            const { error } = await supabase
                .from('visits')
                .update(updateData)
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['visits'] })
        },
    })
}
