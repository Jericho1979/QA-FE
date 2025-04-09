import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TeachersLayout from './QA_TeachersLayout';
import { toast, Toaster } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import apiServiceDefault from '../../services/apiService';
import ReactPlayer from 'react-player';
import config from '../../config';

// Destructure the services from the default export
const { 
  apiRequest,
  authService,
  paginatedService,
  getVideoPlaybackUrl,
  getVideoDownloadUrl,
  teacherGradesService,
  commentRepliesService,
  markerService
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

const SearchContainer = styled.div`
  margin-bottom: 24px;
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #666666;
  }
`;

const SearchBar = styled.input`
  padding: 10px 15px;
  border: 1px solid #EEEEEE;
  border-radius: 8px;
  font-size: 14px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 3px rgba(255, 221, 201, 0.2);
  }
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;

  label {
    font-weight: 500;
    color: #333333;
  }

  input {
    padding: 8px;
    border: 1px solid #EEEEEE;
    border-radius: 4px;
  }
`;

const ClearFilterButton = styled.button`
  background: #f44336;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #d32f2f;
    transform: translateY(-1px);
  }
  
  i {
    font-size: 12px;
  }
`;

const RecordingsHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 100px;
  background: #FFF8F3;
  padding: 12px 16px;
  font-weight: 600;
  color: #333333;
  border-bottom: 1px solid #EEEEEE;
  border-radius: 8px 8px 0 0;
`;

const RecordingRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 100px;
  padding: 12px 16px;
  border-bottom: 1px solid #EEEEEE;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
    border-radius: 0 0 8px 8px;
  }
  
  &:hover {
    background-color: #FFF0E6;
  }
`;

const ViewButton = styled.button`
  background: #FFDDC9;
  color: #333333;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #FFD0B5;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const BackButton = styled(ViewButton)`
  margin-top: 20px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2em;
  color: #666666;
`;

// Add these styled components for the evaluation history and grading
const EvaluationHistoryContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
  display: flex;
  align-items: center;
  
  i {
    margin-right: 10px;
    color: #666;
  }
`;

const EvaluationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const EvaluationCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
`;

const EvaluationCardHeader = styled.div`
  background: #FFDDC9;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EvaluationCardTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const EvaluationCardContent = styled.div`
  padding: 15px;
`;

const EvaluationDetail = styled.div`
  display: flex;
  margin-bottom: 10px;
  
  strong {
    width: 120px;
    color: #555;
  }
`;

const ScoreBadge = styled.div`
  display: inline-block;
  padding: 4px 8px;
  background: ${props => {
    if (props.$score >= 4.5) return '#4CAF50';
    if (props.$score >= 3.5) return '#8BC34A';
    if (props.$score >= 2.5) return '#FFC107';
    if (props.$score >= 1.5) return '#FF9800';
    return '#F44336';
  }};
  color: white;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
`;

const GradingContainer = styled.div`
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  border: 1px solid #eee;
`;

const GradingSection = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-top: 24px;
  border: 1px solid #eee;
`;

const GradingTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  
  i {
    color: #FFB380;
  }
`;

const GradingForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const GradeSelect = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 200px;
`;

const GradeTextarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  min-height: 100px;
  font-size: 14px;
`;

const CheckboxContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  background: #f0f0f0;
  padding: 8px 12px;
  border-radius: 4px;
  
  input {
    margin-right: 8px;
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
  align-self: flex-start;
  
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

const NoRecordingsMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666666;
  background: #f9f9f9;
  border-radius: 8px;
  margin-top: 20px;
`;

const NoEvaluationsMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
`;

const HistoryToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
`;

const HistoryToolbarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const GradeValue = styled.span`
  font-weight: 600;
  background: #FFDDC9;
  padding: 5px 10px;
  border-radius: 4px;
  color: #333;
`;

const CurrentGradeSection = styled.div`
  margin-bottom: 16px;
  margin-top: 16px;
  
  .current-grade-label {
    font-weight: 500;
    margin-bottom: 8px;
  }
`;

const CurrentGradeValue = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f0f8f0;
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-weight: 600;
  font-size: 18px;
`;

const ActionButton = styled.button`
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #e0e0e0;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  i {
    font-size: 12px;
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

const DateFilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
`;

const DateFilterLabel = styled.span`
  font-weight: 500;
  color: #666;
`;

const DateInput = styled.input`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

const RecordingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const RecordingCard = styled.div`
  background: white;
  border-radius: 8px;
  display: flex;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background: #FFF8F3;
  }
`;

const CommentIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  color: white;
  font-size: 14px;
  background: #ffb380;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  padding: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  top: -1px;
  
  i {
    margin-right: 0;
    font-size: 12px;
  }
`;

const ThreadIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  color: white;
  font-size: 14px;
  background: #4a6fa5;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  padding: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  top: -1px;
  
  i {
    margin-right: 0;
    font-size: 12px;
  }
`;

const RecordingThumbnail = styled.div`
  width: 80px;
  height: 80px;
  min-width: 80px;
  background: #FFDDC9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    font-size: 36px;
    color: #333333;
  }
`;

const RecordingInfo = styled.div`
  padding: 0 0 0 15px;
  flex: 1;
  min-width: 0; /* Needed for flexbox text-overflow to work */
`;

const RecordingTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  max-width: 100%;
  line-height: 1.5;
`;

const RecordingDate = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
`;

const RecordingMeta = styled.div`
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #888;
  
  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
`;

const RecordingFileName = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 5px;
`;

const ClassBadge = styled.span`
  background: #FFDDC9;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
  margin-right: 8px;
`;

// Add these styled components for the class code filter
const ClassFilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eee;
`;

const FilterSectionTitle = styled.div`
  font-weight: 600;
  color: #333;
  margin-right: 12px;
  display: flex;
  align-items: center;
  
  i {
    margin-right: 6px;
    color: #FFB380;
  }
`;

const ClassFilterButton = styled.button`
  background: ${props => props.$active ? '#FFDDC9' : '#ffffff'};
  color: ${props => props.$active ? '#333' : '#666'};
  border: ${props => props.$active ? '1px solid #FFB380' : '1px solid #ddd'};
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$active ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};
  
  &:hover {
    background: ${props => props.$active ? '#FFD0B5' : '#f5f5f5'};
    transform: translateY(-1px);
  }
`;

// Add these styled components for the evaluations tab
const EvaluationContainer = styled.div`
  margin-top: 20px;
`;

const EvaluationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: ${props => props.$selected ? '#FFF9F5' : 'white'};
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #FFF9F5;
  }
`;

const EvaluationTitle = styled.div`
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  
  i {
    color: #FFB380;
  }
`;

const EvaluationDate = styled.div`
  font-size: 14px;
  color: #666;
`;

const EvaluationContent = styled.div`
  padding: 16px;
  display: ${props => props.$expanded ? 'block' : 'none'};
`;

const EvaluationScore = styled.div`
  display: inline-block;
  padding: 4px 10px;
  background: ${props => {
    if (props.$score === 'N/A' || isNaN(props.$score)) return '#999999';
    if (props.$score >= 4.5) return '#4CAF50';  // A/A-
    if (props.$score >= 4.0) return '#8BC34A';  // B+/B
    if (props.$score >= 3.5) return '#CDDC39';  // B-/C+
    if (props.$score >= 3.0) return '#FFC107';  // C
    if (props.$score >= 2.0) return '#FF9800';  // C-/D+/D
    return '#F44336';  // D-/F
  }};
  color: white;
  border-radius: 4px;
  font-weight: 600;
`;

const EvaluationActions = styled.div`
  display: flex;
  gap: 8px;
`;

const EvaluationButton = styled.button`
  background: ${props => props.$selected ? '#FFB380' : '#f5f5f5'};
  color: ${props => props.$selected ? 'white' : '#666'};
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => props.$selected ? '#FFA366' : '#e9e9e9'};
  }
  
  i {
    font-size: 12px;
  }
`;

const GradeInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #FFB380;
    box-shadow: 0 0 0 2px rgba(255, 179, 128, 0.2);
  }
`;

const CommentsTextarea = styled.textarea`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  width: 100%;
  min-height: 120px;
  margin-bottom: 16px;
  resize: vertical;
`;

const SubmitGradeButton = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #45a049;
  }
  
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
  
  i {
    font-size: 14px;
  }
`;

const GradingActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const SaveGradeButton = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  i {
    font-size: 14px;
  }
`;

const InfoIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: #666;
  font-size: 10px;
  margin-left: 6px;
  cursor: help;
  position: relative;
  
  &:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    top: -5px;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
    background-color: #333;
    color: white;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 100;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
`;

// Add this function to get the month name
const getMonthName = (monthNumber) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || '';
};

// Add this styled component for the evaluation status
const EvaluationStatus = styled.div`
  margin-top: 10px;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &.can-evaluate {
    background-color: #e8f5e9;
    color: #2e7d32;
  }
  
  &.cannot-evaluate {
    background-color: #ffebee;
    color: #c62828;
  }
`;

// Add this styled component for the evaluation period
const EvaluationPeriod = styled.div`
  margin-top: 10px;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
  
  i {
    font-size: 16px;
    color: #999;
  }
`;

// Helper function to extract username from email
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

const ExportControls = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #eee;
`;

const ExportCheckbox = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
  
  input[type="checkbox"] {
    margin-right: 12px;
  }
  
  label {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }
`;

const EvaluationCardBody = styled.div`
  padding: 15px;
`;

const EvaluationRow = styled.div`
  display: flex;
  margin-bottom: 10px;
  align-items: baseline;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const EvaluationLabel = styled.div`
  min-width: 100px;
  font-weight: 600;
  color: #555;
  margin-right: 10px;
`;

const EvaluationValue = styled.div`
  flex: 1;
  color: #333;
  word-break: break-word;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
`;

const GradeInput_Trial = styled.input`
  width: 100px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
`;

const CommentInput = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
`;

const EvaluationNotice = styled.div`
  background: #fff8e1;
  border-left: 4px solid #ffc107;
  padding: 10px 15px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  i {
    color: #ffc107;
  }
`;

const ExportCheckbox_Trial = styled.input`
  transform: scale(1.2);
  cursor: pointer;
`;

// Duplicate the HistoryToolbar and HistoryToolbarSection definitions here to ensure they're available
const _HistoryToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
`;

const _HistoryToolbarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const GradeInput_Regular = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #FFB380;
    box-shadow: 0 0 0 2px rgba(255, 179, 128, 0.2);
  }
`;

const ExportCheckbox_Regular = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
  
  input[type="checkbox"] {
    margin-right: 12px;
  }
  
  label {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }
`;

// Add these styled components at the end of the file
const EvaluationScoreBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 22px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  background-color: ${props => {
    const score = typeof props.$score === 'number' ? props.$score : 
      typeof props.$score === 'string' && props.$score !== 'N/A' ? parseFloat(props.$score) : 0;
    
    if (props.$score === 'N/A') return '#f5f5f5';
    if (score >= 4.5) return '#4CAF50';
    if (score >= 4.0) return '#8BC34A';
    if (score >= 3.5) return '#CDDC39';
    if (score >= 3.0) return '#FFEB3B';
    if (score >= 2.5) return '#FFC107';
    if (score >= 2.0) return '#FF9800';
    return '#FF5722';
  }};
  color: ${props => props.$score === 'N/A' ? '#999' : '#fff'};
`;

// Add new styled components for pagination
const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-bottom: 30px;
`;

const LoadMoreButton = styled.button`
  background-color: #FF9A5C;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #FF7A3C;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const LoadingIndicator = styled.div`
  text-align: center;
  margin: 20px 0;
  color: #FF9A5C;
  font-size: 16px;
  
  i {
    margin-right: 8px;
  }
`;

// Add new styled components for markers
const AmazingMarkerIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  color: white;
  font-size: 14px;
  background: #ffd700; /* Gold for amazing moments */
  border-radius: 50%;
  width: 24px;
  height: 24px;
  padding: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  top: -1px;
  
  i {
    margin-right: 0;
    font-size: 12px;
  }
`;

const ErrorMarkerIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  color: white;
  font-size: 14px;
  background: #ff4d4d; /* Red for error moments */
  border-radius: 50%;
  width: 24px;
  height: 24px;
  padding: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  top: -1px;
  
  i {
    margin-right: 0;
    font-size: 12px;
  }
