'use client'

import React, { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useDoctors, useAddDoctor, useUpdateDoctor, useDeleteDoctor, addDoctorSchema, editDoctorSchema, type AddDoctorFormData, type EditDoctorFormData } from '@/hooks/useDoctors'
import { useIsAdmin } from '@/hooks/useAuth'
import type { Doctor } from '@/types'

export default function DoctorsPage() {
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)

    const isAdmin = useIsAdmin()
    const { data: doctors, isLoading } = useDoctors()
    const addDoctorMutation = useAddDoctor()
    const updateDoctorMutation = useUpdateDoctor()
    const deleteDoctorMutation = useDeleteDoctor()

    const addForm = useForm<AddDoctorFormData>({
        resolver: zodResolver(addDoctorSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            specialization: '',
            license_number: '',
        },
    })

    const editForm = useForm<EditDoctorFormData>({
        resolver: zodResolver(editDoctorSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            specialization: '',
            license_number: '',
        },
    })

    const handleAddDoctor = async (data: AddDoctorFormData) => {
        try {
            const result = await addDoctorMutation.mutateAsync(data)
            toast.success('Doctor added successfully!')

            // Show temporary password to admin
            toast.info(`Temporary password generated: ${result.tempPassword}. Please share this with the doctor.`)

            setShowAddDialog(false)
            addForm.reset()
        } catch (error: any) {
            toast.error(error.message || 'Failed to add doctor')
        }
    }

    const handleEditDoctorClick = (doctor: Doctor) => {
        setEditingDoctor(doctor)
        editForm.reset({
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            email: doctor.email,
            phone: doctor.phone,
            specialization: doctor.specialization,
            license_number: doctor.license_number,
        })
        setShowEditDialog(true)
    }

    const handleUpdateDoctor = async (data: EditDoctorFormData) => {
        if (!editingDoctor) return

        try {
            await updateDoctorMutation.mutateAsync({
                id: editingDoctor.id,
                data,
            })
            toast.success('Doctor updated successfully!')
            setShowEditDialog(false)
            setEditingDoctor(null)
            editForm.reset()
        } catch (error) {
            toast.error('Failed to update doctor')
        }
    }

    const handleDeleteDoctor = async (doctorId: string, doctorName: string) => {
        try {
            await deleteDoctorMutation.mutateAsync(doctorId)
            toast.success(`Dr. ${doctorName} has been removed.`)
        } catch (error) {
            toast.error('Failed to delete doctor')
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="text-center">Loading doctors...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Doctors</h2>
                    <p className="text-muted-foreground">
                        Manage clinic doctors and their information.
                    </p>
                </div>

                {isAdmin && (
                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Doctor
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Add New Doctor</DialogTitle>
                                <DialogDescription>
                                    Add a new doctor to the clinic. A temporary password will be generated for their login.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...addForm}>
                                <form onSubmit={addForm.handleSubmit(handleAddDoctor)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={addForm.control}
                                            name="first_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>First Name</FormLabel>
                                                    <FormControl><Input {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={addForm.control}
                                            name="last_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Last Name</FormLabel>
                                                    <FormControl><Input {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={addForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl><Input type="email" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={addForm.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={addForm.control}
                                            name="specialization"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Specialization</FormLabel>
                                                    <FormControl><Input {...field} placeholder="e.g., Cardiology" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={addForm.control}
                                            name="license_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>License Number</FormLabel>
                                                    <FormControl><Input {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowAddDialog(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={addDoctorMutation.isPending}>
                                            {addDoctorMutation.isPending ? 'Adding...' : 'Add Doctor'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Clinic Doctors</CardTitle>
                    <CardDescription>
                        All registered doctors in the clinic system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!doctors || doctors.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                            No doctors found. Add your first doctor to get started.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Specialization</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    {isAdmin && <TableHead className="w-[120px]">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {doctors.map((doctor) => (
                                    <TableRow key={doctor.id}>
                                        <TableCell className="font-medium">
                                            Dr. {doctor.first_name} {doctor.last_name}
                                        </TableCell>
                                        <TableCell>{doctor.specialization}</TableCell>
                                        <TableCell>{doctor.phone}</TableCell>
                                        <TableCell>{doctor.email}</TableCell>
                                        {isAdmin && (
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditDoctorClick(doctor)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to remove Dr. {doctor.first_name} {doctor.last_name}?
                                                                    This will also remove their login access. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteDoctor(doctor.id, `${doctor.first_name} ${doctor.last_name}`)}
                                                                    className="bg-red-600"
                                                                >
                                                                    Delete Doctor
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Doctor Dialog */}
            {editingDoctor && (
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Doctor</DialogTitle>
                            <DialogDescription>
                                Update doctor information and credentials.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(handleUpdateDoctor)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={editForm.control}
                                        name="first_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={editForm.control}
                                        name="last_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={editForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input type="email" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={editForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={editForm.control}
                                        name="specialization"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Specialization</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={editForm.control}
                                        name="license_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>License Number</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowEditDialog(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={updateDoctorMutation.isPending}>
                                        {updateDoctorMutation.isPending ? 'Updating...' : 'Update Doctor'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
