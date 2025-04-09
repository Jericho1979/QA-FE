import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import TeachersLayout from './QA_TeachersLayout';
import { toast } from 'react-hot-toast';
import apiServiceDefault from '../../services/apiService';
import QA_VideoMarker from './QA_VideoMarker';
import config from '../../config';

// Destructure the services from the default export
const { 
  apiRequest, 
  paginatedService, 
  getVideoPlaybackUrl, 
  getVideoDownloadUrl 
} = apiServiceDefault;

// API base URL from config
const API_URL = config.API_URL;

// Styled components for this view
const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #333333;
  margin: 0 0 24px 0;
`;

const VideoContainer = styled.div`
  width: 100%;
  max-height: 70vh;
  position: relative;
  padding-top: 56.25%;
  margin-bottom: 24px;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`;

const PlayerWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const StyledReactPlayer = styled(ReactPlayer)`
  position: absolute;
  top: 0;
  left: 0;
`;

const RecordingDetailsContainer = styled.div`
  background: #FFF8F3;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  
  i {
    width: 24px;
    margin-right: 10px;
    color: #666666;
  }
  
  strong {
    width: 150px;
    color: #333333;
  }
`;

const FileDetails = styled.span`
  word-break: break-all;
  color: #666666;
`;

const DownloadButton = styled.button`
  background: #FFDDC9;
  color: #333333;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #FFD0B5;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  i {
    font-size: 16px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #333333;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  
  i {
    color: #FFDDC9;
    font-size: 18px;
  }
`;

const CommentSection = styled.div`
  margin-top: 24px;
`;

const CommentCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${props => props.isExpanded ? '12px' : '0'};
  padding-bottom: ${props => props.isExpanded ? '12px' : '0'};
  border-bottom: ${props => props.isExpanded ? '1px solid #EEEEEE' : 'none'};
`;

const CommentAuthor = styled.div`
  font-weight: 500;
  color: #333333;
  display: flex;
  align-items: center;
  gap: 8px;
  
  i {
    color: #FFDDC9;
  }
`;

const CommentDate = styled.div`
  color: #999999;
  font-size: 12px;
`;

const CommentContent = styled.div`
  display: ${props => props.isExpanded ? 'block' : 'none'};
  margin-top: 12px;
  white-space: pre-wrap;
  color: #333333;
  line-height: 1.5;
`;

const CommentToggle = styled.button`
  background: none;
  border: none;
  color: #666666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 14px;
  margin-top: 8px;
  
  i {
    transition: transform 0.2s ease;
    transform: ${props => props.isExpanded ? 'rotate(90deg)' : 'rotate(0)'};
  }
  
  &:hover {
    color: #333333;
  }
`;

const BackButton = styled.button`
  background: #FFDDC9;
  color: #333333;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #FFD0B5;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  i {
    font-size: 16px;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2em;
  color: #666666;
`;

// Add these styled components for the evaluation form
const EvaluationFormContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border-top: 4px solid #FFDDC9;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 15px;
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 3px rgba(255, 221, 201, 0.2);
  }
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 3px rgba(255, 221, 201, 0.2);
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-height: 100px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 3px rgba(255, 221, 201, 0.2);
  }
`;

const FormCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px;
  
  input {
    margin-right: 10px;
  }
  
  label {
    font-size: 14px;
    cursor: pointer;
  }
`;

const SubmitButton = styled.button`
  background: #FFDDC9;
  color: #333333;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #FFD0B5;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    background: #f5f5f5;
    color: #999;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  i {
    font-size: 16px;
  }
`;

const CategoryCard = styled.div`
  background: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid #eee;
`;

const CategoryTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #333;
`;

const SubcategoryItem = styled.div`
  margin-bottom: 15px;
  padding-left: 15px;
  border-left: 3px solid #FFDDC9;
`;

const SubcategoryName = styled.div`
  flex: 1;
  font-size: 14px;
  color: #555;
`;

const RatingInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  input {
    width: 80px;
    text-align: center;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .rating-labels {
    flex: 1;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #666;
  }
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
`;

const Tab = styled.button`
  padding: 10px 20px;
  background: ${props => props.$active ? '#FFDDC9' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#FFDDC9' : 'transparent'};
  cursor: pointer;
  font-weight: ${props => props.$active ? '600' : '400'};
  color: #333;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active ? '#FFDDC9' : '#f5f5f5'};
  }
`;

// Add these styled components for the evaluation form
const CategorySection = styled.div`
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const CategoryHeader = styled.div`
  background-color: #FFDDC9;
  color: #333;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 16px;
  border-bottom: 1px solid #e0e0e0;
`;

const SubcategoryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background-color: white;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f9f9f9;
  }
`;

const RatingInput = styled.input`
  width: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  
  &:focus {
    border-color: #FFDDC9;
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 221, 201, 0.3);
  }
`;

const ClassBadge = styled.span`
  background: #FFDDC9;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 16px;
  margin-right: 10px;
  color: #333;
`;

// Add the styled components after the existing styled components
const CommentRepliesSection = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ddd;
`;

const CommentRepliesHeader = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #4a6fa5;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
  
  i {
    font-size: 14px;
    color: #4a6fa5;
  }
`;

const CommentReplyItem = styled.div`
  padding: 8px;
  border-radius: 6px;
  background-color: ${props => props.$isQA ? '#f3f7ff' : '#fff0e6'};
  margin-bottom: 8px;
  border-left: 3px solid ${props => props.$isQA ? '#4a6fa5' : '#f6a935'};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CommentReplyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const CommentReplyAuthor = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 5px;
  
  i {
    color: #4a6fa5;
    font-size: 12px;
  }
`;

const CommentReplyDate = styled.div`
  font-size: 11px;
  color: #999;
`;

const CommentReplyText = styled.div`
  font-size: 13px;
  color: #333;
  line-height: 1.4;
`;

const CommentReplyForm = styled.div`
  margin-top: 10px;
  border-top: 1px solid #eee;
  padding-top: 10px;
`;

const CommentReplyTextarea = styled.textarea`
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  min-height: 60px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #4a6fa5;
    box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.2);
  }
`;

const CommentReplyActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
`;

const CommentReplyButton = styled.button`
  background: #4a6fa5;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #3d5d8a;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CommentReplyCancelButton = styled.button`
  background: #f1f1f1;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #e5e5e5;
  }
