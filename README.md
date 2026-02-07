# 🏢 HR Management System

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=for-the-badge&logo=go)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

**A modern, full-stack HR Management System built with Next.js 16, React 19, and Go**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Documentation](#-api-endpoints) • [License](#-license)

</div>

---

## ✨ Features

### 👤 Employee Management

- **Employee Directory** - Browse and search employees across branches
- **Profile Management** - View detailed employee profiles and information
- **Award Tracking** - Manage employee awards and recognition

### 📅 Attendance System

- **Clock In/Out** - Simple attendance tracking with calendar view
- **Attendance Recap** - Monthly/yearly attendance reports and analytics
- **Leave Management** - Track leave quotas and requests

### 📝 Work Permits & Requests

- **Work Permit System** - Submit and track work permits with file attachments
- **Approval Workflow** - Admin approval/rejection with notifications
- **Request History** - Complete audit trail of all requests

### 🔔 Communication

- **Announcements** - Company-wide announcement system
- **Calendar Events** - Track holidays, events, and important dates
- **Notifications** - Real-time notification system

### 🛡️ Admin Panel

- **User Management** - Full CRUD for user accounts
- **Branch Management** - Manage company branches and locations
- **Activity Logs** - Comprehensive admin action logging
- **Statistics Dashboard** - Overview of system metrics

---

## 🛠️ Tech Stack

### Frontend

| Technology   | Version | Purpose                         |
| ------------ | ------- | ------------------------------- |
| Next.js      | 16.1.1  | React Framework with App Router |
| React        | 19.2.3  | UI Library                      |
| TypeScript   | 5.x     | Type Safety                     |
| Tailwind CSS | 4.x     | Styling                         |
| Lucide React | Latest  | Icons                           |

### Backend

| Technology | Version | Purpose            |
| ---------- | ------- | ------------------ |
| Go         | 1.21+   | Backend Language   |
| Gin        | Latest  | HTTP Web Framework |
| MongoDB    | Latest  | Database           |
| JWT        | -       | Authentication     |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Go 1.21+
- MongoDB instance
- Docker (optional)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/hr-system.git
cd hr-system
```

2. **Install dependencies**

```bash
# Install all workspace dependencies
npm install

# Or install separately
cd frontend && npm install
cd ../backend && go mod download
```

3. **Environment Setup**

Copy the example environment file and configure your credentials:

```bash
# Backend configuration
cd backend
cp .env.example .env
# Edit .env with your MongoDB credentials

# Frontend configuration (optional)
cd ../frontend
cp .env.example .env.local  # if needed
```

The backend `.env` file should contain:

```bash
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/?appName=YourApp
MONGODB_DB=HRIS-Demo
JWT_SECRET=your-super-secret-jwt-key
```

4. **Start the development servers**

```bash
# Terminal 1 - Backend
cd backend
go run main.go

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### 🐳 Docker Deployment

Both frontend and backend include Dockerfiles for containerized deployment:

```bash
# Build and run with Docker Compose (if available)
docker-compose up --build

# Or build individually
docker build -t hr-frontend ./frontend
docker build -t hr-backend ./backend
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint                    | Description      |
| ------ | --------------------------- | ---------------- |
| POST   | `/api/auth/login`           | User login       |
| POST   | `/api/auth/logout`          | User logout      |
| POST   | `/api/auth/change-password` | Change password  |
| GET    | `/api/auth/me`              | Get current user |

### Employees & Attendance

| Method | Endpoint             | Description            |
| ------ | -------------------- | ---------------------- |
| GET    | `/api/employees`     | List all employees     |
| GET    | `/api/employees/:id` | Get employee details   |
| GET    | `/api/attendance`    | Get attendance records |
| POST   | `/api/attendance`    | Record attendance      |

### Work Permits & Requests

| Method | Endpoint            | Description        |
| ------ | ------------------- | ------------------ |
| GET    | `/api/work-permits` | List work permits  |
| POST   | `/api/work-permits` | Create work permit |
| POST   | `/api/requests`     | Submit request     |
| GET    | `/api/leave-quota`  | Get leave quota    |

### Admin Routes

| Method | Endpoint              | Description          |
| ------ | --------------------- | -------------------- |
| GET    | `/api/admin/stats`    | Dashboard statistics |
| GET    | `/api/admin/users`    | Manage users         |
| GET    | `/api/admin/requests` | Pending requests     |
| GET    | `/api/admin/logs`     | Activity logs        |

---

## 📁 Project Structure

```
hr-system/
├── frontend/                 # Next.js 16 Frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── admin/       # Admin dashboard
│   │   │   ├── attendance/  # Attendance tracking
│   │   │   ├── directory/   # Employee directory
│   │   │   ├── login/       # Authentication
│   │   │   └── work-permit/ # Work permit system
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React Context providers
│   │   ├── types/           # TypeScript definitions
│   │   └── utils/           # Utility functions
│   └── Dockerfile
│
├── backend/                  # Go Backend
│   ├── handlers/            # API route handlers
│   ├── database/            # MongoDB connection & queries
│   ├── models/              # Data models
│   ├── seed/                # Database seeding
│   ├── main.go              # Application entry point
│   └── Dockerfile
│
└── package.json             # Workspace configuration
```

---

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Admin and user role separation
- **Protected Routes** - Middleware-based route protection
- **CORS Configuration** - Configured allowed origins
- **Input Validation** - Server-side request validation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for modern HR management**

</div>
