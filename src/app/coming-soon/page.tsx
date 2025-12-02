'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

export default function ComingSoonPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                        <Clock className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Coming Soon</CardTitle>
                    <CardDescription>
                        Patient features are currently under development
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-muted-foreground mb-6">
                        We're working hard to bring you the best patient experience.
                        Check back soon for updates!
                    </p>
                    <Button onClick={() => router.push('/')} className="w-full">
                        Back to Login
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
