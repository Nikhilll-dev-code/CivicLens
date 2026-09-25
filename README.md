# CivicLens — Role-Based Civic Complaint Reporting & Resolution Platform 🏛️📸

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)

**CivicLens v2.0** is a full-stack civic complaint reporting and municipal resolution platform. It bridges the gap between citizens and local government by offering photo- and GPS-based reporting, automated database-driven department routing, role-based workflows for municipal staff, real-time map visualization, and system-wide administrative analytics.

---

## 🌟 Key Capabilities (v2.0 Release)

- **👥 Role-Based Access Control (RBAC):** Distinct workflows for **Citizens**, **Authority Staff**, and **Administrators** secured via JWT authentication.
- **⚡ Automatic Authority Routing:** Complaint submission automatically matches issue type (`Pothole`, `Garbage`, `Water Leak`, `Streetlight`, `Drainage`, `Other`) and geographic location/area to active municipal department records (`Roads Dept`, `Sanitation Dept`, `Water Supply Dept`, `Electrical Dept`, `Drainage Dept`, `General Municipal Dept`).
- **📸 Evidence Capture & Cloud Storage:** Photo evidence uploaded via camera or device storage directly to **Cloudinary**.
- **📍 GPS & Reverse Geocoding:** Auto-captures browser location or accepts manual address input with OpenStreetMap Nominatim reverse-geocoding.
- **🗺️ Interactive Complaint Map:** Browser-based Leaflet map rendering status color-coded markers (Amber: Pending, Blue: In Progress, Green: Resolved, Red: Escalated) with slide-out incident inspection panels.
- **📩 Centralized Notification Engine:** Outbound email notifications via **Nodemailer** to routed authorities upon submission and to citizens on status change, paired with simulated SMS and WhatsApp audit logging.
- **📊 Admin System Overview & Analytics:** Live analytics tracking total complaints, active authority records, age-based escalations (3+ days: Needs Attention, 7+ days: Escalated), average resolution times, and routing gap resolution ("Needs Admin Review").

---

## 👥 Role Overview & Demo Login Credentials

The database auto-seeds default authorities and demo accounts on startup:

| Role | Email | Password | Primary Interface & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Citizen (`USER`)** | `citizen@civiclens.gov` | `password123` | **Report Issue & My Complaints:** Report civic issues with photo/GPS; track status progression and routed department names. |
| **Authority Staff (`AUTHORITY`)** | `authority@civiclens.gov` | `password123` | **Department Queue:** Filter and manage department workload; update statuses (`ACKNOWLEDGED`, `In Progress`, `Resolved`); inspect incident map. |
| **Administrator (`ADMIN`)** | `admin@civiclens.gov` | `password123` | **System Overview:** Oversee platform metrics; manage Authority Records (+ Add / Toggle Active); reassign fallback-routed complaints; inspect city-wide map. |

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js 19 (Vite)
- **Routing:** React Router DOM v7
- **Mapping:** Leaflet & React-Leaflet
- **Styling:** Custom CSS Design System (Color Palette: Primary Navy `#1F3864`, Accent `#2E5395`, Surface `#F4F5F7`)
- **Camera:** React Webcam

### Backend
- **Runtime:** Node.js / Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Security & Auth:** JWT (`jsonwebtoken`), `bcryptjs` password hashing
- **Services:** Cloudinary (Multer storage), Nodemailer (SMTP), Custom Routing Service

---

## ⚙️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)
- [Cloudinary](https://cloudinary.com/) Account (for photo storage)

### 1. Clone the Repository
```bash
git clone https://github.com/Nikhilll-dev-code/CivicLens.git
cd CivicLens
```

### 2. Backend Environment Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside `server/` (refer to `.env.example`):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/civiclens
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   JWT_SECRET=super_secret_jwt_key_civiclens_2026
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🚀 Running the Application

### 🔌 1. Start Server (Backend)
```bash
cd server
npm run dev
```
*Server runs on [http://localhost:5000](http://localhost:5000)*

### 💻 2. Start React App (Frontend)
```bash
cd client
npm run dev
```
*Client web app runs on [http://localhost:5173](http://localhost:5173)*

---

## 📡 Key REST API Endpoints

### Auth Routes (`/api/auth`)
- `POST /api/auth/register` — Create citizen account
- `POST /api/auth/login` — Sign in and receive JWT + role details
- `GET /api/auth/me` — Authenticated profile lookup

### Complaint Routes (`/api/complaints`)
- `POST /api/complaints` — Submit complaint (Uploads image, auto-routes authority, dispatches notifications)
- `GET /api/complaints/mine` — List logged-in citizen's complaints
- `GET /api/complaints/assigned` — List assigned department queue for authority staff
- `GET /api/complaints` — System-wide complaints list (Admin)
- `PATCH /api/complaints/:id/status` — Update status (`ACKNOWLEDGED`, `In Progress`, `Resolved`, `Escalated`)
- `PATCH /api/complaints/:id/read` — Toggle read status
- `PATCH /api/complaints/:id/reassign` — Reassign complaint to a different authority (Admin)

### Authority Routes (`/api/authorities`)
- `GET /api/authorities` — List authority records
- `POST /api/authorities` — Create new authority record (Admin)
- `PATCH /api/authorities/:id` — Update or toggle active state (Admin)

### Analytics Routes (`/api/analytics`)
- `GET /api/analytics` — Platform-wide statistics, status counts, breakdown metrics, and admin review items (Admin)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
