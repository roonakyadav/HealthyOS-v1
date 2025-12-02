'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Activity, Users, Calendar, Clock, ChevronRight } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useDashboardStats, useUpcomingAppointments, useRecentCompletedVisits } from '@/hooks/useDashboard'
import { useDoctors } from '@/hooks/useDoctors'
import { useUser, useIsAdmin } from '@/hooks/useAuth'

const statusConfig = {
    scheduled: { label: 'Scheduled', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
    confirmed: { label: 'Confirmed', color: 'text-blue-800', bgColor: 'bg-blue-100' },
    completed: { label: 'Completed', color: 'text-green-800', bgColor: 'bg-green-100' },
    cancelled: { label: 'Cancelled', color: 'text-gray-800', bgColor: 'bg-gray-100' },
}

function StatCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
            </CardContent>
        </Card>
    )
}

function ListItemSkeleton() {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-8" />
        </div>
    )
}

export default function DashboardPage() {
    const { data: user } = useUser()
    const isAdmin = useIsAdmin()
    const { data: doctors } = useDoctors()

    const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
        user?.role === 'doctor' ? user.id : ''
    )

    // Determine which doctor stats to show
    const doctorId = user?.role === 'doctor' ? user.id : (selectedDoctorId || undefined)

    const { data: stats, isLoading: statsLoading } = useDashboardStats(doctorId)
    const { data: upcomingAppointments, isLoading: appointmentsLoading } = useUpcomingAppointments(doctorId)
    const { data: recentVisits, isLoading: visitsLoading } = useRecentCompletedVisits(doctorId)

    const statCards = [
        {
            title: "Today's Visits",
            value: stats?.todaysVisitsCount || 0,
            description: 'Pending visits today',
            icon: Activity,
            href: '/queue',
        },
        {
            title: 'Completed Today',
            value: stats?.completedTodayCount || 0,
            description: 'Visits completed today',
            icon: Clock,
            href: '/queue',
        },
        {
            title: "Tomorrow's Appointments",
            value: stats?.tomorrowAppointmentsCount || 0,
            description: 'Scheduled for tomorrow',
            icon: Calendar,
            href: '/appointments',
        },
        {
            title: 'Total Patients',
            value: stats?.totalPatientsCount || 0,
            description: 'Patients seen',
            icon: Users,
            href: '/patients',
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Overview of your daily operations and key metrics.
                    </p>
                </div>

                {isAdmin && (
                    <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Doctors</SelectItem>
                            {doctors?.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                    Dr. {doctor.first_name} {doctor.last_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsLoading
                    ? Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
                    : statCards.map((stat) => (
                        <Card key={stat.title} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold cursor-pointer">
                                    <Link href={stat.href} className="hover:underline">
                                        {stat.value}
                                    </Link>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
            </div>

            {/* Lists */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Upcoming Appointments */}
                <Card>
                    <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-2">
                            <CardTitle>Upcoming Appointments</CardTitle>
                            <CardDescription>
                                Next 7 days - {
                                    selectedDoctorId
                                        ? `Dr. ${doctors?.find(d => d.id === selectedDoctorId)?.first_name} ${doctors?.find(d => d.id === selectedDoctorId)?.last_name}`
                                        : 'All doctors'
                                }
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {appointmentsLoading ? (
                            Array(5).fill(0).map((_, i) => <ListItemSkeleton key={i} />)
                        ) : !upcomingAppointments || upcomingAppointments.length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground">
                                No upcoming appointments
                            </p>
                        ) : (
                            upcomingAppointments.slice(0, 6).map((appointment) => (
                                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div>
                                        <p className="font-medium">
                                            {appointment.patient?.first_name} {appointment.patient?.last_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {appointment.purpose}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={`${statusConfig[appointment.status as keyof typeof statusConfig]?.bgColor || 'bg-gray-100'
                                            } ${statusConfig[appointment.status as keyof typeof statusConfig]?.color || 'text-gray-800'}`}>
                                            {statusConfig[appointment.status as keyof typeof statusConfig]?.label || appointment.status}
                                        </Badge>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href="/appointments">
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                        {!appointmentsLoading && upcomingAppointments && upcomingAppointments.length > 6 && (
                            <div className="text-center pt-2">
                                <Button variant="outline" asChild>
                                    <Link href="/appointments">
                                        View all appointments
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Completed Visits */}
                <Card>
                    <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-2">
                            <CardTitle>Recent Completed Visits</CardTitle>
                            <CardDescription>
                                Latest completed visits - {
                                    selectedDoctorId
                                        ? `Dr. ${doctors?.find(d => d.id === selectedDoctorId)?.first_name} ${doctors?.find(d => d.id === selectedDoctorId)?.last_name}`
                                        : 'All doctors'
                                }
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {visitsLoading ? (
                            Array(5).fill(0).map((_, i) => <ListItemSkeleton key={i} />)
                        ) : !recentVisits || recentVisits.length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground">
                                No completed visits recently
                            </p>
                        ) : (
                            recentVisits.slice(0, 6).map((visit) => (
                                <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div>
                                        <p className="font-medium">
                                            {visit.patient?.first_name} {visit.patient?.last_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(visit.date), 'MMM d, yyyy')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {visit.diagnosis || 'No diagnosis'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/visits/${visit.id}`}>
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                        {!visitsLoading && recentVisits && recentVisits.length > 6 && (
                            <div className="text-center pt-2">
                                <Button variant="outline" asChild>
                                    <Link href="/patients">
                                        View all patients
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
