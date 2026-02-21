// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout/Layout';
import AuthLayout from './components/Auth/AuthLayout';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import CreateMentorProfile from './components/Profile/CreateMentorProfile';
import CreateJuniorProfile from './components/Profile/CreateJuniorProfile';
import EditProfile from './components/Profile/EditProfile';
import BrowseMentors from './components/Browse/BrowseMentors';
import BrowseJuniors from './components/Browse/BrowseJuniors';
import QuestionList from './components/Questions/QuestionList';
import AskQuestion from './components/Questions/AskQuestion';
import QuestionDetail from './components/Questions/QuestionDetail';
import MyQuestions from './components/Questions/MyQuestions';
import ConnectionsList from './components/Connections/ConnectionsList';
import ConnectionRequests from './components/Connections/ConnectionRequests';
import MessageInterface from './components/Messages/MessageInterface';
import JuniorProfileView from './components/Profile/JuniorProfileView';
import MentorProfileView from './components/Profile/MentorProfileView';
import NotificationsPage from './components/Notifications/NotificationsPage'; // 🔔 NEW
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Auth Routes */}
              <Route path="/auth" element={<AuthLayout />}>
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
              </Route>

              {/* Protected Routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* Profile Routes */}
                <Route path="profile/create-mentor" element={<CreateMentorProfile />} />
                <Route path="profile/create-junior" element={<CreateJuniorProfile />} />
                <Route path="profile/edit" element={<EditProfile />} />
                
                {/* Browse Routes */}
                <Route path="browse/mentors" element={<BrowseMentors />} />
                <Route path="browse/juniors" element={<BrowseJuniors />} />
                
                {/* Questions Routes */}
                <Route path="questions" element={<QuestionList />} />
                <Route path="questions/ask" element={<AskQuestion />} />
                <Route path="questions/:questionId" element={<QuestionDetail />} />
                <Route path="questions/my" element={<MyQuestions />} />
                
                {/* Connections Routes */}
                <Route path="connections" element={<ConnectionsList />} />
                <Route path="connections/requests" element={<ConnectionRequests />} />
                
                {/* Messages Routes */}
                <Route path="messages" element={<MessageInterface />} />

                {/* 🔔 Notifications Route (NEW) */}
                <Route path="notifications" element={<NotificationsPage />} />

                {/* Profile View Routes */}
                <Route path="junior/:userId" element={<JuniorProfileView />} />
                <Route path="mentor/:userId" element={<MentorProfileView />} />
              </Route>

              {/* Redirect to login if no match */}
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;