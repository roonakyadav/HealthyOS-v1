'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users, Calendar, Clock } from 'lucide-react'

export default function DashboardPage() {
    const stats = [
        {
            title: 'Total Patients',
            value: '1,234',
            description: 'Active patients',
            icon: Users,
        },
        {
            title: 'Today\'s Appointments',
            value: '42',
            description: 'Scheduled for today',
            icon: Calendar,
        },
        {
            title: 'In Queue',
            value: '8',
            description: 'Patients waiting',
            icon: Clock,
        },
        {
            title: 'Today\'s Visits',
            value: '23',
            description: 'Completed today',
            icon: Activity,
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Welcome to HealthyOS. Manage your clinic operations and patient care.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common tasks and shortcuts for your daily operations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-muted-foreground py-8">
                            Application is under development. More features coming soon!
                        </p>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest updates and system activity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-muted-foreground py-8">
                            No recent activity to display.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
