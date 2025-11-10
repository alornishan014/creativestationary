# Shop Management System

A comprehensive shop management system built with Next.js 15, TypeScript, and Prisma. This system provides complete functionality for managing shop operations, including employee management, product inventory, sales tracking, and detailed reporting.

## Features

### 🔐 Authentication System
- **Admin Login**: Password-based authentication (Password: `095213`)
- **Employee Login**: Mobile number-based authentication (no password required)
- Secure session management with localStorage

### 👥 Admin Dashboard Features
- **Dashboard Overview**: Real-time sales metrics and statistics
- **Employee Management**: Add/remove employees, track performance
- **Product Management**: Full CRUD operations for products
- **Sales History**: Complete sales records with filtering options
- **Shop Settings**: Configure shop name, phone, and address
- **Date Filtering**: Filter sales by specific dates
- **Print Functionality**: Print sales reports and receipts

### 🛒 Employee Panel Features
- **Product Sales**: Intuitive cart-based selling system
- **Custom Pricing**: Override product prices during sales
- **Product Management**: Add new products to inventory
- **Receipt Printing**: Generate and print sales receipts
- **Search Functionality**: Quick product search
- **Real-time Cart Management**: Add, remove, and modify cart items

### 📊 Reporting & Analytics
- **30-Day Sales History**: Complete sales tracking
- **Employee Performance**: Track individual employee sales
- **Daily Sales Reports**: Day-by-day sales breakdown
- **Total Revenue Tracking**: Real-time revenue calculations
- **Date-based Filtering**: Filter reports by specific dates

### 🎨 Professional UI/UX
- **Responsive Design**: Mobile, tablet, and desktop optimized
- **Modern Interface**: Clean, professional design with shadcn/ui
- **Dark/Light Theme Support**: Built-in theme switching
- **Loading States**: Professional loading indicators
- **Error Handling**: Comprehensive error management

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (New York style)
- **Icons**: Lucide React
- **State Management**: React hooks and localStorage

## Database Schema

### ShopSettings
- Shop configuration (name, phone, address)

### Employees
- Employee information (name, mobile, status)
- Sales relationship tracking

### Products
- Product inventory (name, price, image, status)
- Sales relationship tracking

### Sales
- Sales transactions (employee, total amount, custom pricing)
- Timestamp tracking

### SaleItems
- Individual sale items (product, quantity, pricing)
- Custom price support

## API Endpoints

### Authentication
- `POST /api/auth/employee-login` - Employee authentication

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `DELETE /api/employees/[id]` - Delete employee

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `DELETE /api/products/[id]` - Delete product

### Sales
- `GET /api/sales` - List all sales
- `POST /api/sales` - Create new sale

### Shop Settings
- `GET /api/shop-settings` - Get shop configuration
- `PUT /api/shop-settings` - Update shop configuration

## Getting Started

1. **Login as Admin**: Use password `095213` to access admin dashboard
2. **Create Employees**: Add employees with name and mobile number
3. **Add Products**: Populate inventory with products and prices
4. **Employee Login**: Employees login using their mobile number
5. **Start Selling**: Employees can sell products and manage sales

## Key Features Details

### Admin Capabilities
- View real-time sales dashboard
- Manage employee accounts
- Track employee performance
- Configure shop settings
- Generate sales reports
- Filter sales by date
- Print sales data

### Employee Capabilities
- Search and sell products
- Add products to cart
- Modify quantities and prices
- Generate receipts
- Add new products to inventory
- View product catalog

### Sales Features
- Cart-based selling system
- Custom pricing support
- Multiple product sales
- Receipt generation
- Sales history tracking
- Employee attribution

## Security Features
- Admin password protection
- Employee mobile authentication
- Session management
- Input validation
- Error handling

## Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Adaptive layouts
- Cross-device compatibility

This shop management system provides a complete solution for retail operations with professional features, modern UI, and robust functionality.