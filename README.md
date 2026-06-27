cat > README.md <<'EOF'
# Real-Time Chat Application

A full-stack real-time chat application built with Spring Boot, Angular, MySQL, JWT Authentication, WebSocket, Group Chat, and future Voice/Video Call support.

## Project Features

### Phase 1: Authentication
- User Registration
- User Login
- JWT Authentication
- Protected Angular Routes
- Logout

### Phase 2: One-to-One Chat
- User list
- One-to-one chat
- Real-time messaging using WebSocket
- Message history
- Message timestamp
- Last message preview

### Phase 3: Group Chat
- Create group
- Add group members
- Group messages
- Group member list
- Group admin
- Group unread messages

### Phase 4: Chat Enhancements
- Online/offline status
- Last seen
- Typing indicator
- Unread message count
- Search users/groups
- Profile avatar initials

### Phase 5: Voice/Video Call
- One-to-one voice call
- One-to-one video call
- Incoming call popup
- Accept/reject call
- End call
- WebRTC signaling using WebSocket

## Tech Stack

### Backend
- Java
- Spring Boot
- Spring Security
- JWT
- Spring WebSocket/STOMP
- Spring Data JPA
- MySQL
- Maven
- Swagger/OpenAPI

### Frontend
- Angular
- TypeScript
- HTML
- CSS
- Reactive Forms
- SweetAlert2
- WebSocket/STOMP Client

## Database Plan

### users
- id
- name
- email
- password
- status
- last_seen
- created_at
- updated_at

### messages
- id
- sender_id
- receiver_id
- content
- is_read
- created_at
- updated_at

### chat_groups
- id
- group_name
- created_by
- created_at
- updated_at

### group_members
- id
- group_id
- user_id
- role
- joined_at

### group_messages
- id
- group_id
- sender_id
- content
- created_at

## API Plan

### Auth APIs
- POST /api/auth/register
- POST /api/auth/login

### User APIs
- GET /api/users
- GET /api/users/search?keyword=
- GET /api/users/{id}

### Message APIs
- GET /api/messages/{receiverId}
- POST /api/messages
- PUT /api/messages/read/{senderId}

### Group APIs
- POST /api/groups
- GET /api/groups
- GET /api/groups/{groupId}
- POST /api/groups/{groupId}/members
- DELETE /api/groups/{groupId}/members/{userId}
- GET /api/groups/{groupId}/messages
- POST /api/groups/{groupId}/messages

### WebSocket Routes
- /ws
- /app/chat.send
- /topic/messages/{userId}
- /app/group.send
- /topic/groups/{groupId}
- /app/call.signal
- /topic/call/{userId}

## UI Screens

1. Login Page
2. Register Page
3. Chat Dashboard
4. Contact Sidebar
5. One-to-One Chat Window
6. Group Chat Window
7. Create Group Modal
8. Group Info Page
9. Incoming Call Popup
10. Video Call Screen

## Build Order

1. Backend Spring Boot setup
2. MySQL database setup
3. User entity and authentication
4. JWT security
5. Angular login/register
6. User list API
7. Message entity and history API
8. WebSocket real-time messaging
9. Chat dashboard UI
10. Group chat
11. Online/offline and unread count
12. Voice/video call
13. README and screenshots
