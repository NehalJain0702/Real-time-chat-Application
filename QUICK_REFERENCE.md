# 🚀 QuickChat - Quick Reference Card

## Environment Variables at a Glance

### Backend Configuration
```bash
# Database
DB_URL=jdbc:mysql://localhost:3306/chatApplication
DB_USERNAME=root
DB_PASSWORD=your_password

# CORS & Origins
CORS_ORIGINS=http://localhost:5173

# Server
PORT=8080
```

### Frontend Configuration
```bash
# API URL
VITE_API_URL=http://localhost:8080
```

---

## 🏃 Quick Start (30 seconds)

```bash
# Terminal 1: Backend
cd app
mvn spring-boot:run

# Terminal 2: Frontend
cd chat-frontend
npm install
npm run dev

# Open: http://localhost:5173
```

---

## 🐳 Docker Quick Start

```bash
# Build
docker build -t chat-app .

# Run
docker run -d \
  -e DB_URL=jdbc:mysql://localhost:3306/chatApplication \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=password \
  -e CORS_ORIGINS=http://localhost:5173 \
  -p 8080:8080 \
  chat-app

# View logs
docker logs -f <container_id>
```

---

## 📋 Common Tasks

### Create Test Users
```bash
curl http://localhost:8080/api/users/add-test-users
```

### Get All Users
```bash
curl http://localhost:8080/api/users
```

### Get Chat Messages
```bash
curl http://localhost:8080/messages/{sender}/{receiver}
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 8080 in use | `lsof -i :8080` then `kill -9 <PID>` |
| MySQL connection failed | Verify MySQL is running & credentials correct |
| Frontend can't connect | Check `VITE_API_URL` environment variable |
| CORS error | Verify `CORS_ORIGINS` includes your frontend URL |
| Timestamps are null | Restart backend (needs fresh deployment) |

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `src/main/resources/application.properties` | Backend config |
| `chat-frontend/.env` | Frontend config |
| `Dockerfile` | Container definition |
| `docker-compose.yml` | Multi-container setup |

---

## 🔄 Development Workflow

1. Make code changes
2. Backend: Stop & run `mvn spring-boot:run`
3. Frontend: Auto-reloads on save
4. Test in browser: `http://localhost:5173`

---

## 📊 Architecture

```
Frontend (React)
    ↓
API (Spring Boot REST)
    ↓
WebSocket (STOMP)
    ↓
Message Broker
    ↓
Database (MySQL)
```

---

## 🎯 Tech Stack

- **Backend**: Java 21, Spring Boot 4.0.3
- **Frontend**: React 19, Vite, Tailwind CSS
- **Communication**: WebSocket (STOMP), SockJS
- **Database**: MySQL 8.0+
- **Deployment**: Docker, Render

---

## 📞 Quick Help

```bash
# Backend help
mvn help:describe -Dplugin=spring-boot

# Frontend help  
npm run --list

# Docker help
docker --help
```

---

**Need more info?** See `SETUP_GUIDE.md` or `ISSUES_AND_FIXES.md`
