import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import TeachersLayout from './QA_TeachersLayout';
import { toast } from 'react-hot-toast';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import apiServiceDefault from '../../services/apiService';
import config from '../../config';

// Destructure the services from the default export
const { migrateToSecureApiCall, apiRequest, authService } = apiServiceDefault;

// API base URL from config
const API_URL = config.API_URL;

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

// Styled components for this view
const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #333333;
  margin: 0 0 24px 0;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #FFDDC9;
  
  h3 {
    font-size: 16px;
    color: #666666;
    margin: 0 0 10px 0;
  }
  
  .value {
    font-size: 28px;
    font-weight: 600;
    color: #333333;
  }
`;

const ChartContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  
  h3 {
    font-size: 18px;
    color: #333333;
    margin: 0 0 20px 0;
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  width: 100%;
  table-layout: fixed;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 80px minmax(200px, 1fr) minmax(150px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr);
  grid-gap: 0;
  background: #FFF8F3;
  padding: 12px 16px;
  font-weight: 600;
  color: #333333;
  border-bottom: 1px solid #EEEEEE;
  
  div {
    display: flex;
    align-items: center;
    padding: 0 10px;
    box-sizing: border-box;
  }
  
  div:nth-child(1) {
    justify-content: center;
    text-align: center;
    padding: 0;
  }
  
  div:nth-child(2) {
    justify-content: flex-start;
  }
  
  div:nth-child(3) {
    justify-content: flex-start;
  }
  
  div:nth-child(4) {
    justify-content: center;
    text-align: center;
  }
  
  div:nth-child(5) {
    justify-content: center;
    text-align: center;
  }
  
  .recordings-header {
    justify-content: center;
    text-align: center;
    width: 100%;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 80px minmax(200px, 1fr) minmax(150px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr);
  grid-gap: 0;
  padding: 12px 16px;
  border-bottom: 1px solid #EEEEEE;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #FFF0E6;
  }
  
  div {
    padding: 0 10px;
    box-sizing: border-box;
  }
  
  div:nth-child(1) {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
  }
  
  div:nth-child(2) {
    display: flex;
    align-items: center;
  }
  
  div:nth-child(3) {
    display: flex;
    align-items: center;
  }
  
  div:nth-child(4) {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-weight: 500;
  }
  
  div:nth-child(5) {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .recordings-count {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
  
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
`;

const RankBadge = styled.span`
  background: ${props => {
    if (props.$rank === 1) return '#FFD700';
    if (props.$rank === 2) return '#C0C0C0';
    if (props.$rank === 3) return '#CD7F32';
    return '#FFDDC9';
  }};
  color: #333333;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  display: inline-block;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 18px;
  color: #666;
`;

const GradeDisplay = styled.div`
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  color: ${props => props.$clickable ? '#0066cc' : 'inherit'};
  text-decoration: ${props => props.$clickable ? 'underline' : 'none'};
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    color: ${props => props.$clickable ? '#004499' : 'inherit'};
  }
  
  i {
    font-size: 14px;
  }
`;

const StartEvaluationButton = styled.button`
  background-color: #FF9F40;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #F08C2F;
  }
  
  i {
    font-size: 16px;
  }
`;

const RecordingsInfo = styled.div`
  position: relative;
  display: inline-block;
  
  &:hover .tooltip {
    visibility: visible;
    opacity: 1;
  }
`;

const CustomTooltip = styled.div`
  visibility: hidden;
  width: 200px;
  background-color: #333;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
  
  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
`;

const GradeStatusIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    font-size: 18px;
  }
  
  .graded {
    color: #4CAF50;
  }
  
  .not-graded {
    color: #F44336;
  }
  
  .partially-graded {
    color: #FF9800;
  }
`;

const StatusLegend = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;
  justify-content: center;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666666;
  
  i {
    font-size: 14px;
  }
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: #0066cc;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 102, 204, 0.1);
  }
  
  i {
    font-size: 14px;
  }
`;

