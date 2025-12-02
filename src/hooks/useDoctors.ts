import { useQuery } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Doctor } from '@/types'

const supabase = createSupabaseBrowserClient()

export function useDoctors() {
    return useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('doctors')
                .select('*')
                .order('first_name', { ascending: true })

            if (error) throw error
            return data as Doctor[]
        },
    })
}
