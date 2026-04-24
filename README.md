# 🌍 Menya Rwanda Backend API

A robust backend API for managing tourism attractions, reviews, favorites, notifications, chat, and events.

---

## 🚀 Features

* 🔐 **Authentication & Authorization (JWT)**
* 👤 User roles (Admin, Staff/Owner, Client)
* 📍 Attraction management (CRUD + approval system)
* ⭐ Reviews & rating system (auto-calculated)
* ❤️ Favorites system
* 🔔 Real-time notification system
* 💬 Chat system (user ↔ assistant)
* 🎉 Events management
* ☁️ Image uploads via Cloudinary

---

## 🛠️ Tech Stack

* Node.js
* Express.js
* MongoDB (Mongoose)
* Cloudinary (file uploads)
* JWT Authentication
* Multer (file handling)

---

## 📦 Installation

```bash
git clone <your-repo-url>
cd menya-rwanda-backend
npm install
```

---

## ▶️ Running the Server

```bash
npm start
```

or (development)

```bash
nodemon server.js
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection
SECRET_KEY=your_jwt_secret

CLOUD_NAME=your_cloudinary_name
API_KEY=your_cloudinary_key
API_SECRET=your_cloudinary_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

---

## 🌐 API Base URL

```
http://localhost:5000/api
```

---

## 🔐 Authentication

All protected routes require a Bearer token:

```
Authorization: Bearer <your_token>
```

---

## 📌 API Modules & Routes

### 👤 Users

```
POST   /api/users/signup
POST   /api/users/login
GET    /api/users/all        (Admin)
PUT    /api/users/profile/:id
PUT    /api/users/password
POST   /api/users/verifyotp
POST   /api/users/forgot
POST   /api/users/resetpassword/:token
```

---

### 🧑‍💼 Owners (Staff)

```
POST   /api/owners/create     (Admin)
GET    /api/owners
GET    /api/owners/:id
GET    /api/owners/me
PUT    /api/owners/:id
DELETE /api/owners/:id
```

---

### 📍 Attractions

```
GET    /api/attractions/approved
GET    /api/attractions/search
GET    /api/attractions/top
GET    /api/attractions/:id

POST   /api/attractions/create        (Staff)
PUT    /api/attractions/update/:id    (Owner)
PUT    /api/attractions/status/:id    (Admin)
DELETE /api/attractions/delete/:id
DELETE /api/attractions/image/:id/:imageIndex
```

---

### ⭐ Reviews

```
POST   /api/reviews
GET    /api/reviews/:attractionId
GET    /api/reviews/my
DELETE /api/reviews/:id
```

---

### ❤️ Favorites

```
POST   /api/favorites
POST   /api/favorites/toggle
DELETE /api/favorites/:attractionId
GET    /api/favorites
GET    /api/favorites/check/:attractionId
```

---

### 🔔 Notifications

```
GET    /api/notifications
GET    /api/notifications/type/:type
PUT    /api/notifications/read/:id
PUT    /api/notifications/read-all
DELETE /api/notifications/:id
```

---

### 💬 Chat

```
GET    /api/chat
POST   /api/chat/send
POST   /api/chat/assistant
GET    /api/chat/recent
DELETE /api/chat/message/:messageId
DELETE /api/chat/clear
```

---

### 🎉 Events

```
GET    /api/events
GET    /api/events/upcoming
GET    /api/events/past
GET    /api/events/:id
GET    /api/events/location/:location

POST   /api/events/create
PUT    /api/events/:id
DELETE /api/events/:id
```

---

## 🔄 System Flow Highlights

### ✔️ Reviews

* Users can review attractions
* Ratings are automatically recalculated
* Owners receive notifications on new reviews

### ✔️ Attractions

* Created by staff → status = `pending`
* Admin approves/rejects
* User gets notified of decision

### ✔️ Notifications

* Triggered on:

  * Account creation & verification
  * Password reset
  * New reviews
  * Attraction approval/rejection

---

## 📁 Project Structure

```
/Controllers
/Models
/Routes
/Middleware
/Uploads
/config
server.js
```

---

## ⚠️ Important Notes

* File uploads require `multipart/form-data`
* Image field name: `images`
* Authentication middleware must be applied to protected routes
* Duplicate favorites are prevented via MongoDB index

---

## 🚀 Future Improvements

* AI-powered chat integration (OpenAI / Gemini)
* Pagination for large datasets
* Real-time notifications (WebSockets)
* API documentation (Swagger)
* Rate limiting & security enhancements

---

## 👨‍💻 Author

Developed as part of a tourism platform backend system.

---

## 📜 License

This project is open-source and available for learning and development purposes.
