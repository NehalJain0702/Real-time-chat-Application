# QuickChat - Real-Time Chat Application
## Setup & Deployment Guide

---

## 📋 Prerequisites

- **Java 21+**: [Download](https://www.oracle.com/java/technologies/downloads/#java21)
- **Maven 3.9+**: [Download](https://maven.apache.org/download.cgi)
- **Node.js 18+**: [Download](https://nodejs.org/)
- **MySQL 8.0+**: [Download](https://www.mysql.com/downloads/)
- **Docker** (optional, for containerized deployment)

---

## 🚀 Quick Start - Local Development

### Step 1: Clone & Setup Database
```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE chatApplication;"
```

### Step 2: Start Backend
```bash
cd app
mvn spring-boot:run
# Backend runs on http://localhost:8080
```

### Step 3: Start Frontend (in new terminal)
```bash
cd chat-frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### Step 4: Open in Browser
- Navigate to `http://localhost:5173`
- Enter your display name and start chatting!

---

## 🐳 Docker Deployment (Recommended for Production)

### Build Docker Image
```bash
docker build -t chat-app:latest .
```

### Run Container with Environment Variables
```bash
docker run -d \
  -e DB_URL=jdbc:mysql://mysql-container:3306/chatApplication \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=YourSecurePassword123 \
  -e CORS_ORIGINS=https://your-frontend-domain.com \
  -e PORT=8080 \
  -p 8080:8080 \
  --name chat-app \
  chat-app:latest
```

### With Docker Compose
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: chatApplication
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      DB_URL: jdbc:mysql://mysql:3306/chatApplication
      DB_USERNAME: root
      DB_PASSWORD: password
      CORS_ORIGINS: http://localhost:5173
    depends_on:
      - mysql

volumes:
  mysql_data:
```

Run: `docker-compose up -d`

---

## 🌐 Deployment to Render

### Backend Deployment
1. Push your repository to GitHub
2. On Render.com:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - **Environment Variables** (Settings → Environment):
     ```
     DB_URL = jdbc:mysql://your-db-host:3306/chatApplication
     DB_USERNAME = your_db_user
     DB_PASSWORD = your_secure_password
     CORS_ORIGINS = https://your-frontend-domain.com
     PORT = 8080
     ```
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -jar target/app-0.0.1-SNAPSHOT.jar`

### Frontend Deployment
1. Create a new Static Site on Render
2. Connect your GitHub repository
3. **Build Settings**:
   - Build Command: `cd chat-frontend && npm install && npm run build`
   - Publish Directory: `chat-frontend/dist`
4. **Environment Variables**:
   ```
   VITE_API_URL = https://your-backend-domain.onrender.com
   ```

---

## 🔑 Environment Variables Reference

### Backend (`application.properties`)
| Variable | Default | Description |
|----------|---------|-------------|
| `DB_URL` | `jdbc:mysql://localhost:3306/chatApplication` | MySQL connection URL |
| `DB_USERNAME` | `root` | Database username |
| `DB_PASSWORD` | `Jain0702@#` | Database password |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |
| `PORT` | `8080` | Server port |

### Frontend (`chat-frontend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8080` | Backend API URL |

---

## 📝 Features

- ✅ Real-time messaging with WebSocket (STOMP)
- ✅ Message delivery status (Sent → Delivered → Seen)
- ✅ Active user tracking
- ✅ Responsive UI with Tailwind CSS
- ✅ Message history persistence
- ✅ Multi-user support

---

## 🐛 Troubleshooting

### Frontend Can't Connect to Backend
- Check `VITE_API_URL` is set correctly
- Ensure backend CORS origins include your frontend URL
- Check browser console for network errors

### Database Connection Failed
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in environment variables
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Messages Not Persisting
- Check MySQL database is accessible
- Verify JPA/Hibernate is configured correctly
- Check database logs: `mysql -u root -p -e "USE chatApplication; SHOW TABLES;"`

---

## 📚 Project Structure

```
app/
├── src/
│   ├── main/java/com/chat/application/app/
│   │   ├── AppApplication.java          # Spring Boot entry point
│   │   ├── Controller/
│   │   │   ├── ChatController.java      # WebSocket message handling
│   │   │   └── UserController.java      # User management
│   │   ├── model/
│   │   │   ├── ChatMessage.java         # Message entity
│   │   │   ├── User.java                # User entity
│   │   │   └── MessageStatus.java       # Message status enum
│   │   ├── repository/
│   │   │   ├── ChatMessageRepository.java
│   │   │   └── UserRepository.java
│   │   └── config/
│   │       ├── webSocket.java           # WebSocket config
│   │       └── CorsConfig.java          # CORS config
│   └── resources/
│       └── application.properties        # Spring Boot config
├── chat-frontend/
│   ├── src/
│   │   ├── App.jsx                      # Main React component
│   │   ├── main.jsx
│   │   └── App.css
│   └── package.json
├── Dockerfile
├── docker-compose.yml
└── pom.xml
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push branch: `git push origin feature/your-feature`
4. Open Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review `FIXES_APPLIED.md` for recent changes
3. Check backend logs: `docker logs chat-app`
4. Check frontend console (F12 → Console)

---

**Happy Chatting! 🎉**
