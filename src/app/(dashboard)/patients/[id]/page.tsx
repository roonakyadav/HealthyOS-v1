'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { usePatient } from '@/hooks/usePatients'

interface PageProps {
    params: Promise<{ id: string }>
}

export default function PatientProfilePage({ params }: PageProps) {
    const [id, setId] = useState<string>('')

    // Unwrap params promise
    useEffect(() => {
        params.then((resolved) => setId(resolved.id))
    }, [params])

    const { data: patient, isLoading, error } = usePatient(id)

    if (!id || isLoading) {
        return <div className="flex justify-center items-center h-48">Loading...</div>
    }

    if (error || !patient) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Patient not found.</p>
                <Link href="/patients">
                    <Button className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Patients
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/patients">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {patient.first_name} {patient.last_name}
                    </h2>
                    <p className="text-muted-foreground">
                        Patient Profile & Medical History
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Patient Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Patient Information</CardTitle>
                        <CardDescription>
                            Basic details and contact information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                                <p className="text-sm">{patient.first_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                                <p className="text-sm">{patient.last_name}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                            <p className="text-sm">{patient.date_of_birth}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="text-sm">{patient.phone}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-sm">{patient.email || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Address</label>
                            <p className="text-sm">{patient.address}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                            <p className="text-sm">{patient.emergency_contact}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Medical History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Medical History</CardTitle>
                        <CardDescription>
                            Relevant medical background and conditions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {patient.medical_history ? (
                            <p className="text-sm whitespace-pre-wrap">{patient.medical_history}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">No medical history recorded</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Visit History */}
            <Card>
                <CardHeader>
                    <CardTitle>Visit History</CardTitle>
                    <CardDescription>
                        Record of appointments and consultations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center py-8 text-muted-foreground">
                        Visit history feature coming soon. This will show all appointments, diagnoses, and treatments.
                    </p>
                </CardContent>
            </Card>

            {/* Registration Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Registration Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Patient ID:</span> {patient.id.slice(-8)}
                        </div>
                        <div>
                            <span className="font-medium">Registered:</span> {new Date(patient.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
