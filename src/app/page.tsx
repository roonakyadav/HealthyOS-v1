'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Stethoscope, UserCog, User } from 'lucide-react'

const portals = [
  {
    id: 'doctor',
    title: 'Doctor',
    description: 'Access your patient management and clinical insights',
    icon: Stethoscope,
    href: '/login/doctor'
  },
  {
    id: 'admin',
    title: 'Admin/Staff',
    description: 'Manage clinic operations and oversight',
    icon: UserCog,
    href: '/login/admin'
  },
  {
    id: 'patient',
    title: 'Patient',
    description: 'Access your health records and coming soon features',
    icon: User,
    href: '/coming-soon'
  }
]

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">HealthyOS</h1>
          <p className="text-xl text-gray-600">Healthcare Operating System</p>
          <p className="text-lg text-gray-500 mt-2">Select your role to continue</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {portals.map((portal) => (
            <Link key={portal.id} href={portal.href} className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer rounded-3xl border-2 hover:border-primary/20">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                    <portal.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{portal.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base leading-relaxed">
                    {portal.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
