import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import TeachersLayout from './QA_TeachersLayout';
import apiServiceDefault from '../../services/apiService';
import config from '../../config';

// Destructure the services from the default export
const { authService, apiRequest } = apiServiceDefault;

// API base URL from config
const API_URL = config.API_URL;

// Styled Components
const PageTitle = styled.h2`
  margin-bottom: 24px;
  color: #333333;
`;

const SearchAndFilterContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 2px rgba(255, 221, 201, 0.3);
  }
`;

const FilterSelect = styled.select`
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 2px rgba(255, 221, 201, 0.3);
  }
`;

const TeacherGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const TeacherCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid #FFDDC9;
  position: relative;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const TeacherName = styled.h3`
  margin: 0 0 10px 0;
  color: #333333;
  font-size: 18px;
`;

const TeacherInfo = styled.div`
  color: #666666;
  font-size: 14px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  
  i {
    margin-right: 8px;
    width: 16px;
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
`;

const EvaluationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 2px rgba(255, 221, 201, 0.3);
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 14px;
  margin-top: 5px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  min-height: 120px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 2px rgba(255, 221, 201, 0.3);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 2px rgba(255, 221, 201, 0.3);
  }
`;

const SubmitButton = styled.button`
  background: #FFDDC9;
  color: #333;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #FFD0B5;
  }
  
  &:disabled {
    background: #f0f0f0;
    color: #999;
    cursor: not-allowed;
  }
`;

const CriteriaSection = styled.div`
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
`;

const CriteriaTitle = styled.h4`
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
`;

const SubcategoryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 10px;
  border-radius: 4px;
  background-color: #f9f9f9;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const SubcategoryName = styled.h5`
  margin: 0;
  font-size: 14px;
  flex: 1;
  font-weight: 500;
  color: #444;
`;

const RatingGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
`;

const RatingButton = styled.button`
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  background: ${props => props.$active ? '#FFDDC9' : 'white'};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? '#FFD0B5' : '#f9f9f9'};
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-radius: 50%;
  border-top: 3px solid #FFDDC9;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: #666;
  font-size: 16px;
  margin-top: 10px;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 40px;
  background: #fff5f5;
  border: 1px solid #dc3545;
  border-radius: 8px;
  color: #dc3545;
  margin: 20px 0;
`;

const RetryButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  margin-top: 15px;
  cursor: pointer;
  
  &:hover {
    background: #c82333;
  }
`;

const RatingInput = styled.input`
  width: 70px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  margin-left: 15px;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 2px rgba(255, 221, 201, 0.3);
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    opacity: 1;
  }
`;

const RatingLabel = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
`;

const OverallRatingDisplay = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  background: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #FFDDC9;
  margin-bottom: 20px;
  text-align: center;
  
  span {
    font-size: 24px;
    color: #ff8c42;
  }
`;

const EvaluatedBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #dc3545;
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
`;

const RefreshButton = styled.button`
  background: #FFDDC9;
  color: #333;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
  
  &:hover {
    background: #FFD0B5;
  }
  
  &:disabled {
    background: #f0f0f0;
    color: #999;
    cursor: not-allowed;
  }
`;

