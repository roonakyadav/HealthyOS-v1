'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'

import { useAppointments, useCreateAppointment, useStartAppointmentVisit, appointmentSchema, type AppointmentFormData } from '@/hooks/useAppointments'
import type { Appointment } from '@/types'
import { usePatients } from '@/hooks/usePatients'
import { useDoctors } from '@/hooks/useDoctors'
import { useIsAdmin, useIsDoctor } from '@/hooks/useAuth'

type Status = 'scheduled' | 'confirmed' | 'cancelled' | 'completed'

const statusConfig: Record<Status, { label: string; color: string; bgColor: string }> = {
    scheduled: { label: 'Scheduled', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
    confirmed: { label: 'Confirmed', color: 'text-blue-800', bgColor: 'bg-blue-100' },
    completed: { label: 'Completed', color: 'text-green-800', bgColor: 'bg-green-100' },
    cancelled: { label: 'Cancelled', color: 'text-gray-800', bgColor: 'bg-gray-100' },
}

export default function AppointmentsPage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [addDialogOpen, setAddDialogOpen] = useState(false)

    const { data: appointments, isLoading } = useAppointments()
    const { data: patients } = usePatients()
    const { data: doctors } = useDoctors()
    const createAppointmentMutation = useCreateAppointment()
    const startVisitMutation = useStartAppointmentVisit()

    const isAdmin = useIsAdmin()
    const isDoctor = useIsDoctor()
    const canManage = isAdmin || isDoctor

    const form = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            patient_id: '',
            doctor_id: '',
            date: '',
            time: '',
            purpose: '',
            notes: '',
        },
    })

    // Group appointments by date
    const appointmentsByDate = appointments?.reduce((acc, appointment) => {
        const dateKey = appointment.date
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(appointment)
        return acc
    }, {} as Record<string, Appointment[]>) || {}

    // Selected date appointments
    const selectedDateAppointments = selectedDate
        ? appointmentsByDate[selectedDate.toISOString().split('T')[0]] || []
        : []

    const onCreateAppointment = async (data: AppointmentFormData) => {
        try {
            await createAppointmentMutation.mutateAsync(data)
            toast.success('Appointment created successfully')
            setAddDialogOpen(false)
            form.reset()
        } catch (error) {
            toast.error('Failed to create appointment')
            console.error('Error:', error)
        }
    }

    const onStartVisit = async (appointmentId: string) => {
        try {
            await startVisitMutation.mutateAsync({ appointmentId })
            toast.success('Visit started - patient added to queue')
            // Optionally redirect to queue
        } catch (error) {
            toast.error('Failed to start visit')
            console.error('Error:', error)
        }
    }

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const startDate = startOfWeek(monthStart)
        const endDate = endOfWeek(monthEnd)

        const dateFormat = "d"
        const rows = [] as JSX.Element[][]
        const day = startDate
        let days = []

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = addDays(day, i)
                const dayStr = cloneDay.toISOString().split('T')[0]
                const dayAppointments = appointmentsByDate[dayStr] || []
                const hasAppointments = dayAppointments.length > 0

                days.push(
                    <div
                        key={cloneDay.toString()}
                        className={`min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 ${!isSameMonth(cloneDay, monthStart) ? 'bg-gray-100 text-gray-400' : ''
                            } ${isSameDay(cloneDay, new Date()) ? 'bg-blue-50 border-blue-300' : ''}`}
                        onClick={() => setSelectedDate(selectedDate && isSameDay(cloneDay, selectedDate) ? null : cloneDay)}
                    >
                        <div className="text-right text-sm font-medium">
                            {format(cloneDay, dateFormat)}
                        </div>
                        {hasAppointments && (
                            <div className="mt-1 space-y-1">
                                {dayAppointments.slice(0, 2).map((apt, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className={`text-xs w-full justify-start truncate ${statusConfig[apt.status as Status]?.bgColor || 'bg-gray-100'
                                            } ${statusConfig[apt.status as Status]?.color || 'text-gray-800'}`}
                                    >
                                        {apt.time} - {apt.patient?.first_name}
                                    </Badge>
                                ))}
                                {dayAppointments.length > 2 && (
                                    <div className="text-xs text-gray-500">
                                        +{dayAppointments.length - 2} more
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            }
            rows.push(days)
            days = []
            day.setDate(day.getDate() + 7)
        }

        return rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-7 gap-0">
                {row}
            </div>
        ))
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-48">Loading appointments...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
                    <p className="text-muted-foreground">
                        Schedule and manage patient appointments.
                    </p>
                </div>

                {canManage && (
                    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Appointment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Add New Appointment</DialogTitle>
                                <DialogDescription>
                                    Schedule a new appointment for a patient.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onCreateAppointment)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="patient_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Select Patient</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose a patient" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {patients?.map((patient) => (
                                                            <SelectItem key={patient.id} value={patient.id}>
                                                                {patient.first_name} {patient.last_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="doctor_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Select Doctor</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose a doctor" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {doctors?.map((doctor) => (
                                                            <SelectItem key={doctor.id} value={doctor.id}>
                                                                {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Date</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="time"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Time</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="purpose"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Purpose</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Appointment purpose..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Additional Notes (Optional)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Any additional notes..."
                                                        className="resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setAddDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={createAppointmentMutation.isPending}>
                                            {createAppointmentMutation.isPending ? 'Creating...' : 'Create Appointment'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Calendar */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <CardDescription>
                            Click on a date to view appointments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-0 border-b mb-2 text-sm font-medium text-gray-600">
                            <div className="p-2">Sun</div>
                            <div className="p-2">Mon</div>
                            <div className="p-2">Tue</div>
                            <div className="p-2">Wed</div>
                            <div className="p-2">Thu</div>
                            <div className="p-2">Fri</div>
                            <div className="p-2">Sat</div>
                        </div>
                        {renderCalendar()}
                    </CardContent>
                </Card>

                {/* Selected Date Appointments */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {selectedDate
                                ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                                : 'Select a date'
                            }
                        </CardTitle>
                        <CardDescription>
                            Appointments for the selected date
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!selectedDate ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Click on a calendar date to view appointments
                            </div>
                        ) : selectedDateAppointments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No appointments on this date
                            </div>
                        ) : (
                            <ScrollArea className="h-[300px]">
                                <div className="space-y-4">
                                    {selectedDateAppointments.map((appointment) => (
                                        <div key={appointment.id} className="p-3 border rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium">
                                                        {appointment.patient?.first_name} {appointment.patient?.last_name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Dr. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className={`${statusConfig[appointment.status as Status]?.bgColor || 'bg-gray-100'
                                                        } ${statusConfig[appointment.status as Status]?.color || 'text-gray-800'}`}
                                                >
                                                    {statusConfig[appointment.status as Status]?.label || appointment.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {appointment.time}
                                                </div>
                                                <span>{appointment.purpose}</span>
                                            </div>
                                            {canManage && appointment.status === 'confirmed' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onStartVisit(appointment.id)}
                                                    disabled={startVisitMutation.isPending}
                                                >
                                                    {startVisitMutation.isPending ? 'Starting...' : 'Start Visit'}
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