// New styled components for analytics
const AnalyticsSection = styled.div`
  margin-bottom: 30px;
`;

const AnalyticsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const AnalyticsTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #333333;
  margin: 0;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  color: #666666;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: white;
  font-size: 14px;
  color: #333;
  
  &:focus {
    outline: none;
    border-color: #FF9F40;
  }
`;

const TimelineChartContainer = styled(ChartContainer)`
  height: 350px;
`;

// Helper function to generate consistent colors for teachers
const getRandomColor = (seed) => {
  // Simple hash function to generate a number from a string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to RGB
  const r = (hash & 0xFF) % 200 + 55; // Avoid too dark colors
  const g = ((hash >> 8) & 0xFF) % 200 + 55;
  const b = ((hash >> 16) & 0xFF) % 200 + 55;
  
  return `rgba(${r}, ${g}, ${b}, 1)`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [teacherStats, setTeacherStats] = useState({
    totalTeachers: 0,
    totalRecordings: 0,
    averageGrade: 0
  });
  const [teacherRankings, setTeacherRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New state variables for time-based analytics
  const [historicalGradeData, setHistoricalGradeData] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('6months');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [timeRangeOptions] = useState([
    { value: '1month', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: 'all', label: 'All Time' }
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  // New useEffect to fetch historical data when time range or selected teacher changes
  useEffect(() => {
    if (teacherRankings.length > 0) {
      fetchHistoricalGradeData();
    }
  }, [selectedTimeRange, selectedTeacher, teacherRankings]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching teachers data...');
      // Fetch teachers using apiService
      const teachersData = await apiRequest(`${API_URL}/teachers`);
      
      console.log(`Retrieved ${teachersData.length} teachers`);
      
      // Count total recordings from all teachers
      const actualTotalRecordings = teachersData.reduce((sum, teacher) => {
        // Check if teacher has recordings array and add its length
        return sum + (teacher.recordings?.length || 0);
      }, 0);
      
      console.log(`Total actual recordings across all teachers: ${actualTotalRecordings}`);
      
      console.log('Fetching teacher grades data...');
      // Fetch teacher grades from the database using apiService
      const gradesData = await apiRequest(`${API_URL}/teacher-grades`);
      
      console.log(`Retrieved ${gradesData.length} grade records:`, gradesData);
      
      // Process and combine the data
      const teachersWithGrades = teachersData.map(teacher => {
        // Find all grades for this teacher
        const teacherGrades = gradesData.filter(grade => 
          grade.teacher_id === teacher.email || 
          grade.teacher_id === teacher.id
        );
        
        console.log(`Teacher ${teacher.email} has ${teacherGrades.length} grades and ${teacher.recordings?.length || 0} recordings`);
        
        // Calculate average grade if teacher has grades
        const gradeSum = teacherGrades.reduce((sum, grade) => {
          const gradeValue = parseFloat(grade.grade);
          return sum + (isNaN(gradeValue) ? 0 : gradeValue);
        }, 0);
        const averageGrade = teacherGrades.length > 0 ? gradeSum / teacherGrades.length : 0;
        
        return {
          ...teacher,
          name: teacher.name || extractUsername(teacher.email) || 'Unknown Teacher',
          grade: Math.round(averageGrade * 100) / 100, // Round to 2 decimal places
          recordingsCount: teacher.recordings?.length || 0, // Use actual recordings count
          gradedRecordingsCount: teacherGrades.length // Keep track of graded recordings separately
        };
      });
      
      // Sort teachers by grade for rankings
      const sortedTeachers = [...teachersWithGrades]
        .sort((a, b) => b.grade - a.grade);
      
      console.log('Processed teacher rankings:', sortedTeachers);
      
      // Calculate stats
      const totalTeachers = sortedTeachers.length;
      const totalRecordings = actualTotalRecordings; // Use the actual total recordings count
      
      // Calculate average grade only for teachers who have grades
      const teachersWithValidGrades = sortedTeachers.filter(teacher => teacher.grade > 0);
      const averageGrade = teachersWithValidGrades.length > 0 
        ? teachersWithValidGrades.reduce((sum, teacher) => sum + teacher.grade, 0) / teachersWithValidGrades.length 
        : 0;
      
      setTeacherStats({
        totalTeachers,
        totalRecordings,
        averageGrade: averageGrade.toFixed(1)
      });
      
      setTeacherRankings(sortedTeachers);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      toast.error(`Failed to fetch dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch historical grade data for time-based analytics
  const fetchHistoricalGradeData = async () => {
    try {
      console.log('Fetching historical grade data...');
      
      // Fetch teacher grades with timestamps from the database using apiService
      let gradesData = await apiRequest(`${API_URL}/teacher-grades-history`);
      
      console.log(`Retrieved ${gradesData.length} historical grade records:`, gradesData);
      
      // Filter data based on selected time range
      const now = new Date();
      let startDate = new Date();
      
      switch (selectedTimeRange) {
        case '1month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
        default:
          startDate = new Date(0); // Beginning of time
          break;
      }
      
      // Filter by date range
      gradesData = gradesData.filter(grade => {
        const gradeDate = new Date(grade.timestamp || grade.created_at || grade.date);
        return gradeDate >= startDate;
      });
      
      // Filter by selected teacher if not 'all'
      if (selectedTeacher !== 'all') {
        gradesData = gradesData.filter(grade => 
          grade.teacher_id === selectedTeacher || 
          grade.email === selectedTeacher
        );
      }
      
      // Sort by date
      gradesData.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.created_at || a.date);
        const dateB = new Date(b.timestamp || b.created_at || b.date);
        return dateA - dateB;
      });
      
      setHistoricalGradeData(gradesData);
      
    } catch (error) {
      console.error('Error fetching historical grade data:', error);
      toast.error(`Failed to fetch historical grade data: ${error.message}`);
    }
  };

  // Extract username from email (reusing from TeacherList)
  const extractUsername = (email) => {
    if (!email) return '';
    
    const emailParts = email.split('@')[0];
    
    if (emailParts.startsWith('t.')) {
      return emailParts.substring(2);
    } else {
      return emailParts;
    }
  };

  // Handle click on "Not graded" to navigate to teacher recordings
  const handleGradeClick = (teacher) => {
    if (teacher.grade <= 0) {
      // Navigate to teacher recordings page for evaluation
      const encodedEmail = encodeURIComponent(teacher.email);
      console.log(`Navigating to recordings for teacher: ${teacher.name} (${encodedEmail})`);
      navigate(`/teachers/recordings/${encodedEmail}`);
      toast.success(`Navigating to ${teacher.name}'s recordings for evaluation`);
    }
  };

  // Handle click to view teacher insights
  const handleViewInsights = (teacher) => {
    const encodedEmail = encodeURIComponent(teacher.email);
    console.log(`Navigating to insights for teacher: ${teacher.name} (${encodedEmail})`);
    navigate(`/teachers/insights/${encodedEmail}`);
  };

  // Prepare chart data
  const gradeDistributionData = useMemo(() => {
    const gradeRanges = {
      'Excellent (4.5-5.0)': 0,
      'Good (4.0-4.4)': 0,
      'Average (3.0-3.9)': 0,
      'Below Average (<3.0)': 0,
      'Not Graded': 0
    };
    
    teacherRankings.forEach(teacher => {
      if (teacher.grade <= 0) gradeRanges['Not Graded']++;
      else if (teacher.grade >= 4.5) gradeRanges['Excellent (4.5-5.0)']++;
      else if (teacher.grade >= 4.0) gradeRanges['Good (4.0-4.4)']++;
      else if (teacher.grade >= 3.0) gradeRanges['Average (3.0-3.9)']++;
      else gradeRanges['Below Average (<3.0)']++;
    });
    
    return {
      labels: Object.keys(gradeRanges),
      datasets: [
        {
          label: 'Number of Teachers',
          data: Object.values(gradeRanges),
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(200, 200, 200, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(200, 200, 200, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  }, [teacherRankings]);

  const recordingsPerTeacherData = useMemo(() => {
    // Get top 5 teachers by recordings count
    const topTeachers = [...teacherRankings]
      .sort((a, b) => b.recordingsCount - a.recordingsCount)
      .slice(0, 5);
    
    // If we have fewer than 5 teachers with recordings, add teachers with 0 recordings
    if (topTeachers.length < 5) {
      const teachersWithNoRecordings = teacherRankings
        .filter(teacher => teacher.recordingsCount === 0)
        .slice(0, 5 - topTeachers.length);
      
      topTeachers.push(...teachersWithNoRecordings);
    }
    
    return {
      labels: topTeachers.map(teacher => teacher.name),
      datasets: [
        {
          label: 'Total Recordings',
          data: topTeachers.map(teacher => teacher.recordingsCount),
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1
        },
        {
          label: 'Graded Recordings',
          data: topTeachers.map(teacher => teacher.gradedRecordingsCount),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };
  }, [teacherRankings]);

  // Process historical grade data for time-based charts
  const performanceTrendsData = useMemo(() => {
    if (historicalGradeData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Group data by time periods (weeks or months depending on the selected range)
    const groupedData = {};
    const teacherData = {};
    
    // Determine if we should group by week, month, or quarter based on time range
    let groupingFormat;
    if (selectedTimeRange === '1month') {
      groupingFormat = 'MM/dd'; // Month/Day for 1 month view
    } else if (selectedTimeRange === '3months') {
      groupingFormat = 'MM/dd'; // Month/Day for 3 month view
    } else {
      groupingFormat = 'yyyy-MM'; // Year-Month for longer periods
    }
    
    // Group data by time period and teacher
    historicalGradeData.forEach(grade => {
      const date = new Date(grade.timestamp || grade.created_at || grade.date);
      const teacherId = grade.teacher_id || grade.email;
      const teacherName = teacherRankings.find(t => t.email === teacherId)?.name || extractUsername(teacherId) || teacherId;
      const gradeValue = parseFloat(grade.grade);
      
      if (isNaN(gradeValue)) return;
      
      // Format date based on grouping
      let periodKey;
      if (groupingFormat === 'MM/dd') {
        periodKey = `${date.getMonth() + 1}/${date.getDate()}`;
      } else {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      // Initialize period if not exists
      if (!groupedData[periodKey]) {
        groupedData[periodKey] = {
          sum: 0,
          count: 0,
          teachers: {}
        };
      }
      
      // Add to overall average
      groupedData[periodKey].sum += gradeValue;
      groupedData[periodKey].count += 1;
      
      // Add to teacher-specific data
      if (!groupedData[periodKey].teachers[teacherId]) {
        groupedData[periodKey].teachers[teacherId] = {
          sum: 0,
          count: 0,
          name: teacherName
        };
      }
      
      groupedData[periodKey].teachers[teacherId].sum += gradeValue;
      groupedData[periodKey].teachers[teacherId].count += 1;
      
      // Track unique teachers for individual lines
      if (!teacherData[teacherId]) {
        teacherData[teacherId] = {
          name: teacherName,
          color: getRandomColor(teacherId)
        };
      }
    });
    
    // Sort periods chronologically
    const sortedPeriods = Object.keys(groupedData).sort((a, b) => {
      if (groupingFormat === 'MM/dd') {
        // For MM/dd format, we need to handle the year boundary
        const [monthA, dayA] = a.split('/').map(Number);
        const [monthB, dayB] = b.split('/').map(Number);
        return (monthA * 100 + dayA) - (monthB * 100 + dayB);
      }
      return a.localeCompare(b);
    });
    
    // Prepare dataset for overall average
    const overallDataset = {
      label: 'Overall Average',
      data: sortedPeriods.map(period => {
        const { sum, count } = groupedData[period];
        return count > 0 ? Math.round((sum / count) * 100) / 100 : null;
      }),
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderWidth: 2,
      tension: 0.3,
      fill: false
    };
    
    // Prepare datasets for individual teachers (if not filtering to a specific teacher)
    const teacherDatasets = [];
    
    if (selectedTeacher === 'all') {
      // Get top 5 teachers by average grade
      const topTeachers = Object.keys(teacherData)
        .map(teacherId => {
          const teacherGrades = historicalGradeData.filter(g => g.teacher_id === teacherId || g.email === teacherId);
          const sum = teacherGrades.reduce((acc, g) => acc + parseFloat(g.grade || 0), 0);
          const avg = teacherGrades.length > 0 ? sum / teacherGrades.length : 0;
          return { teacherId, avg };
        })
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5)
        .map(t => t.teacherId);
      
      // Create datasets for top teachers
      topTeachers.forEach(teacherId => {
        const dataset = {
          label: teacherData[teacherId].name,
          data: sortedPeriods.map(period => {
            const teacherInPeriod = groupedData[period].teachers[teacherId];
            return teacherInPeriod && teacherInPeriod.count > 0 
              ? Math.round((teacherInPeriod.sum / teacherInPeriod.count) * 100) / 100 
              : null;
          }),
          borderColor: teacherData[teacherId].color,
          backgroundColor: teacherData[teacherId].color.replace('1)', '0.1)'),
          borderWidth: 2,
          tension: 0.3,
          fill: false
        };
        teacherDatasets.push(dataset);
      });
    } else {
      // Create dataset for selected teacher
      const teacherId = selectedTeacher;
      if (teacherData[teacherId]) {
        const dataset = {
          label: teacherData[teacherId].name,
          data: sortedPeriods.map(period => {
            const teacherInPeriod = groupedData[period].teachers[teacherId];
            return teacherInPeriod && teacherInPeriod.count > 0 
              ? Math.round((teacherInPeriod.sum / teacherInPeriod.count) * 100) / 100 
              : null;
          }),
          borderColor: teacherData[teacherId].color,
          backgroundColor: teacherData[teacherId].color.replace('1)', '0.1)'),
          borderWidth: 2,
          tension: 0.3,
          fill: false
        };
        teacherDatasets.push(dataset);
      }
    }
    
    return {
      labels: sortedPeriods,
      datasets: [overallDataset, ...teacherDatasets]
    };
  }, [historicalGradeData, selectedTimeRange, selectedTeacher, teacherRankings]);

  // Process data for progress tracking chart
  const progressTrackingData = useMemo(() => {
    if (historicalGradeData.length === 0 || selectedTeacher === 'all') {
      return {
        labels: [],
        datasets: []
      };
    }
    
    // For progress tracking, we want to show individual recordings for a specific teacher
    const teacherGrades = historicalGradeData.filter(grade => 
      grade.teacher_id === selectedTeacher || grade.email === selectedTeacher
    );
    
    if (teacherGrades.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    // Sort by date
    teacherGrades.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.created_at || a.date);
      const dateB = new Date(b.timestamp || b.created_at || b.date);
      return dateA - dateB;
    });
    
    // Format dates for display
    const labels = teacherGrades.map(grade => {
      const date = new Date(grade.timestamp || grade.created_at || grade.date);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    });
    
    // Extract grades
    const grades = teacherGrades.map(grade => parseFloat(grade.grade));
    
    // Calculate moving average (last 3 grades)
    const movingAvg = [];
    for (let i = 0; i < grades.length; i++) {
      if (i < 2) {
        // Not enough data for 3-point average
        movingAvg.push(null);
      } else {
        const avg = (grades[i] + grades[i-1] + grades[i-2]) / 3;
        movingAvg.push(Math.round(avg * 100) / 100);
      }
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Individual Grades',
          data: grades,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.1,
          fill: false
        },
        {
          label: '3-Point Moving Average',
          data: movingAvg,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderWidth: 2,
          pointRadius: 0,
          borderDash: [5, 5],
          tension: 0.4,
          fill: false
        }
      ]
    };
  }, [historicalGradeData, selectedTeacher]);

  if (loading) return (
    <TeachersLayout activeView="dashboard">
      <LoadingSpinner>Loading dashboard data...</LoadingSpinner>
    </TeachersLayout>
  );
  
  if (error) return (
    <TeachersLayout activeView="dashboard">
      <div>Error: {error}</div>
    </TeachersLayout>
  );

  return (
    <TeachersLayout activeView="dashboard">
      <PageTitle>Teacher Performance Dashboard</PageTitle>
      
      {teacherRankings.length > 0 ? (
        <>
          <DashboardGrid>
            <StatCard>
              <h3>Total Teachers</h3>
              <div className="value">{teacherStats.totalTeachers}</div>
            </StatCard>
            
            <StatCard>
              <h3>Total Recordings</h3>
              <div className="value">{teacherStats.totalRecordings}</div>
            </StatCard>
            
            <StatCard>
              <h3>Average Grade</h3>
              <div className="value">{teacherStats.averageGrade}/5.0</div>
            </StatCard>
          </DashboardGrid>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <ChartContainer>
              <h3>Grade Distribution</h3>
              <div style={{ height: '250px' }}>
                <Pie 
                  data={gradeDistributionData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </ChartContainer>
            
            <ChartContainer>
              <h3>Top 5 Teachers by Recordings</h3>
              <div style={{ height: '250px' }}>
                <Bar 
                  data={recordingsPerTeacherData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top'
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            return `${label}: ${value}`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Teacher'
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Number of Recordings'
                        },
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </ChartContainer>
          </div>
          
          {/* New Advanced Analytics Section */}
          <AnalyticsSection>
            <AnalyticsHeader>
              <AnalyticsTitle>Advanced Analytics & Performance Trends</AnalyticsTitle>
              <FilterContainer>
                <FilterLabel>Time Range:</FilterLabel>
                <FilterSelect 
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                >
                  {timeRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FilterSelect>
                
                <FilterLabel>Teacher:</FilterLabel>
                <FilterSelect 
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                  <option value="all">All Teachers</option>
                  {teacherRankings.map(teacher => (
                    <option key={teacher.email} value={teacher.email}>
                      {teacher.name}
                    </option>
                  ))}
                </FilterSelect>
              </FilterContainer>
            </AnalyticsHeader>
            
            <TimelineChartContainer>
              <h3>Performance Trends Over Time</h3>
              <div style={{ height: '300px' }}>
                <Line 
                  data={performanceTrendsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top'
                      },
                      tooltip: {
                        callbacks: {
                          title: function(context) {
                            return context[0].label;
                          },
                          label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}/5.0`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: selectedTimeRange === '1month' || selectedTimeRange === '3months' 
                            ? 'Date (Month/Day)' 
                            : 'Month'
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Average Grade'
                        },
                        min: 0,
                        max: 5,
                        ticks: {
                          stepSize: 1
                        }
                      }
                    }
                  }}
                />
              </div>
            </TimelineChartContainer>
            
            {selectedTeacher !== 'all' && (
              <TimelineChartContainer>
                <h3>Individual Progress Tracking</h3>
                <div style={{ height: '300px' }}>
                  <Line 
                    data={progressTrackingData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top'
                        },
                        tooltip: {
                          callbacks: {
                            title: function(context) {
                              return context[0].label;
                            },
                            label: function(context) {
                              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}/5.0`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Recording Date'
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Grade'
                          },
                          min: 0,
                          max: 5,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }}
                  />
                </div>
                <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                  <p>
                    <strong>Individual Progress Analysis:</strong> This chart shows individual grades for each recording and a 3-point moving average trend line to help identify improvement patterns over time.
                  </p>
                </div>
              </TimelineChartContainer>
            )}
          </AnalyticsSection>
          
          <ChartContainer>
            <h3>Teacher Rankings</h3>
            <TableContainer>
              <TableHeader>
                <div>Rank</div>
                <div>Teacher Name</div>
                <div>Grade</div>
                <div className="recordings-header">Recordings</div>
                <div>Grading Status</div>
              </TableHeader>
              
              {teacherRankings.map((teacher, index) => (
                <TableRow key={teacher.email}>
                  <div>
                    <RankBadge $rank={index + 1}>#{index + 1}</RankBadge>
                  </div>
                  <div>{teacher.name}</div>
                  <div>
                    <GradeDisplay 
                      $clickable={teacher.grade <= 0} 
                      onClick={() => handleGradeClick(teacher)}
                      title={teacher.grade <= 0 ? "Click to evaluate this teacher" : ""}
                    >
                      {teacher.grade > 0 ? `${teacher.grade.toFixed(2)}/5.0` : (
                        <>
                          Not graded
                          <i className="fas fa-external-link-alt"></i>
                        </>
                      )}
                    </GradeDisplay>
                  </div>
                  <div className="recordings-count">{teacher.recordingsCount}</div>
                  <div>
                    {teacher.gradedRecordingsCount > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <GradeStatusIndicator>
                          <i className="fas fa-check-circle graded" title={`${teacher.gradedRecordingsCount} recordings graded`}></i>
                        </GradeStatusIndicator>
                        <ActionButton 
                          onClick={() => handleViewInsights(teacher)}
                          title="View detailed performance insights"
                        >
                          <i className="fas fa-chart-line"></i>
                          Insights
                        </ActionButton>
                      </div>
                    ) : teacher.recordingsCount > 0 ? (
                      <RecordingsInfo>
                        <GradeStatusIndicator>
                          <i className="fas fa-times-circle not-graded" title="No recordings graded yet"></i>
                        </GradeStatusIndicator>
                        <CustomTooltip className="tooltip">
                          Click "Not graded" to start evaluating this teacher's recordings
                        </CustomTooltip>
                      </RecordingsInfo>
                    ) : (
                      <GradeStatusIndicator>
                        <i className="fas fa-minus-circle" title="No recordings available"></i>
                      </GradeStatusIndicator>
                    )}
                  </div>
                </TableRow>
              ))}
            </TableContainer>
            
            <StatusLegend>
              <LegendItem>
                <i className="fas fa-check-circle" style={{ color: '#4CAF50' }}></i>
                <span>Has graded recordings</span>
              </LegendItem>
              <LegendItem>
                <i className="fas fa-times-circle" style={{ color: '#F44336' }}></i>
                <span>Needs grading (click "Not graded")</span>
              </LegendItem>
              <LegendItem>
                <i className="fas fa-minus-circle" style={{ color: '#757575' }}></i>
                <span>No recordings available</span>
              </LegendItem>
            </StatusLegend>
          </ChartContainer>
        </>
      ) : (
        <ChartContainer>
          <h3>No Teacher Grades Available</h3>
          <p style={{ padding: '20px', textAlign: 'center' }}>
            There are no teacher grades available in the database yet. 
            Once teachers have been evaluated, their performance data will appear here.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <StartEvaluationButton onClick={() => navigate('/teachers')}>
              <i className="fas fa-clipboard-check"></i>
              Start Evaluating Teachers
            </StartEvaluationButton>
          </div>
        </ChartContainer>
      )}
    </TeachersLayout>
  );
};

export default Dashboard; 