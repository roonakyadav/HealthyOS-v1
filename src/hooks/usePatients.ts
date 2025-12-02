import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Patient } from '@/types'
import { z } from 'zod'

export const patientSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    phone: z.string().min(8, 'Phone number must be at least 8 characters'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    address: z.string().min(1, 'Address is required'),
    emergency_contact: z.string().min(1, 'Emergency contact is required'),
    medical_history: z.string().optional(),
})

export type PatientFormData = z.infer<typeof patientSchema>

const supabase = createSupabaseBrowserClient()

export function usePatients() {
    return useQuery({
        queryKey: ['patients'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as Patient[]
        },
    })
}

export function usePatient(id: string) {
    return useQuery({
        queryKey: ['patient', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            return data as Patient
        },
        enabled: !!id,
    })
}

export function useCreatePatient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: PatientFormData) => {
            const { data: result, error } = await supabase
                .from('patients')
                .insert([data])
                .select()
                .single()

            if (error) throw error
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] })
        },
    })
}

export function useDeletePatient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] })
        },
    })
}
