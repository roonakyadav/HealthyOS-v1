import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Appointment } from '@/types'
import { z } from 'zod'

export const appointmentSchema = z.object({
    patient_id: z.string().uuid('Invalid patient ID'),
    doctor_id: z.string().uuid('Invalid doctor ID'),
    date: z.string().min(1, 'Date is required'),
    time: z.string().min(1, 'Time is required'),
    purpose: z.string().min(1, 'Purpose is required'),
    notes: z.string().optional(),
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>

const supabase = createSupabaseBrowserClient()

export function useAppointments() {
    return useQuery({
        queryKey: ['appointments'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
          *,
          patient:patients(*),
          doctor:doctors(*)
        `)
                .order('date', { ascending: true })
                .order('time', { ascending: true })

            if (error) throw error
            return data as Appointment[]
        },
    })
}

export function useAppointment(id: string) {
    return useQuery({
        queryKey: ['appointment', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
          *,
          patient:patients(*),
          doctor:doctors(*)
        `)
                .eq('id', id)
                .single()

            if (error) throw error
            return data as Appointment
        },
        enabled: !!id,
    })
}

export function useCreateAppointment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: AppointmentFormData) => {
            const { data: result, error } = await supabase
                .from('appointments')
                .insert([{
                    ...data,
                    status: 'scheduled', // Default status
                }])
                .select()
                .single()

            if (error) throw error
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
        },
    })
}

export function useUpdateAppointment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            id,
            status,
            ...updates
        }: {
            id: string;
            status?: string;
            [key: string]: any;
        }) => {
            const { error } = await supabase
                .from('appointments')
                .update({ status, ...updates })
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
        },
    })
}

// Hook to create visit from appointment
export function useStartAppointmentVisit() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ appointmentId }: { appointmentId: string }) => {
            // First get the appointment
            const { data: appointment, error: fetchError } = await supabase
                .from('appointments')
                .select('*')
                .eq('id', appointmentId)
                .single()

            if (fetchError) throw fetchError

            // Create the visit
            const { data: visit, error: visitError } = await supabase
                .from('visits')
                .insert([{
                    patient_id: appointment.patient_id,
                    doctor_id: appointment.doctor_id,
                    appointment_id: appointment.id,
                    date: appointment.date,
                    status: 'waiting',
                    symptoms: '',
                    diagnosis: '',
                    prescription: '',
                    notes: appointment.purpose, // Use appointment purpose as initial notes
                }])
                .select()
                .single()

            if (visitError) throw visitError

            // Update appointment status to completed (since visit is started)
            const { error: updateError } = await supabase
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', appointmentId)

            if (updateError) throw updateError

            return { visit, appointment }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
            queryClient.invalidateQueries({ queryKey: ['visits'] })
        },
    })
}
