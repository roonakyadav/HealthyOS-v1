import { useQuery } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { addDays, startOfDay, endOfDay } from 'date-fns'

const supabase = createSupabaseBrowserClient()

export function useDashboardStats(doctorId?: string) {
    return useQuery({
        queryKey: ['dashboard', 'stats', doctorId || 'all'],
        queryFn: async () => {
            // Today’s date range
            const today = new Date()
            const todayStart = startOfDay(today)
            const todayEnd = endOfDay(today)

            const tomorrowStart = addDays(todayStart, 1)
            const tomorrowEnd = addDays(todayEnd, 1)

            const weekLater = addDays(today, 7)

            let visitsQuery = supabase.from('visits').select('*')
            let appointmentsQuery = supabase.from('appointments').select('*')

            if (doctorId) {
                visitsQuery = visitsQuery.eq('doctor_id', doctorId)
                appointmentsQuery = appointmentsQuery.eq('doctor_id', doctorId)
            }

            // Today's stats
            const todayVisits = await visitsQuery
                .gte('date', todayStart.toISOString().split('T')[0])
                .lte('date', todayEnd.toISOString().split('T')[0])

            const { count: todayVisitsCount } = await visitsQuery
                .gte('date', todayStart.toISOString().split('T')[0])
                .lte('date', todayEnd.toISOString().split('T')[0])
                .neq('status', 'completed')

            const { count: completedTodayCount } = await visitsQuery
                .gte('date', todayStart.toISOString().split('T')[0])
                .lte('date', todayEnd.toISOString().split('T')[0])
                .eq('status', 'completed')

            const { count: tomorrowAppointmentsCount } = await appointmentsQuery
                .gte('date', tomorrowStart.toISOString().split('T')[0])
                .lte('date', tomorrowEnd.toISOString().split('T')[0])

            const { count: totalPatients } = await visitsQuery

            return {
                todaysVisitsCount: todayVisitsCount || 0,
                completedTodayCount: completedTodayCount || 0,
                tomorrowAppointmentsCount: tomorrowAppointmentsCount || 0,
                totalPatientsCount: totalPatients || 0,
            }
        },
    })
}

export function useUpcomingAppointments(doctorId?: string, limit = 7) {
    return useQuery({
        queryKey: ['dashboard', 'upcoming-appointments', doctorId || 'all', limit],
        queryFn: async () => {
            const today = new Date()
            const weekLater = addDays(today, 7)

            let query = supabase
                .from('appointments')
                .select(`
          *,
          patient:patients(*)
        `)
                .gte('date', today.toISOString().split('T')[0])
                .lte('date', weekLater.toISOString().split('T')[0])
                .order('date', { ascending: true })
                .order('time', { ascending: true })
                .limit(limit)

            if (doctorId) {
                query = query.eq('doctor_id', doctorId)
            }

            const { data, error } = await query
            if (error) throw error
            return data
        },
    })
}

export function useRecentCompletedVisits(doctorId?: string, limit = 10) {
    return useQuery({
        queryKey: ['dashboard', 'recent-visits', doctorId || 'all', limit],
        queryFn: async () => {
            let query = supabase
                .from('visits')
                .select(`
          *,
          patient:patients(*)
        `)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(limit)

            if (doctorId) {
                query = query.eq('doctor_id', doctorId)
            }

            const { data, error } = await query
            if (error) throw error
            return data
        },
    })
}
