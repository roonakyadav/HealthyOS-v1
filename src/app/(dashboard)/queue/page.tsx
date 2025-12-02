'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, ArrowRight, Clock, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { useTodayVisits, useCreateVisit, useUpdateVisitStatus } from '@/hooks/useVisits'
import { usePatients } from '@/hooks/usePatients'
import { useDoctors } from '@/hooks/useDoctors'
import type { Visit } from '@/types'

type Status = 'waiting' | 'in_progress' | 'completed'

const statusConfig: Record<Status, { label: string; color: string; bgColor: string }> = {
    waiting: { label: 'Waiting', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
    in_progress: { label: 'In Progress', color: 'text-blue-800', bgColor: 'bg-blue-100' },
    completed: { label: 'Completed', color: 'text-green-800', bgColor: 'bg-green-100' },
}

export default function QueuePage() {
    const [addDialogOpen, setAddDialogOpen] = useState(false)

    const { data: visits, isLoading } = useTodayVisits()
    const { data: patients } = usePatients()
    const { data: doctors } = useDoctors()
    const createVisitMutation = useCreateVisit()
    const updateStatusMutation = useUpdateVisitStatus()

    const form = useForm({
        defaultValues: {
            patient_id: '',
            doctor_id: '',
        },
    })

    // Mock status assignment for demo since status not in DB
    const visitsWithStatus: Visit[] = visits?.map((visit, index) => ({
        ...visit,
        status: (['waiting', 'in_progress', 'completed'] as Status[])[index % 3]
    })) || []

    const onAddToQueue = async (data: { patient_id: string; doctor_id: string }) => {
        try {
            await createVisitMutation.mutateAsync(data)
            toast.success('Patient added to queue')
            setAddDialogOpen(false)
            form.reset()
        } catch (error) {
            toast.error('Failed to add patient to queue')
            console.error('Error:', error)
        }
    }

    const handleStatusUpdate = async (visitId: string, currentStatus: Status, newStatus: Status) => {
        try {
            await updateStatusMutation.mutateAsync({
                id: visitId,
                status: newStatus,
                // Add any additional fields if needed
            })

            const statusMessages = {
                'waiting->in_progress': 'Visit started',
                'in_progress->completed': 'Visit completed',
            }

            const transition = `${currentStatus}->${newStatus}` as keyof typeof statusMessages
            toast.success(statusMessages[transition] || 'Status updated')
        } catch (error) {
            toast.error('Failed to update status')
            console.error('Error:', error)
        }
    }

    const getNextStatus = (currentStatus: Status): Status | null => {
        switch (currentStatus) {
            case 'waiting':
                return 'in_progress'
            case 'in_progress':
                return 'completed'
            default:
                return null
        }
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-48">Loading queue...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Today's Queue</h2>
                    <p className="text-muted-foreground">
                        Manage today's patient visits and appointments.
                    </p>
                </div>

                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add to Queue
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add Patient to Today's Queue</DialogTitle>
                            <DialogDescription>
                                Select the patient and assign a doctor for today's visit.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onAddToQueue)} className="space-y-4">
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
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setAddDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createVisitMutation.isPending}>
                                        {createVisitMutation.isPending ? 'Adding...' : 'Add to Queue'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Visits</CardTitle>
                    <CardDescription>
                        Patients waiting or in consultation today.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!visitsWithStatus || visitsWithStatus.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No visits scheduled for today.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient Name</TableHead>
                                    <TableHead>Doctor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Check-in Time</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visitsWithStatus.map((visit) => (
                                    <TableRow key={visit.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/visits/${visit.id}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {visit.patient?.first_name} {visit.patient?.last_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            Dr. {visit.doctor?.first_name} {visit.doctor?.last_name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={`${statusConfig[visit.status].bgColor} ${statusConfig[visit.status].color} hover:bg-secondary`}
                                            >
                                                {statusConfig[visit.status].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(visit.created_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/visits/${visit.id}`}>
                                                        <Clock className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                {getNextStatus(visit.status) && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(visit.id, visit.status, getNextStatus(visit.status)!)}
                                                        disabled={updateStatusMutation.isPending}
                                                    >
                                                        <UserCheck className="mr-1 h-3 w-3" />
                                                        {visit.status === 'waiting' ? 'Start Visit' : 'Complete Visit'}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
