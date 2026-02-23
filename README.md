Real-Time Chat Application

A real-time chat application built using **Spring Boot**, **WebSocket (STOMP protocol)**, and **Tailwind CSS**.  
Supports live message broadcasting and active user tracking with a responsive modern UI.

---

 Tech Stack

- Java
- Spring Boot
- WebSocket
- STOMP Protocol
- SockJS
- Tailwind CSS
- HTML / JavaScript

---

## ✨ Features

- 🔴 Real-time messaging using WebSocket
- 👥 Active user tracking
- ⚡ Live message broadcasting
- 📱 Responsive UI design
- 🔄 No page refresh required

---

Architecture

Client ↔ WebSocket Endpoint (/chat)  
Client → /app/sendMessage  
Server → /topic/messages  
Server → /topic/users  

---

 ▶️ How to Run

1. Clone the repository  
2. Open in IntelliJ / VS Code  
3. Run the Spring Boot application  
4. Open `http://localhost:8080`  
5. Open in multiple browsers to test real-time chat

---
