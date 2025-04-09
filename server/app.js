// Import existing route handlers
const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teachers');
const recordingsRoutes = require('./routes/recordings');
const adminRoutes = require('./routes/admin');
const markerRoutes = require('./routes/markers');
// Add the new route handler
const teacherGradesRoutes = require('./routes/teacherGrades');

// Register route handlers
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/recordings', recordingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/markers', markerRoutes);
// Register the new route handler
app.use('/api/teacher-grades', teacherGradesRoutes); 