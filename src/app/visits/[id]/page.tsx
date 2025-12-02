'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { toast } from 'sonner'

import { useVisit, useUpdateVisitStatus } from '@/hooks/useVisits'
import { useUser } from '@/hooks/useAuth'

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
    const [symptoms, setSymptoms] = useState('')
    const [diagnosis, setDiagnosis] = useState('')
    const [prescription, setPrescription] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        params.then((resolved) => setId(resolved.id))
    }, [params])

    const { data: visit, isLoading, error } = useVisit(id)
    const updateMutation = useUpdateVisitStatus()
    const { data: user } = useUser()

    // If status changes to in_progress, enable edit mode, but for now always editable for demo
    useEffect(() => {
        if (visit) {
            setSymptoms(visit.symptoms || '')
            setDiagnosis(visit.diagnosis || '')
            setPrescription(visit.prescription || '')
            setNotes(visit.notes || '')
        }
    }, [visit])

    const handleSave = async () => {
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
            console.error('Error:', error)
        }
    }

    if (!id || isLoading) {
        return <div className="flex justify-center items-center h-48">Loading visit...</div>
    }

    if (error || !visit) {
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
            <div className="max-w-6xl mx-auto p-6">
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
                            Visit Details
                        </h1>
                        <p className="text-gray-600">
                            Visit on {new Date(visit.date).toLocaleDateString()}
                        </p>
                    </div>
                    <Badge className={`${statusConfig[statusKey].bgColor} ${statusConfig[statusKey].color}`}>
                        {statusConfig[statusKey].label}
                    </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Patient Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient Information</CardTitle>
                            <CardDescription>Patient details for this visit</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Name</Label>
                                <p className="text-lg font-semibold">
                                    {visit.patient?.first_name} {visit.patient?.last_name}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Date of Birth</Label>
                                    <p>{visit.patient?.date_of_birth}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Phone</Label>
                                    <p>{visit.patient?.phone}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Address</Label>
                                <p>{visit.patient?.address}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Emergency Contact</Label>
                                <p>{visit.patient?.emergency_contact}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Doctor Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Doctor Information</CardTitle>
                            <CardDescription>Assigned physician for this visit</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Name</Label>
                                <p className="text-lg font-semibold">
                                    Dr. {visit.doctor?.first_name} {visit.doctor?.last_name}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Specialization</Label>
                                <p>{visit.doctor?.specialization}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">License Number</Label>
                                <p>{visit.doctor?.license_number}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Contact</Label>
                                <p>{visit.doctor?.phone} | {visit.doctor?.email}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Visit Records */}
                <Card className="mt-6">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle>Visit Records</CardTitle>
                        {!editMode && (user?.role === 'doctor' || user?.role === 'admin') && (
                            <Button onClick={() => setEditMode(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label htmlFor="symptoms">Symptoms</Label>
                            {editMode ? (
                                <Textarea
                                    id="symptoms"
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    placeholder="Describe the patient's symptoms..."
                                    className="mt-2"
                                />
                            ) : (
                                <p className="mt-2 p-3 bg-gray-50 rounded-md min-h-[60px]">
                                    {symptoms || "No symptoms recorded"}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="diagnosis">Diagnosis</Label>
                            {editMode ? (
                                <Textarea
                                    id="diagnosis"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    placeholder="Enter diagnosis..."
                                    className="mt-2"
                                />
                            ) : (
                                <p className="mt-2 p-3 bg-gray-50 rounded-md min-h-[60px]">
                                    {diagnosis || "No diagnosis recorded"}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="prescription">Prescription</Label>
                            {editMode ? (
                                <Textarea
                                    id="prescription"
                                    value={prescription}
                                    onChange={(e) => setPrescription(e.target.value)}
                                    placeholder="Enter prescriptions and instructions..."
                                    className="mt-2"
                                />
                            ) : (
                                <p className="mt-2 p-3 bg-gray-50 rounded-md min-h-[60px]">
                                    {prescription || "No prescription recorded"}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="notes">Additional Notes</Label>
                            {editMode ? (
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any additional notes..."
                                    className="mt-2"
                                />
                            ) : (
                                <p className="mt-2 p-3 bg-gray-50 rounded-md min-h-[60px]">
                                    {notes || "No additional notes"}
                                </p>
                            )}
                        </div>

                        {editMode && (
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditMode(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Visit Timeline */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Visit Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <div>
                                    <p className="font-medium">Visit Created</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(visit.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {visit.status !== 'waiting' && (
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <div>
                                        <p className="font-medium">
                                            {visit.status === 'in_progress' ? 'In Progress' : 'Completed'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Status updated - Symptoms: {symptoms ? 'Yes' : 'Pending'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