`;

const CommentReplyTrigger = styled.button`
  background: none;
  border: none;
  color: ${props => props.disabled ? '#999' : '#4a6fa5'};
  font-size: 13px;
  padding: 0;
  margin-top: 10px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: ${props => props.disabled ? 0.7 : 1};
  
  i {
    font-size: 11px;
  }
  
  &:hover:not(:disabled) {
    color: #333;
    text-decoration: underline;
  }
`;

const LoadingIndicator = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
`;

const NoDataMessage = styled.div`
  padding: 30px;
  text-align: center;
  color: #666;
  font-style: italic;
`;

const ScrollableContent = styled.div`
  max-height: 600px;
  overflow-y: auto;
  padding-right: 10px;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
`;

const TabHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
`;

const TabTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  color: #333;
`;

const TabContent = styled.div`
  margin-top: 15px;
`;

// Add these new styled components at the end of the file before the export
const ConversationContainer = styled.div`
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 8px;
  margin-top: 8px;
`;

const ConversationLimitMessage = styled.div`
  background-color: #fff4e5;
  color: #805b36;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 4px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  
  i {
    color: #f6a935;
  }
`;

// Extract username from email
const extractUsername = (email) => {
  if (!email) return 'Unknown User';
  
  // If it doesn't look like an email, it might already be a name
  if (!email.includes('@')) return email;
  
  // Extract username from email
  const username = email.split('@')[0];
  
  // Format username (remove dots, capitalize first letter of each word)
  return username
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const RecordingDetails = () => {
  const { teacherId, recordingId } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [comments, setComments] = useState([]);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [commentReplies, setCommentReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTab, setShowTab] = useState('markers'); // Default to markers tab
  
  // Add these state variables for evaluation
  const [feedbackType, setFeedbackType] = useState('evaluation');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [evaluationTemplates, setEvaluationTemplates] = useState([]);
  const [responses, setResponses] = useState({});
  const [evaluators, setEvaluators] = useState([]);
  // Add a ref to track if component is mounted
  const isMounted = useRef(true);
  // Add a new useState for loading evaluations
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef(null);
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await fetchRecordingData();
      // Fetch templates and evaluators in parallel
      await Promise.all([
        fetchEvaluationTemplates(),
        fetchEvaluators()
      ]);
    };

    loadData();

    // Set up auto-refresh for conversation threads
    const refreshInterval = setInterval(() => {
      if (isMounted.current) {
        // Refresh the evaluation history which includes conversation threads
        fetchEvaluationHistory();
      }
    }, 10000); // Check for new replies every 10 seconds

    // Clean up on unmount
    return () => {
      isMounted.current = false;
      clearInterval(refreshInterval);
    };
  }, [teacherId, recordingId]);

  // Auto-select template based on class code when recording data and templates are loaded
  useEffect(() => {
    if (recording && evaluationTemplates.length > 0 && !selectedTemplate) {
      // Extract class code from recording
      let classCode = recording.classCode || recording.fullClassName;
      
      // If no class code is available directly, try to extract from filename
      if (!classCode && (recording.name || recording.fileName)) {
        const filename = recording.name || recording.fileName;
        // Extract class code from filename pattern like f1_free_040725_1000AM_T.ALY.mp4 or ps_070424_1000AM_Apple.mp4
        const match = filename.match(/(\w+)_(?:free_)?(\d{6})_\d{4}(?:AM|PM)/);
        if (match && match[1]) {
          classCode = match[1];
          console.log(`Extracted class code "${classCode}" from filename`);
        }
      }
      
      if (classCode) {
        const template = getTemplateForClassCode(classCode);
        if (template) {
          toast.success(`Auto-selected template: ${template.name} based on class code`);
          console.log(`Auto-selected template: ${template.name} based on class code: ${classCode}`);
          setSelectedTemplate(template);
        }
      }
    }
  }, [recording, evaluationTemplates]);

  // Add a useEffect that depends on recording to load evaluation history
  useEffect(() => {
    if (recording) {
      fetchEvaluationHistory();
    }
  }, [recording]);

  const fetchRecordingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const decodedTeacherId = decodeURIComponent(teacherId);
      console.log('Fetching teacher data for:', decodedTeacherId);
      
      // Fetch teacher details - this should include recordings
      const teacherData = await apiRequest(`${API_URL}/teachers/${decodedTeacherId}`);
      console.log('Fetched teacher data:', teacherData);
      
      if (!teacherData) {
        throw new Error('No teacher data returned from API');
      }
      
      setTeacher(teacherData);
      
      // Get the decoded recording ID
      const decodedRecordingId = decodeURIComponent(recordingId);
      console.log('Looking for recording with ID:', decodedRecordingId);
      
      let foundRecording = null;
      
      // First try to find the recording in the teacher's recordings array (should be there if /api/teachers/:id is used)
      if (teacherData.recordings && Array.isArray(teacherData.recordings) && teacherData.recordings.length > 0) {
        console.log('Looking for recording in teacher data recordings array');
        
        foundRecording = teacherData.recordings.find(rec => 
          rec.id === decodedRecordingId || 
          rec.name === decodedRecordingId || 
          rec.fileName === decodedRecordingId
        );
        
        if (foundRecording) {
          console.log('Found recording in teacher data:', foundRecording);
        } else {
          console.log('Recording not found in teacher data, will try paginated search');
        }
      }
      
      // If not found in teacher data, use paginated search
      if (!foundRecording) {
        console.log('Using paginated search to find recording');
        
        // Try to find the recording using the paginated service - might need to fetch multiple pages
        foundRecording = await findRecordingWithPagination(decodedTeacherId, decodedRecordingId);
      }
      
      if (foundRecording) {
        // Process the recording for display
        const processedRecording = {
          id: recordingId,
          title: foundRecording.name,
          date: new Date(foundRecording.date),
          // Use apiService to get the direct path without /api prefix
          path: getVideoPlaybackUrl(teacherData.email, foundRecording.fileName, foundRecording.fileId),
          // Use apiService for download URL too
          downloadUrl: getVideoDownloadUrl(teacherData.email, foundRecording.fileName, foundRecording.fileId),
          fullClassName: foundRecording.classCode || 'Unknown Class',
          // Add fileName and fileId to make them available to other functions
          fileName: foundRecording.fileName,
          fileId: foundRecording.fileId
        };
        console.log('Generated video path:', processedRecording.path);
        console.log('Generated download URL:', processedRecording.downloadUrl);
        
        // Set the recording first, then fetch evaluations
        setRecording(processedRecording);
        
        // Wait a brief moment to ensure recording state is updated
        setTimeout(() => {
          // Fetch evaluations after recording is set
          fetchEvaluationHistory();
        }, 100);
      } else {
        console.error('Recording not found:', decodedRecordingId);
        throw new Error(`Recording not found: ${decodedRecordingId}`);
      }
      
    } catch (error) {
      console.error('Error fetching recording data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to find a recording using pagination
  const findRecordingWithPagination = async (teacherId, recordingId) => {
    let foundRecording = null;
    let nextPageToken = null;
    const pageSize = 50; // Use a reasonable page size
    
    do {
      try {
        console.log(`Fetching recordings page with token: ${nextPageToken || 'none'}`);
        const recordingsResponse = await paginatedService.getTeacherRecordingsPaginated(
          teacherId, 
          pageSize, 
          nextPageToken
        );
        
        if (!recordingsResponse || !recordingsResponse.items) {
          console.error('Invalid response format from recordings API');
          break;
        }
        
        // Look for matching recording in this page
        foundRecording = recordingsResponse.items.find(rec => 
          rec.id === recordingId || 
          rec.name === recordingId || 
          rec.fileName === recordingId
        );
        
        if (foundRecording) {
          console.log('Found recording in current page:', foundRecording);
          break;
        }
        
        // If not found and there are more pages, continue
        nextPageToken = recordingsResponse.nextPageToken;
        
        // Add a small delay to avoid rate limiting
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (pageError) {
        console.error('Error fetching recordings page:', pageError);
        break;
      }
    } while (nextPageToken);
    
    return foundRecording;
  };

  const fetchEvaluationTemplates = async () => {
    try {
      const data = await apiRequest(`${API_URL}/evaluation-templates`);
      console.log('Fetched templates:', data);
      
      if (!Array.isArray(data)) {
        console.warn('API did not return an array for templates:', data);
        setEvaluationTemplates([]);
        return;
      }
      
      // Process templates to ensure they have the necessary properties
      const processedTemplates = data.map(template => ({
        ...template,
        id: template.id,
        name: template.name || 'Unnamed Template',
        categories: typeof template.categories === 'string' 
          ? JSON.parse(template.categories) 
          : template.categories || [],
        ratingScale: typeof template.rating_scale === 'string' 
          ? JSON.parse(template.rating_scale) 
          : template.rating_scale || {
              min: 1,
              max: 5,
              allowDecimals: true,
              labels: []
            }
      }));
      
      setEvaluationTemplates(processedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch evaluation templates');
      setEvaluationTemplates([]); // Set empty array on error
    }
  };

  const fetchEvaluators = async () => {
    try {
      setEvaluators([]);
      
      // Get the current user from the API using the correct endpoint
      try {
        const authCheckData = await apiRequest(`${API_URL}/auth/check`);
        const currentUserData = authCheckData?.user || null;
        const currentUserEmail = currentUserData?.email;
        const currentUserName = currentUserData?.name || extractUsername(currentUserEmail);
        
        // Create a default evaluator list with the current user
        const defaultEvaluators = [];
        
        if (currentUserEmail) {
          defaultEvaluators.push({
            id: 'current-user',
            email: currentUserEmail,
            name: currentUserName,
            user_type: 'qa',
            displayName: currentUserName
          });
        }
        
        // Try to get all QA users from the new dedicated endpoint
        try {
          const data = await apiRequest(`${API_URL}/qa-users`);
          console.log('Fetched QA evaluators successfully:', data);
          
          // If we got data and it includes the current user, use that
          if (data && data.length > 0) {
            setEvaluators(data);
            return;
          }
          
          // Otherwise, fall back to using just the current user
          console.log('Using current user as evaluator:', defaultEvaluators);
          setEvaluators(defaultEvaluators);
          return;
        } catch (fetchError) {
          console.warn(`Couldn't fetch QA users:`, fetchError);
          // If we couldn't fetch QA users, use the default evaluators
          console.log('Using default evaluators list as fallback:', defaultEvaluators);
          setEvaluators(defaultEvaluators);
          return;
        }
      } catch (userError) {
        console.warn('Error getting current user, will try generic fallback:', userError.message);
      }
      
      // If we get here, getting the current user failed
      // Final fallback - create a generic evaluator
      console.log('Using generic fallback evaluator');
      setEvaluators([{
        id: 'current-user',
        email: 'qa@rhet-corp.com',
        name: 'QA Evaluator',
        user_type: 'qa',
        displayName: 'QA Evaluator'
      }]);
    } catch (error) {
      console.error('Failed to fetch evaluators:', error.message);
      
      // Final fallback - just use an empty array
      setEvaluators([]);
    }
  };

  const toggleExpand = (index) => {
    setExpandedComments(prev => {
      const newState = { ...prev };
      newState[index] = !newState[index];
      return newState;
    });
  };

  const handleBackToRecordings = () => {
    navigate(`/teachers/recordings/${encodeURIComponent(teacherId)}`);
  };

  // Function to determine the template ID based on class code prefix
  const getTemplateForClassCode = (classCode) => {
    if (!classCode || !evaluationTemplates.length) return null;
    
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
      return evaluationTemplates.find(t => 
        t.name && t.name.includes('INFORMAL SCHOOLING')
      );
    }
    
    // FORMAL SCHOOL EVALUATION
    else if (['kg', 'k1', 'ga', 'gs', 'g2', 'gb', 'g3', 'gd'].includes(prefix)) {
      // Find the template with "FORMAL SCHOOLING" in the name
      return evaluationTemplates.find(t => 
        t.name && t.name.includes('FORMAL SCHOOLING')
      );
    }
    
    // TRIAL CLASS
    else if (['f1'].includes(prefix)) {
      // Find the template with "TRIAL CLASS" in the name
      return evaluationTemplates.find(t => 
        t.name && t.name.includes('TRIAL CLASS')
      );
    }
    
    return null; // No matching template
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    const template = evaluationTemplates.find(t => t.id === parseInt(templateId));
    setSelectedTemplate(template);
    console.log('Selected template:', template);
  };

  const calculateOverallScore = () => {
    if (!selectedTemplate || Object.keys(responses).length === 0) {
      return 0;
    }
    
    let totalScore = 0;
    let totalWeight = 0;
    
    try {
      const categories = selectedTemplate.categories || [];
      const maxRating = selectedTemplate.ratingScale?.max || 5;
      const minRating = selectedTemplate.ratingScale?.min || 1;
      
      categories.forEach(category => {
        category.subcategories.forEach(subcategory => {
          const responseKey = `${category.name}-${subcategory.name}`;
          if (responses[responseKey]) {
            // Get the raw rating
            const rating = parseFloat(responses[responseKey]);
            
            // Normalize the rating to a 0-1 scale based on the template's min/max
            const normalizedRating = (rating - minRating) / (maxRating - minRating);
            
            // Apply the weight to the normalized rating
            const weightedScore = normalizedRating * subcategory.weight;
            
            totalScore += weightedScore;
            totalWeight += subcategory.weight;
          }
        });
      });
      
      if (totalWeight === 0) return 0;
      
      // Calculate the final score as a weighted average on a 0-1 scale
      const normalizedFinalScore = (totalScore / totalWeight);
      
      // Convert the 0-1 scale to a 1-5 scale
      const finalScore = (normalizedFinalScore * 4) + 1;
      
      // Format to 2 decimal places
      return finalScore.toFixed(2);
    } catch (error) {
      console.error('Error calculating score:', error);
      return 0;
    }
  };

  const handleSubmitEvaluation = async () => {
    try {
      setSubmittingReply(true);
      
      // Validate required fields
      if (!selectedTemplate) {
        toast.error('Please select a template');
        setSubmittingReply(false);
        return;
      }
      
      if (Object.keys(responses).length === 0) {
        toast.error('Please complete the evaluation form');
        setSubmittingReply(false);
        return;
      }
      
      // Make sure we have comments
      if (!responses.evaluationComments) {
        toast.error('Please add comments to your evaluation');
        setSubmittingReply(false);
        return;
      }
      
      // Calculate overall score
      const overallScore = calculateOverallScore();
      
      // Get the current user using the API
      let qaEvaluator = '';
      let qaEvaluatorName = '';
      
      try {
        const authCheckData = await apiRequest(`${API_URL}/auth/check`);
        const currentUser = authCheckData?.user || null;
        qaEvaluator = currentUser?.email || '';
        qaEvaluatorName = currentUser?.name || extractUsername(qaEvaluator);
      } catch (userError) {
        console.error('Error getting current user:', userError);
        // If we can't get the current user, use a default evaluator name
        qaEvaluator = 'qa@rhet-corp.com';
        qaEvaluatorName = 'QA Evaluator';
      }
      
      // Make sure we have valid recording ID
      const videoId = recording.id || recording.name || recording.fileName;
      if (!videoId) {
        toast.error('Invalid recording ID');
        setSubmittingReply(false);
        return;
      }
      
      // Prepare the evaluation data
      const evaluationData = {
        teacher_id: decodeURIComponent(teacherId),
        video_id: videoId,
        template_id: selectedTemplate.id,
        responses: responses,
        overall_score: overallScore,
        additional_comments: responses.evaluationComments,
        qa_evaluator: qaEvaluator,
        qa_evaluator_name: qaEvaluatorName,
        type: 'recording',
        date: new Date().toISOString(),
        videoName: recording.name || recording.fileName,
        comment: responses.evaluationComments,
        grade: overallScore
      };
      
      console.log('Submitting evaluation:', evaluationData);
      console.log('Teacher ID being sent:', evaluationData.teacher_id);
      
      // Send the evaluation data to the server using secure API call
      const result = await apiRequest(`${API_URL}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(evaluationData)
      });
      
      console.log('Evaluation submitted successfully:', result);
      
      // Show success message
      toast.success('Evaluation submitted successfully!');
      
      // Reset form
      setResponses({});
      setSelectedTemplate(null);
      
      // Refresh comments
      fetchRecordingData();
      
      // Navigate back to recordings after a short delay
      setTimeout(() => {
        handleBackToRecordings();
      }, 1500);
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSubmittingReply(false);
    }
  };
  
  const handleRatingChange = (category, subcategory, value) => {
    if (!selectedTemplate) return;
    
    const key = `${category}-${subcategory}`;
    const minRating = selectedTemplate.ratingScale?.min || 1;
    const maxRating = selectedTemplate.ratingScale?.max || 5;
    const allowDecimals = selectedTemplate.ratingScale?.allowDecimals || false;
    
    // Parse the input value
    let numValue = parseFloat(value);
    
    // Validate the input
    if (isNaN(numValue)) {
      // If not a number, clear the input
      setResponses(prev => ({
        ...prev,
        [key]: ''
      }));
      return;
    }
    
    // Enforce min/max constraints
    if (numValue < minRating) numValue = minRating;
    if (numValue > maxRating) numValue = maxRating;
    
    // Round to nearest decimal if decimals not allowed
    if (!allowDecimals) {
      numValue = Math.round(numValue);
    }
    
    // Update the responses state
    setResponses(prev => ({
      ...prev,
      [key]: numValue.toString()
    }));
  };

  // Modify the fetchEvaluationHistory function to include replies directly
  const fetchEvaluationHistory = async () => {
    if (!recording) return;
    
    // Don't show loading indicator when refreshing, only on initial load
    const isInitialLoad = commentsLoading;
    if (isInitialLoad) {
      setCommentsLoading(true);
    }
    
    try {
      // Get the video ID - try multiple properties to ensure we have the right one
      const videoId = recording.videoId || recording.id || recording.name || recording.fileName;
      
      if (!videoId) {
        console.error("No valid video ID found for fetching evaluation history");
        return;
      }
      
      console.log('Fetching evaluation history for video:', videoId);
      
      // Create a direct API endpoint that returns evaluations with their replies
      try {
        const data = await apiRequest(`${API_URL}/evaluations-with-replies/${encodeURIComponent(videoId)}`);
        console.log('Evaluation history with replies:', data);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.log('No evaluation history found');
          setComments([]);
          if (isInitialLoad) setCommentsLoading(false);
          return;
        }
        
        // Check for any new teacher replies to show notifications
        if (!isInitialLoad) {
          let newRepliesFound = false;
          
          for (const evaluation of data) {
            if (evaluation.replies && evaluation.replies.length > 0) {
              const currentEvalReplies = commentReplies[evaluation.id] || [];
              
              const newTeacherReplies = evaluation.replies.filter(
                reply => reply.reply_type === 'teacher' && 
                  !currentEvalReplies.some(existingReply => existingReply.id === reply.id)
              );
              
              if (newTeacherReplies.length > 0) {
                newRepliesFound = true;
                break;
              }
            }
          }
          
          if (newRepliesFound) {
            toast('New teacher replies received!', { icon: '💬' });
          }
        }
        
        // Process and set the comments
        setComments(data);
        
        // Update the commentReplies state with the replies for each evaluation
        const replyMap = {};
        data.forEach(evaluation => {
          if (evaluation.replies && evaluation.replies.length > 0) {
            replyMap[evaluation.id] = evaluation.replies;
          }
        });
        
        setCommentReplies(replyMap);
      } catch (newEndpointError) {
        console.log('New endpoint not available, using old method:', newEndpointError);
        await fetchEvaluationHistoryLegacy(videoId, isInitialLoad);
      }
    } catch (error) {
      console.error('Error fetching evaluation history:', error);
      setComments([]);
    } finally {
      if (isInitialLoad) {
        setCommentsLoading(false);
      }
    }
  };
  
  // Legacy method as fallback
  const fetchEvaluationHistoryLegacy = async (videoId, isInitialLoad) => {
    try {
      console.log('Using legacy fetch method for video ID:', videoId);
      
      // Use apiRequest instead of direct fetch
      const data = await apiRequest(`${API_URL}/evaluations/history/${encodeURIComponent(videoId)}`);
      console.log('Fetched legacy evaluation history:', data);
      
      if (!data || !Array.isArray(data)) {
        console.warn('Unexpected data format from legacy endpoint:', data);
        return;
      }
      
      // Fetch replies for each evaluation that has comments
      const evaluationsWithComments = data.filter(
        evaluation => evaluation.additional_comments && evaluation.additional_comments.trim()
      );
      
      console.log(`Found ${evaluationsWithComments.length} evaluations with comments`);
      
      // Create an object to store replies
      const repliesMap = {};
      let newRepliesFound = false;
      
      // Process and add replies for each evaluation
      for (const evaluationId of evaluationsWithComments) {
        try {
          console.log(`Fetching replies for evaluation: ${evaluationId}`);
          
          // Use apiRequest instead of direct fetch
          const repliesData = await apiRequest(`${API_URL}/comment-replies/${evaluationId}`);
          console.log(`Found ${repliesData.length} replies for evaluation ${evaluationId}:`, repliesData);
          
          if (repliesData && repliesData.length > 0) {
            // Store replies with consistent ID format
            repliesMap[evaluationId] = repliesData;
            
            // Check if we have any new teacher replies
            const currentReplies = commentReplies[evaluationId] || [];
            const newTeacherReplies = repliesData.filter(
              (reply) => 
                reply.reply_type === 'teacher' && 
                !currentReplies.some(existingReply => existingReply.id === reply.id)
            );
            
            if (newTeacherReplies.length > 0 && !isInitialLoad) {
              console.log(`Found ${newTeacherReplies.length} new teacher replies:`, newTeacherReplies);
              newRepliesFound = true;
            }
          }
        } catch (replyError) {
          console.error(`Error fetching replies for evaluation ${evaluationId}:`, replyError);
        }
      }
      
      // Show a notification if new teacher replies were found
      if (newRepliesFound) {
        toast.success("New teacher replies have been received!", {
          icon: "🔔",
          duration: 3000,
        });
      }
      
      console.log('Final replies map:', repliesMap);
      setCommentReplies(repliesMap);
      setComments(data);
    } catch (error) {
      console.error('Error fetching evaluation history (legacy):', error);
      if (isInitialLoad) {
        toast.error(`Failed to load comments: ${error.message}`);
      }
    }
  };

  // Update the handleSubmitReply function to provide better feedback and handle both API versions
  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please enter a comment before submitting');
      return;
    }
    
    if (submittingReply) {
      return; // Prevent multiple submissions
    }
    
    try {
      setSubmittingReply(true);
      
      // Get the current user's information using authService
      const currentUser = await apiRequest(`${API_URL}/auth/check`);
      const userEmail = currentUser?.user?.email || '';
        
      if (!userEmail) {
        toast.error('User information not available. Please log in again.');
        setSubmittingReply(false);
        return;
      }
      
      const userName = extractUsername(userEmail);
      console.log(`Submitting reply as ${userName} (${userEmail})`);
      
      toast.loading('Submitting reply...', { id: 'replyToast' });
      
      // Use apiService.apiRequest instead of direct fetch
      const newReply = await apiRequest(`${API_URL}/comment-reply`, {
        method: 'POST',
        body: JSON.stringify({
          evaluationId: replyingTo,
          replyText,
          replyBy: userEmail,
          replyType: 'qa'
        })
      });
      
      console.log('Reply submitted successfully:', newReply);
      
      // Update the comments state to add the reply directly to the comment
      setComments(prevComments => {
        return prevComments.map(comment => {
          // First normalize the comment ID
          const commentId = comment.id ? 
            (typeof comment.id === 'string' ? parseInt(comment.id, 10) : comment.id) : null;
          
          // If this is the comment we're replying to
          if (commentId === replyingTo) {
            // If the comment already has replies property
            if (comment.replies) {
              return {
                ...comment,
                replies: [...comment.replies, newReply]
              };
            } 
            // If it doesn't, add the new replies property
            else {
              return {
                ...comment,
                replies: [newReply]
              };
            }
          }
          return comment;
        });
      });
      
      // Also update the commentReplies state for backward compatibility
      setCommentReplies(prev => ({
        ...prev,
        [replyingTo]: [...(prev[replyingTo] || []), newReply]
      }));
      
      // Reset the reply form
      setReplyText('');
      setReplyingTo(null);
      
      toast.dismiss('replyToast');
      toast.success('Reply submitted successfully!');
      
      // Refresh all comments and replies to ensure everything is up to date
      setTimeout(() => {
        fetchEvaluationHistory();
      }, 1000);
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.dismiss('replyToast');
      toast.error(`Failed to submit reply: ${error.message}`);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Update the handleVideoReady function
  const handleVideoReady = () => {
    console.log('Video is ready to play');
    console.log('Player reference:', playerRef?.current);
    setIsPlayerReady(true);
  };
  
  const handleProgress = (state) => {
    // You can use this to track playback progress if needed
  };
  
  const handleDuration = (duration) => {
    setDuration(duration);
  };

  if (loading) return (
    <TeachersLayout activeView="teacherList">
      <LoadingSpinner>Loading...</LoadingSpinner>
    </TeachersLayout>
  );
  
  if (error) return (
    <TeachersLayout activeView="teacherList">
      <div style={{ 
        background: '#fff0f0', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #ffcccc'
      }}>
        <h3 style={{ color: '#cc0000', marginTop: 0 }}>Error: {error}</h3>
        <p>There was a problem fetching the recording data. Please try again later.</p>
      </div>
      <BackButton onClick={handleBackToRecordings}>
        <i className="fas fa-arrow-left"></i> Back to Recordings
      </BackButton>
    </TeachersLayout>
  );

  return (
    <TeachersLayout activeView="teacherList">
      <PageTitle>
        {recording && recording.classCode && (
          <ClassBadge>{recording.classCode}</ClassBadge>
        )}
        {teacher?.name} Video Recording
      </PageTitle>
      
      {recording && (
        <>
          <VideoContainer>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              <ReactPlayer
                ref={playerRef}
                url={recording.path}
                width="100%"
                height="100%"
                controls={true}
                playing={isPlaying}
                onReady={handleVideoReady}
                onProgress={handleProgress}
                onDuration={handleDuration}
                onError={(e) => {
                  console.error('Video playback error:', e);
                  console.log('Failed URL:', recording.path);
                }}
                config={{
                  file: {
                    forceVideo: true,
                    attributes: {
                      controlsList: 'nodownload'
                    }
                  }
                }}
              />
            </div>
          </VideoContainer>
          
          <RecordingDetailsContainer>
            <DetailItem>
              <i className="fas fa-file-video"></i>
              <strong>File Name:</strong> 
              <span>{recording.name || recording.fileName || 'Unknown'}</span>
            </DetailItem>
            <DetailItem>
              <i className="fas fa-chalkboard"></i>
              <strong>Class:</strong> 
              <span>{recording.fullClassName || recording.classCode || 'Unknown Class'}</span>
            </DetailItem>
            <DetailItem>
              <i className="fas fa-user-tie"></i>
              <strong>Teacher:</strong> 
              <span>{teacher?.name || 'Unknown'}</span>
            </DetailItem>
            <DetailItem>
              <i className="fas fa-envelope"></i>
              <strong>Email:</strong> 
              <span>{teacher?.email || 'Unknown'}</span>
            </DetailItem>
            <DetailItem>
              <i className="fas fa-calendar-alt"></i>
              <strong>Recording Date:</strong> 
              <span>
                {recording.recordingDate ? 
                  new Date(recording.recordingDate).toLocaleDateString() : 
                  (recording.date ? new Date(recording.date).toLocaleDateString() : 'Unknown')}
              </span>
            </DetailItem>
            <DetailItem>
              <i className="fas fa-clock"></i>
              <strong>Recording Time:</strong> 
              <span>
                {recording.recordingTime || (() => {
                  // Try to extract time from the filename and convert to 12-hour format
                  if (recording.name) {
                    // Try to extract time from the format YYYY.MM.DD-HH.MM
                    const timeMatch = recording.name.match(/\d{4}\.\d{2}\.\d{2}-(\d{2})\.(\d{2})/);
                    if (timeMatch) {
                      const hours = parseInt(timeMatch[1]);
                      const minutes = timeMatch[2];
                      const ampm = hours >= 12 ? 'PM' : 'AM';
                      const hours12 = hours % 12 || 12; // Convert 0 to 12
                      return `${hours12}:${minutes} ${ampm}`;
                    }
                    
                    // Try to extract time from AM/PM format
                    const ampmMatch = recording.name.match(/(\d{2})(\d{2})([AP]M)/);
                    if (ampmMatch) {
                      return `${ampmMatch[1]}:${ampmMatch[2]} ${ampmMatch[3]}`;
                    }
                  }
                  
                  return 'Unknown';
                })()}
              </span>
            </DetailItem>
            <DownloadButton onClick={() => window.open(recording.downloadUrl || recording.path, '_blank')}>
              <i className="fas fa-download"></i> Download Video
            </DownloadButton>
          </RecordingDetailsContainer>
          
          {/* Add tab buttons for switching between evaluation, history, and markers */}
          <TabContainer>
            <Tab 
              $active={showTab === 'evaluation'} 
              onClick={() => setShowTab('evaluation')}
            >
              Submit Evaluation
            </Tab>
            <Tab 
              $active={showTab === 'history'} 
              onClick={() => setShowTab('history')}
            >
              Evaluation History
            </Tab>
            <Tab 
              $active={showTab === 'markers'} 
              onClick={() => setShowTab('markers')}
            >
              Video Markers
            </Tab>
          </TabContainer>
          
          {/* Show evaluation form or history based on active tab */}
          {showTab === 'evaluation' && (
            <EvaluationFormContainer>
              <SectionTitle>
                <i className="fas fa-clipboard-check"></i>
                Submit Evaluation
              </SectionTitle>
              
              <FormGroup>
                <FormLabel>Select Evaluation Template</FormLabel>
                <FormSelect
                  value={selectedTemplate?.id || ''}
                  onChange={handleTemplateChange}
                  disabled={submittingReply}
                >
                  <option value="">Select a template...</option>
                  {evaluationTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </FormSelect>
              </FormGroup>
              
              {selectedTemplate && (
                <div>
                  <h3>Evaluation Form</h3>
                  
                  <div style={{ 
                    background: '#f8f8f8', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    fontSize: '14px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
                      Rating Scale: 1 to {selectedTemplate.ratingScale?.max || 5}
                      {selectedTemplate.ratingScale?.allowDecimals && ' (decimal values allowed)'}
                    </p>
                    
                    {selectedTemplate.ratingScale?.labels && selectedTemplate.ratingScale.labels.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedTemplate.ratingScale.labels.map((label, index) => (
                          <div key={index} style={{ 
                            background: '#fff', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: '13px'
                          }}>
                            <strong>{label.value}:</strong> {label.label}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: '0', color: '#666' }}>
                        Higher values indicate better performance.
                      </p>
                    )}
                  </div>
                  
                  {selectedTemplate.categories.map(category => (
                    <CategorySection key={category.name}>
                      <CategoryHeader>{category.name}</CategoryHeader>
                      {category.subcategories.map(subcategory => (
                        <SubcategoryRow key={subcategory.name}>
                          <SubcategoryName>
                            {subcategory.name} ({subcategory.weight}%)
                          </SubcategoryName>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RatingInput
                              type="number"
                              min={selectedTemplate.ratingScale?.min || 1}
                              max={selectedTemplate.ratingScale?.max || 5}
                              step={selectedTemplate.ratingScale?.allowDecimals ? 0.1 : 1}
                              value={responses[`${category.name}-${subcategory.name}`] || ''}
                              onChange={(e) => handleRatingChange(category.name, subcategory.name, e.target.value)}
                              placeholder="Rating"
                            />
                            <span style={{ color: '#666', fontSize: '13px', whiteSpace: 'nowrap' }}>
                              / {selectedTemplate.ratingScale?.max || 5}
                            </span>
                          </div>
                        </SubcategoryRow>
                      ))}
                    </CategorySection>
                  ))}
                  
                  <div style={{
                    marginTop: '20px',
                    padding: '10px 15px',
                    background: '#f5f5f5',
                    borderRadius: '5px',
                    color: '#333',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Overall Score: {calculateOverallScore()} / 5</span>
                    <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#666' }}>
                      (Normalized to 1-5 scale)
                    </span>
                  </div>
                </div>
              )}
              
              <FormGroup>
                <FormLabel>
                  Evaluation Comments
                  <span style={{ fontWeight: 'normal', fontSize: '13px', marginLeft: '8px' }}>
                    (Visible to teacher)
                  </span>
                </FormLabel>
                <FormTextarea 
                  value={responses['evaluationComments'] || ''}
                  onChange={(e) => setResponses({
                    ...responses,
                    evaluationComments: e.target.value
                  })}
                  placeholder="Enter your comments for the teacher..."
                />
              </FormGroup>
              
              <SubmitButton 
                onClick={handleSubmitEvaluation}
                disabled={submittingReply}
              >
                <i className="fas fa-paper-plane"></i>
                {submittingReply ? 'Submitting...' : 'Submit Evaluation'}
              </SubmitButton>
            </EvaluationFormContainer>
          )}
          
          {/* Show video markers when markers tab is active */}
          {showTab === 'markers' && recording && (
            <div>
              {!isPlayerReady && (
                <div style={{ 
                  padding: '20px', 
                  background: '#fff8e1', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  border: '1px solid #ffe082'
                }}>
                  <p style={{ margin: 0 }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
                    Initializing video player for markers...
                  </p>
                </div>
              )}
              <QA_VideoMarker
                videoRef={playerRef}
                recordingId={recordingId}
                teacherId={teacher?.email}
                onMarkerSelect={(marker) => {
                  // Set player to marker start time and begin playing
                  if (playerRef.current) {
                    console.log('Seeking to timestamp:', marker.start_time);
                    playerRef.current.seekTo(marker.start_time, 'seconds');
                    setIsPlaying(true);
                  }
                }}
              />
            </div>
          )}
          
          {showTab === 'history' && (
            <>
              <TabHeader>
                <TabTitle>Evaluation History</TabTitle>
              </TabHeader>
              <TabContent>
                {commentsLoading ? (
                  <LoadingIndicator>Loading evaluation history...</LoadingIndicator>
                ) : comments.length === 0 ? (
                  <NoDataMessage>No evaluation history available for this recording.</NoDataMessage>
                ) : (
                  <ScrollableContent>
                    {comments.map((comment, index) => (
                      <CommentCard key={index}>
                        <CommentHeader>
                          <CommentAuthor>
                            {comment.qaEvaluator ? (
                              <>
                                <i className="fas fa-user-circle"></i>
                                {comment.qaEvaluator}
                              </>
                            ) : (
                              <>
                                <i className="fas fa-user-circle"></i>
                                QA Evaluator
                              </>
                            )}
                          </CommentAuthor>
                          <CommentDate>
                            {(() => {
                              // Try to get date from different possible fields
                              const dateValue = 
                                comment.createdAt || 
                                comment.created_at || 
                                comment.date || 
                                comment.updatedAt || 
                                comment.updated_at;
                              
                              if (dateValue) {
                                try {
                                  return new Date(dateValue).toLocaleString();
                                } catch (e) {
                                  console.error('Error formatting date:', e);
                                  return 'Invalid Date';
                                }
                              }
                              return 'No Date';
                            })()}
                          </CommentDate>
                        </CommentHeader>
                        
                        {/* Make comment content always visible */}
                        <div style={{ 
                          marginTop: '12px',
                          padding: '12px',
                          background: '#f9f9f9',
                          borderRadius: '6px',
                          border: '1px solid #eee'
                        }}>
                          {/* Check for grade from multiple possible sources */}
                          <div style={{ 
                            background: '#4a6fa5', 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            display: 'inline-block',
                            marginBottom: '8px'
                          }}>
                            <strong>Grade:</strong> {(() => {
                              // Try to get grade from different possible fields
                              const grade = 
                                comment.overallScore || 
                                comment.overall_score ||
                                (comment.responses && comment.responses.overallScore) ||
                                (typeof comment.responses === 'string' ? 
                                  (() => {
                                    try {
                                      const parsed = JSON.parse(comment.responses);
                                      return parsed.overallScore || parsed.overall_score;
                                    } catch (e) {
                                      return null;
                                    }
                                  })() : null);
                            
                              console.log('Grade data for rendering:', {
                                id: comment.id,
                                overallScore: comment.overallScore,
                                overall_score: comment.overall_score,
                                grade: grade
                              });
                              
                              return grade || 'Not Graded';
                            })()}
                          </div>
                          
                          {/* Check multiple possible sources of comments */}
                          {(() => {
                            // Try to get comments from different possible fields
                            const commentText = 
                              comment.additional_comments || 
                              comment.additionalComments || 
                              (comment.responses && comment.responses.evaluationComments) ||
                              (typeof comment.responses === 'string' ? 
                                (() => {
                                  try {
                                    const parsed = JSON.parse(comment.responses);
                                    return parsed.evaluationComments;
                                  } catch (e) {
                                    return null;
                                  }
                                })() : null);
                            
                            console.log('Comment data for rendering:', {
                              id: comment.id,
                              hasAddComment: !!comment.additional_comments || !!comment.additionalComments,
                              hasResponseComment: !!(comment.responses && comment.responses.evaluationComments),
                              commentText: commentText
                            });
                            
                            if (commentText) {
                              return (
                                <div style={{ marginTop: '8px' }}>
                                  <strong>Comments:</strong>
                                  <p style={{ whiteSpace: 'pre-line', marginTop: '4px' }}>{commentText}</p>
                                </div>
                              );
                            } else {
                              return (
                                <div style={{ marginTop: '8px', fontStyle: 'italic', color: '#666' }}>
                                  No comments provided
                                </div>
                              );
                            }
                          })()}
                        </div>
                        
                        {/* Show replies if any */}
                        {(() => {
                          // Get replies from the comment object directly or from the state
                          let replies = comment.replies;
                          if (!replies && commentReplies[comment.id]) {
                            replies = commentReplies[comment.id];
                          }
                          
                          // Ensure replies is an array
                          replies = replies || [];
                          
                          const hasReplies = replies && replies.length > 0;
                          
                          return (
                            <CommentRepliesSection>
                              <CommentRepliesHeader>
                                <i className="fas fa-comments"></i> Conversation Thread 
                                {hasReplies ? ` (${replies.length}/3)` : ''}
                              </CommentRepliesHeader>
                              
                              <ConversationContainer>
                                {hasReplies ? (
                                  replies.map((reply, replyIndex) => (
                                    <CommentReplyItem key={replyIndex} $isQA={reply.reply_type === 'qa'}>
                                      <CommentReplyHeader>
                                        <CommentReplyAuthor>
                                          {reply.reply_type === 'qa' ? (
                                            <><i className="fas fa-user-tie"></i> QA Team</>
                                          ) : (
                                            <><i className="fas fa-chalkboard-teacher"></i> {reply.reply_by ? extractUsername(reply.reply_by) : 'Teacher'}</>
                                          )}
                                        </CommentReplyAuthor>
                                        <CommentReplyDate>
                                          {reply.reply_at ? new Date(reply.reply_at).toLocaleString() : 'No Date'}
                                        </CommentReplyDate>
                                      </CommentReplyHeader>
                                      <CommentReplyText>{reply.reply_text}</CommentReplyText>
                                    </CommentReplyItem>
                                  ))
                                ) : (
                                  <div style={{ 
                                    padding: '10px', 
                                    textAlign: 'center', 
                                    color: '#666',
                                    fontStyle: 'italic'
                                  }}>
                                    No replies in this conversation yet
                                  </div>
                                )}
                              </ConversationContainer>
                              
                              {hasReplies && replies.length >= 3 && (
                                <ConversationLimitMessage>
                                  <i className="fas fa-info-circle"></i> Maximum of 3 replies reached for this conversation.
                                </ConversationLimitMessage>
                              )}
                            </CommentRepliesSection>
                          );
                        })()}
                        
                        {/* Check for comments using the same logic as above for conditionally showing the reply form */}
                        {(() => {
                          const commentText = 
                            comment.additional_comments || 
                            comment.additionalComments || 
                            (comment.responses && comment.responses.evaluationComments) ||
                            (typeof comment.responses === 'string' ? JSON.parse(comment.responses).evaluationComments : null);
                          
                          // Normalize comment ID
                          const commentId = comment.id ? 
                            (typeof comment.id === 'string' ? parseInt(comment.id, 10) : comment.id) : null;
                          
                          // Get replies from the comment object directly or from the state
                          let replies = comment.replies;
                          if (!replies && commentReplies[commentId]) {
                            replies = commentReplies[commentId];
                          }
                          replies = replies || [];
                          
                          // Check reply count against maximum
                          const replyCount = replies.length;
                          const maxRepliesReached = replyCount >= 3;
                          
                          if (commentText && commentId) {
                            return (
                              <>
                                {replyingTo === commentId ? (
                                  <CommentReplyForm>
                                    <CommentReplyTextarea
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder="Type your reply as QA team..."
                                    />
                                    <CommentReplyActions>
                                      <CommentReplyButton 
                                        onClick={handleSubmitReply}
                                        disabled={submittingReply || !replyText.trim() || maxRepliesReached}
                                      >
                                        {submittingReply ? 'Sending...' : 'Reply'}
                                      </CommentReplyButton>
                                      <CommentReplyCancelButton
                                        onClick={() => {
                                          setReplyText('');
                                          setReplyingTo(null);
                                        }}
                                      >
                                        Cancel
                                      </CommentReplyCancelButton>
                                    </CommentReplyActions>
                                  </CommentReplyForm>
                                ) : (
                                  <CommentReplyTrigger 
                                    onClick={() => {
                                      // Check if max replies reached (3)
                                      if (maxRepliesReached) {
                                        toast.error('Maximum of 3 replies reached for this comment.');
                                        return;
                                      }
                                      setReplyingTo(commentId);
                                    }}
                                    disabled={maxRepliesReached}
                                    style={{ marginTop: '16px' }}
                                  >
                                    <i className="fas fa-reply"></i> {maxRepliesReached ? 
                                      'Conversation limit reached' : 'Reply as QA'}
                                  </CommentReplyTrigger>
                                )}
                              </>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* Show details button if template exists */}
                        {comment.templateId && (
                          <CommentToggle 
                            onClick={() => toggleExpand(index)}
                            style={{ marginTop: '16px' }}
                          >
                            {expandedComments[index] ? 'Hide Details' : 'Show Evaluation Details'}
                            <i className={`fas fa-chevron-${expandedComments[index] ? 'up' : 'down'}`} style={{ marginLeft: '6px' }}></i>
                          </CommentToggle>
                        )}
                        
                        {expandedComments[index] && (
                          <div style={{ marginTop: '12px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                            <h4 style={{ margin: '0 0 12px 0' }}>Evaluation Details</h4>
                            {/* Parse responses if it's a string */}
                            {(() => {
                              let responsesObj = comment.responses;
                              
                              if (typeof comment.responses === 'string') {
                                try {
                                  responsesObj = JSON.parse(comment.responses);
                                } catch (e) {
                                  console.error('Error parsing responses JSON', e);
                                  responsesObj = {};
                                }
                              }
                              
                              if (responsesObj && typeof responsesObj === 'object' && Object.keys(responsesObj).length > 0) {
                                return (
                                  <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '12px'
                                  }}>
                                    {Object.entries(responsesObj).map(([key, value]) => (
                                      // Skip evaluationComments since we already show it above
                                      key !== 'evaluationComments' && (
                                        <div key={key} style={{ background: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                                          <div style={{ fontWeight: '500', fontSize: '14px', color: '#555' }}>
                                            {key.replace(/-/g, ' → ').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                          </div>
                                          <div style={{ fontSize: '15px', marginTop: '4px' }}>
                                            {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                                          </div>
                                        </div>
                                      )
                                    ))}
                                  </div>
                                );
                              } else {
                                return (
                                  <div style={{ fontStyle: 'italic', color: '#666' }}>
                                    No detailed responses available
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                      </CommentCard>
                    ))}
                  </ScrollableContent>
                )}
              </TabContent>
            </>
          )}
          
          <BackButton onClick={handleBackToRecordings}>
            <i className="fas fa-arrow-left"></i> Back to Recordings
          </BackButton>
        </>
      )}
    </TeachersLayout>
  );
};

export default RecordingDetails; 