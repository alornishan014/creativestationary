'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Store, Users, User, Lock, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [adminPassword, setAdminPassword] = useState('')
  const [employeeMobile, setEmployeeMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAdminLogin = async () => {
    setLoading(true)
    if (adminPassword === '095213') {
      localStorage.setItem('isAdmin', 'true')
      router.push('/admin')
    } else {
      alert('Invalid password')
    }
    setLoading(false)
  }

  const handleEmployeeLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: employeeMobile })
      })
      
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('employee', JSON.stringify(data))
        router.push('/employee')
      } else {
        alert('Employee not found')
      }
    } catch (error) {
      alert('Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      <div className="relative max-w-md mx-auto pt-20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-2xl">
              <Store className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">Shop Management</h1>
          <p className="text-slate-600 text-lg">Complete shop management system</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-xl font-bold text-slate-800">Login</CardTitle>
            <CardDescription className="text-center text-slate-600">
              Access your shop management panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 border border-slate-200">
                <TabsTrigger 
                  value="admin" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Admin
                </TabsTrigger>
                <TabsTrigger 
                  value="employee" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600"
                >
                  <User className="w-4 h-4 mr-2" />
                  Employee
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="admin" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-slate-700 font-medium">Admin Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                    className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button 
                  onClick={handleAdminLogin} 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transform hover:scale-[1.02] transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login as Admin'}
                </Button>
              </TabsContent>
              
              <TabsContent value="employee" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="employee-mobile" className="text-slate-700 font-medium">Mobile Number</Label>
                  <Input
                    id="employee-mobile"
                    type="tel"
                    placeholder="Enter your mobile number"
                    value={employeeMobile}
                    onChange={(e) => setEmployeeMobile(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEmployeeLogin()}
                    className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button 
                  onClick={handleEmployeeLogin} 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transform hover:scale-[1.02] transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login as Employee'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}