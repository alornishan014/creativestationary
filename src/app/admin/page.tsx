'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Store, Users, Package, DollarSign, Plus, Trash2, LogOut, Settings, Calendar, Printer, TrendingUp, Activity, BarChart3, PieChart, Target, Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface Employee {
  id: string
  name: string
  mobile: string
  isActive: boolean
  _count?: { sales: number }
}

interface Product {
  id: string
  name: string
  price: number
  image?: string
  isActive: boolean
}

interface Sale {
  id: string
  employeeId: string
  totalAmount: number
  customTotal?: number
  createdAt: string
  employee: { name: string }
  items: { product: { name: string }; quantity: number; unitPrice: number }[]
}

interface ShopSettings {
  id: string
  name: string
  phone?: string
  address?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [lastSaleNotification, setLastSaleNotification] = useState<string | null>(null)
  const [topPerformers, setTopPerformers] = useState<any[]>([])
  const [salesTrend, setSalesTrend] = useState<any[]>([])

  // Form states
  const [newEmployee, setNewEmployee] = useState({ name: '', mobile: '' })
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image: '' })
  const [shopForm, setShopForm] = useState({ name: '', phone: '', address: '' })

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin')
    if (!isAdmin) {
      router.push('/')
      return
    }
    fetchData()

    // Listen for real-time sales updates
    const handleSaleUpdate = (event: any) => {
      fetchData()
      // Show notification
      const saleData = event.detail?.saleData
      if (saleData) {
        setLastSaleNotification(`New sale completed: $${(saleData.customTotal || saleData.totalAmount).toFixed(2)}`)
        setTimeout(() => setLastSaleNotification(null), 5000)
      }
    }

    window.addEventListener('saleCompleted', handleSaleUpdate)
    
    return () => {
      window.removeEventListener('saleCompleted', handleSaleUpdate)
    }
  }, [router])

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''

  const fetchData = async () => {
    try {
      const [employeesRes, productsRes, salesRes, settingsRes] = await Promise.all([
        fetch(`${apiBase}/api/employees`),
        fetch(`${apiBase}/api/products`),
        fetch(`${apiBase}/api/sales`),
        fetch(`${apiBase}/api/shop-settings`)
      ])

      if (employeesRes.ok) {
        const data = await employeesRes.json()
        setEmployees(data)
      }

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data)
      }

      if (salesRes.ok) {
        const data = await salesRes.json()
        setSales(data)
        calculateAnalytics(data)
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setShopSettings(data)
        setShopForm({ name: data.name || '', phone: data.phone || '', address: data.address || '' })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (salesData: Sale[]) => {
    // Calculate top performers
    const employeePerformance: { [key: string]: { name: string; sales: number; revenue: number; orders: number } } = {}
    
    salesData.forEach(sale => {
      if (!employeePerformance[sale.employeeId]) {
        employeePerformance[sale.employeeId] = { name: sale.employee.name, sales: 0, revenue: 0, orders: 0 }
      }
      employeePerformance[sale.employeeId].sales += (sale.customTotal || sale.totalAmount)
      employeePerformance[sale.employeeId].revenue += (sale.customTotal || sale.totalAmount)
      employeePerformance[sale.employeeId].orders += 1
    })

    const top = Object.values(employeePerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    setTopPerformers(top)

    // Calculate sales trend (last 7 days)
    const trend: { [key: string]: number } = {}
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()
      
      const daySales = salesData.filter(sale => 
        new Date(sale.createdAt).toDateString() === dateStr
      ).reduce((sum, sale) => sum + (sale.customTotal || sale.totalAmount), 0)
      
      trend[dateStr] = daySales
    }

    setSalesTrend(Object.entries(trend).map(([date, amount]) => ({ date, amount })))
  }

  const handleLogout = () => {
    localStorage.removeItem('isAdmin')
    router.push('/')
  }

  const handleAddEmployee = async () => {
    try {
      const response = await fetch(`${apiBase}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee)
      })

      if (response.ok) {
        setNewEmployee({ name: '', mobile: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add employee:', error)
    }
  }

  const handleAddProduct = async () => {
    try {
      const response = await fetch(`${apiBase}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProduct, price: parseFloat(newProduct.price) })
      })

      if (response.ok) {
        setNewProduct({ name: '', price: '', image: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add product:', error)
    }
  }

  const handleUpdateShopSettings = async () => {
    try {
      const response = await fetch(`${apiBase}/api/shop-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopForm)
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to update shop settings:', error)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    try {
      const response = await fetch(`${apiBase}/api/employees/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to delete employee:', error)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await fetch(`${apiBase}/api/products/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const filteredSales = dateFilter 
    ? sales.filter(sale => new Date(sale.createdAt).toDateString() === new Date(dateFilter).toDateString())
    : sales

  const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.customTotal || sale.totalAmount), 0)
  const todaySales = sales.filter(sale => 
    new Date(sale.createdAt).toDateString() === new Date().toDateString()
  ).reduce((sum, sale) => sum + (sale.customTotal || sale.totalAmount), 0)

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      
      <header className="relative bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {lastSaleNotification && (
            <div className="bg-gradient-to-r from-green-600 to-green-700 border border-green-500 text-white px-4 py-3 rounded-lg mb-3 flex items-center justify-between shadow-lg animate-pulse">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle className="w-5 h-5 text-yellow-300" />
                {lastSaleNotification}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLastSaleNotification(null)}
                className="text-white hover:text-yellow-300 hover:bg-green-800/50"
              >
                ×
              </Button>
            </div>
          )}
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{shopSettings?.name || 'Shop Management'}</h1>
                <p className="text-sm text-slate-600">Admin Dashboard</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-xl border border-slate-200">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="employees" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600"
            >
              Employees
            </TabsTrigger>
            <TabsTrigger 
              value="products" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600"
            >
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="sales" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600"
            >
              Sales
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Enhanced Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Total Sales</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">${totalSales.toFixed(2)}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    {dateFilter ? 'Filtered period' : 'All time'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Today's Sales</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">${todaySales.toFixed(2)}</div>
                  <p className="text-xs text-slate-500 mt-1">Today</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Total Employees</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{employees.length}</div>
                  <p className="text-xs text-slate-500 mt-1">Active staff</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{products.length}</div>
                  <p className="text-xs text-slate-500 mt-1">Available items</p>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.map((performer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{performer.name}</p>
                            <p className="text-sm text-slate-600">{performer.orders} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">${performer.revenue.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">Revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sales Trend */}
              <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    7-Day Sales Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {salesTrend.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="font-medium text-slate-800">${day.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales */}
            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Recent Sales</CardTitle>
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-auto bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                  />
                  {dateFilter && (
                    <Button 
                      variant="outline" 
                      onClick={() => setDateFilter('')}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                    >
                      Clear Filter
                    </Button>
                  )}
                  <Button 
                    onClick={handlePrint} 
                    variant="outline" 
                    className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200">
                        <TableHead className="text-slate-700">Date</TableHead>
                        <TableHead className="text-slate-700">Employee</TableHead>
                        <TableHead className="text-slate-700">Items</TableHead>
                        <TableHead className="text-slate-700 text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.slice(0, 10).map((sale) => (
                        <TableRow key={sale.id} className="border-slate-100">
                          <TableCell className="text-slate-800">{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-800">{sale.employee.name}</TableCell>
                          <TableCell className="text-slate-800">{sale.items.length} items</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            ${(sale.customTotal || sale.totalAmount).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Add New Employee</CardTitle>
                <CardDescription className="text-slate-600">Create a new employee account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emp-name" className="text-slate-700 font-medium">Name</Label>
                    <Input
                      id="emp-name"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      placeholder="Employee name"
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emp-mobile" className="text-slate-700 font-medium">Mobile Number</Label>
                    <Input
                      id="emp-mobile"
                      value={newEmployee.mobile}
                      onChange={(e) => setNewEmployee({ ...newEmployee, mobile: e.target.value })}
                      placeholder="Mobile number"
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <Button onClick={handleAddEmployee} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Employee
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200">
                        <TableHead className="text-slate-700">Name</TableHead>
                        <TableHead className="text-slate-700">Mobile</TableHead>
                        <TableHead className="text-slate-700">Status</TableHead>
                        <TableHead className="text-slate-700">Sales</TableHead>
                        <TableHead className="text-slate-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id} className="border-slate-100">
                          <TableCell className="text-slate-800">{employee.name}</TableCell>
                          <TableCell className="text-slate-800">{employee.mobile}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={employee.isActive ? 'default' : 'secondary'}
                              className={employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                            >
                              {employee.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{employee._count?.sales || 0}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="bg-red-100 text-red-600 hover:bg-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Add New Product</CardTitle>
                <CardDescription className="text-slate-600">Add a new product to inventory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="prod-name" className="text-slate-700 font-medium">Product Name</Label>
                    <Input
                      id="prod-name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Product name"
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prod-price" className="text-slate-700 font-medium">Price</Label>
                    <Input
                      id="prod-price"
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="Price"
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prod-image" className="text-slate-700 font-medium">Image URL (Optional)</Label>
                    <Input
                      id="prod-image"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      placeholder="Image URL"
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <Button onClick={handleAddProduct} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Product
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200">
                        <TableHead className="text-slate-700">Name</TableHead>
                        <TableHead className="text-slate-700">Price</TableHead>
                        <TableHead className="text-slate-700">Status</TableHead>
                        <TableHead className="text-slate-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id} className="border-slate-100">
                          <TableCell className="text-slate-800">{product.name}</TableCell>
                          <TableCell className="text-green-600 font-medium">${product.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={product.isActive ? 'default' : 'secondary'}
                              className={product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                            >
                              {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="bg-red-100 text-red-600 hover:bg-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Sales History</CardTitle>
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-auto bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                  />
                  {dateFilter && (
                    <Button 
                      variant="outline" 
                      onClick={() => setDateFilter('')}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                    >
                      Clear Filter
                    </Button>
                  )}
                  <Button 
                    onClick={handlePrint} 
                    variant="outline" 
                    className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                  >
                    <Printer className="w-4 h-4" />
                    Print Sales
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200">
                        <TableHead className="text-slate-700">Date & Time</TableHead>
                        <TableHead className="text-slate-700">Employee</TableHead>
                        <TableHead className="text-slate-700">Products</TableHead>
                        <TableHead className="text-slate-700">Quantity</TableHead>
                        <TableHead className="text-slate-700 text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.id} className="border-slate-100">
                          <TableCell className="text-slate-800">{new Date(sale.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="text-slate-800">{sale.employee.name}</TableCell>
                          <TableCell className="text-slate-800">
                            {sale.items.map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.product.name}
                              </div>
                            ))}
                          </TableCell>
                          <TableCell className="text-slate-800">
                            {sale.items.map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.quantity}
                              </div>
                            ))}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            ${(sale.customTotal || sale.totalAmount).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Shop Settings</CardTitle>
                <CardDescription className="text-slate-600">Configure your shop information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shop-name" className="text-slate-700 font-medium">Shop Name</Label>
                  <Input
                    id="shop-name"
                    value={shopForm.name}
                    onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                    placeholder="Shop name"
                    className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="shop-phone" className="text-slate-700 font-medium">Phone</Label>
                  <Input
                    id="shop-phone"
                    value={shopForm.phone}
                    onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                    placeholder="Shop phone"
                    className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="shop-address" className="text-slate-700 font-medium">Address</Label>
                  <Textarea
                    id="shop-address"
                    value={shopForm.address}
                    onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                    placeholder="Shop address"
                    className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button onClick={handleUpdateShopSettings} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Update Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}