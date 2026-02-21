# BridgeUp - Mentorship Platform

## 📋 Overview

BridgeUp is a comprehensive full-stack mentorship platform designed to connect junior developers with experienced mentors. The platform facilitates knowledge sharing, career guidance, and technical support through an intuitive interface that serves both mentees seeking guidance and mentors ready to share their expertise.

## ✨ Key Features

### 👤 Dual User Roles

#### **Junior Developer (Mentee) Features**
- **Personalized Dashboard**: Overview of active mentors, questions asked, new messages, and notifications
- **Mentor Discovery**: Browse and search for mentors based on skills, expertise, and experience
- **Connection Management**: Send connection requests and manage active mentorships
- **Q&A Community**: Ask technical questions and receive answers from experienced developers
- **Real-time Messaging**: Communicate directly with connected mentors
- **Profile Management**: Create and maintain a comprehensive junior developer profile

#### **Senior Developer (Mentor) Features**
- **Mentor Dashboard**: Track active mentees, answered questions, pending requests, and karma points
- **Connection Requests**: Review and respond to mentorship requests from junior developers
- **Question Answering**: Help junior developers by answering their technical questions
- **Mentee Management**: View and manage all active mentorship connections
- **Real-time Communication**: Message mentees and provide guidance
- **Profile Showcase**: Create a mentor profile highlighting skills, experience, and areas of expertise

### 🔍 Core Functionality

#### **Browse & Search**
- **Find Mentors**: Search for mentors by name, skills (JavaScript, React, Node.js, Express.js, MongoDB, etc.)
- **Filter Results**: Smart search functionality to find the perfect mentor match
- **View Profiles**: Detailed mentor profiles with skills, experience, and background information

#### **Q&A Community**
- **Ask Questions**: Post technical questions with detailed descriptions
- **Tag System**: Categorize questions with relevant tags (max 5 tags)
- **Status Tracking**: Monitor question status (Open/Answered)
- **View History**: Access all previously asked questions
- **Browse All Questions**: Explore community questions filtered by tags and status
- **Answer Questions**: Mentors can provide detailed answers to help juniors

#### **Connection System**
- **Send Requests**: Junior developers can request mentorship with personalized messages
- **Accept/Decline**: Mentors can review and respond to connection requests
- **Active Connections**: View all established mentor-mentee relationships
- **Connection Status**: Track connection status and details

#### **Messaging System**
- **Real-time Chat**: WebSocket-powered instant messaging between mentors and mentees
- **Conversation History**: Access complete message history with connections
- **Connection Status**: Online/offline indicators for active users
- **File Attachment Support**: Share resources and documents (UI ready)

#### **Notifications**
- **Real-time Updates**: Instant notifications for new messages, connection requests, and question answers
- **Notification Center**: Centralized location to view all notifications
- **Status Indicators**: Visual badges showing unread notifications

### 🔐 Authentication & Security

- **User Registration**: Separate signup flows for juniors and mentors
- **Secure Login**: Protected authentication system
- **Role-based Access**: Different dashboards and features based on user role
- **Protected Routes**: Secure navigation preventing unauthorized access
- **Session Management**: Persistent login sessions with JWT tokens

### 💡 Additional Features

- **Profile Creation**: Comprehensive profile setup for both juniors and mentors
- **Edit Profile**: Update personal information, skills, and experience
- **Search Functionality**: Quick search across questions, mentors, and content
- **Responsive Design**: Mobile-friendly interface that works across all devices
- **Loading States**: Smooth loading indicators for better UX
- **Error Handling**: User-friendly error messages and validation

## 🛠️ Technology Stack

### **Frontend**
- **React.js**: Modern UI library for building interactive interfaces
- **React Router**: Client-side routing and navigation
- **Axios**: HTTP client for API requests
- **Socket.io Client**: Real-time WebSocket communication
- **CSS3**: Custom styling and responsive design
- **React Context API**: State management for authentication

### **Backend**
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for data persistence
- **Mongoose**: MongoDB object modeling
- **Socket.io**: Real-time bidirectional communication
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing and security

### **Architecture**
- **RESTful API**: Standard HTTP methods for CRUD operations
- **WebSocket**: Real-time messaging functionality
- **MVC Pattern**: Organized code structure
- **Component-based**: Reusable React components

## 📁 Project Structure

