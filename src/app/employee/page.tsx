'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Store, Package, ShoppingCart, Plus, Trash2, LogOut, DollarSign, Printer, TrendingUp, Users, Clock, Target } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Product {
  id: string
  name: string
  price: number
  image?: string
  isActive: boolean
}

interface CartItem extends Product {
  quantity: number
  customPrice?: number
}

interface Employee {
  id: string
  name: string
  mobile: string
}

export default function EmployeeDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('sell')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [customTotal, setCustomTotal] = useState('')
  const [employeeSales, setEmployeeSales] = useState<any[]>([])
  const [todaySales, setTodaySales] = useState(0)
  const [totalSalesAmount, setTotalSalesAmount] = useState(0)
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [salesVelocity, setSalesVelocity] = useState(0)
  const [topProducts, setTopProducts] = useState<any[]>([])

  // Form states
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image: '' })
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [customPrice, setCustomPrice] = useState('')

  useEffect(() => {
    const employeeData = localStorage.getItem('employee')
    if (!employeeData) {
      router.push('/')
      return
    }
    
    const emp = JSON.parse(employeeData)
    setEmployee(emp)
    fetchProducts()
    fetchEmployeeSales(emp.id)

    // Listen for real-time sales updates
    const handleSaleUpdate = () => {
      if (emp.id) {
        fetchEmployeeSales(emp.id)
      }
    }

    window.addEventListener('saleCompleted', handleSaleUpdate)
    
    return () => {
      window.removeEventListener('saleCompleted', handleSaleUpdate)
    }
  }, [router])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.filter((p: Product) => p.isActive))
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeSales = async (employeeId: string) => {
    try {
      const response = await fetch('/api/sales')
      if (response.ok) {
        const allSales = await response.json()
        const empSales = allSales.filter((sale: any) => sale.employeeId === employeeId)
        setEmployeeSales(empSales)
        
        // Calculate today's sales
        const today = new Date().toDateString()
        const todaySalesData = empSales.filter((sale: any) => 
          new Date(sale.createdAt).toDateString() === today
        )
        
        const todayTotal = todaySalesData.reduce((sum: number, sale: any) => 
          sum + (sale.customTotal || sale.totalAmount), 0
        )
        
        const totalAmount = empSales.reduce((sum: number, sale: any) => 
          sum + (sale.customTotal || sale.totalAmount), 0
        )
        
        // Calculate sales velocity (sales per hour today)
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const hoursElapsed = Math.max(1, (now.getTime() - startOfDay.getTime()) / (1000 * 60 * 60))
        const velocity = todayTotal / hoursElapsed
        
        // Get recent sales (last 5)
        const recent = empSales.slice(-5).reverse()
        
        // Calculate top products
        const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {}
        empSales.forEach((sale: any) => {
          sale.items.forEach((item: any) => {
            if (!productSales[item.productId]) {
              productSales[item.productId] = { name: item.product.name, quantity: 0, revenue: 0 }
            }
            productSales[item.productId].quantity += item.quantity
            productSales[item.productId].revenue += (item.customPrice || item.unitPrice) * item.quantity
          })
        })
        
        const top = Object.values(productSales)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3)
        
        setTodaySales(todayTotal)
        setTotalSalesAmount(totalAmount)
        setSalesVelocity(velocity)
        setRecentSales(recent)
        setTopProducts(top)
      }
    } catch (error) {
      console.error('Failed to fetch employee sales:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('employee')
    router.push('/')
  }

  const handleAddProduct = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProduct, price: parseFloat(newProduct.price) })
      })

      if (response.ok) {
        setNewProduct({ name: '', price: '', image: '' })
        fetchProducts()
        setActiveTab('sell')
      }
    } catch (error) {
      console.error('Failed to add product:', error)
    }
  }

  const updateCartItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id))
    } else {
      setCart(prev => prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      ))
    }
  }

  const updateCartItemPrice = (id: string, customPrice: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, customPrice } : item
    ))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const calculateTotal = () => {
    if (customTotal) {
      return parseFloat(customTotal)
    }
    return cart.reduce((sum, item) => {
      const price = item.customPrice || item.price
      return sum + (price * item.quantity)
    }, 0)
  }

  const handleCheckout = async () => {
    if (!employee || cart.length === 0) return

    try {
      const saleData = {
        employeeId: employee.id,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          customPrice: item.customPrice
        })),
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        customTotal: customTotal ? parseFloat(customTotal) : undefined
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      })

      if (response.ok) {
        setCart([])
        setCustomTotal('')
        alert('Sale completed successfully!')
        // Trigger a custom event to notify admin dashboard
        window.dispatchEvent(new CustomEvent('saleCompleted', { detail: { saleData } }))
        // Immediately update employee sales
        if (employee?.id) {
          fetchEmployeeSales(employee.id)
        }
      }
    } catch (error) {
      console.error('Failed to complete sale:', error)
      alert('Failed to complete sale')
    }
  }

  const handleAddFromDropdown = () => {
    if (!selectedProduct) return
    
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    const itemToAdd = {
      ...product,
      quantity: quantity,
      customPrice: customPrice ? parseFloat(customPrice) : undefined
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity, customPrice: customPrice ? parseFloat(customPrice) : item.customPrice }
            : item
        )
      }
      return [...prev, itemToAdd]
    })

    // Reset form
    setSelectedProduct('')
    setQuantity(1)
    setCustomPrice('')
  }

  const handlePrintReceipt = () => {
    const receiptContent = `
      SHOP RECEIPT
      ============
      Date: ${new Date().toLocaleString()}
      Employee: ${employee?.name}
      
      ITEMS:
      ${cart.map(item => {
        const price = item.customPrice || item.price
        return `${item.name} x${item.quantity} = $${(price * item.quantity).toFixed(2)}`
      }).join('\n')}
      
      TOTAL: $${calculateTotal().toFixed(2)}
      ============
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <pre style="font-family: monospace; padding: 20px;">
          ${receiptContent}
        </pre>
      `)
      printWindow.document.close()
      printWindow.print()
    }
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Employee Panel</h1>
                <p className="text-sm text-slate-600">Welcome, {employee?.name}</p>
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
        {/* Enhanced Sales Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-700 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Today's Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${todaySales.toFixed(2)}
              </div>
              <p className="text-slate-500 text-sm mt-1">Today's revenue</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-700 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalSalesAmount.toFixed(2)}
              </div>
              <p className="text-slate-500 text-sm mt-1">All time revenue</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-700 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {employeeSales.length}
              </div>
              <p className="text-slate-500 text-sm mt-1">Completed orders</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Sales Velocity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${salesVelocity.toFixed(0)}/h
              </div>
              <p className="text-slate-500 text-sm mt-1">Per hour today</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-700 flex items-center gap-2">
                <Target className="w-5 h-5 text-pink-600" />
                Avg Sale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">
                ${employeeSales.length > 0 ? (totalSalesAmount / employeeSales.length).toFixed(2) : '0.00'}
              </div>
              <p className="text-slate-500 text-sm mt-1">Average order</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Products and Recent Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products */}
          {topProducts.length > 0 && (
            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Top Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{product.name}</p>
                          <p className="text-sm text-slate-600">{product.quantity} sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${product.revenue.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Sales Activity */}
          {recentSales.length > 0 && (
            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Recent Sales Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentSales.map((sale, index) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-slate-600 text-sm">
                          {new Date(sale.createdAt).toLocaleTimeString()}
                        </span>
                        <span className="text-slate-800 font-medium">
                          {sale.items.length} items
                        </span>
                      </div>
                      <span className="text-green-600 font-bold">
                        ${(sale.customTotal || sale.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-xl border border-slate-200">
            <TabsTrigger 
              value="sell" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600"
            >
              Sell Products
            </TabsTrigger>
            <TabsTrigger 
              value="manage" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600"
            >
              Manage Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sell" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                    Quick Sale
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Select product and complete sale efficiently
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="product-select" className="text-slate-700 font-medium">Product</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger className="bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                          {products.map((product) => (
                            <SelectItem 
                              key={product.id} 
                              value={product.id}
                              className="text-slate-900 hover:bg-slate-50 focus:bg-slate-50"
                            >
                              {product.name} - ${product.price.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantity" className="text-slate-700 font-medium">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          placeholder="Qty"
                          className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="custom-price" className="text-slate-700 font-medium">Custom Price</Label>
                        <Input
                          id="custom-price"
                          type="number"
                          step="0.01"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          placeholder="Optional"
                          className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleAddFromDropdown} 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                    disabled={!selectedProduct}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                    Cart ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500">Cart is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-800">{item.name}</h4>
                              <div className="flex items-center gap-2 mt-2">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value) || 0)}
                                  className="w-16 h-8 text-sm bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                                  min="0"
                                />
                                <span className="text-slate-600 text-sm">x</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.customPrice || item.price}
                                  onChange={(e) => updateCartItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                  className="w-20 h-8 text-sm bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                                  placeholder="Price"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 font-bold">
                                ${((item.customPrice || item.price) * item.quantity).toFixed(2)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 pt-4 border-t border-slate-200">
                        <div>
                          <Label htmlFor="custom-total" className="text-slate-700 font-medium">Custom Total (Optional)</Label>
                          <Input
                            id="custom-total"
                            type="number"
                            step="0.01"
                            value={customTotal}
                            onChange={(e) => setCustomTotal(e.target.value)}
                            placeholder="Enter custom total"
                            className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700 text-lg font-medium">Total:</span>
                          <span className="text-2xl font-bold text-green-600">${calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleCheckout} 
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 font-semibold shadow-lg transform hover:scale-[1.02] transition-all duration-200" 
                          disabled={cart.length === 0}
                        >
                          <DollarSign className="w-5 h-5 mr-2" />
                          Complete Sale
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handlePrintReceipt} 
                          disabled={cart.length === 0}
                          className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-blue-600" />
                  Add New Product
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Add a new product to inventory
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="new-prod-name" className="text-slate-700 font-medium">Product Name</Label>
                    <Input
                      id="new-prod-name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Product name"
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-prod-price" className="text-slate-700 font-medium">Price</Label>
                    <Input
                      id="new-prod-price"
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="Price"
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-prod-image" className="text-slate-700 font-medium">Image URL (Optional)</Label>
                    <Input
                      id="new-prod-image"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      placeholder="Image URL"
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAddProduct} 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  Current Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200">
                        <TableHead className="text-slate-700">Name</TableHead>
                        <TableHead className="text-slate-700">Price</TableHead>
                        <TableHead className="text-slate-700">Status</TableHead>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}