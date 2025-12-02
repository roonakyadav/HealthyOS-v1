'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Eye, Download, Trash2, Plus, Edit } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useVisit, useUpdateVisit, usePatientVisits } from '@/hooks/useVisits'
import { useMedications, useCreateMedication, useUpdateMedication, useDeleteMedication, medicationSchema, type MedicationFormData } from '@/hooks/useMedications'
import { useAttachments, useUploadAttachment, useDeleteAttachment, getAttachmentUrl } from '@/hooks/useAttachments'
import { useUser } from '@/hooks/useAuth'
import type { Attachment } from '@/types'

interface PageProps {
    params: Promise<{ id: string }>
}

const statusConfig = {
    waiting: { label: 'Waiting', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
    in_progress: { label: 'In Progress', color: 'text-blue-800', bgColor: 'bg-blue-100' },
    completed: { label: 'Completed', color: 'text-green-800', bgColor: 'bg-green-100' },
}

export default function VisitPage({ params }: PageProps) {
    const [id, setId] = useState<string>('')
    const [editMode, setEditMode] = useState(false)
    const [addMedDialog, setAddMedDialog] = useState(false)
    const [editingMed, setEditingMed] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Overview form state
    const [symptoms, setSymptoms] = useState('')
    const [diagnosis, setDiagnosis] = useState('')
    const [prescription, setPrescription] = useState('')
    const [notes, setNotes] = useState('')

    // Vitals form state
    const [vitals, setVitals] = useState({
        bp: '',
        heart_rate: '',
        temperature: '',
        weight: '',
        spo2: '',
    })

    useEffect(() => {
        params.then((resolved) => setId(resolved.id))
    }, [params])

    const { data: visit, isLoading } = useVisit(id)
    const { data: patientVisits } = usePatientVisits(visit?.patient_id || '')
    const { data: medications } = useMedications(id)
    const { data: attachments } = useAttachments(id)

    const updateMutation = useUpdateVisit()
    const createMedMutation = useCreateMedication()
    const updateMedMutation = useUpdateMedication()
    const deleteMedMutation = useDeleteMedication()
    const uploadMutation = useUploadAttachment()
    const deleteAttachMutation = useDeleteAttachment()

    const { data: user } = useUser()
    const canEdit = user?.role === 'doctor' || user?.role === 'admin'

    const medForm = useForm<MedicationFormData>({
        resolver: zodResolver(medicationSchema),
        defaultValues: {
            medicine_name: '',
            dosage: '',
            frequency: '',
            duration: '',
            notes: '',
        },
    })

    // Initialize form data
    useEffect(() => {
        if (visit) {
            setSymptoms(visit.symptoms || '')
            setDiagnosis(visit.diagnosis || '')
            setPrescription(visit.prescription || '')
            setNotes(visit.notes || '')

            if (visit.vitals) {
                setVitals({
                    bp: visit.vitals.bp || '',
                    heart_rate: String(visit.vitals.heart_rate || ''),
                    temperature: String(visit.vitals.temperature || ''),
                    weight: String(visit.vitals.weight || ''),
                    spo2: String(visit.vitals.spo2 || ''),
                })
            }
        }
    }, [visit])

    const handleSaveOverview = async () => {
        try {
            await updateMutation.mutateAsync({
                id,
                symptoms,
                diagnosis,
                prescription,
                notes,
            })
            toast.success('Visit details updated')
            setEditMode(false)
        } catch (error) {
            toast.error('Failed to update visit')
        }
    }

    const handleSaveVitals = async () => {
        try {
            const vitalsData = {
                bp: vitals.bp || undefined,
                heart_rate: vitals.heart_rate ? Number(vitals.heart_rate) : undefined,
                temperature: vitals.temperature ? Number(vitals.temperature) : undefined,
                weight: vitals.weight ? Number(vitals.weight) : undefined,
                spo2: vitals.spo2 ? Number(vitals.spo2) : undefined,
            }

            await updateMutation.mutateAsync({ id, vitals: vitalsData })
            toast.success('Vitals updated')
        } catch (error) {
            toast.error('Failed to update vitals')
        }
    }

    const handleAddMedication = async (data: MedicationFormData) => {
        try {
            await createMedMutation.mutateAsync({ visit_id: id, ...data })
            toast.success('Medication added')
            setAddMedDialog(false)
            medForm.reset()
        } catch (error) {
            toast.error('Failed to add medication')
        }
    }

    const handleEditMedication = async (data: MedicationFormData) => {
        if (!editingMed) return
        try {
            await updateMedMutation.mutateAsync({ id: editingMed, ...data })
            toast.success('Medication updated')
            setEditingMed(null)
            medForm.reset()
        } catch (error) {
            toast.error('Failed to update medication')
        }
    }

    const handleDeleteMedication = async (medId: string) => {
        try {
            await deleteMedMutation.mutateAsync(medId)
            toast.success('Medication deleted')
        } catch (error) {
            toast.error('Failed to delete medication')
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setUploading(true)
        setUploadProgress(0)

        try {
            await uploadMutation.mutateAsync({
                visitId: id,
                file,
                uploadedBy: user?.id || 'unknown',
            })
            toast.success('File uploaded successfully')
        } catch (error) {
            toast.error('Failed to upload file')
        } finally {
            setUploading(false)
            setUploadProgress(0)
            event.target.value = ''
        }
    }

    const handleFileDownload = (attachment: Attachment) => {
        const url = getAttachmentUrl(attachment.file_path)
        window.open(url, '_blank')
    }

    const handleFileDelete = async (attachment: Attachment) => {
        try {
            await deleteAttachMutation.mutateAsync(attachment)
            toast.success('File deleted')
        } catch (error) {
            toast.error('Failed to delete file')
        }
    }

    if (!id || isLoading) {
        return <div className="flex justify-center items-center h-48">Loading visit...</div>
    }

    if (!visit) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Visit not found.</p>
                <Link href="/queue">
                    <Button className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Queue
                    </Button>
                </Link>
            </div>
        )
    }

    const statusKey = visit.status as keyof typeof statusConfig

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/queue">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Queue
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">
                            EHR - {visit.patient?.first_name} {visit.patient?.last_name}
                        </h1>
                        <p className="text-gray-600">
                            Visit on {new Date(visit.date).toLocaleDateString()} |
                            Dr. {visit.doctor?.first_name} {visit.doctor?.last_name}
                        </p>
                    </div>
                    <Badge className={`${statusConfig[statusKey].bgColor} ${statusConfig[statusKey].color}`}>
                        {statusConfig[statusKey].label}
                    </Badge>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="vitals">Vitals</TabsTrigger>
                        <TabsTrigger value="medications">Medications</TabsTrigger>
                        <TabsTrigger value="attachments">Attachments</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview">
                        <div className="grid gap-6">
                            {/* Patient Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Patient Information</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div><Label>Name:</Label> <span className="font-medium">{visit.patient?.first_name} {visit.patient?.last_name}</span></div>
                                    <div><Label>DOB:</Label> <span>{visit.patient?.date_of_birth}</span></div>
                                    <div><Label>Phone:</Label> <span>{visit.patient?.phone}</span></div>
                                    <div><Label>Email:</Label> <span>{visit.patient?.email || 'N/A'}</span></div>
                                </CardContent>
                            </Card>

                            {/* Visit Records */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Visit Records</CardTitle>
                                    {canEdit && !editMode && (
                                        <Button onClick={() => setEditMode(true)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Records
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label>Symptoms</Label>
                                            {editMode ? (
                                                <Textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="mt-2" />
                                            ) : (
                                                <p className="mt-2 p-3 bg-gray-50 rounded">{symptoms || "No symptoms recorded"}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label>Diagnosis</Label>
                                            {editMode ? (
                                                <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="mt-2" />
                                            ) : (
                                                <p className="mt-2 p-3 bg-gray-50 rounded">{diagnosis || "No diagnosis recorded"}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label>Prescription</Label>
                                            {editMode ? (
                                                <Textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} className="mt-2" />
                                            ) : (
                                                <p className="mt-2 p-3 bg-gray-50 rounded">{prescription || "No prescription recorded"}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label>Notes</Label>
                                            {editMode ? (
                                                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2" />
                                            ) : (
                                                <p className="mt-2 p-3 bg-gray-50 rounded">{notes || "No notes recorded"}</p>
                                            )}
                                        </div>
                                    </div>

                                    {editMode && (
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                                            <Button onClick={handleSaveOverview} disabled={updateMutation.isPending}>
                                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Vitals Tab */}
                    <TabsContent value="vitals">
                        <Card>
                            <CardHeader>
                                <CardTitle>Vital Signs</CardTitle>
                                <CardDescription>Record patient's vital measurements</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label>Blood Pressure (BP)</Label>
                                        <Input
                                            value={vitals.bp}
                                            onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                                            placeholder="120/80"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                    <div>
                                        <Label>Heart Rate (bpm)</Label>
                                        <Input
                                            type="number"
                                            value={vitals.heart_rate}
                                            onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value })}
                                            placeholder="72"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                    <div>
                                        <Label>Temperature (°C)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={vitals.temperature}
                                            onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                                            placeholder="36.5"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                    <div>
                                        <Label>Weight (kg)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={vitals.weight}
                                            onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                                            placeholder="70.5"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                    <div>
                                        <Label>SpO2 (%)</Label>
                                        <Input
                                            type="number"
                                            value={vitals.spo2}
                                            onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                                            placeholder="98"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                </div>
                                {canEdit && (
                                    <Button onClick={handleSaveVitals} disabled={updateMutation.isPending} className="mt-4">
                                        {updateMutation.isPending ? 'Saving...' : 'Save Vitals'}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Medications Tab */}
                    <TabsContent value="medications">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Medications</CardTitle>
                                {canEdit && (
                                    <Dialog open={addMedDialog} onOpenChange={setAddMedDialog}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Medication
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add Medication</DialogTitle>
                                            </DialogHeader>
                                            <Form {...medForm}>
                                                <form onSubmit={medForm.handleSubmit(handleAddMedication)} className="space-y-4">
                                                    <FormField
                                                        control={medForm.control}
                                                        name="medicine_name"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Medicine Name</FormLabel>
                                                                <FormControl><Input {...field} /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <FormField
                                                            control={medForm.control}
                                                            name="dosage"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Dosage</FormLabel>
                                                                    <FormControl><Input {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={medForm.control}
                                                            name="frequency"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Frequency</FormLabel>
                                                                    <FormControl><Input {...field} placeholder="e.g., 1x daily" /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={medForm.control}
                                                            name="duration"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Duration</FormLabel>
                                                                    <FormControl><Input {...field} placeholder="e.g., 7 days" /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <FormField
                                                        control={medForm.control}
                                                        name="notes"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Notes (Optional)</FormLabel>
                                                                <FormControl><Textarea {...field} /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <Button type="button" variant="outline" onClick={() => setAddMedDialog(false)}>Cancel</Button>
                                                        <Button type="submit" disabled={createMedMutation.isPending}>
                                                            {createMedMutation.isPending ? 'Adding...' : 'Add Medication'}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </CardHeader>
                            <CardContent>
                                {!medications || medications.length === 0 ? (
                                    <p className="text-center py-8 text-muted-foreground">No medications prescribed</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Medicine</TableHead>
                                                <TableHead>Dosage</TableHead>
                                                <TableHead>Frequency</TableHead>
                                                <TableHead>Duration</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {medications.map((med) => (
                                                <TableRow key={med.id}>
                                                    <TableCell className="font-medium">{med.medicine_name}</TableCell>
                                                    <TableCell>{med.dosage}</TableCell>
                                                    <TableCell>{med.frequency}</TableCell>
                                                    <TableCell>{med.duration}</TableCell>
                                                    <TableCell>
                                                        {canEdit && (
                                                            <div className="flex gap-2">
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="outline" size="sm">
                                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete Medication</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to delete this medication?
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleDeleteMedication(med.id)}
                                                                                className="bg-red-600"
                                                                            >
                                                                                Delete
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Attachments Tab */}
                    <TabsContent value="attachments">
                        <Card>
                            <CardHeader>
                                <CardTitle>Attachments</CardTitle>
                                <CardDescription>Manage visit-related documents and images</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {canEdit && (
                                    <div className="mb-6">
                                        <Label htmlFor="file-upload" className="cursor-pointer">
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                                <input
                                                    id="file-upload"
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                    disabled={uploading}
                                                />
                                                {uploading ? (
                                                    <div>
                                                        <div className="mb-2">Uploading...</div>
                                                        <Progress value={uploadProgress} className="w-full" />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <Plus className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-600">Click to upload files</p>
                                                        <p className="text-xs text-gray-400">PDF, DOC, JPG, PNG (max 10MB)</p>
                                                    </div>
                                                )}
                                            </div>
                                        </Label>
                                    </div>
                                )}

                                {!attachments || attachments.length === 0 ? (
                                    <p className="text-center py-8 text-muted-foreground">No attachments uploaded</p>
                                ) : (
                                    <div className="space-y-4">
                                        {attachments.map((attachment) => (
                                            <div key={attachment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <p className="font-medium">{attachment.filename}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {(attachment.file_size / 1024).toFixed(1)} KB •
                                                        Uploaded {new Date(attachment.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleFileDownload(attachment)}>
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    {canEdit && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="outline" size="sm">
                                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete File</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete this file? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleFileDelete(attachment)}
                                                                        className="bg-red-600"
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Visit History</CardTitle>
                                <CardDescription>Previous visits for this patient</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!patientVisits || patientVisits.length <= 1 ? (
                                    <p className="text-center py-8 text-muted-foreground">No previous visits</p>
                                ) : (
                                    <div className="space-y-4">
                                        {patientVisits
                                            .filter((v) => v.id !== id) // Exclude current visit
                                            .map((visit) => (
                                                <Card key={visit.id}>
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-medium">
                                                                    {new Date(visit.date).toLocaleDateString()}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    Dr. {visit.doctor?.first_name} {visit.doctor?.last_name}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {visit.diagnosis || 'No diagnosis'} | {visit.symptoms || 'No symptoms'}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Badge className="bg-blue-100 text-blue-800">{visit.status}</Badge>
                                                                <Button variant="outline" size="sm" asChild>
                                                                    <Link href={`/visits/${visit.id}`}>
                                                                        <Eye className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