const OnlineEvaluation = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [evaluationData, setEvaluationData] = useState({
    overallRating: 0,
    feedback: '',
    criteriaRatings: {},
    classCode: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Modify the fetchData function to better handle the data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting data fetch...');
      
      // Fetch teachers from API using apiService
      console.log('Fetching teachers...');
      const teachersData = await apiRequest(`${API_URL}/teachers-for-evaluation`);
      console.log('Teachers data:', teachersData);
      
      // Fetch evaluation counts for each teacher
      const evaluationCountsPromises = teachersData.map(async (teacher) => {
        try {
          const evaluations = await apiRequest(`${API_URL}/evaluations?teacher_id=${encodeURIComponent(teacher.email)}`);
          return {
            ...teacher,
            evaluation_count: evaluations.length,
            evaluations: evaluations,
            last_evaluation_date: evaluations.length > 0 ? 
              new Date(evaluations[0].created_at).getTime() / 1000 : null
          };
        } catch (error) {
          console.error(`Error fetching evaluations for ${teacher.email}:`, error);
          return {
            ...teacher,
            evaluation_count: 0,
            evaluations: []
          };
        }
      });
      
      // Fetch monthly evaluation status for each teacher
      const monthlyStatusPromises = teachersData.map(async (teacher) => {
        try {
          const gradeData = await apiRequest(`${API_URL}/teachers/${encodeURIComponent(teacher.email)}/grade`);
          return {
            ...teacher,
            already_evaluated_this_month: !gradeData.canEvaluate,
            grade_data: gradeData,
            has_grade: gradeData && gradeData.id ? true : false
          };
        } catch (error) {
          console.error(`Error fetching grade for ${teacher.email}:`, error);
          // Default to allowing evaluation if we can't get the grade data
          return {
            ...teacher,
            already_evaluated_this_month: false,
            grade_data: null,
            has_grade: false
          };
        }
      });
      
      // Wait for all promises to resolve
      const teachersWithCounts = await Promise.all(evaluationCountsPromises);
      const teachersWithMonthlyStatus = await Promise.all(monthlyStatusPromises);
      
      // Merge the results
      const enrichedTeachers = teachersData.map(teacher => {
        const withCounts = teachersWithCounts.find(t => t.email === teacher.email) || {
          ...teacher,
          evaluation_count: 0,
          evaluations: []
        };
        
        const withStatus = teachersWithMonthlyStatus.find(t => t.email === teacher.email) || {
          ...withCounts,
          already_evaluated_this_month: false,
          grade_data: null,
          has_grade: false
        };
        
        return {
          ...teacher,
          evaluation_count: withCounts.evaluation_count || 0,
          evaluations: withCounts.evaluations || [],
          last_evaluation_date: withCounts.last_evaluation_date,
          already_evaluated_this_month: withStatus.already_evaluated_this_month || false,
          grade_data: withStatus.grade_data,
          has_grade: withStatus.has_grade || false
        };
      });
      
      setTeachers(enrichedTeachers);
      setFilteredTeachers(enrichedTeachers);
      
      // Fetch QA templates from API
      console.log('Fetching QA templates...');
      const templatesData = await apiRequest(`${API_URL}/qa-templates`);
      console.log('Templates data:', templatesData);
      setTemplates(templatesData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      let errorMessage = error.message;
      
      // Add more context to common errors
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the server. Please check if the server is running.';
      } else if (error.message.includes('Unexpected token')) {
        errorMessage = 'The server returned an invalid response. Please check if the API endpoints are correctly configured.';
      }
      
      setError(errorMessage);
      toast.error(`Failed to load data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter teachers based on search term and filter value
  useEffect(() => {
    let filtered = [...teachers];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(teacher => 
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterValue === 'evaluated') {
      // Only show teachers who have actual evaluations in the evaluations table
      filtered = filtered.filter(teacher => teacher.evaluation_count > 0);
    } else if (filterValue === 'not-evaluated') {
      // Show teachers who have no evaluations in the evaluations table
      filtered = filtered.filter(teacher => teacher.evaluation_count === 0);
    } else if (filterValue === 'evaluated-this-month') {
      // Show teachers who have been evaluated this month
      filtered = filtered.filter(teacher => teacher.already_evaluated_this_month);
    }
    
    setFilteredTeachers(filtered);
  }, [searchTerm, filterValue, teachers]);

  const handleTeacherSelect = (teacher) => {
    // Check if the teacher has already been evaluated this month
    if (teacher.already_evaluated_this_month) {
      toast.warning(`${teacher.name} has already been evaluated this month. You can evaluate again on the 1st day of next month.`);
      // Still allow selection, but with a warning
    }
    
    setSelectedTeacher(teacher);
    setShowModal(true);
    // Reset evaluation data
    setEvaluationData({
      overallRating: 0,
      feedback: '',
      criteriaRatings: {},
      classCode: ''
    });
    setSelectedTemplate('');
  };

  const handleTemplateChange = (e) => {
    const templateId = parseInt(e.target.value);
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        // Parse categories and rating scale
        const categoriesData = typeof template.categories === 'string' 
          ? JSON.parse(template.categories) 
          : template.categories;
        
        const ratingScale = typeof template.rating_scale === 'string'
          ? JSON.parse(template.rating_scale)
          : template.rating_scale;

        // Initialize criteria ratings based on the categories structure
        const initialCriteriaRatings = {};
        
        if (Array.isArray(categoriesData)) {
          categoriesData.forEach(category => {
            if (category.subcategories) {
              category.subcategories.forEach(subcategory => {
                const criterionId = `${category.name}-${subcategory.name}`;
                initialCriteriaRatings[criterionId] = 0;
              });
            }
          });
        }
        
        setEvaluationData(prev => ({
          ...prev,
          criteriaRatings: initialCriteriaRatings,
          overallRating: 0
        }));
      }
    } else {
      // Reset if no template is selected
      setEvaluationData(prev => ({
        ...prev,
        criteriaRatings: {},
        overallRating: 0
      }));
    }
  };

  // Calculate overall rating based on criteria ratings
  useEffect(() => {
    if (Object.keys(evaluationData.criteriaRatings).length > 0) {
      const ratings = Object.values(evaluationData.criteriaRatings).filter(rating => rating > 0);
      if (ratings.length > 0) {
        // Get the template's max rating
        const template = templates.find(t => t.id === parseInt(selectedTemplate));
        if (!template) return;
        
        const ratingScale = typeof template.rating_scale === 'string'
          ? JSON.parse(template.rating_scale)
          : template.rating_scale;
        const maxRating = ratingScale ? ratingScale.max || 5 : 5;
        
        const sum = ratings.reduce((acc, curr) => acc + parseFloat(curr), 0);
        const average = sum / ratings.length;
        
        // Scale the average to be out of 5 if the template uses a different scale
        let scaledAverage = average;
        if (maxRating !== 5) {
          scaledAverage = (average / maxRating) * 5;
        }
        
        // Round to 1 decimal place
        const roundedAverage = Math.round(scaledAverage * 10) / 10;
    setEvaluationData(prev => ({
      ...prev,
          overallRating: roundedAverage
        }));
      } else {
        setEvaluationData(prev => ({
          ...prev,
          overallRating: 0
        }));
      }
    }
  }, [evaluationData.criteriaRatings, selectedTemplate, templates]);

  const handleRatingChange = (criterionId, value) => {
    // Convert the input value to a number and validate
    let rating = parseFloat(value);
    
    // Get the template's max rating
    const template = templates.find(t => t.id === parseInt(selectedTemplate));
    if (!template) return;
    
    const ratingScale = typeof template.rating_scale === 'string'
      ? JSON.parse(template.rating_scale)
      : template.rating_scale;
    const maxRating = ratingScale ? ratingScale.max || 5 : 5;
    
    // Ensure the rating is between 0 and the max rating
    if (rating < 0) rating = 0;
    if (rating > maxRating) rating = maxRating;
    
    setEvaluationData(prev => ({
      ...prev,
      criteriaRatings: {
        ...prev.criteriaRatings,
        [criterionId]: rating
      }
    }));
  };

  const handleFeedbackChange = (e) => {
    setEvaluationData(prev => ({
      ...prev,
      feedback: e.target.value
    }));
  };

  // Function to generate timestamp in required format
  const generateTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timezone = '+0800';

    return `${year}.${month}.${day}-${hours}.${minutes}${timezone}-`;
  };

  // Function to validate class code format
  const validateClassCode = (code) => {
    // Support both traditional formats and the new f1_free_date_time_teacher format
    const traditionalFormat = /^(?:[a-z]+|trial)_\d{6}_\d{4}(?:AM|PM)_[A-Za-z]+$/;
    const freeLessonFormat = /^f\d+_free_\d{6}_\d{4}(?:AM|PM)_[A-Za-z\.]+$/;
    
    return traditionalFormat.test(code) || freeLessonFormat.test(code);
  };

  // Function to determine the template ID based on class code prefix
  const getTemplateIdForClassCode = (classCode) => {
    if (!classCode) return null;
    
    // Extract the class code prefix (first part before underscore)
    let prefix = classCode;
    if (classCode.includes('_')) {
      prefix = classCode.split('_')[0].toLowerCase();
    } else {
      // Handle the case where only the prefix is entered
      prefix = classCode.toLowerCase();
    }

    // Map to template based on the prefix
    // INFORMAL SCHOOL EVALUATION
    if (['ng', 'n5', 'pk', 'ps', 'tp', 'tc'].includes(prefix)) {
      // Find the template with "INFORMAL SCHOOLING" in the name
      const informalTemplate = templates.find(t => 
        t.name && t.name.includes('INFORMAL SCHOOLING')
      );
      return informalTemplate ? informalTemplate.id : null;
    }
    
    // FORMAL SCHOOL EVALUATION
    else if (['kg', 'k1', 'ga', 'gs', 'g2', 'gb', 'g3', 'gd'].includes(prefix)) {
      // Find the template with "FORMAL SCHOOLING" in the name
      const formalTemplate = templates.find(t => 
        t.name && t.name.includes('FORMAL SCHOOLING')
      );
      return formalTemplate ? formalTemplate.id : null;
    }
    
    // TRIAL CLASS
    else if (['f1'].includes(prefix)) {
      // Find the template with "TRIAL CLASS" in the name
      const trialTemplate = templates.find(t => 
        t.name && t.name.includes('TRIAL CLASS')
      );
      return trialTemplate ? trialTemplate.id : null;
    }
    
    return null; // No matching template
  };

  const handleClassCodeChange = (e) => {
    const classCode = e.target.value;
    setEvaluationData(prev => ({
      ...prev,
      classCode: classCode
    }));
    
    // Auto-select template based on class code
    if (classCode && classCode.includes('_')) {
      const templateId = getTemplateIdForClassCode(classCode);
      if (templateId && !selectedTemplate) {
        setSelectedTemplate(templateId.toString());
        // Get template name for the toast message
        const template = templates.find(t => t.id === templateId);
        if (template) {
          toast.success(`Auto-selected template: ${template.name}`);
        }
        console.log(`Auto-selected template ID ${templateId} based on class code prefix`);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedTeacher || !selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    
    // Get the template details
    const template = templates.find(t => t.id === parseInt(selectedTemplate));
    if (!template) {
      toast.error('Selected template not found');
      return;
    }
    
    if (evaluationData.overallRating === 0) {
      toast.error('Please provide ratings for at least one criterion');
      return;
    }

    if (evaluationData.overallRating > 5) {
      toast.error('Overall rating cannot exceed 5');
      return;
    }

    if (!evaluationData.classCode) {
      toast.error('Please enter a class code');
      return;
    }

    if (!validateClassCode(evaluationData.classCode)) {
      toast.error('Invalid class code format. Please use format: ps_070424_1000AM_Apple, or f1_free_040325_0900AM_T.ALY');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Generate the filename with timestamp and class code
      const timestamp = generateTimestamp();
      const filename = `${timestamp}${evaluationData.classCode}.mp4`;

      // Convert criteria ratings to the expected format
      const responses = {
        evaluationComments: evaluationData.feedback || '',
      };

      // Add each criterion rating to the responses object
      Object.entries(evaluationData.criteriaRatings).forEach(([criterionId, rating]) => {
        responses[criterionId] = rating.toString();
      });
      
      // Get user information from authService
      const currentUser = await authService.getCurrentUser();
      const qaEvaluator = currentUser?.email || '';
      const qaEvaluatorName = qaEvaluator.split('@')[0] || '';
      
      // Create a payload that matches the structure in evaluations.json
      const evaluationPayload = {
        teacher_id: selectedTeacher.email,
        video_id: filename,  // Use the generated filename
        template_id: parseInt(selectedTemplate),
        responses: JSON.stringify(responses),
        overall_score: parseFloat(evaluationData.overallRating).toFixed(2),
        additional_comments: evaluationData.feedback || '',
        qa_evaluator: qaEvaluator,
        qa_evaluator_name: qaEvaluatorName
      };

      console.log('Submitting evaluation:', evaluationPayload);

      // Use apiService for the API call
      await apiRequest(`${API_URL}/evaluations`, {
        method: 'POST',
        body: JSON.stringify(evaluationPayload)
      });
      
      // Update teachers list after successful submission
      await fetchData();
      
      toast.success('Evaluation submitted successfully');
      setShowModal(false);
      
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast.error(error.message || 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTeacher(null);
  };

  return (
    <TeachersLayout activeView="onlineEvaluation">
      <PageTitle>Online Teacher Evaluation</PageTitle>
      
      {loading ? (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading teachers and templates...</LoadingText>
        </LoadingContainer>
      ) : error ? (
        <ErrorContainer>
          <div>Error loading data: {error}</div>
          <RetryButton onClick={fetchData}>
            Retry Loading
          </RetryButton>
        </ErrorContainer>
      ) : (
        <>
          <SearchAndFilterContainer>
            <SearchInput
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FilterSelect
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            >
              <option value="all">All Teachers</option>
              <option value="evaluated">Evaluated</option>
              <option value="not-evaluated">Not Evaluated</option>
              <option value="evaluated-this-month">Evaluated this month</option>
            </FilterSelect>
            <RefreshButton onClick={fetchData} disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Loading...
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt"></i> Refresh Data
                </>
              )}
            </RefreshButton>
          </SearchAndFilterContainer>

          {filteredTeachers.length === 0 ? (
            <NoResults>
              {searchTerm || filterValue !== 'all' 
                ? 'No teachers found matching your search criteria'
                : 'No teachers found in the database'}
            </NoResults>
          ) : (
            <TeacherGrid>
              {filteredTeachers.map(teacher => (
                <TeacherCard key={teacher.id} onClick={() => handleTeacherSelect(teacher)}>
                  {teacher.already_evaluated_this_month && (
                    <EvaluatedBadge>Evaluated this month</EvaluatedBadge>
                  )}
                  <TeacherName>{teacher.name}</TeacherName>
                  <TeacherInfo>
                    <i className="fas fa-envelope"></i> {teacher.email}
                  </TeacherInfo>
                  <TeacherInfo>
                    <i className="fas fa-clipboard-check"></i> 
                    {teacher.evaluation_count || 0} evaluations
                    {teacher.evaluation_count > 0 ? 
                      <span style={{ marginLeft: '5px', color: '#4CAF50' }}>(Evaluated)</span> : 
                      <span style={{ marginLeft: '5px', color: '#F44336' }}>(Not Evaluated)</span>}
                  </TeacherInfo>
                  {teacher.last_evaluation_date && (
                    <TeacherInfo>
                      <i className="fas fa-calendar-alt"></i> 
                      Last evaluated: {new Date(teacher.last_evaluation_date * 1000).toLocaleDateString()}
                    </TeacherInfo>
                  )}
                </TeacherCard>
              ))}
            </TeacherGrid>
          )}
        </>
      )}
      
      {showModal && selectedTeacher && (
        <EvaluationModal>
          <ModalContent>
            <CloseButton onClick={closeModal}>&times;</CloseButton>
            <h2>Evaluate {selectedTeacher.name}</h2>
            
            <FormGroup>
              <Label>Class Code</Label>
              <Input
                type="text"
                placeholder="e.g., ps_070424_1000AM_Apple or f1_free_040325_0900AM_T.ALY"
                value={evaluationData.classCode}
                onChange={handleClassCodeChange}
              />
              <ErrorMessage>
                Format: (e.g., ps_070424_1000AM_Apple, f1_free_DDMMYY_HHMMAMPM_T.NAME)
              </ErrorMessage>
            </FormGroup>

            <FormGroup>
              <Label>Select Evaluation Template</Label>
              <Select 
                value={selectedTemplate} 
                onChange={handleTemplateChange}
              >
                <option value="">-- Select a template --</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </Select>
            </FormGroup>
            
            {selectedTemplate && (
              <>
                {(() => {
                  const template = templates.find(t => t.id === parseInt(selectedTemplate));
                  if (!template) return null;

                  const categoriesData = typeof template.categories === 'string'
                    ? JSON.parse(template.categories)
                    : template.categories;

                  const ratingScale = typeof template.rating_scale === 'string'
                    ? JSON.parse(template.rating_scale)
                    : template.rating_scale;

                  const maxRating = ratingScale ? ratingScale.max || 5 : 5;

                  return Array.isArray(categoriesData) && categoriesData.map(category => (
                    <React.Fragment key={category.name}>
                      <CriteriaSection>
                        <CriteriaTitle>{category.name}</CriteriaTitle>
                        {category.subcategories && category.subcategories.map(subcategory => {
                          const criterionId = `${category.name}-${subcategory.name}`;
                          return (
                            <SubcategoryRow key={criterionId}>
                              <SubcategoryName>{subcategory.name}</SubcategoryName>
                              <RatingInput
                                type="number"
                                min="0"
                                max={maxRating}
                                step="0.1"
                                value={evaluationData.criteriaRatings[criterionId] || ''}
                                onChange={(e) => handleRatingChange(criterionId, e.target.value)}
                                placeholder={`0-${maxRating}`}
                              />
                            </SubcategoryRow>
                          );
                        })}
                      </CriteriaSection>
                    </React.Fragment>
                  ));
                })()}
                
                <CriteriaSection>
                  <CriteriaTitle>Overall Rating</CriteriaTitle>
                  <OverallRatingDisplay>
                    Overall Rating: <span>{evaluationData.overallRating ? evaluationData.overallRating.toFixed(1) : '0.0'}</span> / 5
                  </OverallRatingDisplay>
                </CriteriaSection>
                
                <FormGroup>
                  <Label>Feedback & Comments</Label>
                  <TextArea
                    value={evaluationData.feedback}
                    onChange={handleFeedbackChange}
                    placeholder="Provide detailed feedback for the teacher..."
                  />
                </FormGroup>
                
                <SubmitButton 
                  onClick={handleSubmit} 
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Evaluation'}
                </SubmitButton>
              </>
            )}
          </ModalContent>
        </EvaluationModal>
      )}
    </TeachersLayout>
  );
};

export default OnlineEvaluation; 