```
HACKATHON-BRIDGEUP-APP/
│
├── client/                          # Frontend React application
│   ├── node_modules/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Auth/               # Authentication components
│       │   │   ├── AuthLayout.jsx
│       │   │   ├── Login.jsx
│       │   │   ├── ProtectedRoute.jsx
│       │   │   └── Signup.jsx
│       │   ├── Browse/             # Mentor browsing
│       │   │   ├── BrowseJuniors.jsx
│       │   │   └── BrowseMentors.jsx
│       │   ├── Common/             # Reusable components
│       │   │   ├── ErrorMessage.jsx
│       │   │   ├── Loading.jsx
│       │   │   ├── NotificationBell.jsx
│       │   │   ├── SearchInput.jsx
│       │   │   └── SuccessMessage.jsx
│       │   ├── Connections/        # Connection management
│       │   │   ├── ConnectionRequests.jsx
│       │   │   ├── ConnectionsList.jsx
│       │   │   └── SendRequest.jsx
│       │   ├── Dashboard/          # User dashboards
│       │   │   ├── Dashboard.jsx
│       │   │   ├── JuniorDashboard.jsx
│       │   │   └── SeniorDashboard.jsx
│       │   ├── Layout/             # Layout components
│       │   │   ├── Header.jsx
│       │   │   ├── Layout.jsx
│       │   │   └── Sidebar.jsx
│       │   ├── Messages/           # Messaging system
│       │   │   ├── ChatWindow.jsx
│       │   │   ├── MessageInterface.jsx
│       │   │   └── MessageList.jsx
│       │   ├── Notifications/      # Notification system
│       │   │   └── NotificationsPage.jsx
│       │   ├── Profile/            # User profiles
│       │   │   ├── CreateJuniorProfile.jsx
│       │   │   ├── CreateMentorProfile.jsx
│       │   │   ├── EditProfile.jsx
│       │   │   ├── JuniorProfileView.jsx
│       │   │   ├── MentorProfileView.jsx
│       │   │   └── ViewProfile.jsx
│       │   └── Questions/          # Q&A system
│       │       ├── AskQuestion.jsx
│       │       ├── MyQuestions.jsx
│       │       ├── QuestionDetail.jsx
│       │       └── QuestionList.jsx
│       ├── context/
│       │   ├── AuthContext.jsx     # Authentication state
│       │   └── SocketContext.jsx   # WebSocket connection
│       ├── services/
│       │   ├── api.js              # API configuration
│       │   ├── auth.js             # Auth services
│       │   └── mentorProfileAPI.js # Mentor profile services
│       ├── styles/
│       │   └── global.css          # Global styles
│       ├── utils/
│       │   ├── constants.js        # App constants
│       │   └── helpers.js          # Helper functions
│       ├── App.css
│       ├── App.jsx                 # Main app component
│       ├── index.css
│       └── main.jsx                # App entry point
│
├── node_modules/
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HACKATHON-BRIDGEUP-APP
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

5. **Start MongoDB**
   Ensure MongoDB is running on your system

6. **Run the application**
   
   **Development mode (with hot reload):**
   ```bash
   # Terminal 1 - Backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```
   
   **Production mode:**
   ```bash
   npm start
   ```

7. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:4444`

## 📱 Usage Guide

### For Junior Developers

1. **Sign Up**: Create an account as a junior developer
2. **Complete Profile**: Fill in your skills, interests, and learning goals
3. **Find Mentors**: Browse available mentors and search by expertise
4. **Connect**: Send connection requests to mentors you'd like to learn from
5. **Ask Questions**: Post technical questions in the Q&A section
6. **Message**: Chat with your mentors in real-time
7. **Track Progress**: Monitor your questions and active mentorships

### For Senior Developers

1. **Sign Up**: Create an account as a mentor
2. **Create Profile**: Showcase your skills, experience, and areas of expertise
3. **Review Requests**: Check pending connection requests from juniors
4. **Accept Mentees**: Accept requests and start mentoring
5. **Answer Questions**: Help the community by answering technical questions
6. **Communicate**: Message your mentees and provide guidance
7. **Track Impact**: Monitor answered questions and karma points

## 🎯 Future Enhancements

- **Video Call Integration**: Enable video calls between mentors and mentees (currently in development)
- **Progress Tracking**: Implement learning milestones and progress tracking
- **Rating System**: Allow mentees to rate their mentorship experience
- **Resource Sharing**: Integrated file sharing and resource library
- **Calendar Integration**: Schedule mentoring sessions
- **Group Mentoring**: Support for group mentoring sessions
- **Achievement Badges**: Gamification with badges and achievements
- **Advanced Search**: More filtering options for mentor discovery
- **Email Notifications**: Email alerts for important events
- **Mobile App**: Native iOS and Android applications

