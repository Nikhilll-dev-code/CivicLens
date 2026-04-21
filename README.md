# CivicLens - Human-Centered Civic Issue Reporting 🏛️📸

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

**CivicLens** is a full-stack web application designed to bridge the gap between citizens and municipal authorities. It empowers users to report urban problems—such as potholes, garbage, or water leaks—directly with photographic evidence, ensuring transparency and accountability in civic management.

## 🌟 Key Features

- **🚀 Seamless Reporting:** Quick submission of issues with descriptions, geolocation, and image attachments.
- **🖼️ Secure Image Hosting:** Robust integration with **Cloudinary** for reliable storage of evidence photos.
- **📊 Public Dashboard:** A modern, card-based interface providing a transparent view of all reported issues.
- **🔄 Real-Time Updates:** Instant status synchronization (Pending ➔ In Progress ➔ Resolved).
- **⏳ Dynamic Escalation:** Automatic tagging of unresolved issues based on age:
  - ⚠️ **Needs Attention** (3+ days)
  - 🚨 **Escalated** (7+ days)
- **📩 Hybrid Notifications:**
  - **Email Alerts:** Reliable notifications sent to admins via **Nodemailer**.
  - **Simulated SMS/WhatsApp:** Terminal-based logging for authority notifications.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js (Vite)
- **Styling:** Vanilla CSS (Custom Design System)
- **State Management:** React Hooks
- **Routing:** React Router DOM

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Service Integration:** Cloudinary, Nodemailer

---

## ⚙️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- [Cloudinary](https://cloudinary.com/) account for image storage
- Gmail account with [App Passwords](https://support.google.com/accounts/answer/185833) enabled for Nodemailer

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd civic-lens
```

### 2. Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory (use `.env.example` as a template):
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   JWT_SECRET=your_jwt_secret
   ```

### 3. Frontend Setup
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🚀 Running the Application

You need to run both the server and client concurrently.

### 🔌 Start Server
```bash
cd server
npm run dev
```
*The server will start on [http://localhost:5000](http://localhost:5000)*

### 💻 Start Client
```bash
cd client
npm run dev
```
*The UI will be accessible at [http://localhost:5173](http://localhost:5173)*

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for a better community.**