`;

const TeacherRecordings = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [teacher, setTeacher] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [f1Evaluations, setF1Evaluations] = useState([]);
  const [selectedEvaluations, setSelectedEvaluations] = useState([]);
  const [selectedF1Evaluations, setSelectedF1Evaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recordings');
  const [canEvaluate, setCanEvaluate] = useState(true);
  const [teacherGrade, setTeacherGrade] = useState(null);
  const [finalGrade, setFinalGrade] = useState('');
  const [qaComments, setQaComments] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [evaluationMonth, setEvaluationMonth] = useState(null);
  const [evaluationYear, setEvaluationYear] = useState(null);
  const [selectedForExport, setSelectedForExport] = useState([]);
  const [gradeDisplay, setGradeDisplay] = useState('Not Graded');
  const [selectedClassCode, setSelectedClassCode] = useState('');
  const [availableClassCodes, setAvailableClassCodes] = useState([]);
  const [error, setError] = useState(null);
  const [decodedTeacherId, setDecodedTeacherId] = useState('');
  const [qaEvaluator, setQaEvaluator] = useState('');
  const [videoMarkers, setVideoMarkers] = useState([]); // To store markers for all recordings
  
  // Add pagination state
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  
  // Set page size for recordings pagination
  const PAGE_SIZE = 50;

  // Add these state variables with the other useState declarations
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Storage keys for persistent time period preferences
  const REGULAR_EVAL_TIMEPERIOD_KEY = 'qa-regular-evaluation-time-period';
  const TRIAL_EVAL_TIMEPERIOD_KEY = 'qa-trial-evaluation-time-period';
  
  // Get stored time period preference or use default
  const getStoredTimePeriod = (isTrialTab) => {
    const storageKey = isTrialTab ? TRIAL_EVAL_TIMEPERIOD_KEY : REGULAR_EVAL_TIMEPERIOD_KEY;
    try {
      const storedValue = localStorage.getItem(storageKey);
      return storedValue || 'current_month'; // Default to current_month if not found
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return 'current_month'; // Default if localStorage fails
    }
  };
  
  // Add new state for time period filtering with persistent preferences
  const [timePeriod, setTimePeriod] = useState(getStoredTimePeriod(false));

  // Handle tab selection with preference loading
  const handleTabSelection = (tabName) => {
    setActiveTab(tabName);
    
    // Only load time period preferences for evaluation tabs
    if (tabName === 'evaluations' || tabName === 'trialClassEval') {
      const isTrialTab = tabName === 'trialClassEval';
      const storedTimePeriod = getStoredTimePeriod(isTrialTab);
      
      // Only update if different to avoid unnecessary renders
      if (timePeriod !== storedTimePeriod) {
        console.log(`Switching to tab ${tabName}, loading stored time period: ${storedTimePeriod}`);
        setTimePeriod(storedTimePeriod);
      }
    }
  };

  useEffect(() => {
    fetchTeacherData();
    // Get current user's info for QA evaluator
    const getCurrentUserInfo = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser?.email) {
          const userEmail = currentUser.email;
          const evaluator = userEmail.includes('@') ? userEmail.split('@')[0] : userEmail;
          setQaEvaluator(evaluator);
          console.log('Set QA Evaluator to:', evaluator);
        }
      } catch (error) {
        console.error('Error getting current user info:', error);
      }
    };
    
    getCurrentUserInfo();
  }, [teacherId]);

  // Extract unique class codes from recordings
  useEffect(() => {
    if (recordings && recordings.length > 0) {
      // Extract unique class codes, prioritizing the short class code
      const classCodes = [...new Set(recordings.map(recording => {
        // Use the short class code (like TP, F1, etc.)
        return recording.classCode || 'Unknown Class';
      }))];
      
      // Sort the class codes alphabetically
      classCodes.sort();
      
      setAvailableClassCodes(classCodes);
    }
  }, [recordings]);

  const fetchTeacherData = async (pageToken = null) => {
    try {
      // For the initial load, set loading to true
      if (!pageToken) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      // Decode the teacherId if it's an email address
      const decoded = decodeURIComponent(teacherId);
      setDecodedTeacherId(decoded);
      console.log('Fetching teacher data for', decoded);
      
      // Use apiRequest instead of direct fetch
      const teacherData = await apiRequest(`${API_URL}/teachers/${decoded}`);
      console.log('Teacher data fetched:', teacherData);
      
      if (!teacherData || !teacherData.email) {
        console.error('Invalid teacher data received');
        setError('Failed to fetch teacher data');
        setLoading(false);
        return;
      }
      
      if (!pageToken) {
        // We already have the teacher data from the apiRequest above
        console.log('Using teacher data from previous request:', teacherData);
        
        setTeacher(teacherData);
        
        // Check if teacher data already includes recordings
        if (teacherData.recordings && Array.isArray(teacherData.recordings) && teacherData.recordings.length > 0) {
          console.log('Using recordings from teacher data:', teacherData.recordings.length, 'recordings found');
          
          // Process recordings to ensure they have the necessary properties
          const processedRecordings = teacherData.recordings.map(recording => ({
            ...recording,
            id: recording.id || recording.name || recording.fileName,
            title: recording.title || recording.name || 'Untitled Recording',
            date: recording.date || new Date().toISOString()
          }));
          
          setRecordings(processedRecordings);
          
          // Since we got all recordings from /api/teachers/:id, there's no need for pagination
          setNextPageToken(null);
          setAllLoaded(true);
        } else {
          // If no recordings in teacher data, fetch using pagination
          console.log('No recordings in teacher data, fetching with pagination');
          await fetchPaginatedRecordings(decoded);
        }
        
        // Start fetching evaluations and grades
        const teacherEmail = teacherData.email;
        if (teacherEmail) {
          fetchEvaluations(teacherEmail);
          
          // Wait a bit before fetching the grade to ensure teacher state is updated
          setTimeout(() => {
            fetchTeacherGrade(decoded);
          }, 500);
        }
      } else {
        // For subsequent pages, just fetch more recordings with pagination
        await fetchPaginatedRecordings(decoded, pageToken);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setError(error.message);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Helper function to fetch recordings with pagination
  const fetchPaginatedRecordings = async (teacherId, pageToken = null) => {
    try {
      // Fetch recordings with pagination
      const recordingsResponse = await paginatedService.getTeacherRecordingsPaginated(
        teacherId, 
        PAGE_SIZE, 
        pageToken
      );
      
      console.log('Fetched paginated recordings:', recordingsResponse);
      
      if (!recordingsResponse || !recordingsResponse.items) {
        throw new Error('Invalid recordings response from API');
      }
      
      // Process recordings to ensure they have the necessary properties
      const processedRecordings = recordingsResponse.items.map(recording => ({
        ...recording,
        id: recording.id || recording.name || recording.fileName,
        title: recording.title || recording.name || 'Untitled Recording',
        date: recording.date || new Date().toISOString()
      }));
      
      // Update recordings - append if we're loading more, replace if it's the first page
      if (pageToken) {
        setRecordings(prevRecordings => [...prevRecordings, ...processedRecordings]);
      } else {
        setRecordings(processedRecordings);
      }
      
      // Update pagination state
      setNextPageToken(recordingsResponse.nextPageToken);
      setAllLoaded(!recordingsResponse.nextPageToken);
      
      return processedRecordings;
    } catch (error) {
      console.error('Error fetching paginated recordings:', error);
      throw error;
    }
  };

  const handleLoadMore = () => {
    if (nextPageToken && !loadingMore) {
      fetchTeacherData(nextPageToken);
    }
  };

  const formatDateForFilter = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Filter recordings based on search term, date range, and class code
  const filteredRecordings = useMemo(() => {
    if (!recordings || recordings.length === 0) return [];
    
    // Add debug logging
    if (searchTerm) {
      console.log('Filtering with search term:', searchTerm);
    }
    
    // If we're on the Trial Class tab, only show F1 class recordings but still apply search and date filters
    if (activeTab === 'trialClass') {
      return recordings.filter(recording => {
        // First filter by class code F1
        if (recording.classCode !== 'F1') return false;
        
        // Apply search filter to multiple fields to ensure we catch all possible matches
        if (searchTerm) {
          const recordingTitle = recording.title || recording.name || recording.fileName || '';
          const recordingClassName = recording.fullClassName || recording.classCode || '';
          const recordingId = recording.id || '';
          
          const searchTermLower = searchTerm.toLowerCase();
          
          const matchesSearch = 
            recordingTitle.toLowerCase().includes(searchTermLower) ||
            recordingClassName.toLowerCase().includes(searchTermLower) ||
            recordingId.toLowerCase().includes(searchTermLower);
          
          if (!matchesSearch) return false;
        }
        
        // If no date filters, return true at this point
        if (!dateRange.start && !dateRange.end) return true;
        
        // Apply date filtering
        const recordingDate = recording.date ? new Date(recording.date) : null;
        if (!recordingDate) return true; // If no date, include it
        
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        const afterStart = !startDate || recordingDate >= startDate;
        const beforeEnd = !endDate || recordingDate <= endDate;
        
        return afterStart && beforeEnd;
      });
    }
    
    return recordings.filter(recording => {
      // For the recordings tab, exclude F1 class recordings since they have their own tab
      if (activeTab === 'recordings' && recording.classCode === 'F1') {
        return false;
      }
      
      // Make sure recording has a title or name property
      const recordingTitle = recording.title || recording.name || '';
      const matchesSearch = recordingTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by class code if selected
      const matchesClassCode = !selectedClassCode || 
        recording.classCode === selectedClassCode || 
        (recording.fullClassName && recording.fullClassName.startsWith(selectedClassCode.toLowerCase()));
      
      if (!dateRange.start && !dateRange.end) return matchesSearch && matchesClassCode;
      
      // Handle date filtering
      const recordingDate = recording.date ? new Date(recording.date) : null;
      if (!recordingDate) return matchesSearch && matchesClassCode;
      
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      
      const afterStart = !startDate || recordingDate >= startDate;
      const beforeEnd = !endDate || recordingDate <= endDate;
      
      return matchesSearch && afterStart && beforeEnd && matchesClassCode;
    });
  }, [recordings, searchTerm, dateRange, selectedClassCode, activeTab]);

  const handleRecordingClick = (recording) => {
    try {
      if (!recording) {
        toast.error('Invalid recording data');
        return;
      }
      
      if (!teacher || !teacher.email) {
        toast.error('Teacher data not available');
        return;
      }
      
      // Create a properly formatted recording ID for navigation
      // Use name as fallback if id is not available
      const recordingId = recording.id || recording.name || recording.fileName;
      
      if (!recordingId) {
        console.error('Recording has no id or name:', recording);
        toast.error('Invalid recording data - missing identifier');
        return;
      }
      
      console.log('Navigating to recording details:', recordingId);
      
      // Navigate to the recording details page
      navigate(`/teachers/recordings/${encodeURIComponent(teacher.email)}/${encodeURIComponent(recordingId)}`);
    } catch (error) {
      console.error('Error navigating to recording details:', error);
      toast.error('Failed to navigate to recording details');
    }
  };

  const handleBackToTeachers = () => {
    navigate('/teachers');
  };

  // Update the fetchEvaluations function to use apiRequest directly
  const fetchEvaluations = async (teacherEmail) => {
    try {
      if (!teacherEmail) {
        console.log('No teacher email provided for fetching evaluations');
        return;
      }
      
      console.log('Fetching evaluations for teacher:', teacherEmail);
      
      // Use apiRequest directly
      const data = await apiRequest(`${API_URL}/evaluations?teacher_id=${encodeURIComponent(teacherEmail)}`);
      console.log('Fetched evaluations:', data);
      
      // Process evaluations to ensure they have the necessary properties
      const processedEvaluations = data.map(evaluation => {
        // Ensure responses is properly parsed
        const responses = typeof evaluation.responses === 'string' 
          ? JSON.parse(evaluation.responses) 
          : evaluation.responses || {};
          
        // Extract class code from video_id if possible
        let classCode = 'Unknown';
        if (evaluation.video_id) {
          // Check if video_id follows pattern with class code
          const classCodeMatch = evaluation.video_id.match(/[A-Z]+\d{1}/);
          if (classCodeMatch) {
            classCode = classCodeMatch[0];
          } else if (evaluation.video_id.includes('f1_') || evaluation.video_id.includes('F1_')) {
            classCode = 'F1';
          }
        }
        
        // Check if this evaluation has replies
        const hasReplies = evaluation.replies && evaluation.replies.length > 0;
        
        return {
          ...evaluation,
          id: evaluation.id || `eval-${Math.random().toString(36).substr(2, 9)}`,
          responses: responses,
          classCode: classCode,
          date: evaluation.created_at ? new Date(evaluation.created_at) : new Date(),
          selected: false,
          hasReplies: hasReplies
        };
      });
      
      // Separately get all comment replies to map them to evaluations
      try {
        // Use the new commentRepliesService
        const repliesData = await commentRepliesService.getAllCommentReplies();
        
        // Map replies to evaluations
        if (repliesData && repliesData.length > 0) {
          const repliesMap = {};
          repliesData.forEach(reply => {
            if (!repliesMap[reply.evaluation_id]) {
              repliesMap[reply.evaluation_id] = [];
            }
            repliesMap[reply.evaluation_id].push(reply);
          });
          
          // Update evaluations with reply count
          processedEvaluations.forEach(evaluation => {
            if (repliesMap[evaluation.id]) {
              evaluation.replies = repliesMap[evaluation.id];
              evaluation.hasReplies = true;
            }
          });
        }
      } catch (repliesError) {
        console.error('Error fetching comment replies:', repliesError);
        // Continue with the evaluations even if replies couldn't be fetched
        console.log('Continuing with evaluations without replies');
      }
      
      // Separate F1 evaluations and regular evaluations
      const f1FilteredEvaluations = processedEvaluations.filter(
        evaluation => evaluation.classCode === 'F1' || evaluation.video_id?.toLowerCase().includes('f1_')
      );
      
      const regularEvaluations = processedEvaluations.filter(
        evaluation => evaluation.classCode !== 'F1' && !evaluation.video_id?.toLowerCase().includes('f1_')
      );
      
      setF1Evaluations(f1FilteredEvaluations);
      setEvaluations(regularEvaluations);
      
      console.log('Processed evaluations:', {
        regular: regularEvaluations,
        f1: f1FilteredEvaluations
      });
      
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    }
  };
  
  // Update the fetchTeacherGrade function to use teacherGradesService
  const fetchTeacherGrade = async (teacherId = null) => {
    try {
      setLoading(true);
      
      // Use passed teacherId or fall back to decodedTeacherId state
      const id = teacherId || decodedTeacherId;
      console.log('Fetching grade for teacher:', id);
      
      if (!id) {
        console.error('No teacher ID provided');
        setLoading(false);
        return;
      }
      
      // Use teacherGradesService instead of direct API call
      console.log('Using teacherGradesService to fetch teacher grade');
      const data = await teacherGradesService.getTeacherGradeById(id);
      console.log('Fetched teacher grade data:', data);
      
      // Get current month and year
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      if (data) {
        // Set grade data if available
        setTeacherGrade(data.grade || '');
        setQaComments(data.qa_comments || '');
        
        if (data.evaluation_ids && Array.isArray(data.evaluation_ids)) {
          setSelectedEvaluations(data.evaluation_ids);
        }
        
        // Use canEvaluate flag directly from the API response if available
        if (data.hasOwnProperty('canEvaluate')) {
          setCanEvaluate(data.canEvaluate);
        } else {
          // Fallback to checking if it's current month
          const isCurrentMonth = data.month === currentMonth && data.year === currentYear;
          setCanEvaluate(!isCurrentMonth);
        }
        
        // Set month and year information
        setEvaluationMonth(data.month || currentMonth);
        setEvaluationYear(data.year || currentYear);
      } else {
        // No grade found - allow evaluation
        setTeacherGrade('');
        setQaComments('');
        setCanEvaluate(true);
        setEvaluationMonth(currentMonth);
        setEvaluationYear(currentYear);
      }
    } catch (error) {
      console.error('Error in fetchTeacherGrade:', error);
      
      // Default values in case of error - allow evaluation
      setTeacherGrade('');
      setQaComments('');
      setCanEvaluate(true);
      
      // Use current month/year for defaults
      const currentDate = new Date();
      setEvaluationMonth(currentDate.getMonth() + 1);
      setEvaluationYear(currentDate.getFullYear());
      
      // Don't show error toast for 404 errors, which are expected if no grade exists
      if (!error.message?.includes('404')) {
        toast.error(`Failed to load teacher grade: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Add this function to handle evaluation selection
  const handleEvaluationSelection = (evaluationId) => {
    setSelectedEvaluations(prev => {
      if (prev.includes(evaluationId)) {
        return prev.filter(id => id !== evaluationId);
      } else {
        return [...prev, evaluationId];
      }
    });
  };
  
  // Add this function to handle F1 evaluation selection
  const handleF1EvaluationSelection = (evaluationId) => {
    setSelectedF1Evaluations(prev => {
      if (prev.includes(evaluationId)) {
        return prev.filter(id => id !== evaluationId);
      } else {
        return [...prev, evaluationId];
      }
    });
  };
  
  // Update the handleSubmitGrade function to use the new API endpoint
  const handleSubmitGrade = async () => {
    if (!decodedTeacherId) {
      toast.error('No teacher ID available');
      return;
    }
    
    if (finalGrade === undefined || finalGrade === null || finalGrade === '') {
      toast.error('Please provide a valid grade');
      return;
    }
    
    if (!qaEvaluator) {
      toast.error('QA evaluator is required');
      return;
    }
    
    try {
      setSubmittingGrade(true);
      
      // Convert grade to numeric value
      const gradeToSubmit = parseFloat(finalGrade);
      
      if (isNaN(gradeToSubmit)) {
        toast.error('Invalid grade format. Please enter a valid number.');
        return;
      }
      
      // Calculate average score for reporting using the time-filtered evaluations
      const filteredEvaluations = filterEvaluationsByTimePeriod(evaluations, timePeriod);
      const avgScore = parseFloat(calculateAverageScore(filteredEvaluations, timePeriod));
      
      // Use current month and year if not specified
      const currentDate = new Date();
      const currentMonth = evaluationMonth || currentDate.getMonth() + 1;
      const currentYear = evaluationYear || currentDate.getFullYear();
      
      // Get IDs of evaluations from the selected time period
      const timeFilteredIds = filteredEvaluations.map(evaluation => evaluation.id);
      // Intersection of selected evaluations and time-filtered evaluations
      const filteredSelectedIds = selectedEvaluations.filter(id => timeFilteredIds.includes(id));
      
      // Use teacherGradesService to save grade
      const gradeData = {
        teacher_id: decodedTeacherId,
        grade: gradeToSubmit,
        qa_comments: qaComments, // Changed from comments to qa_comments to match server schema
        average_score: avgScore,
        evaluation_ids: filteredSelectedIds.length > 0 ? filteredSelectedIds : timeFilteredIds,
        qa_evaluator: qaEvaluator,
        month: currentMonth,
        year: currentYear,
        time_period: timePeriod // Send the time period used for filtering
      };
      
      const data = await teacherGradesService.saveTeacherGrade(gradeData);
      
      setTeacherGrade(gradeToSubmit);
      toast.success('Grade submitted successfully');
      setCanEvaluate(false);
      
      if (data.month && data.year) {
        setEvaluationMonth(data.month);
        setEvaluationYear(data.year);
      }
      
      // Refresh the teacher grade data
      await fetchTeacherGrade(decodedTeacherId);
      
    } catch (error) {
      console.error('Error submitting grade:', error);
      toast.error(error.message || 'Failed to submit grade');
      setSubmissionError(error.message);
    } finally {
      setSubmittingGrade(false);
    }
  };

  const handleClassCodeFilter = (classCode) => {
    setSelectedClassCode(prevCode => prevCode === classCode ? '' : classCode);
  };

  // Add helper function to filter evaluations by time period
  const filterEvaluationsByTimePeriod = (evaluations, period) => {
    if (!evaluations || !period || period === 'all') {
      return evaluations;
    }
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return evaluations.filter(evaluation => {
      const evalDate = new Date(evaluation.created_at || evaluation.date);
      
      switch(period) {
        case 'current_month':
          return evalDate.getMonth() === currentMonth && 
                 evalDate.getFullYear() === currentYear;
        
        case 'previous_month': {
          // Calculate previous month and year
          let prevMonth = currentMonth - 1;
          let prevYear = currentYear;
          
          // Handle January (month 0) special case
          if (prevMonth < 0) {
            prevMonth = 11; // December
            prevYear = currentYear - 1;
          }
          
          return evalDate.getMonth() === prevMonth && 
                 evalDate.getFullYear() === prevYear;
        }
        
        case 'last_3_months': {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          return evalDate >= threeMonthsAgo;
        }
        
        case 'last_6_months': {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          return evalDate >= sixMonthsAgo;
        }
        
        default:
          return true;
      }
    });
  };

  // Function to get display name for time period
  const getTimePeriodDisplayName = (period) => {
    switch(period) {
      case 'current_month':
        return 'Current Month';
      case 'previous_month': {
        // Calculate previous month name
        const now = new Date();
        const prevMonth = now.getMonth() - 1;
        const prevYear = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const prevMonthDate = new Date(prevYear, prevMonth < 0 ? 11 : prevMonth, 1);
        return `${prevMonthDate.toLocaleString('default', { month: 'long' })} ${prevYear}`;
      }
      case 'last_3_months':
        return 'Last 3 Months';
      case 'last_6_months':
        return 'Last 6 Months';
      case 'all':
      default:
        return 'All Time';
    }
  };

  // Handle time period change
  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
    
    // Save preference to localStorage based on active tab
    try {
      const storageKey = activeTab === 'trialClassEval' 
        ? TRIAL_EVAL_TIMEPERIOD_KEY 
        : REGULAR_EVAL_TIMEPERIOD_KEY;
      localStorage.setItem(storageKey, newPeriod);
      console.log(`Saved time period preference "${newPeriod}" for ${activeTab === 'trialClassEval' ? 'trial class' : 'regular'} evaluations`);
      
      // Show a toast notification to inform the user their preference was saved
      toast.success(`Time period preference saved: ${getTimePeriodDisplayName(newPeriod)}`, {
        duration: 2000,
        style: {
          background: '#f0f8ff',
          color: '#0066cc',
          border: '1px solid #b3d7ff'
        },
        icon: '💾'
      });
    } catch (error) {
      console.error('Error saving preference to localStorage:', error);
      toast.error('Could not save your preference');
    }
    
    // Immediately recalculate final grade value based on the new time period
    if (activeTab === 'trialClassEval') {
      if (f1Evaluations.length > 0) {
        // Calculate average score from evaluations with time period filtering
        const avgScore = calculateAverageScore(f1Evaluations, newPeriod);
        
        // Update the final grade state
        setFinalGrade(avgScore !== 'N/A' ? avgScore : '');
        console.log(`Updated final grade for trial class evaluations (${newPeriod}): ${avgScore}`);
      }
    } else {
      if (evaluations.length > 0) {
        // Calculate average score from evaluations with time period filtering
        const avgScore = calculateAverageScore(evaluations, newPeriod);
        
        // Update the final grade state
        setFinalGrade(avgScore !== 'N/A' ? avgScore : '');
        console.log(`Updated final grade for regular evaluations (${newPeriod}): ${avgScore}`);
      }
    }
  };

  // Update the calculateAverageScore function to calculate average score with time filtering
  const calculateAverageScore = (evaluations, period = timePeriod) => {
    if (!evaluations || evaluations.length === 0) return 'N/A';
    
    // Apply time filtering
    const filteredEvaluations = filterEvaluationsByTimePeriod(evaluations, period);
    
    // Log evaluations to debug
    console.log(`Calculating average score from ${filteredEvaluations.length} evaluations after time filtering (${period}):`, filteredEvaluations);
    
    if (filteredEvaluations.length === 0) return 'N/A';
    
    const validScores = filteredEvaluations.filter(evaluation => {
      // Check for overall_score or overallScore property
      const score = evaluation.overall_score || evaluation.overallScore;
      return typeof score === 'number' || (typeof score === 'string' && !isNaN(parseFloat(score)));
    });
    
    console.log('Valid scores found:', validScores);
    
    if (validScores.length === 0) return 'N/A';
    
    const sum = validScores.reduce((acc, evaluation) => {
      // Get score from either overall_score or overallScore property
      let score = evaluation.overall_score || evaluation.overallScore;
      score = parseFloat(score);
      
      // Ensure the score is within the 1-5 range
      if (score > 5) {
        console.log(`Normalizing score ${score} to 5`);
        score = 5;
      } else if (score < 1) {
        console.log(`Normalizing score ${score} to 1`);
        score = 1;
      }
      
      return acc + score;
    }, 0);
    
    return (sum / validScores.length).toFixed(2);
  };

  // Add a new function to determine the final grade based on average score
  const determineGradeFromScore = (score) => {
    if (score === 'N/A' || score === undefined || score === null) return '';
    
    // If score is a string, try to parse it
    let numericScore;
    if (typeof score === 'string') {
      if (score === 'N/A') return '';
      numericScore = parseFloat(score);
      if (isNaN(numericScore)) return '';
    } else {
      numericScore = score;
    }
    
    console.log('Determining grade from numeric score (1-5 scale):', numericScore);
    
    // Convert 1-5 scale to letter grades
    if (numericScore >= 4.7) return 'A';
    if (numericScore >= 4.5) return 'A-';
    if (numericScore >= 4.2) return 'B+';
    if (numericScore >= 4.0) return 'B';
    if (numericScore >= 3.7) return 'B-';
    if (numericScore >= 3.5) return 'C+';
    if (numericScore >= 3.0) return 'C';
    if (numericScore >= 2.7) return 'C-';
    if (numericScore >= 2.5) return 'D+';
    if (numericScore >= 2.0) return 'D';
    if (numericScore >= 1.7) return 'D-';
    return 'F';
  };

  // Update autoCalculateGrade to use the time period
  const autoCalculateGrade = (forceRefresh = false) => {
    // Get the current evaluations from state
    const currentEvaluations = evaluations;
    
    if (currentEvaluations.length === 0) {
      console.log('No evaluations available for grade calculation');
      setFinalGrade('');
      return;
    }
    
    // Calculate the average score with time period filter
    const avgScore = calculateAverageScore(currentEvaluations, timePeriod);
    console.log(`Calculated average score for ${timePeriod}:`, avgScore);
    
    // Use the numeric score directly instead of converting to a letter grade
    const numericScore = avgScore === 'N/A' ? '' : avgScore;
    
    // Always update when force refresh is true, otherwise check if different
    if (forceRefresh || finalGrade !== numericScore) {
      setFinalGrade(numericScore);
      console.log('Updated final grade to:', numericScore);
    } else {
      console.log('Grade already set correctly to:', finalGrade);
    }
  };

  // Add a useEffect to auto-calculate the grade when the activeTab changes to 'evaluations'
  useEffect(() => {
    if (activeTab === 'evaluations' && evaluations.length > 0) {
      // Calculate grade using the default time period (current_month)
      autoCalculateGrade(false);
      
      // Log information about filtered evaluations
      const filteredCount = filterEvaluationsByTimePeriod(evaluations, timePeriod).length;
      const totalCount = evaluations.length;
      console.log(`Using ${filteredCount} of ${totalCount} evaluations for grade calculation (${getTimePeriodDisplayName(timePeriod)})`);
    }
  }, [activeTab, evaluations, timePeriod]);
  
  // Add a useEffect for trial class evaluations tab
  useEffect(() => {
    if (activeTab === 'trialClassEval' && f1Evaluations.length > 0) {
      // Calculate grade using the default time period (current_month)
      // Use setTimeout to avoid the circular dependency
      setTimeout(() => {
        if (activeTab === 'trialClassEval') {
          // Only call if we're still on the right tab
          const forceRefresh = false;
          if (!forceRefresh && finalGrade) {
            // If we already have a grade and aren't forcing a refresh, don't recalculate
            return;
          }
          
          if (f1Evaluations.length === 0) {
            toast.error('No trial class evaluations available for calculating grade');
            return;
          }
          
          // Calculate average score from evaluations with time period filtering
          const avgScore = calculateAverageScore(f1Evaluations, timePeriod);
          
          if (avgScore === 'N/A') {
            toast.error('Cannot calculate grade: no valid evaluation scores found');
            return;
          }
          
          // Set the calculated grade
          setFinalGrade(avgScore);
          toast.success(`Auto-calculated grade: ${avgScore} (from ${getTimePeriodDisplayName(timePeriod).toLowerCase()} evaluations)`);
          
          // Get the current month and year if not already set
          if (!evaluationMonth) {
            const currentDate = new Date();
            setEvaluationMonth(String(currentDate.getMonth() + 1));
          }
          
          if (!evaluationYear) {
            const currentDate = new Date();
            setEvaluationYear(String(currentDate.getFullYear()));
          }
        }
      }, 0);
      
      // Log information about filtered evaluations
      const filteredCount = filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).length;
      const totalCount = f1Evaluations.length;
      console.log(`Using ${filteredCount} of ${totalCount} trial class evaluations for grade calculation (${getTimePeriodDisplayName(timePeriod)})`);
    }
  }, [activeTab, f1Evaluations, timePeriod]);

  // Helper function to format category sections with proper HTML row structure
  const formatHtmlCategorySection = (evaluation, category, sectionClass) => {
    let sectionContent = '';
    
    // Extract all responses for this category
    const categoryResponses = Object.entries(evaluation.responses || {})
      .filter(([key]) => key.startsWith(category))
      .map(([key, value]) => ({
        subcategory: key.replace(`${category}-`, ''),
        score: typeof value === 'object' ? value.score : value,
        comments: typeof value === 'object' ? value.comments : ''
      }));

    // Debug log
    console.log(`Processing category ${category}:`, categoryResponses);

    if (categoryResponses.length === 0) {
      console.log(`No responses found for category ${category}`);
      return '';
    }

    // First row includes the category name
    categoryResponses.forEach((response, index) => {
      if (index === 0) {
        sectionContent += `
          <tr class="${sectionClass}" style="background-color: ${getSectionColor(sectionClass)} !important;">
            <td rowspan="${categoryResponses.length}" class="category-cell" style="font-weight: bold !important; vertical-align: top !important;">${category}</td>
            <td style="padding: 8px !important;">${response.subcategory}</td>
            <td class="score-cell" style="text-align: center !important;">${response.score || ''}</td>
            <td style="padding: 8px !important;">${response.comments || ''}</td>
          </tr>
        `;
      } else {
        // Subsequent rows leave the category cell empty
        sectionContent += `
          <tr class="${sectionClass}" style="background-color: ${getSectionColor(sectionClass)} !important;">
            <td style="padding: 8px !important;">${response.subcategory}</td>
            <td class="score-cell" style="text-align: center !important;">${response.score || ''}</td>
            <td style="padding: 8px !important;">${response.comments || ''}</td>
          </tr>
        `;
      }
    });
    
    return sectionContent;
  };

  // Add this helper function to get section colors
  const getSectionColor = (sectionClass) => {
    switch(sectionClass) {
      case 'section-0': return '#ffffcc';
      case 'section-1': return '#ffcccc';
      case 'section-2': return '#e6ccff';
      case 'section-3': return '#ccffcc';
      default: return '#ffffff';
    }
  };

  // Helper function to format category sections for PDF with inline styles
  const formatPdfCategorySection = (evaluation, category, bgColor) => {
    let sectionContent = '';
    
    // Extract all responses for this category
    const categoryResponses = Object.entries(evaluation.responses || {})
      .filter(([key]) => key.startsWith(category))
      .map(([key, value]) => ({
        subcategory: key.replace(`${category}-`, ''),
        score: typeof value === 'object' ? value.score : value,
        comments: typeof value === 'object' ? value.comments : ''
      }));

    if (categoryResponses.length === 0) {
      return '';
    }

    // Get score color based on value
    const getScoreColor = (score) => {
      if (!score || score === 'N/A') return '#777';
      const numScore = parseFloat(score);
      if (numScore >= 4.5) return '#4CAF50';
      if (numScore >= 3.5) return '#8BC34A';
      if (numScore >= 2.5) return '#FFC107';
      if (numScore >= 1.5) return '#FF9800';
      return '#F44336';
    };

    // First row includes the category name
    categoryResponses.forEach((response, index) => {
      if (index === 0) {
        sectionContent += `
          <tr style="background-color: ${bgColor}15;">
            <td rowspan="${categoryResponses.length}" style="font-weight: 600; padding: 12px; border-bottom: 1px solid #eee; color: #444; font-family: Arial, sans-serif;">${category}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-family: Arial, sans-serif;">${response.subcategory}</td>
            <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee; font-family: Arial, sans-serif;">
              <span style="font-weight: 700; color: ${getScoreColor(response.score)}; padding: 4px 8px; border-radius: 12px; background-color: ${getScoreColor(response.score)}15; display: inline-block; min-width: 28px;">${response.score || 'N/A'}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-family: Arial, sans-serif; color: #555; font-size: 13px;">${response.comments || ''}</td>
          </tr>
        `;
      } else {
        // Subsequent rows leave the category cell empty
        sectionContent += `
          <tr style="background-color: ${bgColor}15;">
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-family: Arial, sans-serif;">${response.subcategory}</td>
            <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee; font-family: Arial, sans-serif;">
              <span style="font-weight: 700; color: ${getScoreColor(response.score)}; padding: 4px 8px; border-radius: 12px; background-color: ${getScoreColor(response.score)}15; display: inline-block; min-width: 28px;">${response.score || 'N/A'}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-family: Arial, sans-serif; color: #555; font-size: 13px;">${response.comments || ''}</td>
          </tr>
        `;
      }
    });
    
    return sectionContent;
  };

  const handleExportData = () => {
    if (selectedForExport.length === 0) {
      toast.error('Please select at least one evaluation to export');
      return;
    }

    // Filter evaluations based on selection and current tab
    const selectedEvaluations = activeTab === 'trialClassEval'
      ? f1Evaluations.filter(evaluation => selectedForExport.includes(evaluation.id))
      : evaluations.filter(evaluation => selectedForExport.includes(evaluation.id));
    
    // Debug: Log the structure of the first evaluation to understand its format
    if (selectedEvaluations.length > 0) {
      console.log('Evaluation structure for export:', JSON.stringify(selectedEvaluations[0], null, 2));
    }

    try {
      // Create HTML content for the report
      
      // Add report title based on current tab
      const reportTitle = activeTab === 'trialClassEval' ? 'TRIAL CLASS EVALUATION REPORT' : 'TEACHER EVALUATION REPORT';
      
      let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Teacher Evaluation Report - ${teacher?.name || 'Unknown Teacher'}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
          <style>
            :root {
              --primary-color: #4CAF50;
              --secondary-color: #2196F3;
              --accent-color: #FF9800;
              --light-grey: #f8f8f8;
              --dark-grey: #555;
              --text-color: #333;
              --border-color: #eee;
              --card-shadow: 0 2px 4px rgba(0,0,0,0.05);
              --section-shadow: 0 2px 6px rgba(0,0,0,0.1);
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: var(--text-color);
              background-color: #f9f9f9;
              padding: 0;
              margin: 0;
            }
            
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0;
            }
            
            .report-header {
              position: relative;
              background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            
            .report-title {
              font-size: 28px;
              font-weight: 600;
              margin-bottom: 10px;
            }
            
            .report-subtitle {
              font-size: 18px;
              font-weight: 400;
              opacity: 0.9;
            }
            
            .info-card {
              background-color: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: var(--section-shadow);
              margin: -30px 20px 30px;
              position: relative;
              z-index: 1;
            }
            
            .info-row {
              display: flex;
              flex-wrap: wrap;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid var(--border-color);
            }
            
            .info-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            
            .info-label {
              width: 150px;
              font-weight: 600;
              color: var(--dark-grey);
            }
            
            .info-value {
              flex: 1;
            }
            
            .accent-value {
              color: var(--primary-color);
              font-weight: 500;
            }
            
            .evaluation-container {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              padding: 0 20px 40px;
            }
            
            .sidebar {
              width: 250px;
              position: sticky;
              top: 20px;
              align-self: flex-start;
            }
            
            .main-content {
              flex: 1;
              min-width: 0;
            }
            
            .nav-card {
              background-color: white;
              border-radius: 8px;
              box-shadow: var(--section-shadow);
              padding: 15px;
              margin-bottom: 20px;
            }
            
            .nav-title {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 15px;
              color: var(--primary-color);
              border-bottom: 2px solid var(--primary-color);
              padding-bottom: 8px;
            }
            
            .nav-list {
              list-style: none;
            }
            
            .nav-item {
              margin-bottom: 12px;
              font-size: 14px;
            }
            
            .nav-link {
              display: flex;
              align-items: center;
              text-decoration: none;
              color: var(--text-color);
              padding: 8px 12px;
              border-radius: 4px;
              transition: background-color 0.2s;
            }
            
            .nav-link:hover {
              background-color: var(--light-grey);
            }
            
            .nav-link i {
              margin-right: 10px;
              color: var(--secondary-color);
            }
            
            .stats-card {
              background-color: white;
              border-radius: 8px;
              box-shadow: var(--section-shadow);
              padding: 15px;
            }
            
            .stat-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }
            
            .stat-item {
              background-color: var(--light-grey);
              padding: 10px;
              border-radius: 4px;
              text-align: center;
            }
            
            .stat-value {
              font-size: 18px;
              font-weight: 700;
              color: var(--primary-color);
            }
            
            .stat-label {
              font-size: 12px;
              color: var(--dark-grey);
            }
            
            .evaluation-card {
              background-color: white;
              border-radius: 8px;
              box-shadow: var(--section-shadow);
              margin-bottom: 25px;
              overflow: hidden;
            }
            
            .evaluation-header {
              background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
              color: white;
              padding: 20px;
              position: relative;
            }
            
            .evaluation-id {
              position: absolute;
              top: 20px;
              right: 20px;
              background-color: rgba(255, 255, 255, 0.2);
              padding: 5px 10px;
              border-radius: 20px;
              font-size: 12px;
            }
            
            .evaluation-title {
              margin-bottom: 5px;
              font-size: 18px;
              font-weight: 600;
            }
            
            .evaluation-meta {
              display: flex;
              gap: 15px;
              flex-wrap: wrap;
              font-size: 14px;
              opacity: 0.9;
            }
            
            .meta-item {
              display: flex;
              align-items: center;
            }
            
            .meta-item i {
              margin-right: 5px;
            }
            
            .evaluation-body {
              padding: 20px;
            }
            
            .info-section {
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid var(--border-color);
            }
            
            .section-title {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 15px;
              color: var(--secondary-color);
              display: flex;
              align-items: center;
            }
            
            .section-title i {
              margin-right: 8px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
            }
            
            .info-item {
              background-color: var(--light-grey);
              padding: 10px 15px;
              border-radius: 6px;
            }
            
            .info-item-label {
              font-size: 12px;
              color: var(--dark-grey);
              margin-bottom: 5px;
            }
            
            .info-item-value {
              font-weight: 500;
            }
            
            .score-badge {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 4px;
              font-weight: 700;
              color: white;
              background-color: var(--primary-color);
            }
            
            .details-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-bottom: 20px;
            }
            
            .details-table th,
            .details-table td {
              padding: 12px 15px;
              text-align: left;
              border-bottom: 1px solid var(--border-color);
            }
            
            .details-table th {
              background-color: var(--light-grey);
              font-weight: 600;
              color: var(--dark-grey);
            }
            
            .category-row {
              font-weight: 600;
            }
            
            .comments-section {
              background-color: var(--light-grey);
              padding: 15px;
              border-radius: 6px;
              margin-top: 20px;
            }
            
            .comments-title {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 10px;
              color: var(--accent-color);
            }
            
            .comments-text {
              white-space: pre-line;
              padding: 15px;
              background-color: white;
              border-radius: 4px;
            }
            
            footer {
              text-align: center;
              padding: 20px;
              color: var(--dark-grey);
              font-size: 12px;
              border-top: 1px solid var(--border-color);
            }
            
            /* Score coloring */
            .score-4-5 { background-color: #4CAF50; }
            .score-3-5 { background-color: #8BC34A; }
            .score-2-5 { background-color: #FFC107; }
            .score-1-5 { background-color: #FF9800; }
            .score-0-1 { background-color: #F44336; }
            
            /* Media queries for responsiveness */
            @media (max-width: 768px) {
              .evaluation-container {
                flex-direction: column;
              }
              
              .sidebar {
                width: 100%;
                position: static;
              }
              
              .info-grid {
                grid-template-columns: 1fr;
              }
            }
            
            /* Back to top button */
            .back-to-top {
              position: fixed;
              bottom: 20px;
              right: 20px;
              width: 40px;
              height: 40px;
              background-color: var(--primary-color);
              color: white;
              border-radius: 50%;
              display: flex;
              justify-content: center;
              align-items: center;
              text-decoration: none;
              opacity: 0.8;
              transition: opacity 0.2s;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            }
            
            .back-to-top:hover {
              opacity: 1;
            }

            /* Print button */
            .print-button {
              position: fixed;
              bottom: 20px;
              right: 70px;
              background-color: var(--secondary-color);
              color: white;
              border: none;
              border-radius: 4px;
              padding: 8px 16px;
              font-size: 14px;
              display: flex;
              align-items: center;
              gap: 8px;
              cursor: pointer;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              transition: background-color 0.2s;
              z-index: 100;
            }
            
            .print-button:hover {
              background-color: #0d7ad6;
            }
            
            .print-button i {
              font-size: 16px;
            }

            /* Print-specific styles */
            @media print {
              body {
                background-color: white;
                color: black;
                font-size: 8pt;  /* Reduced font size for printing */
                margin: 0;
                padding: 0;
                zoom: 0.75;  /* Scale down content for printing */
              }

              .container {
                max-width: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
              }

              .evaluation-container {
                display: block;
                padding: 0;
              }

              .sidebar {
                display: none; /* Hide sidebar when printing */
              }

              .main-content {
                width: 100%;
                margin: 0;
                padding: 0;
              }

              /* Remove the page-break-inside: avoid to allow content to flow across pages if needed */
              .evaluation-card {
                margin-bottom: 15px;
                border: 1px solid #ddd;
                box-shadow: none;
                page-break-inside: auto;
                break-inside: auto;
              }

              .report-header {
                background: white;
                color: black;
                border-bottom: 1px solid #4CAF50;
                padding: 10px;
              }

              .report-title {
                font-size: 14pt;
              }

              .report-subtitle {
                font-size: 10pt;
              }

              .info-card {
                margin: 10px 0;
                box-shadow: none;
                border: 1px solid #ddd;
                padding: 5px;
              }

              .info-row {
                margin-bottom: 5px;
                padding-bottom: 5px;
              }

              .back-to-top {
                display: none !important; /* Hide back to top button when printing */
              }
              
              .print-button {
                display: none !important; /* Hide print button when printing */
              }

              /* Compact tables for printing */
              .details-table {
                font-size: 7pt;
              }

              .details-table th {
                background-color: #f0f0f0 !important;
                color: black;
                padding: 3px;
              }

              .details-table td, .details-table th {
                border: 1px solid #ddd;
                padding: 3px;
              }

              /* Adjust score badges for print */
              .score-badge {
                color: black !important;
                border: 1px solid currentColor;
                padding: 1px 3px;
                font-size: 7pt;
              }

              .score-4-5 { background-color: #e0f0e0 !important; border-color: #4CAF50; }
              .score-3-5 { background-color: #e8f5e0 !important; border-color: #8BC34A; }
              .score-2-5 { background-color: #fff8e0 !important; border-color: #FFC107; }
              .score-1-5 { background-color: #fff0e0 !important; border-color: #FF9800; }
              .score-0-1 { background-color: #ffe0e0 !important; border-color: #F44336; }

              /* Page layout */
              @page {
                size: auto;  /* Use default printer page size */
                margin: 0.5cm;  /* Minimal margins */
                scale: 90%;  /* Scale content to fit on page */
              }

              /* Force color print */
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              /* Compact headers */
              h2, h3 {
                margin: 5px 0;
                font-size: 10pt;
              }

              /* For tables that span multiple pages, repeat headers */
              thead {
                display: table-header-group;
              }
              
              /* Additional print adjustments */
              .evaluation-header {
                background: #f0f0f0 !important;
                color: black;
                border-bottom: 1px solid #4CAF50;
                padding: 5px 10px;
              }
              
              .evaluation-id {
                background-color: white !important;
                border: 1px solid #ddd;
                color: black;
                padding: 2px 5px;
                font-size: 7pt;
              }

              .evaluation-title {
                font-size: 10pt;
                margin: 2px 0;
              }
              
              .evaluation-meta {
                font-size: 7pt;
              }
              
              .evaluation-body {
                padding: 5px 10px;
              }
              
              .section-title {
                font-size: 9pt;
                margin-bottom: 5px;
              }
              
              .comments-section {
                border: 1px solid #ddd;
                background-color: white !important;
                padding: 5px;
                margin-top: 5px;
              }
              
              .comments-title {
                font-size: 9pt;
                margin-bottom: 5px;
              }
              
              .comments-text {
                font-size: 7pt;
                padding: 5px;
              }
              
              footer {
                margin-top: 5px;
                font-size: 7pt;
                padding: 5px;
                text-align: center;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <header class="report-header">
              <div class="report-title">${reportTitle}</div>
              <div class="report-subtitle">${getTimePeriodDisplayName(timePeriod)} Report</div>
            </header>
            
            <div class="info-card">
              <div class="info-row">
                <div class="info-label">Teacher:</div>
                <div class="info-value">${teacher?.name || 'Unknown Teacher'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value">${teacher?.email || 'Unknown Email'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Time Period:</div>
                <div class="info-value accent-value">${getTimePeriodDisplayName(timePeriod)}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Generated:</div>
                <div class="info-value">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Evaluations:</div>
                <div class="info-value">${selectedEvaluations.length} ${selectedEvaluations.length === 1 ? 'evaluation' : 'evaluations'}</div>
              </div>
            </div>
            
            <div class="evaluation-container">
              <aside class="sidebar">
                <div class="nav-card">
                  <div class="nav-title">Table of Contents</div>
                  <ul class="nav-list">
                    ${selectedEvaluations.map((evaluation, index) => `
                      <li class="nav-item">
                        <a href="#evaluation-${index}" class="nav-link">
                          <i class="fas fa-clipboard-check"></i>
                          Evaluation ${index + 1}
                        </a>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                
                <div class="stats-card">
                  <div class="nav-title">Summary Statistics</div>
                  <div class="stat-grid">
                    <div class="stat-item">
                      <div class="stat-value">${selectedEvaluations.length}</div>
                      <div class="stat-label">Total Evaluations</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">
                        ${(() => {
                          const validScores = selectedEvaluations
                            .filter(e => e.overall_score || e.overallScore)
                            .map(e => parseFloat(e.overall_score || e.overallScore));
                          return validScores.length ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2) : 'N/A';
                        })()}
                      </div>
                      <div class="stat-label">Average Score</div>
                    </div>
                  </div>
                </div>
              </aside>
              
              <main class="main-content">
      `;
      
      // Process each evaluation
      selectedEvaluations.forEach((evaluation, index) => {
        // Get unique categories from the evaluation responses
        const categories = [...new Set(
          Object.keys(evaluation.responses || {})
            .map(key => key.split('-')[0])
            .filter(Boolean)
        )];

        // Function to get score color class
        const getScoreColorClass = (score) => {
          if (!score || score === 'N/A') return '';
          const numScore = parseFloat(score);
          if (numScore >= 4.5) return 'score-4-5';
          if (numScore >= 3.5) return 'score-3-5';
          if (numScore >= 2.5) return 'score-2-5';
          if (numScore >= 1.5) return 'score-1-5';
          return 'score-0-1';
        };

        // Evaluation card
        htmlContent += `
          <div id="evaluation-${index}" class="evaluation-card">
            <div class="evaluation-header">
              <div class="evaluation-id">#${index + 1}</div>
              <h2 class="evaluation-title">${evaluation.video_id || `Evaluation ${index + 1}`}</h2>
              <div class="evaluation-meta">
                <div class="meta-item">
                  <i class="fas fa-calendar"></i>
                  ${evaluation.date ? new Date(evaluation.date).toLocaleDateString() : 
                  evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : 'Unknown'}
                </div>
                ${evaluation.qa_evaluator_name || evaluation.qa_evaluator ? `
                  <div class="meta-item">
                    <i class="fas fa-user"></i>
                    ${evaluation.qa_evaluator_name || evaluation.qa_evaluator}
                  </div>
                ` : ''}
                ${evaluation.overall_score || evaluation.overallScore ? `
                  <div class="meta-item">
                    <i class="fas fa-star"></i>
                    <span class="score-badge ${getScoreColorClass(evaluation.overall_score || evaluation.overallScore)}">
                      ${evaluation.overall_score || evaluation.overallScore || 'N/A'}/5
                    </span>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div class="evaluation-body">
              <div class="info-section">
                <h3 class="section-title">
                  <i class="fas fa-info-circle"></i>
                  Basic Information
                </h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-item-label">Video ID</div>
                    <div class="info-item-value">${evaluation.video_id || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-item-label">Class Code</div>
                    <div class="info-item-value">${evaluation.video_id ? evaluation.video_id.split('+0800-')[1]?.replace('.mp4', '') || 'N/A' : 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-item-label">Evaluation Date</div>
                    <div class="info-item-value">${evaluation.date ? new Date(evaluation.date).toLocaleDateString() : 
                      evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : 'Unknown'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-item-label">Evaluation Time</div>
                    <div class="info-item-value">${evaluation.date ? new Date(evaluation.date).toLocaleTimeString() : 
                      evaluation.created_at ? new Date(evaluation.created_at).toLocaleTimeString() : 'Unknown'}</div>
                  </div>
                </div>
              </div>
              
              ${evaluation.additional_comments ? `
                <div class="info-section">
                  <h3 class="section-title">
                    <i class="fas fa-comment-alt"></i>
                    QA Comments
                  </h3>
                  <div class="comments-text">${evaluation.additional_comments}</div>
                </div>
              ` : ''}
              
              <div class="info-section">
                <h3 class="section-title">
                  <i class="fas fa-list"></i>
                  Evaluation Details
                </h3>
                <table class="details-table">
                  <thead>
                    <tr>
                      <th style="width: 15%;">Category</th>
                      <th style="width: 45%;">Subcategory</th>
                      <th style="width: 10%;">Score</th>
                      <th style="width: 30%;">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
        `;

        // Process categories
        categories.forEach((category) => {
          // Skip evaluationComments as it will be shown separately
          if (category !== 'evaluationComments') {
            // Extract all responses for this category
            const categoryResponses = Object.entries(evaluation.responses || {})
              .filter(([key]) => key.startsWith(category))
              .map(([key, value]) => ({
                subcategory: key.replace(`${category}-`, ''),
                score: typeof value === 'object' ? value.score : value,
                comments: typeof value === 'object' ? value.comments : ''
              }));

            if (categoryResponses.length > 0) {
              categoryResponses.forEach((response, responseIdx) => {
                htmlContent += `
                  <tr>
                    ${responseIdx === 0 ? `<td rowspan="${categoryResponses.length}" class="category-row">${category}</td>` : ''}
                    <td>${response.subcategory}</td>
                    <td style="text-align: center;">
                      ${response.score ? `
                        <span class="score-badge ${getScoreColorClass(response.score)}">
                          ${response.score}
                        </span>
                      ` : 'N/A'}
                    </td>
                    <td>${response.comments || ''}</td>
                  </tr>
                `;
              });
            }
          }
        });

        htmlContent += `
                  </tbody>
                </table>
              </div>
              
              ${evaluation.responses && evaluation.responses.evaluationComments ? `
                <div class="comments-section">
                  <h3 class="comments-title">Additional Remarks</h3>
                  <div class="comments-text">${evaluation.responses.evaluationComments}</div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      });

      // Close main content and container
      htmlContent += `
              </main>
            </div>
            <footer>
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              <p>Time Period: ${getTimePeriodDisplayName(timePeriod)}</p>
              <p style="margin-top: 10px; font-style: italic;">This report is optimized for printing on a single page. Use the print button or press Ctrl+P (Cmd+P on Mac) to print.</p>
            </footer>
          </div>
          
          <div class="scale-controls">
            <button onclick="document.body.style.zoom = parseFloat(document.body.style.zoom || 1) * 0.9;" class="scale-btn">Zoom Out (-)</button>
            <button onclick="document.body.style.zoom = parseFloat(document.body.style.zoom || 1) * 1.1;" class="scale-btn">Zoom In (+)</button>
            <div class="scale-hint">Adjust zoom to fit on a single page when printing</div>
          </div>
          
          <a href="#" class="back-to-top">
            <i class="fas fa-arrow-up"></i>
          </a>
          
          <button class="print-button" onclick="window.print()" title="Print this report on a single page">
            <i class="fas fa-print"></i>
            Print Report
          </button>
          
          <script>
            // Simple script to make the "back to top" button appear after scrolling
            window.addEventListener('scroll', function() {
              const backToTop = document.querySelector('.back-to-top');
              if (window.scrollY > 300) {
                backToTop.style.display = 'flex';
              } else {
                backToTop.style.display = 'none';
              }
            });
            
            // Initially hide the button
            document.querySelector('.back-to-top').style.display = 'none';
          </script>
        </body>
        </html>
      `;

      // Format the filename base
      const teacherName = (teacher?.name || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
      const date = new Date().toISOString().split('T')[0];
      const filenameBase = activeTab === 'trialClassEval' 
        ? `trial_class_evaluation_report_${teacherName}_${date}`
        : `teacher_evaluation_report_${teacherName}_${date}`;

      // Ask user if they want HTML or PDF
      const exportFormat = window.confirm(
        'Choose export format:\n\nClick "OK" for PDF format\nClick "Cancel" for HTML format'
      );

      if (exportFormat) {
        // Export as PDF
        const loadingToast = toast.loading('Generating PDF...');
        
        // Create PDF document
        const pdf = new jsPDF('p', 'mm', 'a4');
        let currentPage = 0;
        
        // Process each evaluation as a separate page
        const processEvaluations = async () => {
          try {
            // Create title page
            const titleDiv = document.createElement('div');
            titleDiv.innerHTML = `
              <div style="text-align: center; padding: 40px; font-family: Arial, sans-serif; position: relative; max-width: 800px; margin: 0 auto;">
                <!-- Color Band at Top -->
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 15px; background: linear-gradient(to right, #4CAF50, #2196F3);"></div>
                
                <!-- Logo Placeholder -->
                <div style="margin: 30px 0;">
                  <i class="fas fa-clipboard-check" style="font-size: 50px; color: #4CAF50;"></i>
                </div>
                
                <h1 style="color: #333; margin-bottom: 10px; font-size: 28px; font-weight: 600;">${reportTitle}</h1>
                <h2 style="color: #666; margin-bottom: 30px; font-size: 18px; font-weight: 400; font-style: italic;">
                  ${getTimePeriodDisplayName(timePeriod)} Report
                </h2>
                
                <div style="width: 50px; height: 3px; background-color: #4CAF50; margin: 20px auto;"></div>
                
                <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 5px solid #4CAF50; text-align: left;">
                  <p style="font-size: 16px; margin: 10px 0; display: flex; align-items: center;">
                    <span style="display: inline-block; width: 120px; font-weight: 600; color: #555;">Teacher:</span> 
                    <span style="font-weight: 500;">${teacher?.name || 'Unknown Teacher'}</span>
                  </p>
                  <p style="font-size: 16px; margin: 10px 0; display: flex; align-items: center;">
                    <span style="display: inline-block; width: 120px; font-weight: 600; color: #555;">Email:</span> 
                    <span>${teacher?.email || 'Unknown Email'}</span>
                  </p>
                  <p style="font-size: 16px; margin: 10px 0; display: flex; align-items: center;">
                    <span style="display: inline-block; width: 120px; font-weight: 600; color: #555;">Time Period:</span> 
                    <span style="color: #4CAF50; font-weight: 500;">${getTimePeriodDisplayName(timePeriod)}</span>
                  </p>
                  <p style="font-size: 16px; margin: 10px 0; display: flex; align-items: center;">
                    <span style="display: inline-block; width: 120px; font-weight: 600; color: #555;">Generated:</span> 
                    <span>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span>
                  </p>
                  <p style="font-size: 16px; margin: 10px 0; display: flex; align-items: center;">
                    <span style="display: inline-block; width: 120px; font-weight: 600; color: #555;">Evaluations:</span> 
                    <span>${selectedEvaluations.length} ${selectedEvaluations.length === 1 ? 'evaluation' : 'evaluations'}</span>
                  </p>
                </div>
                
                <div style="font-size: 14px; color: #777; margin-top: 40px;">
                  This report includes detailed evaluation feedback and scoring for the selected time period.
                </div>
                
                <!-- Color Band at Bottom -->
                <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 15px; background: linear-gradient(to left, #4CAF50, #2196F3);"></div>
              </div>
            `;
            document.body.appendChild(titleDiv);
            
            // Convert title page to canvas and add to PDF
            const titleCanvas = await html2canvas(titleDiv, {
              scale: 2,
              useCORS: true,
              logging: false,
              allowTaint: true
            });
            
            const imgData = titleCanvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = titleCanvas.width;
            const imgHeight = titleCanvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 20;
            
            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            document.body.removeChild(titleDiv);
            currentPage++;
            
            // Process each evaluation
            for (let i = 0; i < selectedEvaluations.length; i++) {
              const evaluation = selectedEvaluations[i];
              
              if (currentPage > 0) {
                pdf.addPage();
              }
              
              // Create evaluation HTML
              const evalDiv = document.createElement('div');
              evalDiv.style.width = '800px';
              evalDiv.style.padding = '20px';
              evalDiv.style.fontFamily = 'Arial, sans-serif';
              
              // Get unique categories from the evaluation responses
              const categories = [...new Set(
                Object.keys(evaluation.responses || {})
                  .map(key => key.split('-')[0])
                  .filter(Boolean)
              )];
              
              // Evaluation header
              let evalHtml = `
                <div style="position: relative; padding: 30px 0 20px 0;">
                  <!-- Header bar -->
                  <div style="position: absolute; top: 0; left: 0; right: 0; height: 10px; background: linear-gradient(to right, #4CAF50, #2196F3);"></div>
                  
                  <div style="text-align: center; margin: 20px 0 30px 0;">
                    <h2 style="font-size: 20px; color: #333; margin: 0 0 5px 0; font-weight: 600;">Evaluation Details</h2>
                    <div style="width: 40px; height: 3px; background-color: #4CAF50; margin: 10px auto;"></div>
                    <p style="font-size: 14px; color: #777; margin: 10px 0 0 0;">
                      Evaluation ${i + 1} of ${selectedEvaluations.length} | ${evaluation.date ? new Date(evaluation.date).toLocaleDateString() : 
                      evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                  
                  <!-- Basic Information Card -->
                  <div style="background-color: #f8f8f8; border-radius: 8px; padding: 15px; margin-bottom: 25px; border-left: 5px solid #2196F3; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 15px 0; color: #2196F3; font-size: 16px; font-weight: 600;">Basic Information</h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                      <div style="background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #eee;">
                        <p style="margin: 0; font-size: 13px; color: #777;">Video ID</p>
                        <p style="margin: 5px 0 0 0; font-weight: 500;">${evaluation.video_id || 'N/A'}</p>
                      </div>
                      
                      <div style="background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #eee;">
                        <p style="margin: 0; font-size: 13px; color: #777;">Class Code</p>
                        <p style="margin: 5px 0 0 0; font-weight: 500;">${evaluation.video_id ? evaluation.video_id.split('+0800-')[1]?.replace('.mp4', '') || 'N/A' : 'N/A'}</p>
                      </div>
                      
                      <div style="background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #eee;">
                        <p style="margin: 0; font-size: 13px; color: #777;">Evaluation Date</p>
                        <p style="margin: 5px 0 0 0; font-weight: 500;">${evaluation.date ? new Date(evaluation.date).toLocaleDateString() : 
                            evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                      
                      <div style="background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #eee;">
                        <p style="margin: 0; font-size: 13px; color: #777;">Evaluation Time</p>
                        <p style="margin: 5px 0 0 0; font-weight: 500;">${evaluation.date ? new Date(evaluation.date).toLocaleTimeString() : 
                            evaluation.created_at ? new Date(evaluation.created_at).toLocaleTimeString() : 'Unknown'}</p>
                      </div>
                      
                      <div style="background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #eee;">
                        <p style="margin: 0; font-size: 13px; color: #777;">Overall Score</p>
                        <p style="margin: 5px 0 0 0; font-weight: 700; color: #4CAF50; font-size: 16px;">
                          ${evaluation.overall_score || evaluation.overallScore || 'N/A'}<span style="font-size: 12px; font-weight: 400; margin-left: 3px;">/5</span>
                        </p>
                      </div>
                      
                      <div style="background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #eee;">
                        <p style="margin: 0; font-size: 13px; color: #777;">QA Evaluator</p>
                        <p style="margin: 5px 0 0 0; font-weight: 500;">${evaluation.qa_evaluator_name || evaluation.qa_evaluator || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
              `;
              
              // Evaluation Details section
              evalHtml += `
                <div style="background-color: #666; color: white; text-align: center; padding: 8px; font-weight: bold; margin-bottom: 5px;">
                  EVALUATION DETAILS
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border: 1px solid #666;">
                    <th style="width: 15%; background-color: #666; color: white; text-align: center; padding: 8px; border: 1px solid #666;">Category</th>
                    <th style="width: 45%; background-color: #666; color: white; text-align: center; padding: 8px; border: 1px solid #666;">Subcategory</th>
                    <th style="width: 10%; background-color: #666; color: white; text-align: center; padding: 8px; border: 1px solid #666;">Score</th>
                    <th style="width: 30%; background-color: #666; color: white; text-align: center; padding: 8px; border: 1px solid #666;">Comments</th>
                  </tr>
              `;
              
              // Process each category with different background colors
              const bgColors = ['#ffffcc', '#ffcccc', '#e6ccff', '#ccffcc'];
              categories.forEach((category, idx) => {
                // Skip evaluationComments as it will be shown separately
                if (category !== 'evaluationComments') {
                  evalHtml += formatPdfCategorySection(evaluation, category, bgColors[idx % bgColors.length]);
                }
              });
              
              // Close the table
              evalHtml += `</table>`;

              // Add evaluationComments as remarks if they exist
              if (evaluation.responses && evaluation.responses.evaluationComments) {
                evalHtml += `
                  <div style="background-color: #f8f8f8; border-radius: 8px; padding: 15px; margin-top: 25px; border-left: 5px solid #FF9800; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 15px 0; color: #FF9800; font-size: 16px; font-weight: 600;">Additional Remarks</h3>
                    <div style="background-color: white; padding: 15px; border-radius: 6px; white-space: pre-line; color: #555; font-family: Arial, sans-serif;">
                      ${evaluation.responses.evaluationComments}
                    </div>
                  </div>
                `;
              }
              
              // Set the HTML content
              evalDiv.innerHTML = evalHtml;
              document.body.appendChild(evalDiv);
              
              // Convert to canvas and add to PDF
              const canvas = await html2canvas(evalDiv, {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true
              });
              
              const evalImgData = canvas.toDataURL('image/png');
              const evalImgWidth = canvas.width;
              const evalImgHeight = canvas.height;
              const evalRatio = Math.min(pdfWidth / evalImgWidth, pdfHeight / evalImgHeight);
              const evalImgX = (pdfWidth - evalImgWidth * evalRatio) / 2;
              const evalImgY = 10;
              
              pdf.addImage(evalImgData, 'PNG', evalImgX, evalImgY, evalImgWidth * evalRatio, evalImgHeight * evalRatio);
              document.body.removeChild(evalDiv);
              currentPage++;
            }
            
            // Save the PDF
            pdf.save(`${filenameBase}.pdf`);
            toast.dismiss(loadingToast);
            toast.success(`PDF exported successfully (${currentPage} pages)`);
          } catch (err) {
            console.error('Error generating PDF:', err);
            toast.dismiss(loadingToast);
            toast.error('Failed to generate PDF');
          }
        };
        
        // Start processing
        processEvaluations();
      } else {
        // Export as HTML
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
        link.setAttribute('download', `${filenameBase}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
        toast.success('HTML report exported successfully');
      }
      
      // Clear selection
      setSelectedForExport([]);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export evaluation data');
    }
  };

  // Add these functions right after the state declarations
  const handleSelectAllForExport = () => {
    // Get the evaluations based on current tab and time period filter
    const currentEvaluations = activeTab === 'trialClassEval'
      ? filterEvaluationsByTimePeriod(f1Evaluations, timePeriod)
      : filterEvaluationsByTimePeriod(evaluations, timePeriod);

    // Check if all visible evaluations are already selected
    const allSelected = currentEvaluations.every(evaluation => 
      selectedForExport.includes(evaluation.id)
    );
    
    if (allSelected) {
      // If all are selected, deselect all
      setSelectedForExport([]);
    } else {
      // Otherwise, select all visible evaluations
      const visibleIds = currentEvaluations.map(evaluation => evaluation.id);
      
      // Keep existing selections that might be from other tabs
      const otherSelections = selectedForExport.filter(id => 
        !currentEvaluations.some(evaluation => evaluation.id === id)
      );
      
      setSelectedForExport([...otherSelections, ...visibleIds]);
    }
  };

  const handleToggleExportSelection = (evaluationId) => {
    setSelectedForExport(prev => {
      if (prev.includes(evaluationId)) {
        // If already selected, remove it
        return prev.filter(id => id !== evaluationId);
      } else {
        // If not selected, add it
        return [...prev, evaluationId];
      }
    });
  };

  // Add the function to auto calculate grade for trial classes
  const autoCalculateTrialClassGrade = (forceRefresh = false) => {
    if (!forceRefresh && finalGrade) {
      // If we already have a grade and aren't forcing a refresh, don't recalculate
      return;
    }
    
    if (f1Evaluations.length === 0) {
      toast.error('No trial class evaluations available for calculating grade');
      return;
    }
    
    // Calculate average score from evaluations with time period filtering
    const avgScore = calculateAverageScore(f1Evaluations, timePeriod);
    
    if (avgScore === 'N/A') {
      toast.error('Cannot calculate grade: no valid evaluation scores found');
      return;
    }
    
    // Set the calculated grade
    setFinalGrade(avgScore);
    toast.success(`Auto-calculated grade: ${avgScore} (from ${getTimePeriodDisplayName(timePeriod).toLowerCase()} evaluations)`);
    
    // Get the current month and year if not already set
    if (!evaluationMonth) {
      const currentDate = new Date();
      setEvaluationMonth(String(currentDate.getMonth() + 1));
    }
    
    if (!evaluationYear) {
      const currentDate = new Date();
      setEvaluationYear(String(currentDate.getFullYear()));
    }
  };

  // Add the function to submit the trial class grade
  const handleSubmitTrialClassGrade = async () => {
    if (!teacher || !teacher.email) {
      toast.error('Teacher information is not available');
      return;
    }
    
    if (finalGrade === undefined || finalGrade === null || finalGrade === '') {
      toast.error('Please provide a valid grade');
      return;
    }
    
    try {
      setSubmittingGrade(true);
      setSubmissionError(null);
      
      // Calculate average score for reporting using the time-filtered evaluations
      const filteredF1Evaluations = filterEvaluationsByTimePeriod(f1Evaluations, timePeriod);
      
      // Create a grade object for trial classes
      const gradeData = {
        teacher_id: teacher.email,
        grade: parseFloat(finalGrade).toFixed(2),
        comments: qaComments,
        month: evaluationMonth,
        year: evaluationYear,
        trialClass: true, // Mark this as a trial class grade
        qa_evaluator: qaEvaluator,
        time_period: timePeriod, // Include time period used for calculation
        evaluation_ids: filteredF1Evaluations.map(evaluation => evaluation.id) // Include evaluation IDs used
      };
      
      console.log('Submitting trial class grade:', gradeData);
      
      // Use teacherGradesService to save grade
      const result = await teacherGradesService.saveTeacherGrade({
        ...gradeData,
        trialClass: true // Mark this as a trial class grade
      });
      
      console.log('Grade submission result:', result);
      
      toast.success('Trial class grade submitted successfully');
      
      // Update the canEvaluate state and teacher grade
      setCanEvaluate(false);
      setTeacherGrade({
        ...gradeData,
        id: result.id || Date.now(),
        created_at: new Date().toISOString()
      });
      
      // Reset form
      setFinalGrade('');
      setQaComments('');
      
      // Refresh evaluation status to show updated grade
      checkEvaluationStatus();
      
    } catch (error) {
      console.error('Error submitting grade:', error);
      setSubmissionError(error.message);
      toast.error(`Failed to submit grade: ${error.message}`);
    } finally {
      setSubmittingGrade(false);
    }
  };

  useEffect(() => {
    if (teacher) {
      checkEvaluationStatus();
    }
  }, [teacher, activeTab, f1Evaluations.length]);

  const checkEvaluationStatus = async () => {
    try {
      setLoading(true);
      
      // Different endpoint URL based on whether it's a trial class or regular evaluation
      const isTrialClass = activeTab === 'trialClassEval';
      const endpoint = `${API_URL}/teachers/${encodeURIComponent(teacher.email)}/grade${isTrialClass ? '?trialClass=true' : ''}`;
      
      console.log('Checking evaluation status at:', endpoint);
      
      // Use apiService instead of direct fetch
      const data = await apiRequest(endpoint);
      console.log('Evaluation status data:', data);
      
      if (data) {
        setTeacherGrade(data);
        
        // Use the canEvaluate flag from the server
        setCanEvaluate(data.canEvaluate);
        
        // Use the actual month/year from the server response
        setEvaluationMonth(data.month || new Date().getMonth() + 1);
        setEvaluationYear(data.year || new Date().getFullYear());
        
        // Set appropriate title based on grade/tc_grades - use the grade value based on the current tab
        let gradeValue = 'Not Graded';
        if (isTrialClass && data.tc_grades !== null && data.tc_grades !== undefined) {
          gradeValue = data.tc_grades;
        } else if (!isTrialClass && data.grade !== null && data.grade !== undefined) {
          gradeValue = data.grade;
        }
        
        setGradeDisplay(gradeValue);
        
        // Store current month info for the UI
        setCurrentMonth(data.currentMonth || new Date().getMonth() + 1);
        setCurrentYear(data.currentYear || new Date().getFullYear());
        
        // If this is a trial class evaluation and there are f1Evaluations but no grade yet, auto-calculate
        if (isTrialClass && f1Evaluations.length > 0 && data.canEvaluate) {
          // We'll auto-calculate the grade after the component is fully rendered
          setTimeout(() => {
            // Inline implementation instead of calling autoCalculateTrialClassGrade
            if (f1Evaluations.length === 0) {
              toast.error('No trial class evaluations available for calculating grade');
              return;
            }
            
            // Calculate average score from evaluations with time period filtering
            const avgScore = calculateAverageScore(f1Evaluations, timePeriod);
            
            if (avgScore === 'N/A') {
              toast.error('Cannot calculate grade: no valid evaluation scores found');
              return;
            }
            
            // Set the calculated grade
            setFinalGrade(avgScore);
            toast.success(`Auto-calculated grade: ${avgScore} (from ${getTimePeriodDisplayName(timePeriod).toLowerCase()} evaluations)`);
            
            // Get the current month and year if not already set
            if (!evaluationMonth) {
              const currentDate = new Date();
              setEvaluationMonth(String(currentDate.getMonth() + 1));
            }
            
            if (!evaluationYear) {
              const currentDate = new Date();
              setEvaluationYear(String(currentDate.getFullYear()));
            }
          }, 500);
        }
      } else {
        setCanEvaluate(true);
        setTeacherGrade(null);
        setGradeDisplay('Not Graded');
        
        // Auto-calculate if we have evaluations
        if (isTrialClass && f1Evaluations.length > 0) {
          setTimeout(() => {
            // Inline implementation instead of calling autoCalculateTrialClassGrade
            if (f1Evaluations.length === 0) {
              toast.error('No trial class evaluations available for calculating grade');
              return;
            }
            
            // Calculate average score from evaluations with time period filtering
            const avgScore = calculateAverageScore(f1Evaluations, timePeriod);
            
            if (avgScore === 'N/A') {
              toast.error('Cannot calculate grade: no valid evaluation scores found');
              return;
            }
            
            // Set the calculated grade
            setFinalGrade(avgScore);
            toast.success(`Auto-calculated grade: ${avgScore} (from ${getTimePeriodDisplayName(timePeriod).toLowerCase()} evaluations)`);
            
            // Get the current month and year if not already set
            if (!evaluationMonth) {
              const currentDate = new Date();
              setEvaluationMonth(String(currentDate.getMonth() + 1));
            }
            
            if (!evaluationYear) {
              const currentDate = new Date();
              setEvaluationYear(String(currentDate.getFullYear()));
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error checking evaluation status:', error);
      setCanEvaluate(true); // Default to allowing evaluation if check fails
      setGradeDisplay('Not Graded'); // Default display value on error
      toast.error('Error checking evaluation status');
    } finally {
      setLoading(false);
    }
  };

  // Add a helper function to check if a recording has comments
  const hasComments = (recording) => {
    if (!recording) return false;
    
    // Get all possible recording identifiers
    const recordingIds = [
      recording.name,
      recording.id,
      recording.fileName,
      recording.videoId
    ].filter(Boolean); // Filter out nulls/undefined
    
    if (recordingIds.length === 0) return false;
    
    // Check if there are evaluations for this recording using any of its identifiers
    const evaluationsData = [...evaluations, ...f1Evaluations];
    return evaluationsData.some(evaluation => 
      recordingIds.some(id => 
        evaluation.video_id === id || 
        // Also check if the evaluation video_id contains the recording id (for partial matches)
        (evaluation.video_id && id && evaluation.video_id.includes(id))
      )
    );
  };

  // Add a helper function to check if a recording has threads (replies)
  const hasThreads = (recording) => {
    if (!recording) return false;
    
    // Get all possible recording identifiers
    const recordingIds = [
      recording.name,
      recording.id,
      recording.fileName,
      recording.videoId
    ].filter(Boolean); // Filter out nulls/undefined
    
    if (recordingIds.length === 0) return false;
    
    // Check if there are evaluations with replies for this recording
    const evaluationsData = [...evaluations, ...f1Evaluations];
    return evaluationsData.some(evaluation => 
      (recordingIds.some(id => 
        evaluation.video_id === id || 
        (evaluation.video_id && id && evaluation.video_id.includes(id))
      )) && 
      evaluation.hasReplies
    );
  };

  // Add useEffect to log debug info about recordings and comments
  useEffect(() => {
    if (recordings && recordings.length > 0 && (evaluations.length > 0 || f1Evaluations.length > 0)) {
      console.log('Checking for recordings with comments...');
      
      // Count recordings with comments
      let recordingsWithComments = 0;
      let recordingsWithThreads = 0;
      
      recordings.forEach(recording => {
        if (hasComments(recording)) {
          recordingsWithComments++;
          console.log('Recording with comments:', recording.name || recording.id);
        }
        
        if (hasThreads(recording)) {
          recordingsWithThreads++;
        }
      });
      
      console.log(`Found ${recordingsWithComments} recordings with comments`);
      console.log(`Found ${recordingsWithThreads} recordings with threads`);
      
      // Log all evaluations for debugging
      console.log('All evaluations:', [...evaluations, ...f1Evaluations]);
    }
  }, [recordings, evaluations, f1Evaluations]);

  // Add function to fetch all markers for this teacher
  const fetchTeacherMarkers = async (teacherEmail) => {
    try {
      if (!teacherEmail) return;
      
      console.log('Fetching markers for teacher:', teacherEmail);
      
      // Use the markerService from apiService.js to get all markers for this teacher
      const markers = await markerService.getTeacherMarkers(teacherEmail);
      
      console.log('Markers fetched:', markers);
      
      // Store markers in state
      setVideoMarkers(markers || []);
    } catch (error) {
      console.error('Error fetching teacher markers:', error);
    }
  };
  
  // Add a function to check if a recording has amazing markers
  const hasAmazingMarkers = (recording) => {
    if (!recording || !videoMarkers.length) return false;
    
    // Get all possible recording identifiers
    const recordingIds = [
      recording.name,
      recording.id,
      recording.fileName,
      recording.videoId
    ].filter(Boolean); // Filter out nulls/undefined
    
    if (recordingIds.length === 0) return false;
    
    // Check if any markers match this recording and are "amazing" type
    return videoMarkers.some(marker => 
      marker.marker_type === 'amazing' && 
      recordingIds.some(id => 
        marker.recording_id === id || 
        (marker.recording_id && id && marker.recording_id.includes(id))
      )
    );
  };
  
  // Add a function to check if a recording has error markers
  const hasErrorMarkers = (recording) => {
    if (!recording || !videoMarkers || videoMarkers.length === 0) return false;
    
    // Get all possible recording IDs for this recording
    const recordingIds = [
      recording.id,
      recording.recordingId,
      recording.videoId
    ].filter(Boolean); // Filter out nulls/undefined
    
    if (recordingIds.length === 0) return false;
    
    // Check if any markers match this recording and are "incident" type
    return videoMarkers.some(marker => 
      marker.marker_type === 'incident' && 
      recordingIds.some(id => 
        marker.recording_id === id || 
        (marker.recording_id && id && marker.recording_id.includes(id))
      )
    );
  };

  // Updated useEffect to fetch markers when teacher data is loaded
  useEffect(() => {
    if (teacher && teacher.email) {
      fetchTeacherMarkers(teacher.email);
    }
  }, [teacher]);

  // Add debug logging for markers
  useEffect(() => {
    if (videoMarkers.length > 0 && recordings.length > 0) {
      console.log('Checking recordings for markers...');
      
      // Count recordings with different marker types
      let recordingsWithAmazingMarkers = 0;
      let recordingsWithErrorMarkers = 0;
      
      recordings.forEach(recording => {
        if (hasAmazingMarkers(recording)) {
          recordingsWithAmazingMarkers++;
          console.log('Recording with amazing markers:', recording.name || recording.id);
        }
        
        if (hasErrorMarkers(recording)) {
          recordingsWithErrorMarkers++;
          console.log('Recording with error markers:', recording.name || recording.id);
        }
      });
      
      console.log(`Found ${recordingsWithAmazingMarkers} recordings with amazing markers`);
      console.log(`Found ${recordingsWithErrorMarkers} recordings with error markers`);
      
      // Log all markers for debugging
      console.log('All video markers:', videoMarkers);
    }
  }, [recordings, videoMarkers]);

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
        <p>There was a problem fetching the teacher data. Please try again later.</p>
      </div>
      <BackButton onClick={handleBackToTeachers}>
        <i className="fas fa-arrow-left"></i> Back to Teachers
      </BackButton>
    </TeachersLayout>
  );

  return (
    <TeachersLayout activeView="teacherList">
      <Toaster position="top-right" />
      <PageTitle>{teacher?.name || 'Teacher'} Recordings</PageTitle>
      
      <TabContainer>
        <Tab 
          $active={activeTab === 'recordings'} 
          onClick={() => handleTabSelection('recordings')}
        >
          Video Recordings
        </Tab>
        <Tab 
          $active={activeTab === 'evaluations'} 
          onClick={() => handleTabSelection('evaluations')}
        >
          Evaluations & Grading
        </Tab>
        <Tab 
          $active={activeTab === 'trialClass'} 
          onClick={() => handleTabSelection('trialClass')}
        >
          Trial Class
        </Tab>
        <Tab 
          $active={activeTab === 'trialClassEval'} 
          onClick={() => handleTabSelection('trialClassEval')}
        >
          Trial Class Evaluation
        </Tab>
      </TabContainer>
      
      {activeTab === 'recordings' || activeTab === 'trialClass' ? (
        <>
          {(activeTab === 'recordings' || activeTab === 'trialClass') && (
          <SearchContainer>
            <SearchBar 
              type="text" 
              placeholder="Search recordings..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <DateFilterContainer>
              <DateInput 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
              <DateFilterLabel>to</DateFilterLabel>
              <DateInput 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
              {(dateRange.start || dateRange.end) && (
                <ClearFilterButton onClick={() => setDateRange({ start: '', end: '' })}>
                  <i className="fas fa-times"></i>
                  Clear
                </ClearFilterButton>
              )}
            </DateFilterContainer>
            
            {/* Only show class filter on the recordings tab, not on trial class tab */}
            {activeTab === 'recordings' && availableClassCodes.length > 0 && (
              <ClassFilterContainer>
                <FilterSectionTitle>
                  <i className="fas fa-filter"></i>
                  Filter by class:
                </FilterSectionTitle>
                {availableClassCodes.map(classCode => (
                  <ClassFilterButton 
                    key={classCode}
                    $active={selectedClassCode === classCode}
                    onClick={() => handleClassCodeFilter(classCode)}
                  >
                    {classCode}
                  </ClassFilterButton>
                ))}
                {selectedClassCode && (
                  <ClearFilterButton onClick={() => handleClassCodeFilter('')}>
                    <i className="fas fa-times"></i>
                    Clear Class
                  </ClearFilterButton>
                )}
              </ClassFilterContainer>
            )}
          </SearchContainer>
          )}
          
          {filteredRecordings.length > 0 ? (
            <>
              <RecordingsGrid>
                {filteredRecordings.map((recording, index) => {
                  // Extract class code from recording
                  const classCode = recording.classCode || 'Unknown Class';
                  
                  // Format date
                  const recordingDate = recording.recordingDate || recording.date 
                    ? new Date(recording.recordingDate || recording.date).toLocaleDateString() 
                    : 'Unknown date';
                  
                  // Extract time from filename
                  let recordingTime = recording.recordingTime || '';
                  if (!recordingTime && recording.name) {
                    // Try to extract time from the format YYYY.MM.DD-HH.MM
                    const timeMatch = recording.name.match(/\d{4}\.\d{2}\.\d{2}-(\d{2})\.(\d{2})/);
                    if (timeMatch) {
                      const hours = parseInt(timeMatch[1]);
                      const minutes = timeMatch[2];
                      const ampm = hours >= 12 ? 'PM' : 'AM';
                      const hours12 = hours % 12 || 12; // Convert 0 to 12
                      recordingTime = `${hours12}:${minutes} ${ampm}`;
                    } 
                    // Try to extract time from AM/PM format
                    else {
                      const ampmMatch = recording.name.match(/(\d{2})(\d{2})([AP]M)/);
                      if (ampmMatch) {
                        recordingTime = `${ampmMatch[1]}:${ampmMatch[2]} ${ampmMatch[3]}`;
                      }
                    }
                  }
                  
                  // Use getVideoPlaybackUrl directly
                  const videoUrl = getVideoPlaybackUrl(teacher.email, recording.fileName, recording.fileId);
                  
                  // Generate download URL using getVideoDownloadUrl directly
                  const downloadUrl = getVideoDownloadUrl(teacher.email, recording.fileName, recording.fileId);
                  
                  return (
                    <RecordingCard key={index} onClick={() => handleRecordingClick(recording)}>
                      <RecordingThumbnail>
                        <i className="fas fa-video"></i>
                      </RecordingThumbnail>
                      <RecordingInfo>
                        <RecordingTitle>
                          <ClassBadge>{classCode}</ClassBadge>
                          {recording.fullClassName || 'Untitled Recording'}
                        </RecordingTitle>
                        
                        {/* Separate row for indicators */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          {hasComments(recording) && (
                            <CommentIndicator title="Has comments">
                              <i className="fas fa-comment"></i>
                            </CommentIndicator>
                          )}
                          {hasThreads(recording) && (
                            <ThreadIndicator title="Has conversation threads">
                              <i className="fas fa-comments"></i>
                            </ThreadIndicator>
                          )}
                          {hasAmazingMarkers(recording) && (
                            <AmazingMarkerIndicator title="Has amazing moments">
                              <i className="fas fa-star"></i>
                            </AmazingMarkerIndicator>
                          )}
                          {hasErrorMarkers(recording) && (
                            <ErrorMarkerIndicator title="Has error/improvement markers">
                              <i className="fas fa-exclamation-circle"></i>
                            </ErrorMarkerIndicator>
                          )}
                          
                          {/* Add static indicators for testing if needed */}
                          {activeTab === 'trialClass' && recording.name && recording.name.includes('01') && !hasComments(recording) && (
                            <CommentIndicator title="Test indicator">
                              <i className="fas fa-comment"></i>
                            </CommentIndicator>
                          )}
                        </div>
                        
                        <RecordingDate>
                          <i className="fas fa-calendar-alt"></i>
                          {recordingDate}
                          {recordingTime && (
                            <span style={{ marginLeft: '8px' }}>
                              <i className="fas fa-clock" style={{ marginRight: '4px' }}></i>
                              {recordingTime}
                            </span>
                          )}
                        </RecordingDate>
                        <RecordingMeta>
                          {recording.fileName && (
                            <RecordingFileName>{recording.fileName}</RecordingFileName>
                          )}
                        </RecordingMeta>
                      </RecordingInfo>
                    </RecordingCard>
                  );
                })}
              </RecordingsGrid>
              
              {/* Add pagination controls */}
              {!searchTerm && !selectedClassCode && !dateRange.start && !dateRange.end && (
                <PaginationControls>
                  {loadingMore ? (
                    <LoadingIndicator>
                      <i className="fas fa-spinner fa-spin"></i>
                      Loading more recordings...
                    </LoadingIndicator>
                  ) : !allLoaded ? (
                    <LoadMoreButton 
                      onClick={handleLoadMore}
                      disabled={loadingMore || !nextPageToken}
                    >
                      Load More Recordings
                    </LoadMoreButton>
                  ) : (
                    <p>All recordings loaded</p>
                  )}
                </PaginationControls>
              )}
            </>
          ) : (
            <NoRecordingsMessage>
              <i className="fas fa-video-slash"></i>
              <p>No recordings found{searchTerm ? ` matching "${searchTerm}"` : ''}.</p>
            </NoRecordingsMessage>
          )}
        </>
      ) : activeTab === 'evaluations' ? (
        <>
          <EvaluationContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Evaluation History</h3>
              {evaluations.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 500 }}>
                    Average Score ({getTimePeriodDisplayName(timePeriod)}):
                    <InfoIcon data-tooltip={`Calculated from ${filterEvaluationsByTimePeriod(evaluations, timePeriod).length} evaluations during the ${getTimePeriodDisplayName(timePeriod).toLowerCase()} period`}>
                      <i className="fas fa-info"></i>
                    </InfoIcon>
                  </span>
                  <EvaluationScoreBadge $score={calculateAverageScore(evaluations) === 'N/A' ? 'N/A' : parseFloat(calculateAverageScore(evaluations))}>
                    {calculateAverageScore(evaluations)}
                  </EvaluationScoreBadge>
                  <span style={{ fontSize: '12px', color: '#666' }}>(1-5 scale)</span>
                </div>
              )}
            </div>
            
            {/* Add time period selector */}
            {evaluations.length > 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                marginBottom: '20px',
                background: '#f9f9f9',
                padding: '10px 16px',
                borderRadius: '6px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-filter" style={{ color: '#666' }}></i>
                  <span style={{ fontWeight: 500 }}>Time Period:</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['current_month', 'previous_month', 'last_3_months', 'last_6_months', 'all'].map(period => (
                    <button
                      key={period}
                      onClick={() => handleTimePeriodChange(period)}
                      style={{
                        padding: '6px 12px',
                        background: timePeriod === period ? '#3498db' : '#fff',
                        color: timePeriod === period ? '#fff' : '#333',
                        border: `1px solid ${timePeriod === period ? '#3498db' : '#ddd'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: timePeriod === period ? '600' : '400',
                        transition: 'all 0.2s ease'
                      }}
                      title="Your selection will be remembered for next time"
                    >
                      {getTimePeriodDisplayName(period)}
                      {period === 'current_month' && (
                        <span style={{ marginLeft: '4px', fontSize: '11px' }}>(Default)</span>
                      )}
                    </button>
                  ))}
                </div>
                <div style={{ 
                  marginLeft: 'auto', 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '13px', 
                  color: '#666'
                }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                  Showing {filterEvaluationsByTimePeriod(evaluations, timePeriod).length} evaluations
                  <span style={{ 
                    marginLeft: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: '#0066cc', 
                    fontSize: '12px' 
                  }}>
                    <i className="fas fa-save" style={{ marginRight: '4px', fontSize: '10px' }}></i>
                    Your preference is saved
                  </span>
                </div>
              </div>
            )}
            
            {evaluations.length > 0 ? (
              <>
                {/* If there are evaluations but none in the current time period */}
                {evaluations.length > 0 && filterEvaluationsByTimePeriod(evaluations, timePeriod).length === 0 ? (
                  <div style={{
                    padding: '12px 16px',
                    background: '#fff8e1',
                    border: '1px solid #ffe0b2',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <i className="fas fa-info-circle" style={{ color: '#ff9800', fontSize: '18px' }}></i>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>No evaluations found for {getTimePeriodDisplayName(timePeriod).toLowerCase()}</p>
                      <p style={{ margin: '0', fontSize: '14px' }}>
                        This teacher has {evaluations.length} evaluation(s) but none from {getTimePeriodDisplayName(timePeriod).toLowerCase()}. 
                        Try selecting a different time period above to view all evaluations.
                      </p>
                    </div>
                  </div>
                ) : (
                  // Only show evaluations for the selected time period
                  filterEvaluationsByTimePeriod(evaluations, timePeriod).map((evaluation, index) => (
                    <EvaluationCard key={evaluation.id || index}>
                      <EvaluationHeader 
                        onClick={() => handleEvaluationSelection(evaluation.id)}
                        $selected={selectedEvaluations.includes(evaluation.id)}
                      >
                        <EvaluationTitle>
                          <i className="fas fa-clipboard-check"></i>
                          {evaluation.video_id || `Evaluation #${index + 1}`}
                          {!canEvaluate && (
                            <span style={{ 
                              marginLeft: '8px', 
                              fontSize: '12px', 
                              color: '#666',
                              fontStyle: 'italic' 
                            }}>
                              (Graded for {getMonthName(evaluationMonth)} {evaluationYear})
                            </span>
                          )}
                        </EvaluationTitle>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <EvaluationDate>
                            {new Date(evaluation.created_at).toLocaleDateString()}
                          </EvaluationDate>
                          {evaluation.overall_score && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <EvaluationScoreBadge 
                                $score={
                                  typeof evaluation.overall_score === 'string' && evaluation.overall_score !== 'N/A' 
                                    ? parseFloat(evaluation.overall_score) 
                                    : evaluation.overall_score
                                }
                              >
                                {typeof evaluation.overall_score === 'number' || 
                                 (typeof evaluation.overall_score === 'string' && !isNaN(parseFloat(evaluation.overall_score)))
                                  ? parseFloat(evaluation.overall_score).toFixed(2)
                                  : evaluation.overall_score
                                }
                              </EvaluationScoreBadge>
                              <span style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}>/5</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <i className={`fas fa-chevron-${selectedEvaluations.includes(evaluation.id) ? 'down' : 'right'}`} style={{ color: '#888', fontSize: '14px' }}></i>
                          </div>
                        </div>
                      </EvaluationHeader>
                      <EvaluationContent $expanded={selectedEvaluations.includes(evaluation.id)}>
                        {evaluation.additional_comments && (
                          <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ marginTop: 0 }}>Comments:</h4>
                            <p style={{ whiteSpace: 'pre-line' }}>{evaluation.additional_comments}</p>
                          </div>
                        )}
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{ marginTop: 0 }}>Evaluator:</h4>
                          <p style={{ fontWeight: '500' }}>{evaluation.qa_evaluator_name || (evaluation.qa_evaluator ? extractUsername(evaluation.qa_evaluator) : 'Unknown User')}</p>
                        </div>
                        
                        {/* Display evaluation details */}
                        {evaluation.responses && Object.keys(evaluation.responses).length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ marginTop: 0 }}>Evaluation Details:</h4>
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                              gap: '12px',
                              background: '#f9f9f9',
                              padding: '12px',
                              borderRadius: '6px'
                            }}>
                              {Object.entries(evaluation.responses).map(([key, value]) => (
                                <div key={key} style={{ marginBottom: '8px' }}>
                                  <div style={{ fontWeight: '500', fontSize: '14px', color: '#555' }}>
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                  </div>
                                  <div style={{ fontSize: '15px' }}>
                                    {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Display any other evaluation details if available */}
                        {evaluation.evaluation_details && 
                         typeof evaluation.evaluation_details === 'object' && 
                         Object.keys(evaluation.evaluation_details).length > 0 && 
                         evaluation.evaluation_details !== evaluation.responses && (
                          <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ marginTop: 0 }}>Additional Details:</h4>
                            <div style={{ 
                              background: '#f9f9f9',
                              padding: '12px',
                              borderRadius: '6px'
                            }}>
                              {Object.entries(evaluation.evaluation_details).map(([key, value]) => (
                                <div key={key} style={{ marginBottom: '8px' }}>
                                  <div style={{ fontWeight: '500', fontSize: '14px', color: '#555' }}>
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                  </div>
                                  <div style={{ fontSize: '15px' }}>
                                    {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </EvaluationContent>
                    </EvaluationCard>
                  ))
                )}
                
                <GradingSection>
                  <GradingTitle>
                    <i className="fas fa-star"></i>
                    Final Grade
                  </GradingTitle>
                  
                  {/* Evaluation Status */}
                  {evaluationMonth && evaluationYear && (
                    <EvaluationPeriod>
                      <i className="fas fa-calendar-alt"></i>
                      Last evaluated: {getMonthName(evaluationMonth)} {evaluationYear}
                    </EvaluationPeriod>
                  )}
                  
                  {/* Evaluation Status */}
                  <EvaluationStatus $canEvaluate={canEvaluate}>
                    <div className="evaluation-status-content">
                      <i className={canEvaluate ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i>
                      {canEvaluate 
                       ? `You can evaluate this teacher for the current month.`
                       : `You have already evaluated this teacher for ${getMonthName(evaluationMonth)} ${evaluationYear}. You can evaluate again on the 1st day of next month.`}
                    </div>
                  </EvaluationStatus>
                  
                  <CurrentGradeSection>
                    <div className="current-grade-label">Current Grade:</div>
                    <CurrentGradeValue>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div>
                          {gradeDisplay}
                          <span style={{ fontSize: '14px', color: '#666', marginLeft: '4px' }}>/5</span>
                        </div>
                      </div>
                    </CurrentGradeValue>
                  </CurrentGradeSection>

                  <_HistoryToolbarSection>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 500 }}>
                      <span>Final Monthly Grade:</span>
                      <GradeValue>
                        {gradeDisplay}
                      </GradeValue>
                    </div>
                  </_HistoryToolbarSection>
                  
                  <div style={{ marginBottom: '16px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <label style={{ fontWeight: 500 }}>
                        New Grade (based on {getTimePeriodDisplayName(timePeriod).toLowerCase()} evaluations):
                        <InfoIcon data-tooltip={`Calculated from ${filterEvaluationsByTimePeriod(evaluations, timePeriod).length} evaluations during the ${getTimePeriodDisplayName(timePeriod).toLowerCase()} period`}>
                          <i className="fas fa-info"></i>
                        </InfoIcon>
                      </label>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        background: '#f0f8f0', 
                        padding: '8px 16px', 
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontWeight: '600',
                        fontSize: '18px'
                      }}>
                        {finalGrade || calculateAverageScore(evaluations, timePeriod)}
                        <span style={{ fontSize: '14px', color: '#666', marginLeft: '4px' }}>/5</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                      Auto-calculated from average score during the <span style={{ fontWeight: '500' }}>{getTimePeriodDisplayName(timePeriod).toLowerCase()}</span> period. You can manually adjust if needed.
                      {process.env.NODE_ENV === 'development' && (
                        <div style={{ marginTop: '4px', color: '#999' }}>
                          Debug: Average Score ({getTimePeriodDisplayName(timePeriod)}) = {calculateAverageScore(evaluations, timePeriod)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        onClick={() => autoCalculateGrade(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#f5f5f5',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fas fa-sync-alt"></i>
                        Auto-calculate Grade
                      </button>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        color: '#4CAF50',
                        fontSize: '14px'
                      }}>
                        <i className="fas fa-check-circle"></i>
                        Auto-calculated
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                      QA Comments:
                    </label>
                    <CommentsTextarea 
                      placeholder="Enter comments about the teacher's performance..." 
                      value={qaComments}
                      onChange={(e) => setQaComments(e.target.value)}
                      disabled={!canEvaluate}
                    />
                  </div>
                  <GradingActions style={{ marginTop: '16px' }}>
                    {canEvaluate && (
                      <SaveGradeButton 
                        onClick={handleSubmitGrade} 
                        disabled={submittingGrade}
                      >
                        {submittingGrade ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save"></i>
                            Save Final Grade
                          </>
                        )}
                      </SaveGradeButton>
                    )}
                    {!canEvaluate && evaluationMonth && evaluationYear && (
                      <div style={{ 
                        color: '#666', 
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#f5f5f5',
                        padding: '12px 16px',
                        borderRadius: '4px'
                      }}>
                        <i className="fas fa-info-circle"></i>
                        Teacher already evaluated for {getMonthName(evaluationMonth)} {evaluationYear}
                      </div>
                    )}
                  </GradingActions>
                  
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#666', 
                    marginTop: '8px', 
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    The grade is automatically calculated from the average score of all evaluations.
                  </div>
                  
                  {submissionError && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#ffebee',
                      color: '#d32f2f',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      marginTop: '12px',
                      fontSize: '14px',
                      width: '100%'
                    }}>
                      <i className="fas fa-exclamation-circle"></i>
                      Failed to submit grade: {submissionError}
                    </div>
                  )}
                </GradingSection>
              </>
            ) : (
              <NoEvaluationsMessage>
                No evaluations found for this teacher.
              </NoEvaluationsMessage>
            )}
          </EvaluationContainer>
          <ExportControls>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div>
                <h4 style={{ margin: 0 }}>Export Evaluation Data</h4>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  Showing evaluations from {getTimePeriodDisplayName(timePeriod).toLowerCase()}
                </div>
              </div>
              <button
                onClick={handleSelectAllForExport}
                style={{
                  background: 'transparent',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {selectedForExport.length === filterEvaluationsByTimePeriod(evaluations, timePeriod).length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
              {filterEvaluationsByTimePeriod(evaluations, timePeriod).map((evaluation) => (
                <ExportCheckbox_Regular key={evaluation.id}>
                  <input
                    type="checkbox"
                    id={`export-${evaluation.id}`}
                    checked={selectedForExport.includes(evaluation.id)}
                    onChange={() => handleToggleExportSelection(evaluation.id)}
                  />
                  <label htmlFor={`export-${evaluation.id}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{evaluation.video_id || 'Unnamed Recording'}</span>
                      <span style={{ 
                        fontSize: '12px',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        ({new Date(evaluation.created_at).toLocaleDateString()})
                      </span>
                    </div>
                    <EvaluationScoreBadge 
                      $score={
                        typeof evaluation.overall_score === 'string' && evaluation.overall_score !== 'N/A' 
                          ? parseFloat(evaluation.overall_score) 
                          : evaluation.overall_score
                      }
                    >
                      {typeof evaluation.overall_score === 'number' || 
                       (typeof evaluation.overall_score === 'string' && !isNaN(parseFloat(evaluation.overall_score)))
                        ? parseFloat(evaluation.overall_score).toFixed(2)
                        : evaluation.overall_score
                      }
                    </EvaluationScoreBadge>
                  </label>
                </ExportCheckbox_Regular>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Selected: {selectedForExport.length} of {filterEvaluationsByTimePeriod(evaluations, timePeriod).length} evaluations
              </div>
              <button
                onClick={handleExportData}
                disabled={selectedForExport.length === 0}
                style={{
                  background: selectedForExport.length === 0 ? '#cccccc' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: selectedForExport.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <i className="fas fa-file-export"></i>
                Export Selected Evaluations
              </button>
            </div>
          </ExportControls>
        </>
      ) : activeTab === 'trialClassEval' ? (
        <EvaluationHistoryContainer>
          <SectionTitle>
            <i className="fas fa-clipboard-check"></i>
            Trial Class Evaluation History
          </SectionTitle>
          
          {f1Evaluations.length === 0 ? (
            <NoEvaluationsMessage>
              No trial class evaluations found for this teacher.
            </NoEvaluationsMessage>
          ) : (
            <>
              <_HistoryToolbar>
                <_HistoryToolbarSection>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 500 }}>
                    <span>Final {currentMonth === evaluationMonth && currentYear === evaluationYear ? `${getMonthName(evaluationMonth)} ${evaluationYear}` : 'Monthly'} Grade:</span>
                    <GradeValue>
                      {gradeDisplay}
                    </GradeValue>
                    {currentMonth === evaluationMonth && currentYear === evaluationYear && (
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#ff6600',
                        fontWeight: 'normal',
                        fontStyle: 'italic'
                      }}>
                        * Previous month's data
                      </span>
                    )}
                  </div>
                </_HistoryToolbarSection>
              </_HistoryToolbar>
              
              {/* Add time period selector for trial class evaluations */}
              {f1Evaluations.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  marginBottom: '20px',
                  background: '#f9f9f9',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-filter" style={{ color: '#666' }}></i>
                    <span style={{ fontWeight: 500 }}>Time Period:</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['current_month', 'previous_month', 'last_3_months', 'last_6_months', 'all'].map(period => (
                      <button
                        key={period}
                        onClick={() => handleTimePeriodChange(period)}
                        style={{
                          padding: '6px 12px',
                          background: timePeriod === period ? '#3498db' : '#fff',
                          color: timePeriod === period ? '#fff' : '#333',
                          border: `1px solid ${timePeriod === period ? '#3498db' : '#ddd'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: timePeriod === period ? '600' : '400',
                          transition: 'all 0.2s ease'
                        }}
                        title="Your selection will be remembered for next time"
                      >
                        {getTimePeriodDisplayName(period)}
                        {period === 'current_month' && (
                          <span style={{ marginLeft: '4px', fontSize: '11px' }}>(Default)</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div style={{ 
                    marginLeft: 'auto', 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontSize: '13px', 
                    color: '#666'
                  }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                    Showing {filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).length} evaluations
                    <span style={{ 
                      marginLeft: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      color: '#0066cc', 
                      fontSize: '12px' 
                    }}>
                      <i className="fas fa-save" style={{ marginRight: '4px', fontSize: '10px' }}></i>
                      Your preference is saved
                    </span>
                  </div>
                </div>
              )}
              
              {/* Show message when no evaluations found for the selected time period */}
              {f1Evaluations.length > 0 && filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).length === 0 ? (
                <div style={{
                  padding: '12px 16px',
                  background: '#fff8e1',
                  border: '1px solid #ffe0b2',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <i className="fas fa-info-circle" style={{ color: '#ff9800', fontSize: '18px' }}></i>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>No trial class evaluations found for {getTimePeriodDisplayName(timePeriod).toLowerCase()}</p>
                    <p style={{ margin: '0', fontSize: '14px' }}>
                      This teacher has {f1Evaluations.length} trial class evaluation(s) but none from {getTimePeriodDisplayName(timePeriod).toLowerCase()}. 
                      Try selecting a different time period above to view all evaluations.
                    </p>
                  </div>
                </div>
              ) : (
                <EvaluationContainer>
                  {/* Only display evaluations for the selected time period */}
                  {filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).map((evaluation, index) => (
                    <EvaluationCard key={evaluation.id || index}>
                      <EvaluationHeader 
                        onClick={() => handleF1EvaluationSelection(evaluation.id)}
                        $selected={selectedF1Evaluations.includes(evaluation.id)}
                      >
                        <EvaluationTitle>
                          <i className="fas fa-clipboard-check"></i>
                          {evaluation.video_id || `Trial Class Evaluation #${index + 1}`}
                        </EvaluationTitle>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <EvaluationDate>
                            {evaluation.date ? new Date(evaluation.date).toLocaleDateString() 
                          : evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() 
                          : 'Unknown'}
                          </EvaluationDate>
                          {(evaluation.overall_score || evaluation.overallScore) && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <EvaluationScoreBadge 
                                $score={
                                  typeof (evaluation.overall_score || evaluation.overallScore) === 'string' 
                                    ? parseFloat(evaluation.overall_score || evaluation.overallScore) 
                                    : (evaluation.overall_score || evaluation.overallScore)
                                }
                              >
                                {(evaluation.overall_score || evaluation.overallScore) ? 
                                 parseFloat(evaluation.overall_score || evaluation.overallScore).toFixed(2) : 'N/A'}
                              </EvaluationScoreBadge>
                              <span style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}>/5</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <i className={`fas fa-chevron-${selectedF1Evaluations.includes(evaluation.id) ? 'down' : 'right'}`} style={{ color: '#888', fontSize: '14px' }}></i>
                          </div>
                        </div>
                      </EvaluationHeader>
                      <EvaluationContent $expanded={selectedF1Evaluations.includes(evaluation.id)}>
                        <EvaluationRow>
                          <EvaluationLabel>Recording:</EvaluationLabel>
                          <EvaluationValue>
                            {evaluation.video_id || 'Unknown'}
                          </EvaluationValue>
                        </EvaluationRow>
                        <EvaluationRow>
                          <EvaluationLabel>Evaluator:</EvaluationLabel>
                          <EvaluationValue>
                            {evaluation.qa_evaluator_name || evaluation.qa_evaluator || 'Unknown'}
                          </EvaluationValue>
                        </EvaluationRow>
                        {evaluation.additional_comments && (
                          <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ marginTop: 0 }}>Comments:</h4>
                            <p style={{ whiteSpace: 'pre-line' }}>{evaluation.additional_comments}</p>
                          </div>
                        )}
                        
                        {/* Display evaluation details */}
                        {evaluation.responses && Object.keys(evaluation.responses).length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ marginTop: 0 }}>Evaluation Details:</h4>
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                              gap: '12px',
                              background: '#f9f9f9',
                              padding: '12px',
                              borderRadius: '6px'
                            }}>
                              {Object.entries(evaluation.responses).map(([key, value]) => (
                                <div key={key} style={{ marginBottom: '8px' }}>
                                  <div style={{ fontWeight: '500', fontSize: '14px', color: '#555' }}>
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                  </div>
                                  <div style={{ fontSize: '15px' }}>
                                    {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </EvaluationContent>
                    </EvaluationCard>
                  ))}
                </EvaluationContainer>
              )}
              
              {/* Export Controls - Matching the regular evaluations */}
              <ExportControls>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Export Evaluation Data</h4>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                      Showing evaluations from {getTimePeriodDisplayName(timePeriod).toLowerCase()}
                    </div>
                  </div>
                  <button
                    onClick={handleSelectAllForExport}
                    style={{
                      background: 'transparent',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {selectedForExport.filter(id => filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).some(e => e.id === id)).length === filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).length 
                      ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                  {filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).map((evaluation) => (
                    <ExportCheckbox_Regular key={evaluation.id}>
                      <input
                        type="checkbox"
                        id={`export-f1-${evaluation.id}`}
                        checked={selectedForExport.includes(evaluation.id)}
                        onChange={() => handleToggleExportSelection(evaluation.id)}
                      />
                      <label htmlFor={`export-f1-${evaluation.id}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{evaluation.video_id || 'Unnamed Recording'}</span>
                          <span style={{ 
                            fontSize: '12px',
                            color: '#666',
                            fontStyle: 'italic'
                          }}>
                            ({evaluation.date ? new Date(evaluation.date).toLocaleDateString() 
                            : evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() 
                            : 'Unknown'})
                          </span>
                        </div>
                        <EvaluationScoreBadge 
                          $score={
                            typeof (evaluation.overall_score || evaluation.overallScore) === 'string' 
                              ? parseFloat(evaluation.overall_score || evaluation.overallScore) 
                              : (evaluation.overall_score || evaluation.overallScore)
                          }
                        >
                          {(evaluation.overall_score || evaluation.overallScore) ? 
                           parseFloat(evaluation.overall_score || evaluation.overallScore).toFixed(2) : 'N/A'}
                        </EvaluationScoreBadge>
                      </label>
                    </ExportCheckbox_Regular>
                  ))}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Selected: {selectedForExport.filter(id => filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).some(e => e.id === id)).length} of {filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).length} evaluations
                  </div>
                  <button
                    onClick={handleExportData}
                    disabled={selectedForExport.filter(id => filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).some(e => e.id === id)).length === 0}
                    style={{
                      background: selectedForExport.filter(id => filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).some(e => e.id === id)).length === 0 ? '#cccccc' : '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '10px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: selectedForExport.filter(id => filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).some(e => e.id === id)).length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    <i className="fas fa-file-export"></i>
                    Export Selected Evaluations
                  </button>
                </div>
              </ExportControls>
              
              <GradingForm>
                <SectionTitle>
                  <i className="fas fa-star"></i>
                  Trial Class Monthly Grading
                </SectionTitle>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    <FormGroup style={{ minWidth: '250px' }}>
                      <FormLabel>Evaluation Month</FormLabel>
                      <Select
                        value={evaluationMonth}
                        onChange={(e) => setEvaluationMonth(e.target.value)}
                        disabled={!canEvaluate}
                      >
                        <option value="">Select Month</option>
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </Select>
                    </FormGroup>
                    
                    <FormGroup style={{ minWidth: '250px' }}>
                      <FormLabel>Evaluation Year</FormLabel>
                      <Select 
                        value={evaluationYear}
                        onChange={(e) => setEvaluationYear(e.target.value)}
                        disabled={!canEvaluate}
                      >
                        <option value="">Select Year</option>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                      </Select>
                    </FormGroup>
                    
                    <FormGroup style={{ minWidth: '250px' }}>
                      <FormLabel>Auto-Calculate Grade</FormLabel>
                      <ActionButton 
                        onClick={() => {
                          // Inline calculation instead of calling autoCalculateTrialClassGrade
                          if (f1Evaluations.length === 0) {
                            toast.error('No trial class evaluations available for calculating grade');
                            return;
                          }
                          
                          // Calculate average score from evaluations with time period filtering
                          const avgScore = calculateAverageScore(f1Evaluations, timePeriod);
                          
                          if (avgScore === 'N/A') {
                            toast.error('Cannot calculate grade: no valid evaluation scores found');
                            return;
                          }
                          
                          // Set the calculated grade
                          setFinalGrade(avgScore);
                          toast.success(`Auto-calculated grade: ${avgScore} (from ${getTimePeriodDisplayName(timePeriod).toLowerCase()} evaluations)`);
                        }}
                        disabled={!canEvaluate || f1Evaluations.length === 0}
                      >
                        <i className="fas fa-calculator"></i> Calculate Average
                      </ActionButton>
                    </FormGroup>
                  </div>
                  
                  <FormGroup>
                    <FormLabel>
                      Final Grade (out of 5.0)
                      <InfoIcon data-tooltip={`Calculated from ${filterEvaluationsByTimePeriod(f1Evaluations, timePeriod).length} evaluations during the ${getTimePeriodDisplayName(timePeriod).toLowerCase()} period`}>
                        <i className="fas fa-info"></i>
                      </InfoIcon>
                    </FormLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <GradeInput_Trial 
                        type="number" 
                        min="0" 
                        max="5" 
                        step="0.1"
                        value={finalGrade}
                        onChange={(e) => setFinalGrade(e.target.value)}
                        disabled={!canEvaluate}
                      />
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '0' }}>
                        Auto-calculated from {getTimePeriodDisplayName(timePeriod).toLowerCase()} evaluations
                      </div>
                    </div>
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel>Comments</FormLabel>
                    <CommentInput 
                      value={qaComments}
                      onChange={(e) => setQaComments(e.target.value)}
                      placeholder="Additional comments about the teacher's performance..."
                      disabled={!canEvaluate}
                    />
                  </FormGroup>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    {!canEvaluate && (
                      <EvaluationNotice>
                        <i className="fas fa-info-circle"></i>
                        You have already submitted a grade for this month. You can submit again on the 1st day of the next month.
                      </EvaluationNotice>
                    )}
                    <SubmitButton 
                      onClick={handleSubmitTrialClassGrade}
                      disabled={!canEvaluate || !finalGrade || submittingGrade || !evaluationMonth || !evaluationYear}
                    >
                      {submittingGrade ? 'Submitting...' : 'Submit Final Grade'}
                    </SubmitButton>
                  </div>
                </div>
              </GradingForm>
            </>
          )}
        </EvaluationHistoryContainer>
      ) : null}
      
      <BackButton onClick={handleBackToTeachers}>
        <i className="fas fa-arrow-left"></i> Back to Teachers
      </BackButton>
    </TeachersLayout>
  );
};

export default TeacherRecordings; 