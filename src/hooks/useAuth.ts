import { useQuery } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { User } from '@/types'

const supabase = createSupabaseBrowserClient()

export function useUser() {
    return useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const { data: session } = await supabase.auth.getSession()

            if (!session?.session?.user) return null

            const { data: user, error } = await supabase
                .from('users')
                .select(`
          *,
          roles:role_id (
            id,
            name
          )
        `)
                .eq('id', session.session.user.id)
                .single()

            if (error) throw error
            return {
                ...user,
                role: (user as any).roles?.name as 'admin' | 'doctor' | 'patient'
            } as User
        },
    })
}

export function useIsAdmin() {
    const { data: user } = useUser()
    return user?.role === 'admin'
}

export function useIsDoctor() {
    const { data: user } = useUser()
    return user?.role === 'doctor'
}

export function useIsPatient() {
    const { data: user } = useUser()
    return user?.role === 'patient'
}
