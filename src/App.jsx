import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate, useParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import AuthForm from './AuthForm'
import './services/firebaseConfig'
import TeacherDashboard from './components/teachers/TeacherDashboard'
import AdminDashboard from './components/admin/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'

// Import QA components
import QADashboard from './components/qa/QA_Dashboard'
import QAList from './components/qa/QA_TeacherList'
import QARecordingsComponent from './components/qa/QA_TeacherRecordings'
import QAInsightsComponent from './components/qa/QA_TeacherInsights'
import QAOnlineEvaluation from './components/qa/QA_OnlineEvaluation'
import QATemplatesComponent from './components/qa/QA_Templates'
import QARecordingDetails from './components/qa/QA_RecordingDetails'

// Redirect component that preserves URL parameters
const TeacherDashboardRedirect = () => {
  const { username } = useParams();
  return <Navigate to={`/teacher-dashboard/${username}/dashboard`} replace />;
};

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFF8F3',
            color: '#333333',
            border: '1px solid #FFDDC9',
          },
          success: {
            iconTheme: {
              primary: '#4CAF50',
              secondary: '#FFF8F3',
            },
          },
          error: {
            iconTheme: {
              primary: '#E57373',
              secondary: '#FFF8F3',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<AuthForm />} />
        
        {/* Teacher List Routes - Using QA Components */}
        <Route 
          path="/teachers" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QAList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teachers/dashboard" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QADashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teachers/templates" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QATemplatesComponent />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teachers/recordings/:teacherId" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QARecordingsComponent />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teachers/recordings/:teacherId/:recordingId" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QARecordingDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teachers/insights/:teacherId" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QAInsightsComponent />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teachers/online-evaluation" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QAOnlineEvaluation />
            </ProtectedRoute>
          } 
        />
        
        {/* QA Routes */}
        <Route 
          path="/qa" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QADashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/qa/dashboard" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QADashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/qa/recordings" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QARecordingsComponent />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/qa/recordings/:teacherId/:recordingId" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QARecordingDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/qa/evaluations" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QAOnlineEvaluation />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/qa/templates" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QATemplatesComponent />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/qa/qa-users" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QAList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/qa/qa-users/:id/insights" 
          element={
            <ProtectedRoute requiredUserType="qa">
              <QAInsightsComponent />
            </ProtectedRoute>
          } 
        />
        
        {/* Teacher Dashboard Routes with nested views */}
        <Route 
          path="/teacher-dashboard/:username" 
          element={
            <ProtectedRoute requiredUserType="teacher">
              <TeacherDashboardRedirect />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher-dashboard/:username/dashboard" 
          element={
            <ProtectedRoute requiredUserType="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher-dashboard/:username/stats" 
          element={
            <ProtectedRoute requiredUserType="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher-dashboard/:username/ratings" 
          element={
            <ProtectedRoute requiredUserType="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher-dashboard/:username/comments" 
          element={
            <ProtectedRoute requiredUserType="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher-dashboard/:username/videos" 
          element={
            <ProtectedRoute requiredUserType="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredUserType="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App
