import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Doctor } from '@/types'
import { z } from 'zod'

export const addDoctorSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(1, 'Phone is required'),
    specialization: z.string().min(1, 'Specialization is required'),
    license_number: z.string().min(1, 'License number is required'),
})

export const editDoctorSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(1, 'Phone is required'),
    specialization: z.string().min(1, 'Specialization is required'),
    license_number: z.string().min(1, 'License number is required'),
})

export type AddDoctorFormData = z.infer<typeof addDoctorSchema>
export type EditDoctorFormData = z.infer<typeof editDoctorSchema>

const supabase = createSupabaseBrowserClient()

export function useDoctors() {
    return useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('doctors')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as Doctor[]
        },
    })
}

export function useAddDoctor() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: AddDoctorFormData) => {
            // Generate a temporary password
            const tempPassword = Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-8)

            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: tempPassword,
            })

            if (authError) throw authError

            // Get doctor role ID
            const { data: roleData, error: roleError } = await supabase
                .from('roles')
                .select('id')
                .eq('name', 'doctor')
                .single()

            if (roleError) throw roleError

            // Create users table entry
            const { error: userError } = await supabase
                .from('users')
                .insert([{
                    id: authData.user!.id,
                    email: data.email,
                    role: 'doctor', // For backward compatibility
                    role_id: roleData.id,
                }])

            if (userError) throw userError

            // Create doctor record
            const { data: doctorData, error: doctorError } = await supabase
                .from('doctors')
                .insert([{
                    id: authData.user!.id,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    phone: data.phone,
                    specialization: data.specialization,
                    license_number: data.license_number,
                }])
                .select()
                .single()

            if (doctorError) throw doctorError

            // TODO: Send email with temp password (would need email service)
            console.log(`Doctor created! Temp password: ${tempPassword}`)

            return { doctorData, tempPassword }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] })
        },
    })
}

export function useUpdateDoctor() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: EditDoctorFormData }) => {
            // Update doctor record
            const { error: doctorError } = await supabase
                .from('doctors')
                .update({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    phone: data.phone,
                    specialization: data.specialization,
                    license_number: data.license_number,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)

            if (doctorError) throw doctorError

            // Update users table
            const { error: userError } = await supabase
                .from('users')
                .update({
                    email: data.email,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)

            if (userError) throw userError

            // Update auth email if changed
            // Note: This might require email verification in production
            const { error: authError } = await supabase.auth.updateUser({
                email: data.email,
            })

            if (authError) throw authError
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] })
        },
    })
}

export function useDeleteDoctor() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            // Delete doctor record
            const { error: doctorError } = await supabase
                .from('doctors')
                .delete()
                .eq('id', id)

            if (doctorError) throw doctorError

            // Delete users table entry
            const { error: userError } = await supabase
                .from('users')
                .delete()
                .eq('id', id)

            if (userError) throw userError

            // Note: Auth user deletion requires admin privileges
            // This would need to be handled by an admin function in production
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] })
        },
    })
}
