import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import apiServiceDefault from '../../services/apiService';
import { getUserVideos } from '../../services/fileService';
import ReactPlayer from 'react-player';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, RadialLinearScale } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import TeacherStats from './TeacherStats';
import TeacherVideoMarkers from './TeacherVideoMarkers';
import { toast } from 'react-hot-toast';
import config from '../../config';
import AmazingMomentsSpotlight from './AmazingMomentsSpotlight';

// API base URL from config
const API_URL = config.API_URL;

// Destructure the services from the default export
const { 
  apiRequest, 
  authService, 
  fetchTeacherStats, 
  checkTeacherExists, 
  fetchTeacherRecordings,
  getVideoPlaybackUrl,
  getVideoDownloadUrl
} = apiServiceDefault;

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  RadialLinearScale
);

// Add styled components for the markers section
const DashboardMarkerCard = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  grid-column: 1 / span 3;
`;

const MarkersSection = styled.div`
  padding: 16px;
`;

const MarkersTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #e1e4e8;
  margin-bottom: 16px;
`;

const MarkersTab = styled.button`
  padding: 8px 16px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${props => props.active ? '#3498db' : '#666'};
  border-bottom: ${props => props.active ? '2px solid #3498db' : 'none'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #3498db;
  }
`;

const MarkersList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

const MarkerItem = styled.div`
  flex: 1;
  min-width: 280px;
  max-width: calc(50% - 16px);
  background-color: white;
  border-radius: 6px;
  padding: 12px;
  border-left: 4px solid ${props => props.type === 'amazing' ? '#F1A27F' : '#F1A27F'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  
  &:hover {
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const MarkerThumbnail = styled.div`
  background-color: #000;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-bottom: 10px;
  overflow: hidden;
  position: relative;
`;

const PlayOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 24px;
  z-index: 5;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.5);
  }
`;

const MarkerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const MarkerTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
`;

const MarkerType = styled.span`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
  color: white;
  background-color: ${props => props.type === 'amazing' ? '#F1A27F' : '#F1A27F'};
`;

const MarkerTimestamp = styled.div`
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
`;

const MarkerDescription = styled.div`
  color: #333;
  font-size: 14px;
  margin: 8px 0;
  line-height: 1.4;
`;

const MarkerPlayButton = styled.button`
  padding: 6px 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const DashboardPlayerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: ${props => props.visible ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  padding: 20px;

  .player-wrapper {
    position: relative;
    width: 80%;
    max-width: 1200px;
    aspect-ratio: 16 / 9;
    background-color: #000;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
    
    /* Create unique border styles based on marker type */
    border: ${props => props.markerType === 'amazing' ? '4px solid #27ae60' : '4px solid #e74c3c'};
  }

  /* Custom styling to handle marker boundaries */
  .react-player {
    position: relative;
  }
  
  .react-player video {
    object-fit: contain;
  }

  /* Custom controls container */
  .custom-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50px;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    padding: 0 15px;
    z-index: 20;
    backdrop-filter: blur(5px);
  }

  .play-pause-btn {
    background: none;
    border: none;
    color: white;
    font-size: 22px;
    cursor: pointer;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    transition: transform 0.2s;
    
    &:hover {
      transform: scale(1.1);
    }
  }

  /* Custom progress display */
  .marker-progress-container {
    position: relative;
    flex: 1;
    height: 6px;
    background-color: rgba(255, 255, 255, 0.2);
    cursor: pointer;
    border-radius: 3px;
    transition: height 0.2s;
    
    &:hover {
      height: 8px;
    }
  }

  .marker-progress-bar {
    height: 100%;
    background-color: ${props => props.markerType === 'amazing' ? '#27ae60' : '#e74c3c'};
    width: 0%;
    border-radius: 3px;
    position: relative;
  }
  
  .marker-progress-handle {
    position: absolute;
    right: -8px;
    top: -6px;
    width: 16px;
    height: 16px;
    background-color: ${props => props.markerType === 'amazing' ? '#27ae60' : '#e74c3c'};
    border-radius: 50%;
    transform: scale(0);
    transition: transform 0.1s;
    border: 2px solid white;
  }
  
  .marker-progress-container:hover .marker-progress-handle {
    transform: scale(1);
  }

  /* Time display */
  .marker-time-display {
    color: white;
    font-size: 14px;
    margin-left: 15px;
    font-family: monospace;
    min-width: 80px;
  }

  /* Add clipped view indicator */
  .clipped-indicator {
    position: absolute;
    top: 15px;
    left: 15px;
    background-color: ${props => props.markerType === 'amazing' ? 'rgba(39, 174, 96, 0.8)' : 'rgba(231, 76, 60, 0.8)'};
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
  
  /* Add marker info display */
  .marker-info {
    position: absolute;
    top: 15px;
    right: 15px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10;
    max-width: 300px;
    backdrop-filter: blur(5px);
  }
  
  .marker-title {
    font-weight: bold;
    margin-bottom: 4px;
  }
  
  .marker-description {
    font-size: 12px;
    opacity: 0.9;
  }
  
  /* Add marker boundary indicators */
  .marker-start-indicator, .marker-end-indicator {
    position: absolute;
    top: 0;
    width: 2px;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.5);
    z-index: 5;
    pointer-events: none;
  }
  
  .marker-start-indicator {
    left: 0;
    border-left: 2px solid #4CAF50;
  }
  
  .marker-end-indicator {
    right: 0;
    border-right: 2px solid #F44336;
  }
`;

const PlayerCloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
`;

const RecordingName = styled.div`
  color: #666;
  font-size: 12px;
  margin-bottom: 4px;
`;

const NoMarkersMessage = styled.div`
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 30px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  margin-top: 10px;
`;

const NoMarkersIcon = styled.div`
  font-size: 32px;
  color: #ddd;
  margin-bottom: 10px;
`;

// Move these styled components outside the TeacherDashboard component
const VideoLoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 16px;
  gap: 15px;
  z-index: 5;
`;

const LoadingSpinner = styled.div`
  margin-bottom: 15px;
  font-size: 36px;
  
  i {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const TeacherNameDisplay = styled.div`
  color: #555;
  font-size: 12px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-style: italic;
  
  i {
    color: #3498db;
  }
`;

const DebugInfo = styled.div`
  margin-top: 10px;
  font-size: 12px;
  color: #999;
  background-color: #f5f5f5;
  padding: 5px;
  border-radius: 4px;
`;

// Create a standalone marker player component to avoid structural issues
const MarkerPlayerOverlay = ({ 
  visible, 
  markerType, 
  currentPlayingMarker, 
  playerLoading,
  isPlaying,
  currentTime, 
  markerProgress,
  handleClose,
  dashboardPlayerRef,
  setPlayerLoading,
  setIsPlaying,
  setCurrentTime,
  setMarkerProgress,
  hasPerformedInitialSeek,
  togglePlay,
  handleProgressClick,
  formatTimeDisplay,
  getElapsedMarkerTime,
  getMarkerDuration,
  playbackAttempt,
  retryPlayWithoutTimestamp
}) => {
  if (!visible || !currentPlayingMarker) return null;
  
  return (
    <DashboardPlayerContainer 
      visible={visible}
      markerType={markerType || 'amazing'}
    >
      <div className="player-wrapper">
        <PlayerCloseButton onClick={handleClose}>
          <i className="fas fa-times"></i>
        </PlayerCloseButton>
        
        {playerLoading && (
          <VideoLoadingOverlay>
            <LoadingSpinner>
              <i className="fas fa-circle-notch fa-spin"></i>
            </LoadingSpinner>
            <div>Loading video...</div>
          </VideoLoadingOverlay>
        )}
        
        <div className="clipped-indicator">
          <i className={currentPlayingMarker?.marker_type === 'amazing' ? 'fas fa-star' : 'fas fa-exclamation-circle'} style={{ marginRight: '8px' }}></i>
          {currentPlayingMarker?.marker_type === 'amazing' ? 'Amazing Moment' : 'Area for Improvement'}
        </div>
        
        {currentPlayingMarker && (
          <div className="marker-info">
            <div className="marker-title">{currentPlayingMarker.title || 'Untitled Marker'}</div>
            {currentPlayingMarker.description && (
              <div className="marker-description">{currentPlayingMarker.description}</div>
            )}
          </div>
        )}
        
        {/* Add marker boundary indicators */}
        <div className="marker-start-indicator"></div>
        <div className="marker-end-indicator"></div>
        
        <ReactPlayer
          ref={dashboardPlayerRef}
          url={currentPlayingMarker?.path}
          width="100%"
          height="100%"
          controls={false} // Hide default controls
          playing={isPlaying}
          playsinline={true}
          onBuffer={() => setPlayerLoading(true)}
          onBufferEnd={() => setPlayerLoading(false)}
          progressInterval={200}
          onProgress={(state) => {
            // Track the current playback time
            setCurrentTime(state.playedSeconds);
            
            // Check if we're outside the marker boundaries
            if (currentPlayingMarker) {
              // If we're before the start marker, seek to the start
              if (state.playedSeconds < currentPlayingMarker.start_time) {
                console.log('Playback position before marker start, seeking to:', currentPlayingMarker.start_time);
                dashboardPlayerRef.current.seekTo(currentPlayingMarker.start_time, 'seconds');
              }
              
              // If we've reached the end marker, pause playback
              if (state.playedSeconds >= currentPlayingMarker.end_time) {
                console.log('Reached marker end time, pausing playback');
                // Pause the video
                setIsPlaying(false);
              }
              
              // Calculate progress within the marker section (0-100%)
              const markerDuration = currentPlayingMarker.end_time - currentPlayingMarker.start_time;
              const timeWithinMarker = state.playedSeconds - currentPlayingMarker.start_time;
              const progress = Math.min(100, Math.max(0, (timeWithinMarker / markerDuration) * 100));
              setMarkerProgress(progress);
            }
          }}
          onDuration={(duration) => {
            // Handle duration changes
          }}
          onReady={() => {
            // Only perform seeking once to avoid infinite buffering
            if (!hasPerformedInitialSeek.current && dashboardPlayerRef.current && currentPlayingMarker?.start_time) {
              console.log('Player ready, performing one-time seek to:', currentPlayingMarker.start_time);
              
              try {
                // Set the flag before seeking to prevent multiple attempts
                hasPerformedInitialSeek.current = true;
                
                // Use a small delay to ensure player is fully initialized
                setTimeout(() => {
                  if (dashboardPlayerRef.current) {
                    dashboardPlayerRef.current.seekTo(currentPlayingMarker.start_time, 'seconds');
                    console.log('Seek operation completed');
                    setPlayerLoading(false);
                  }
                }, 1000);
              } catch (seekError) {
                console.error('Error while seeking:', seekError);
                setPlayerLoading(false);
              }
            } else {
              console.log('Player ready event - seeking already performed or not needed');
              setPlayerLoading(false);
            }
          }}
          onStart={() => {
            console.log('Video playback started successfully');
            setPlayerLoading(false);
            setIsPlaying(true);
          }}
          onPlay={() => {
            console.log('Video is now playing');
            setIsPlaying(true);
          }}
          onPause={() => {
            console.log('Video playback paused');
            setIsPlaying(false);
          }}
          onEnded={() => {
            console.log('Playback ended');
            setIsPlaying(false);
            hasPerformedInitialSeek.current = false; // Reset for potential replay
          }}
          onError={(e) => {
            console.error('ReactPlayer error:', e);
            console.log('Failed URL:', currentPlayingMarker?.path);
            
            // Check if this is our first playback attempt
            if (playbackAttempt === 0) {
              toast.error('Playback error. Trying an alternative approach...');
              // Reset the seeking flag
              hasPerformedInitialSeek.current = false;
              retryPlayWithoutTimestamp();
            } else {
              // If we've already tried alternative approaches
              toast.error('Error playing video. The recording may not be available.');
              
              // Reset the seeking flag
              hasPerformedInitialSeek.current = false;
              
              // Instead of closing, pause the video and show an error overlay
              if (dashboardPlayerRef.current) {
                const player = dashboardPlayerRef.current.getInternalPlayer();
                if (player && typeof player.pause === 'function') {
                  player.pause();
                  setIsPlaying(false);
                }
              }
            }
          }}
          config={{
            file: {
              forceVideo: true,
              attributes: {
                controlsList: 'nodownload',
                preload: 'auto'
              },
              hlsOptions: {
                enableWorker: true,
                lowLatencyMode: true
              },
              forceHLS: false,
              forceDASH: false
            }
          }}
        />
        
        {/* Custom player controls */}
        <div className="custom-controls">
          <button className="play-pause-btn" onClick={togglePlay}>
            {isPlaying ? <i className="fas fa-pause"></i> : <i className="fas fa-play"></i>}
          </button>
          
          <div className="marker-progress-container" onClick={handleProgressClick}>
            <div 
              className="marker-progress-bar"
              style={{
                width: `${markerProgress}%`,
              }}
            >
              <div className="marker-progress-handle"></div>
            </div>
          </div>
          
          <div className="marker-time-display">
            {formatTimeDisplay(getElapsedMarkerTime(currentTime, currentPlayingMarker))} / 
            {formatTimeDisplay(getMarkerDuration(currentPlayingMarker))}
          </div>
        </div>
      </div>
    </DashboardPlayerContainer>
  );
};

const TeacherDashboard = () => {
  // Extract class name from video filename
  const extractClassName = (filename) => {
    // Split by timezone marker and get the last part
    const parts = filename.split('+0800');
    if (parts.length > 1) {
      // Remove any trailing dash and return the class name
      return parts[1].replace(/^-/, '').replace(/\.mp4$/, '');
    }
    return filename.replace(/\.mp4$/, '');
  };

  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [debugData, setDebugData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [videoRecordings, setVideoRecordings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentsCount, setNewCommentsCount] = useState(0);
  const [loginTime, setLoginTime] = useState(new Date());
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedClassCode, setSelectedClassCode] = useState('');
  const [availableClassCodes, setAvailableClassCodes] = useState([]);
  const [teacherRankings, setTeacherRankings] = useState([]);
  const [rankingsLoading, setRankingsLoading] = useState(true);
  const [rankingsError, setRankingsError] = useState(null);
  const [currentRank, setCurrentRank] = useState(null);
  const [showingPreviousMonth, setShowingPreviousMonth] = useState(false);
  const [rankingsMetadata, setRankingsMetadata] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    previousMonth: null,
    previousYear: null
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [userVideos, setUserVideos] = useState([]);
  const [userData, setUserData] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [videoToPlay, setVideoToPlay] = useState(null);
  const [filterClassCode, setFilterClassCode] = useState(null);
  const [teacherExistsInDB, setTeacherExistsInDB] = useState(false);
  const [teacherEvaluationCount, setTeacherEvaluationCount] = useState(0);
  const [teacherLatestGrade, setTeacherLatestGrade] = useState(null);
  const [teacherStats, setTeacherStats] = useState(null);
  const [performanceTrend, setPerformanceTrend] = useState('neutral'); // 'up', 'down', or 'neutral'
  const [replyingToComment, setReplyingToComment] = useState(null); // New state for reply functionality
  const [replyText, setReplyText] = useState(''); // New state for reply text
  const [submittingReply, setSubmittingReply] = useState(false); // New state for tracking reply submission
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [markersTabType, setMarkersTabType] = useState('amazing'); // 'amazing' or 'error'
  const [teacherMarkers, setTeacherMarkers] = useState([]);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  const [currentPlayingMarker, setCurrentPlayingMarker] = useState(null);
  const [showAllAmazingMoments, setShowAllAmazingMoments] = useState(false); // New state for showing all moments
  const dashboardPlayerRef = useRef(null);

  // Clean up username for display - remove email domain and t. prefix
  const displayName = username.split('@')[0].replace('t.', '');

  // Add these refs for the video players
  const videoPlayerRef = useRef(null);
  const modalVideoPlayerRef = useRef(null);

  // Add state for tracking video loading
  const [videoLoading, setVideoLoading] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);

  // Debug state
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [markerIdToMakePublic, setMarkerIdToMakePublic] = useState('');
  const [debugMessage, setDebugMessage] = useState('');
  const [recordingId, setRecordingId] = useState('');
  const [debugCreateForm, setDebugCreateForm] = useState({
    title: 'Test Amazing Moment',
    description: 'This is a test public amazing moment created from debug panel',
    is_public: true
  });

  // Add a state for tracking playback attempts
  const [playbackAttempt, setPlaybackAttempt] = useState(0);

  // Add a ref to track whether seeking has been done
  const hasPerformedInitialSeek = useRef(false);

  // Add state for player controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [markerProgress, setMarkerProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  
  // Format time for display (MM:SS)
  const formatTimeDisplay = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate the elapsed time relative to the marker
  const getElapsedMarkerTime = (currentTime, marker) => {
    if (!marker || !marker.start_time) return 0;
    return Math.max(0, currentTime - marker.start_time);
  };

  // Calculate the total marker duration
  const getMarkerDuration = (marker) => {
    if (!marker || !marker.start_time || !marker.end_time) return 0;
    return marker.end_time - marker.start_time;
  };
  
  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Handle click on progress bar
  const handleProgressClick = (e) => {
    if (!currentPlayingMarker || !dashboardPlayerRef.current) return;
    
    const container = e.currentTarget;
    const bounds = container.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percent = x / bounds.width;
    
    // Calculate time within marker boundaries
    const markerDuration = currentPlayingMarker.end_time - currentPlayingMarker.start_time;
    const newTime = currentPlayingMarker.start_time + (percent * markerDuration);
    
    // Seek to new position
    dashboardPlayerRef.current.seekTo(newTime, 'seconds');
  };

  // Instead of calling the functions in useEffect, let's use a modified approach
  useEffect(() => {
    if (username) {
      // Debug code - fetch sample evaluations data
      const fetchDebugData = async () => {
        try {
          console.log('Fetching debug data for evaluations');
          const data = await apiRequest(`${API_URL}/debug/evaluations`);
          console.log('Debug data:', data);
          setDebugData(data);
        } catch (error) {
          console.error('Error fetching debug data:', error);
          // Don't set debugData to null on error, keep previous state
          console.error(error);
        }
      };
      
      // Only fetch debug data in development
      if (process.env.NODE_ENV === 'development') {
        fetchDebugData();
      }
      
      // Note: fetchTeacherComments, fetchTeacherRankings are called in the second useEffect
      // We'll call fetchTeacherRecordings here since it's imported from apiService
      fetchTeacherRecordings(username)
        .then(recordings => {
          if (recordings && recordings.length > 0) {
            console.log(`Loaded ${recordings.length} recordings from API service`);
            setVideoRecordings(recordings);
          }
        })
        .catch(error => {
          console.error('Error fetching recordings:', error);
        });
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Starting to load data for teacher:', username);
        
        // First, get the videos from fileService (if we haven't already loaded them via fetchTeacherRecordings)
        if (videoRecordings.length === 0) {
          const videos = await getUserVideos(username);
          console.log('Loaded videos from fileService:', videos.length);
          
          if (videos && videos.length > 0) {
            setVideoRecordings(videos);
          }
        }
        
        // If the teacher exists in DB, make sure the evaluation count is correctly reflected in videos
        if (teacherExistsInDB && teacherEvaluationCount > 0 && videoRecordings.length > 0) {
          const evaluatedCount = videoRecordings.filter(v => v.evaluated).length;
          console.log(`Database shows ${teacherEvaluationCount} evaluations, videos show ${evaluatedCount} evaluated`);
          
          // If counts don't match, try to update the evaluated flag on videos
          if (evaluatedCount !== teacherEvaluationCount) {
            console.log('Discrepancy in evaluation counts, attempting to fix...');
            
            try {
              // Format username for API call
              let baseUsername = username;
              if (baseUsername.includes('@')) {
                baseUsername = baseUsername.split('@')[0];
              }
              if (baseUsername.startsWith('t.')) {
                baseUsername = baseUsername.substring(2);
              }
              const normalizedTeacherId = `t.${baseUsername}@little-champions.com`;
              
              // Fetch teacher stats to get detailed evaluation info
              const stats = await apiRequest(`${API_URL}/teacher-stats/${encodeURIComponent(normalizedTeacherId)}`);
              if (stats) {
                if (stats && stats.recentEvaluations && stats.recentEvaluations.length > 0) {
                  console.log(`Stats contains ${stats.recentEvaluations.length} evaluations`);
                  
                  // Create a set of evaluated recording names for fast lookup
                  const evaluatedRecordingNames = new Set(
                    stats.recentEvaluations.map(e => e.recordingName || '')
                      .filter(name => name && name.length > 0)
                  );
                  
                  // Update videos with evaluated status based on stats data
                  if (evaluatedRecordingNames.size > 0) {
                    const updatedVideos = [...videoRecordings];
                    updatedVideos.forEach(video => {
                      if (evaluatedRecordingNames.has(video.name)) {
                        video.evaluated = true;
                      }
                    });
                    setVideoRecordings(updatedVideos);
                    console.log('Updated videos with evaluation status from API data');
                  }
                }
              }
            } catch (statsError) {
              console.warn('Error fetching stats to update evaluation status:', statsError);
            }
          }
        }
        
        // Extract unique class codes from videos
        if (videoRecordings && videoRecordings.length > 0) {
          const classCodes = [...new Set(videoRecordings.map(video => {
            // Extract class code from video name (e.g., PS, TP, F1, etc.)
            const classCode = video.classCode || extractClassName(video.name).split('_')[0];
            return classCode;
          }))];
          
          // Sort the class codes alphabetically
          classCodes.sort();
          setAvailableClassCodes(classCodes);
        }
        
        // Set login time
        const now = new Date();
        setLoginTime(now);
        
        // Schedule removal of all comments after 5 minutes
        const fiveMinutesInMs = 5 * 60 * 1000;
        setTimeout(() => {
          console.log('5 minutes passed since login, removing unclicked comments');
          setComments(prevComments => prevComments.filter(c => c.clicked));
        }, fiveMinutesInMs);
        
      } catch (error) {
        console.error('Error loading user data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Load user data
    loadUserData();
    
    // Fetch teacher comments and rankings immediately
    fetchTeacherComments();
    fetchTeacherRankings();
    
    // Set up interval to check for new comments every 30 seconds
    const commentInterval = setInterval(fetchTeacherComments, 30000);
    
    return () => clearInterval(commentInterval);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, teacherExistsInDB, teacherEvaluationCount, videoRecordings]);

  useEffect(() => {
    // This second useEffect is for data that should be fetched after the initial load
    
    // Fetch teacher comments and evaluation data
    fetchTeacherComments();
    
    // Check if teacher exists in database (affects what data we show)
    checkTeacherExists(username)
      .then(exists => {
        setTeacherExistsInDB(exists);
        console.log(`Teacher ${username} exists in database: ${exists}`);
      })
      .catch(error => {
        console.error('Error checking if teacher exists:', error);
      });
      
    // This will be called when the view is changed to 'ratings'
    // fetchTeacherRankings();
    
    // Set up the comment update interval (every 15 seconds)
    const commentsInterval = setInterval(() => {
      console.log('Refreshing comments via interval');
      fetchTeacherComments();
    }, 15000);
    
    // Clean up interval on unmount
    return () => {
      clearInterval(commentsInterval);
    };
  }, [username]);

  useEffect(() => {
    // Additional debug check to verify the teacher exists in the database
    const checkTeacherInDatabase = async () => {
      try {
        // Format username for DB query
        let baseUsername = username;
        
        // Remove domain part if it exists
        if (baseUsername.includes('@')) {
          baseUsername = baseUsername.split('@')[0];
        }
        
        // Remove t. prefix if it exists
        if (baseUsername.startsWith('t.')) {
          baseUsername = baseUsername.substring(2);
        }
        
        // Build the normalized ID
        const normalizedTeacherId = `t.${baseUsername}@little-champions.com`;
        console.log('Checking if teacher exists in database:', normalizedTeacherId);
        
        // Use the API service function instead of direct fetch
        const result = await checkTeacherExists(normalizedTeacherId);
        
        console.log('Teacher check result:', result);
        
        // If teacher exists in database, we can use this information later
        if (result && result.exists) {
          console.log(`Teacher ${normalizedTeacherId} exists in database with ${result.evaluationCount} evaluations`);
          setTeacherExistsInDB(true);
          setTeacherEvaluationCount(result.evaluationCount || 0);
          
          if (result.hasGrades) {
            console.log(`Latest grade: ${result.latestGrade}`);
            setTeacherLatestGrade(result.latestGrade);
          }
          
          // Fetch additional teacher stats for performance summary
          try {
            console.log('Fetching teacher stats with normalized ID:', normalizedTeacherId);
            
            // Use apiRequest instead of direct fetch
            const stats = await apiRequest(`${API_URL}/teacher-stats/${encodeURIComponent(normalizedTeacherId)}`);
            console.log('Teacher stats:', stats);
            
            if (!stats) {
              console.warn('No stats returned from API');
              return;
            }
            
            setTeacherStats(stats);
            
            // Determine performance trend based on history
            if (stats && stats.performanceTrend && stats.performanceTrend.length >= 2) {
              const recentScores = stats.performanceTrend.map(item => parseFloat(item.score)).slice(-3);
              if (recentScores.length >= 2) {
                const latestScore = recentScores[recentScores.length - 1];
                const previousScore = recentScores[recentScores.length - 2];
                
                if (latestScore > previousScore) {
                  setPerformanceTrend('up');
                } else if (latestScore < previousScore) {
                  setPerformanceTrend('down');
              } else {
                  setPerformanceTrend('neutral');
                }
              }
            }
          } catch (statsError) {
            console.error('Error fetching teacher stats:', statsError);
        }
      } else {
          console.log(`Teacher ${normalizedTeacherId} not found in database or has no evaluations`);
          setTeacherExistsInDB(false);
          setTeacherEvaluationCount(0);
          setTeacherLatestGrade(null);
      }
    } catch (error) {
        console.warn('Error checking teacher in database:', error);
        // Non-critical error, so we don't need to do anything with it
        setTeacherExistsInDB(false);
      }
    };
    
    // Call the check function
    if (username) {
      checkTeacherInDatabase();
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // Automatically expand replies when needed
  useEffect(() => {
    // Don't run this effect if comments is empty or replyingToComment is active
    if (comments.length === 0 || replyingToComment) {
      return;
    }
    
    let needsUpdate = false;
    const updatedComments = comments.map(comment => {
      if (comment.replies && comment.replies.length > 0 && !comment.showReplies) {
        const hasQaReplies = comment.replies.some(reply => reply.reply_type === 'qa');
        const hasTeacherReplies = comment.replies.some(reply => reply.reply_type === 'teacher');
        
        // If there are QA replies but no teacher replies, automatically show the reply form
        if (hasQaReplies && !hasTeacherReplies) {
          needsUpdate = true;
          return { ...comment, showReplies: true };
        }
      }
      return comment;
    });
    
    // Only update state if changes were made
    if (needsUpdate) {
      setComments(updatedComments);
    }
  }, [comments.length, replyingToComment]); // Only depend on the length of comments and replyingToComment

  const fetchTeacherComments = async () => {
    try {
      setCommentsLoading(true);
      console.log('Fetching comments for teacher:', username);
      
      // Use apiRequest instead of direct fetch
      const data = await apiRequest(`${API_URL}/teacher-comments/${encodeURIComponent(username)}`);
      console.log('Fetched teacher comments:', data);
      
      if (!data || !Array.isArray(data)) {
        console.warn('Unexpected response format for comments:', data);
        setComments([]);
        return;
      }
      
      // The backend now returns unviewed comments with replies
      const mappedComments = data.map(comment => {
        // Check if this comment exists in our current state to preserve clicked status
        const existingComment = comments.find(c => c.evaluationId === comment.evaluationId);
        return {
          ...comment,
          clicked: existingComment ? existingComment.clicked : false,
          showReplies: existingComment ? existingComment.showReplies : false
        };
      });
      
      // Check for new QA replies
      const oldCommentsMap = comments.reduce((acc, comment) => {
        acc[comment.evaluationId] = comment;
        return acc;
      }, {});
      
      let newQaRepliesFound = false;
      
      // Compare replies between old and new comments
      mappedComments.forEach(newComment => {
        const oldComment = oldCommentsMap[newComment.evaluationId];
        if (oldComment && newComment.replies) {
          // Count QA replies in old comment
          const oldQaReplies = oldComment.replies ? 
            oldComment.replies.filter(reply => reply.reply_type === 'qa').length : 0;
          
          // Count QA replies in new comment
          const newQaReplies = newComment.replies.filter(reply => reply.reply_type === 'qa').length;
          
          // If there are more QA replies in the new comment, show notification
          if (newQaReplies > oldQaReplies) {
            newQaRepliesFound = true;
          }
        }
      });
      
      // If new QA replies were found, show a notification
      if (newQaRepliesFound && comments.length > 0) { // Only show notification after initial load
        // Check if toast is available (imported from react-hot-toast or similar)
        if (typeof toast !== 'undefined') {
          toast.success("New QA responses have been received!", {
            icon: "🔔",
            duration: 5000,
          });
        } else {
          // Fallback to alert if toast is not available
          alert("New QA responses have been received!");
        }
      }
      
      setComments(mappedComments);
      setNewCommentsCount(mappedComments.length);
      console.log(`Updated comments count: ${mappedComments.length}`);
    } catch (error) {
      console.error('Error fetching comments:', error);
      
      // Check if it's a database connection error
      if (error.message && (
          error.message.includes('timeout') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('ECONNREFUSED')
        )) {
        // Show a more specific error message for connection issues
        if (typeof toast !== 'undefined') {
          toast.error("Database connection issue. Offline mode active.", {
            duration: 5000,
          });
        }
        
        // Keep existing comments if we have them
        if (comments.length > 0) {
          console.log('Using cached comments due to connection error');
        } else {
          // Set empty comments array if we don't have any
          setComments([]);
        }
      } else {
        // For other errors, clear the comments
        setComments([]);
        
        // Show general error message
        if (typeof toast !== 'undefined') {
          toast.error(`Error loading comments: ${error.message}`, {
            duration: 3000,
          });
        }
      }
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchTeacherRankings = async () => {
    try {
      setRankingsLoading(true);
      setRankingsError(null);
      
      // Use the correct domain for the teacher email
      const teacherEmail = username.includes('@little-champions.com') ? 
        username : username.replace('@rhet-corp.com', '@little-champions.com');
      
      // Get current month and year
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
      const currentYear = currentDate.getFullYear();
      
      // Calculate previous month
      let previousMonth = currentMonth - 1;
      let previousYear = currentYear;
      if (previousMonth === 0) {
        previousMonth = 12;
        previousYear = currentYear - 1;
      }
      
      // Determine which month to fetch based on the toggle state
      const targetMonth = showingPreviousMonth ? previousMonth : currentMonth;
      const targetYear = showingPreviousMonth ? previousYear : currentYear;
      
      console.log(`Fetching rankings data for ${teacherEmail} for ${targetMonth}/${targetYear}`);
      console.log(`Showing ${showingPreviousMonth ? 'previous' : 'current'} month data`);
      
      try {
        // Use the apiRequest function for teacher rankings with month parameters
        const teacherRankingData = await apiRequest(
          `${API_URL}/teacher-rankings/${encodeURIComponent(teacherEmail)}?month=${targetMonth}&year=${targetYear}`
        );
        console.log('Teacher ranking data:', teacherRankingData);
        
        // Also get all rankings for the table with month parameters
        const allRankingsResponse = await apiRequest(
          `${API_URL}/teacher-rankings?month=${targetMonth}&year=${targetYear}`
        );
        console.log('All teacher rankings response:', allRankingsResponse);
        
        // Extract rankings and metadata
        const allRankingsData = allRankingsResponse.rankings || [];
        const metadata = allRankingsResponse.metadata || {};
        
        if (allRankingsData && Array.isArray(allRankingsData)) {
          setTeacherRankings(allRankingsData);
          setCurrentRank(teacherRankingData.rank);
          setRankingsMetadata(metadata);
        }
      } catch (error) {
        console.log('Individual ranking error, fetching all rankings:', error);
        
        try {
          // Try to get all rankings with month parameters
          const allRankingsResponse = await apiRequest(
            `${API_URL}/teacher-rankings?month=${targetMonth}&year=${targetYear}`
          );
          console.log('All teacher rankings response:', allRankingsResponse);
          
          // Extract rankings and metadata
          const allRankingsData = allRankingsResponse.rankings || [];
          const metadata = allRankingsResponse.metadata || {};
          
          if (allRankingsData && Array.isArray(allRankingsData) && allRankingsData.length > 0) {
            setTeacherRankings(allRankingsData);
            setRankingsMetadata(metadata);
            
            // Find the current teacher's rank
            const currentTeacherRank = allRankingsData.find(t => t.teacher_id === teacherEmail);
            if (currentTeacherRank) {
              setCurrentRank(currentTeacherRank.rank);
            }
          } else {
            console.warn(`No teacher rankings data available for ${targetMonth}/${targetYear}`);
            setTeacherRankings([]);
            setRankingsMetadata(metadata);
          }
        } catch (allRankingsError) {
          console.error('Error fetching all rankings:', allRankingsError);
          throw new Error(`Failed to fetch rankings: ${allRankingsError.message}`);
        }
      }
    } catch (error) {
      console.error('Error fetching teacher rankings:', error);
      setRankingsError(error.message);
      
      // Fallback to direct DB access if API fails
      try {
        console.log('Falling back to direct DB access');
        
        const teacherEmail = username.includes('@little-champions.com') ? 
          username : username.replace('@rhet-corp.com', '@little-champions.com');
        
        // Get current month and year
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        // Calculate previous month
        let previousMonth = currentMonth - 1;
        let previousYear = currentYear;
        if (previousMonth === 0) {
          previousMonth = 12;
          previousYear = currentYear - 1;
        }
        
        // Determine which month to fetch based on the toggle state
        const targetMonth = showingPreviousMonth ? previousMonth : currentMonth;
        const targetYear = showingPreviousMonth ? previousYear : currentYear;
        
        // Use apiRequest for fallback with month parameters
        const response = await apiRequest(
          `${API_URL}/db/teacher_grades?month=${targetMonth}&year=${targetYear}`
        );
        console.log('Teacher grades data for rankings:', response);
        
        // Extract data and metadata
        const data = response.grades || [];
        const metadata = response.metadata || {};
        
        if (data && Array.isArray(data) && data.length > 0) {
          // Create rankings from grade data
          // Sort teachers by grade in descending order
          const sortedTeachers = [...data].sort((a, b) => parseFloat(b.grade) - parseFloat(a.grade));
          
          // Add rank property to each teacher
          const rankedTeachers = sortedTeachers.map((teacher, index) => ({
            ...teacher,
            rank: index + 1
          }));
          
          setTeacherRankings(rankedTeachers);
          setRankingsMetadata(metadata);
          
          // Find the current teacher's rank
          const currentTeacherRank = rankedTeachers.find(t => t.teacher_id === teacherEmail);
          if (currentTeacherRank) {
            setCurrentRank(currentTeacherRank.rank);
          }
        } else {
          console.warn(`No teacher rankings data available from fallback for ${targetMonth}/${targetYear}`);
          setTeacherRankings([]);
          setRankingsMetadata(metadata);
        }
      } catch (fallbackError) {
        console.error('Error in fallback rankings fetch:', fallbackError);
      }
    } finally {
      setRankingsLoading(false);
    }
  };

  const handleCommentClick = (comment) => {
    console.log('Comment clicked:', comment);
    
    // Find the video in recordings by matching either name or fileName
    const video = videoRecordings.find(v => 
      v.name === comment.videoName || 
      v.fileName === comment.videoName ||
      // Also try matching without .mp4 extension
      v.name === comment.videoName.replace('.mp4', '') ||
      v.fileName === comment.videoName.replace('.mp4', '')
    );
    
    if (video) {
      console.log('Found matching video:', video);
      
      // Create a clean copy of the video object
      const videoToPlay = {...video};
      
      // Ensure we have proper paths for playback
      if (videoToPlay.fileId) {
        // Generate URLs using fileId for Drive videos
        videoToPlay.path = getVideoPlaybackUrl(
          videoToPlay.teacherEmail || username, 
          videoToPlay.fileName || videoToPlay.name, 
          videoToPlay.fileId
        );
      } else {
        // Generate URLs using filename for local videos
        videoToPlay.path = getVideoPlaybackUrl(
          videoToPlay.teacherEmail || username, 
          videoToPlay.fileName || videoToPlay.name
        );
      }
      
      console.log('Video playback URL:', videoToPlay.path);
      
      // Show the video directly in a modal instead of navigating to videos view
      setSelectedVideo(videoToPlay);
      setShowVideoModal(true);
      
      // Mark comment as viewed in the database
      markCommentAsViewed(comment.videoName);
      
      // Mark comment as clicked in our local state
      setComments(prevComments => {
        return prevComments.map(c => 
          c.evaluationId === comment.evaluationId 
            ? { ...c, clicked: true } 
            : c
        );
      });
      
      // Decrement the comment count
      setNewCommentsCount(prev => Math.max(0, prev - 1));
      
      // Start the 15-second timer for this specific comment
      setTimeout(() => {
        console.log(`15 seconds passed, removing comment for video: ${comment.videoName}`);
        setComments(prevComments => {
          const remainingComments = prevComments.filter(c => c.evaluationId !== comment.evaluationId);
          setNewCommentsCount(remainingComments.length);
          return remainingComments;
        });
      }, 15000); // 15 seconds
    } else {
      console.error('Could not find matching video:', comment.videoName);
      console.log('Available videos:', videoRecordings);
      toast.error(`Could not find video "${comment.videoName}". Please try again later.`);
    }
  };

  const markCommentAsViewed = async (videoName) => {
    try {
      console.log('Marking comment as viewed:', videoName);
      
      // Use apiRequest instead of direct fetch
      await apiRequest(`${API_URL}/mark-comment-viewed`, {
        method: 'POST',
        body: JSON.stringify({
          teacherId: username,
          videoName
        })
      });
      
      console.log('Comment marked as viewed successfully');
      
      // Update UI to reflect the change
      setComments(prev => 
        prev.map(comment => 
          comment.video_name === videoName ? { ...comment, viewed: true } : comment
        )
      );
    } catch (error) {
      console.error('Error marking comment as viewed:', error);
      // Don't show a toast as this is a background operation
    }
  };

  // Format date for display - updated to match the desired format
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Extract and format date-time from filename
  const extractDateTime = (filename) => {
    const match = filename.match(/^(\d{4})\.(\d{2})\.(\d{2})-(\d{2})\.(\d{2})/);
    if (match) {
      const [_, year, month, day, hour, minute] = match;
      const date = new Date(year, month - 1, day, hour, minute);
      return formatDate(date);
    }
    return formatDate(new Date());
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Size unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Add helper function for formatting duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0h';
    const hours = Math.floor(seconds / 3600);
    return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Filter videos based on search term and date range
  const filteredVideos = videoRecordings.filter(video => {
    const matchesSearch = video.name.toLowerCase().includes(searchTerm.toLowerCase());
    const videoDate = new Date(video.date);
    const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
    const toDate = dateFilter.to ? new Date(dateFilter.to) : null;

    const matchesDateRange = 
      (!fromDate || videoDate >= fromDate) &&
      (!toDate || videoDate <= toDate);

    // Add class code filtering
    const videoClassCode = video.classCode || extractClassName(video.name).split('_')[0];
    const matchesClassCode = !selectedClassCode || videoClassCode === selectedClassCode;

    return matchesSearch && matchesDateRange && matchesClassCode;
  });

  const handleLogout = async () => {
    try {
      authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleVideoClick = (video) => {
    // If we're in a different view, go to the videos view first
    if (activeView !== 'videos') {
      setActiveView('videos');
    }
    
    // Ensure the selected video has the proper path and download URL using apiService
    if (video.fileId) {
      console.log('Video has fileId:', video.fileId);
      // Use apiService to generate URLs from fileId
      video.path = getVideoPlaybackUrl(video.teacherEmail, video.fileName, video.fileId);
      video.downloadUrl = getVideoDownloadUrl(video.teacherEmail, video.fileName, video.fileId);
      console.log('Updated video URLs with fileId:', { path: video.path, downloadUrl: video.downloadUrl });
    } else if (!video.downloadUrl) {
      // Fallback to standard URLs if no fileId is available
      video.downloadUrl = getVideoDownloadUrl(video.teacherEmail, video.fileName);
      console.log('Using standard download URL:', video.downloadUrl);
    }
    
    setSelectedVideo(video);
    setViewingDetails(true);
  };

  const handleDashboardVideoClick = (video) => {
    // Ensure the selected video has the proper path and download URL using apiService
    if (video.fileId) {
      console.log('Video has fileId:', video.fileId);
      // Use apiService to generate URLs from fileId
      video.path = getVideoPlaybackUrl(video.teacherEmail, video.fileName, video.fileId);
      video.downloadUrl = getVideoDownloadUrl(video.teacherEmail, video.fileName, video.fileId);
      console.log('Updated video URLs with fileId:', { path: video.path, downloadUrl: video.downloadUrl });
    } else if (!video.downloadUrl) {
      // Fallback to standard URLs if no fileId is available
      video.downloadUrl = getVideoDownloadUrl(video.teacherEmail, video.fileName);
      console.log('Using standard download URL:', video.downloadUrl);
    }
    
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  // Add handler for class code filter
  const handleClassCodeFilter = (classCode) => {
    setSelectedClassCode(classCode === selectedClassCode ? '' : classCode);
  };

  // Replace the renderStatsPage function with the new TeacherStats component
  const renderStatsPage = () => {
    console.log('DEBUG - renderStatsPage with username:', username);
    
    // Check which email format to use based on teacher existence in DB
    let formattedUsername;
    
    // If we have already verified teacher exists with specific format, use that
    if (teacherExistsInDB) {
      console.log('Teacher exists in DB, using detected format');
      formattedUsername = `t.${username.split('@')[0].replace(/^t\./, '')}@little-champions.com`;
      console.log('Using verified username format:', formattedUsername);
    } else {
      // Try both formats to ensure we find the teacher
      // This is a fallback in case the database check didn't happen yet
      console.log('No verified DB record, trying standard format');
      
      // Extract the base username without domain and prefix
      let baseUsername = username;
      
      // Remove domain part if it exists
      if (baseUsername.includes('@')) {
        baseUsername = baseUsername.split('@')[0];
      }
      
      // Remove t. prefix if it exists
      if (baseUsername.startsWith('t.')) {
        baseUsername = baseUsername.substring(2);
      }
      
      // Now construct the proper format for Neon database
      formattedUsername = `t.${baseUsername}@little-champions.com`;
    }
    
    console.log('DEBUG - Normalized username for Neon DB:', formattedUsername);
    
    // For additional debugging, also try the rhet-corp.com format as some teachers might have that
    console.log('DEBUG - Alternative format to try:', `t.${formattedUsername.split('@')[0].replace(/^t\./, '')}@rhet-corp.com`);
    
    return <TeacherStats username={formattedUsername} displayName={displayName} />;
  };

  // Add new function to handle replies
  const handleSubmitReply = async (commentId) => {
    if (!replyText.trim()) return;
    
    setSubmittingReply(true);
    try {
      toast.loading('Submitting reply...', { id: 'replyToast' });
      
      // Use apiRequest with API_URL
      const newReply = await apiRequest(`${API_URL}/comment-reply`, {
        method: 'POST',
        body: JSON.stringify({
          evaluationId: commentId, // Changed from commentId to evaluationId to match API expectations
          replyText,
          replyBy: username,
          replyType: 'teacher'
        })
      });
      
      // Update the comment with the new reply
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.evaluationId === commentId 
            ? { 
                ...comment, 
                replies: [...(comment.replies || []), newReply],
                showReplies: true
              } 
            : comment
        )
      );
      
      // Reset the reply form
      setReplyText('');
      setReplyingToComment(null);
      toast.success('Reply submitted successfully', { id: 'replyToast' });
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error('Failed to submit reply: ' + error.message, { id: 'replyToast' });
    } finally {
      setSubmittingReply(false);
    }
  };
  
  // Add function to toggle replies visibility
  const toggleReplies = (commentId) => {
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.evaluationId === commentId 
          ? { ...comment, showReplies: !comment.showReplies } 
          : comment
      )
    );
  };

  // Add a new function to render the dashboard page with a comments sidebar section
  const renderDashboardPage = () => {
    const recentComments = comments.slice(0, 5); // Take only the 5 most recent comments
    
    // Debug log all markers
    console.log('All teacher markers:', teacherMarkers);
    console.log('Current markers tab type:', markersTabType);
    
    // Filter markers based on the selected tab type
    const filteredMarkers = teacherMarkers.filter(marker => marker.marker_type === markersTabType);
    
    // Get amazing moments for spotlight
    const amazingMoments = teacherMarkers.filter(marker => 
      marker.marker_type === 'amazing' && marker.is_public
    );
    
    // Sort by creation date (newest first)
    amazingMoments.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    });
    
    // Debug log filtered markers
    console.log('Filtered markers for current tab:', filteredMarkers);
    
    return (
      <ContentWrapper>
        <PageTitle>Welcome, {displayName}</PageTitle>
        
        {/* Amazing Moments Spotlight */}
        <AmazingMomentsSpotlight 
          amazingMoments={amazingMoments}
          showAllAmazingMoments={showAllAmazingMoments}
          setShowAllAmazingMoments={setShowAllAmazingMoments}
          handlePlayDashboardMarker={handlePlayDashboardMarker}
          formatTime={formatTime}
          getRecordingName={getRecordingName}
        />
        
        {/* Areas for Improvement - Horizontal Display */}
        <div style={{ 
          marginBottom: '25px',
          width: '100%'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #FFE8D6, #FFDAB9)',
            border: '1px solid #FFDAB9',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(255, 178, 125, 0.2)',
            padding: '0',
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px 20px',
              borderBottom: '1px solid #FFDAB9'
            }}>
              <div style={{ 
                fontWeight: '600',
                fontSize: '18px',
                color: '#E67E22',
                display: 'flex',
                alignItems: 'center'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#E67E22', marginRight: '8px' }}></i>
                Areas for Improvement
              </div>
              <div 
                onClick={() => setShowAllImprovementAreas(!showAllImprovementAreas)}
                style={{ 
                  color: '#E67E22', 
                  background: 'rgba(255, 218, 185, 0.4)',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {showAllImprovementAreas ? 'Collapse' : 'View All'}
                <i className={`fas fa-${showAllImprovementAreas ? 'compress-alt' : 'arrow-right'}`}></i>
              </div>
            </div>
            
            <div style={{ padding: '15px 20px' }}>
              {loadingMarkers ? (
                <div>Loading markers...</div>
              ) : (
                <>
                  {teacherMarkers.filter(marker => marker.marker_type === 'incident').length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 0',
                      color: '#666',
                      background: '#C3E2C2',
                      borderRadius: '8px',
                      margin: '10px 0'
                    }}>
                      <div style={{
                        fontSize: '40px',
                        color: '#4CAF50',
                        marginBottom: '15px'
                      }}>
                        <i className="fas fa-check-circle"></i>
                      </div>
                      <div>No areas for improvement identified yet</div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      overflowX: 'auto',
                      gap: '15px',
                      padding: '5px 0',
                      marginBottom: '5px'
                    }}>
                      {teacherMarkers
                        .filter(marker => marker.marker_type === 'incident')
                        .slice(0, showAllImprovementAreas ? undefined : 3)
                        .map((marker, index) => {
                          // Calculate duration safely
                          const duration = (marker.end_time && marker.start_time) 
                            ? (marker.end_time - marker.start_time) 
                            : 0;
                          
                          return (
                            <div 
                              key={marker.id}
                              style={{
                                flex: '0 0 280px',
                                background: 'white',
                                borderRadius: '8px',
                                borderLeft: '4px solid #F1A27F',
                                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
                                transition: 'all 0.3s ease',
                                transform: 'scale(1)',
                                padding: '15px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                height: '320px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(241, 162, 127, 0.25)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.08)';
                              }}
                            >
                              <div 
                                onClick={() => handlePlayDashboardMarker(marker)}
                                style={{
                                  background: 'linear-gradient(45deg, #333, #111)',
                                  borderRadius: '8px',
                                  height: '120px',
                                  position: 'relative',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <div style={{ 
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  borderRadius: '8px'
                                }}>
                                  <i className="fas fa-play-circle" style={{ fontSize: '60px', opacity: '0.9', color: 'white' }}></i>
                                </div>
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: 'white', 
                                  position: 'absolute', 
                                  bottom: '10px', 
                                  right: '10px',
                                  background: 'rgba(241, 162, 127, 0.9)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 'bold'
                                }}>
                                  {formatTime(duration)}
                                </div>
                              </div>
                              
                              <div style={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '2px'
                              }}>
                                <div style={{ 
                                  fontSize: '16px', 
                                  fontWeight: 'bold',
                                  color: '#333'
                                }}>
                                  {marker.title || `Error ${index + 1}`}
                                  <span
                                    style={{
                                      background: '#F1A27F',
                                      color: 'white',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      marginLeft: '8px',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      display: 'inline-block'
                                    }}
                                  >
                                    <i className="fas fa-exclamation-circle" style={{marginRight: '4px'}}></i>
                                    Improvement
                                  </span>
                                </div>
                              </div>
                              
                              <div style={{ fontSize: '13px', color: '#666' }}>
                                {marker.recording_id ? getRecordingName(marker.recording_id) : 'Unknown Recording'}
                              </div>
                              
                              <div style={{ 
                                color: '#E67E22', 
                                fontWeight: 'bold',
                                fontSize: '13px',
                                background: 'rgba(241, 162, 127, 0.15)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                width: 'fit-content'
                              }}>
                                <i className="fas fa-clock" style={{ marginRight: '5px' }}></i>
                                {formatTime(marker.start_time || 0)} - {formatTime(marker.end_time || 0)}
                              </div>
                              
                                {marker.description && (
                                  <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.5' }}>
                                    {marker.description.length > 80 
                                      ? `${marker.description.slice(0, 80)}...` 
                                      : marker.description}
                                  </div>
                                )}
                                
                                <button 
                                  onClick={() => handlePlayDashboardMarker(marker)}
                                  style={{
                                    background: '#F1A27F',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                    marginTop: 'auto',
                                    width: '100%'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#E67E22';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#F1A27F';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <i className="fas fa-play"></i> Play Clip
                                </button>
                              </div>
                            );
                          })}
                          
                        {/* Only show the "See more" button if we're not showing all and have more than 3 incidents */}
                        {!showAllImprovementAreas && teacherMarkers.filter(marker => marker.marker_type === 'incident').length > 3 && (
                          <div 
                            onClick={() => setShowAllImprovementAreas(true)}
                            style={{
                              flex: '0 0 100px',
                              background: '#FFF1E6',
                              borderRadius: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              cursor: 'pointer',
                              padding: '20px',
                              color: '#E67E22',
                              textAlign: 'center',
                              transition: 'all 0.2s ease',
                              border: '1px solid #FFDAB9',
                              height: '280px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#C3E2C2';
                              e.currentTarget.style.color = '#4CAF50';
                              e.currentTarget.style.transform = 'translateY(-5px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#FFF1E6';
                              e.currentTarget.style.color = '#E67E22';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <i className="fas fa-ellipsis-h" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                            <div>See {teacherMarkers.filter(marker => marker.marker_type === 'incident').length - 3} more</div>
                          </div>
                        )}
                        
                        {/* Show "See less" button when showing all and have more than 3 */}
                        {showAllImprovementAreas && teacherMarkers.filter(marker => marker.marker_type === 'incident').length > 3 && (
                          <div 
                            onClick={() => setShowAllImprovementAreas(false)}
                            style={{
                              flex: '0 0 100px',
                              background: '#FFF1E6',
                              borderRadius: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              cursor: 'pointer',
                              padding: '20px',
                              color: '#E67E22',
                              textAlign: 'center',
                              transition: 'all 0.2s ease',
                              border: '1px solid #FFDAB9',
                              height: '280px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#C3E2C2';
                              e.currentTarget.style.color = '#4CAF50';
                              e.currentTarget.style.transform = 'translateY(-5px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#FFF1E6';
                              e.currentTarget.style.color = '#E67E22';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <i className="fas fa-compress-alt" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                            <div>Show less</div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        
        <DashboardGrid>
          {/* Teacher performance card */}
          <DashboardCard>
            <CardHeader>
              <CardTitle>Your Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {teacherLatestGrade ? (
                <>
                  <ScoreCircle>
                    <ScoreValue>{teacherLatestGrade}</ScoreValue>
                    <ScoreLabel>Latest Score</ScoreLabel>
                  </ScoreCircle>
                  
                  <ScoreTrend $trend={performanceTrend}>
                    {performanceTrend === 'up' ? (
                      <><i className="fas fa-arrow-up"></i> Improving</>
                    ) : performanceTrend === 'down' ? (
                      <><i className="fas fa-arrow-down"></i> Declining</>
                    ) : (
                      <><i className="fas fa-arrows-alt-h"></i> Stable</>
                    )}
                  </ScoreTrend>
                  
                  {currentRank && (
                    <ComparisonSection>
                      <ComparisonLabel>Your Rank</ComparisonLabel>
                      <ComparisonValue>#{currentRank} of {teacherRankings.length}</ComparisonValue>
                      <ComparisonIndicator $above={currentRank <= Math.ceil(teacherRankings.length / 2)}>
                        {currentRank <= Math.ceil(teacherRankings.length / 2) ? (
                          <><i className="fas fa-thumbs-up"></i> Above Average</>
                        ) : (
                          <><i className="fas fa-thumbs-down"></i> Below Average</>
                        )}
                      </ComparisonIndicator>
                    </ComparisonSection>
                  )}
                </>
              ) : (
                <NoDataMessage>No performance data available yet</NoDataMessage>
              )}
            </CardContent>
          </DashboardCard>
          
          {/* Recent recordings */}
          <DashboardCard>
            <CardHeader>
              <CardTitle>Recent Recordings</CardTitle>
              <ViewAllLink onClick={() => setActiveView('videos')}>
                View All
              </ViewAllLink>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              {videoRecordings.length === 0 ? (
                <EmptyListMessage>No recordings found</EmptyListMessage>
              ) : (
                <MiniRecordingsList>
                  {videoRecordings.slice(0, 5).map((video, index) => (
                    <MiniRecordingItem key={index} onClick={() => handleDashboardVideoClick(video)}>
                      <MiniRecordingIcon>
                        <i className="fas fa-video"></i>
                      </MiniRecordingIcon>
                      <MiniRecordingDetails>
                        <MiniRecordingTitle>{extractClassName(video.name)}</MiniRecordingTitle>
                        <MiniRecordingDate>{extractDateTime(video.name)}</MiniRecordingDate>
                      </MiniRecordingDetails>
                      <MiniRecordingStatus>
                        {video.evaluated ? (
                          <EvaluatedIndicator><i className="fas fa-check-circle"></i></EvaluatedIndicator>
                        ) : (
                          <PendingIndicator><i className="fas fa-clock"></i></PendingIndicator>
                        )}
                      </MiniRecordingStatus>
                    </MiniRecordingItem>
                  ))}
                </MiniRecordingsList>
              )}
            </CardContent>
          </DashboardCard>
          
          {/* New comments */}
          <DashboardCard>
            <CardHeader>
              <CardTitle>New Comments</CardTitle>
              <ViewAllLink onClick={() => setActiveView('comments')}>
                View All {newCommentsCount > 0 && <CommentBadgeSmall>{newCommentsCount}</CommentBadgeSmall>}
              </ViewAllLink>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              {comments.length === 0 ? (
                <EmptyListMessage>No new comments</EmptyListMessage>
              ) : (
                <CommentsListContainer>
                  {comments.slice(0, 5).map((comment, index) => (
                    <CommentListItem key={index} onClick={() => handleCommentClick(comment)}>
                      <CommentListHeader>
                        <CommentListTitle>{extractClassName(comment.videoName)}</CommentListTitle>
                        <CommentListDate>{new Date(comment.date).toLocaleDateString()}</CommentListDate>
                      </CommentListHeader>
                      <CommenterInfo>
                        <i className="fas fa-user-circle"></i> {getEvaluatorAlias(comment.qaEvaluator)}
                      </CommenterInfo>
                      <CommentListText>{comment.comment.length > 60 
                        ? `${comment.comment.substring(0, 60)}...` 
                        : comment.comment}
                      </CommentListText>
                      {comment.grade && (
                        <CommentGrade>Grade: {comment.grade}</CommentGrade>
                      )}
                      {comment.replies && comment.replies.length > 0 && (
                        <CommentListReplies>
                          <i className="fas fa-reply"></i> {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                        </CommentListReplies>
                      )}
                    </CommentListItem>
                  ))}
                </CommentsListContainer>
              )}
            </CardContent>
          </DashboardCard>
        </DashboardGrid>
      </ContentWrapper>
    );
  };

  // Load teacher rankings when switching to ratings view
  useEffect(() => {
    if (activeView === 'ratings') {
      // Reset to current month when switching to ratings view
      setShowingPreviousMonth(false);
      fetchTeacherRankings();
    }
  }, [activeView]);

  // Re-fetch rankings when toggling between current and previous month
  useEffect(() => {
    if (activeView === 'ratings') {
      fetchTeacherRankings();
    }
  }, [showingPreviousMonth]);

  // Add a function to get an alias for evaluator names
  const getEvaluatorAlias = (evaluatorName) => {
    if (!evaluatorName) return 'QA Team';
    
    // If it's already "QA Team", return it
    if (evaluatorName === 'QA Team') return evaluatorName;
    
    // Check for obvious names to replace
    const lowerName = evaluatorName.toLowerCase();
    if (lowerName.includes('daniel')) return 'QA Evaluator 1';
    if (lowerName.includes('john')) return 'QA Evaluator 2';
    if (lowerName.includes('mary')) return 'QA Evaluator 3';
    if (lowerName.includes('admin')) return 'QA Admin';
    
    // For other evaluators, just return a generic "QA Evaluator"
    return 'QA Evaluator';
  };

  // Add a new function to load markers for the dashboard
  const loadTeacherMarkers = async () => {
    if (!username) return;
    
    try {
      setLoadingMarkers(true);
      console.log('Starting to load markers for dashboard...');
      
      // Normalize the username to match database format (t.name@little-champions.com)
      let normalizedUsername = username;
      
      // Remove domain part if it exists
      if (normalizedUsername.includes('@')) {
        normalizedUsername = normalizedUsername.split('@')[0];
      }
      
      // Remove t. prefix if it exists
      if (normalizedUsername.startsWith('t.')) {
        normalizedUsername = normalizedUsername.substring(2);
      }
      
      // Build the properly formatted teacher ID
      const teacherId = `t.${normalizedUsername}@little-champions.com`;
      
      console.log('Fetching markers for teacher:', username);
      console.log('Using normalized teacher ID:', teacherId);
      
      // Step 1: Load teacher's own markers
      let teacherOwnMarkers = [];
      
      try {
        teacherOwnMarkers = await apiServiceDefault.markerService.getTeacherMarkers(teacherId);
        console.log('Received teacher markers using normalized ID:', teacherOwnMarkers);
      } catch (error) {
        console.warn('Error fetching teacher markers with normalized ID:', error);
        
        try {
          teacherOwnMarkers = await apiServiceDefault.markerService.getTeacherMarkers(username);
          console.log('Received teacher markers using original username:', teacherOwnMarkers);
        } catch (secondError) {
          console.error('Error fetching teacher markers with original username:', secondError);
          teacherOwnMarkers = []; // Use empty array on error
        }
      }
      
      // Step 2: Make a SEPARATE call to get ALL public Amazing Moments
      let publicAmazingMoments = [];
      try {
        console.log('Fetching public Amazing Moments from all teachers...');
        publicAmazingMoments = await apiServiceDefault.markerService.getPublicAmazingMoments(100);
        console.log('Received public Amazing Moments:', publicAmazingMoments);
      } catch (error) {
        console.error('Error fetching public Amazing Moments:', error);
        publicAmazingMoments = []; // Use empty array on error
      }
      
      // Log the number of markers from each source
      console.log(`Found ${teacherOwnMarkers.length} teacher's own markers`);
      console.log(`Found ${publicAmazingMoments.length} public Amazing Moments from all teachers`);
      
      // Step 3: Combine BOTH sets of markers - teacher's own + ALL public amazing moments
      const combinedMarkers = [...teacherOwnMarkers, ...publicAmazingMoments];
      
      console.log(`Total combined markers: ${combinedMarkers.length}`);
      
      // Remove duplicates by ID
      const uniqueMarkers = [];
      const seenIds = new Set();
      
      for (const marker of combinedMarkers) {
        if (marker && marker.id && !seenIds.has(marker.id)) {
          uniqueMarkers.push(marker);
          seenIds.add(marker.id);
        }
      }
      
      console.log(`Total unique markers after deduplication: ${uniqueMarkers.length}`);
      console.log('Final markers array to be displayed:', uniqueMarkers);
      
      // Set the markers state
      setTeacherMarkers(uniqueMarkers);
    } catch (error) {
      console.error('Error in loadTeacherMarkers:', error);
      toast.error('Failed to load video markers');
      setTeacherMarkers([]);
    } finally {
      setLoadingMarkers(false);
    }
  };
  
  // Add this to the existing useEffect that loads user data
  useEffect(() => {
    // ... existing code ...
    
    // Load markers when the dashboard loads
    if (username && activeView === 'dashboard') {
      loadTeacherMarkers();
    }
    
    // ... existing code ...
  }, [username, activeView]);
  
  // Format time in seconds to MM:SS or HH:MM:SS format
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    
    // If time exceeds 60 minutes, use HH:MM:SS format
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } 
    // Otherwise use MM:SS format
    else {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };
  
  // Update the handlePlayDashboardMarker function
  const handlePlayDashboardMarker = (marker) => {
    try {
      // Reset the seeking flag when switching markers
      hasPerformedInitialSeek.current = false;
      
      // Reset the playback attempt counter
      setPlaybackAttempt(0);
      
      // Reset player state
      setIsPlaying(true);
      setMarkerProgress(0);
      setCurrentTime(0);
      
      console.log('Attempting to play marker:', marker);
      
      // Validate marker object
      if (!marker) {
        console.error('Invalid marker: marker is null or undefined');
        toast.error('Cannot play marker: Invalid marker data');
        return;
      }
      
      // Create enhanced marker with default values for missing properties
      const enhancedMarker = {
        ...marker,
        // If recording_id is missing, we can't play the video
        recording_id: marker.recording_id || null,
        // Use teacher_email as fallback for teacher_id
        teacher_id: marker.teacher_id || marker.teacher_email || null,
        // Ensure start_time and end_time are numbers
        start_time: typeof marker.start_time === 'number' ? marker.start_time : parseFloat(marker.start_time) || 0,
        end_time: typeof marker.end_time === 'number' ? marker.end_time : parseFloat(marker.end_time) || 0
      };
      
      // Make sure end_time is greater than start_time
      if (enhancedMarker.end_time <= enhancedMarker.start_time) {
        // Set a default duration of 10 seconds if end_time is invalid
        enhancedMarker.end_time = enhancedMarker.start_time + 10;
        console.warn('Fixed invalid marker timing - end time must be greater than start time');
      }
      
      // Enhanced logging for debugging
      console.log('Marker details:', {
        id: enhancedMarker.id,
        title: enhancedMarker.title,
        teacher_id: enhancedMarker.teacher_id,
        teacher_email: enhancedMarker.teacher_email,
        recording_id: enhancedMarker.recording_id,
        start_time: enhancedMarker.start_time,
        end_time: enhancedMarker.end_time,
        duration: enhancedMarker.end_time - enhancedMarker.start_time
      });
      
      // If the marker doesn't have recording_id or teacher_id, show error
      if (!enhancedMarker.recording_id || !enhancedMarker.teacher_id) {
        console.error('Enhanced marker missing required properties:', enhancedMarker);
        toast.error('Cannot play marker: Missing required data');
        return;
      }
      
      // Check if recording_id looks like a filename instead of a Google Drive ID
      const isFilename = enhancedMarker.recording_id.includes('.mp4') || 
                         enhancedMarker.recording_id.includes('+0800') ||
                         /\d{4}\.\d{2}\.\d{2}/.test(enhancedMarker.recording_id);
                         
      // If this marker appears to have a filename as recording_id, adjust it for direct streaming
      if (isFilename) {
        console.log('Recording ID appears to be a filename, not a Drive ID:', enhancedMarker.recording_id);
        
        // Generate direct streaming URL for file
        const teacherId = enhancedMarker.teacher_id || enhancedMarker.teacher_email;
        
        // Make sure we have a proper teacher ID
        if (!teacherId) {
          console.error('No teacher ID available for direct streaming');
          toast.error('Cannot play video: Missing teacher information');
          return;
        }
        
        // Extract filename, ensuring we don't double-encode or have path issues
        let filename = enhancedMarker.recording_id;
        
        // If the recording_id contains slashes, extract just the filename part
        if (filename.includes('/')) {
          filename = filename.split('/').pop();
        }
        
        // Ensure filename is properly formatted (no leading/trailing whitespace)
        filename = filename.trim();
        
        console.log(`Using direct streaming for ${teacherId} / ${filename}`);
        
        // Use config.video.baseStreamUrl instead of hardcoded URL
        const baseUrl = `${config.video.baseStreamUrl}/${encodeURIComponent(teacherId)}/${encodeURIComponent(filename)}`;
        console.log('Base URL for streaming:', baseUrl);
        
        // Add time hash for seeking
        const directStreamUrl = `${baseUrl}#t=${enhancedMarker.start_time}`;
        
        // Create a copy of the marker with the direct URL
        const markerCopy = {
          ...enhancedMarker,
          path: directStreamUrl,
          baseUrl: baseUrl  // Add baseUrl for potential fallback
        };
        
        // Set the marker to be played and show the player
        setCurrentPlayingMarker(markerCopy);
        setDashboardPlayerVisible(true);
        setPlayerLoading(true);
        console.log('Using direct stream URL:', directStreamUrl);
        
        // Show guidance to the user
        toast.success('Playing marker clip. If video doesn\'t start, try clicking play.');
        return;
      }
      
      // Generate URL for the marker using the API service
      let markerUrl = apiServiceDefault.apiService.getMarkerVideoUrl(enhancedMarker);
      
      console.log('Generated marker URL:', markerUrl);
      
      if (markerUrl) {
        // Create a copy of the marker to avoid mutating the original
        const markerCopy = {...enhancedMarker, path: markerUrl};
        
        // Set the marker to be played and show the player
        setCurrentPlayingMarker(markerCopy);
        setDashboardPlayerVisible(true);
        setPlayerLoading(true);
        
        // Log the action
        console.log(`Playing marker: ${markerCopy.title || 'Unnamed marker'}, Type: ${markerCopy.marker_type}, URL: ${markerUrl}`);
        
        // Show guidance to the user
        toast.success('Playing marker clip. If video doesn\'t start, try clicking play.');
      } else {
        console.error('Could not generate playback URL for marker:', enhancedMarker);
        toast.error('Could not generate playback URL for this marker');
      }
    } catch (error) {
      console.error('Error playing marker:', error);
      toast.error('Error playing marker clip');
    }
  };

  // Update the handleClosePlayer function
  const handleCloseDashboardPlayer = () => {
    setCurrentPlayingMarker(null);
    setDashboardPlayerVisible(false);
    setPlaybackAttempt(0);
    setIsPlaying(false);
    setMarkerProgress(0);
    setCurrentTime(0);
    hasPerformedInitialSeek.current = false;
  };

  // Get recording name from recording ID
  const getRecordingName = (recordingId) => {
    // Handle null, undefined, or non-string recording IDs
    if (!recordingId) return 'Unknown recording';
    
    try {
      // Ensure recordingId is a string
      const recordingIdStr = String(recordingId);
      
      // For files in Google Drive, we don't have the full name in the recordingId
      // so we'll need to check if this is a file ID (doesn't have slashes)
      if (!recordingIdStr.includes('/')) {
        return 'Recording from Google Drive';
      }
      
      // For local files, extract the filename from the path
      const parts = recordingIdStr.split('/');
      return parts[parts.length - 1] || 'Unknown recording';
    } catch (error) {
      console.error('Error extracting recording name:', error);
      return 'Unknown recording';
    }
  };

  // Update the useEffect that loads teacher data when view changes
  useEffect(() => {
    if (activeView === 'stats') {
      // No need to refetch if we already have stats data
      if (!teacherStats) {
        // Replace fetchTeacherStatsData with fetchTeacherStats
        const loadTeacherStats = async () => {
          try {
            const statsData = await fetchTeacherStats(username);
            setTeacherStats(statsData);
          } catch (error) {
            console.error('Error loading teacher stats:', error);
            toast.error('Failed to load teacher statistics');
          }
        };
        loadTeacherStats();
      }
    } else if (activeView === 'ratings') {
      fetchTeacherRankings();
    } else if (activeView === 'dashboard') {
      // Load markers for the dashboard view
      loadTeacherMarkers();
    }
  }, [activeView, username, teacherStats]);

  // Modify the tab click handler to reset the current marker
  const handleMarkerTabChange = (tabType) => {
    setMarkersTabType(tabType);
    // Reset the current playing marker when changing tabs
    setCurrentPlayingMarker(null);
  };

  // Add a separate useEffect to load markers on component mount
  useEffect(() => {
    // Load teacher markers on component mount, regardless of active view
    if (username) {
      console.log('Initial load of teacher markers on component mount');
      loadTeacherMarkers();
    }
  }, []);  // Empty dependency array means it only runs once on mount

  // Helper function to format teacher email into a readable name
  const formatTeacherName = (teacherId) => {
    if (!teacherId) return 'Unknown Teacher';
    
    // Try to extract username from email
    if (teacherId.includes('@')) {
      const username = teacherId.split('@')[0];
      
      // Remove t. prefix if it exists
      if (username.startsWith('t.')) {
        const name = username.substring(2);
        // Convert to title case
        return name.split('.').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
      }
      
      // Just return the username if no t. prefix
      return username;
    }
    
    // If not an email, just return as is
    return teacherId;
  };

  // Function to make a marker public
  const makeMarkerPublic = async () => {
    if (!markerIdToMakePublic) {
      setDebugMessage('No marker ID provided');
      return;
    }

    try {
      setDebugMessage('Attempting to make marker public...');
      const data = await apiRequest(`${API_URL}/api/markers/make-public/${markerIdToMakePublic}`, {
        method: 'POST'
      });
      
      setDebugMessage(`Success: ${data.message}. Marker details: ${JSON.stringify(data.marker)}`);
      // Reload markers to see the change
      loadTeacherMarkers();
    } catch (error) {
      setDebugMessage(`Exception: ${error.message}`);
    }
  };

  // Function to create a test Amazing Moment for debugging
  const createTestAmazingMoment = async () => {
    try {
      setDebugMessage('Creating test Amazing Moment...');
      
      if (!recordingId) {
        setDebugMessage('Error: No recording ID available. You need to have at least one recording.');
        return;
      }
      
      // Create a marker with the test data
      const markerData = {
        recording_id: recordingId,
        teacher_id: teacherId || username, // Use current teacher
        marker_type: 'amazing',
        start_time: 10, // 10 seconds into recording
        end_time: 20,   // 10 second duration
        title: debugCreateForm.title,
        description: debugCreateForm.description,
        is_public: debugCreateForm.is_public
      };
      
      // Call the API to create the marker
      const data = await apiRequest(`${API_URL}/api/markers`, {
        method: 'POST',
        body: JSON.stringify(markerData)
      });
      
      if (data && data.id) {
        setDebugMessage(`Success: Created test Amazing Moment with ID ${data.id}`);
        // Reload markers to see the new one
        loadTeacherMarkers();
      } else {
        setDebugMessage(`Error creating marker: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setDebugMessage(`Exception: ${error.message}`);
    }
  };

  // Function to fetch available recordings for debugging purposes
  const loadFirstRecording = async () => {
    try {
      const recordings = await apiRequest(`${API_URL}/api/recordings?teacher=${teacherId || username}`);
      
      if (recordings && recordings.length > 0) {
        // Use the first recording's ID
        setRecordingId(recordings[0].id);
        setDebugMessage(`Found recording ID: ${recordings[0].id}`);
      } else {
        setDebugMessage('No recordings found for this teacher. Create a recording first.');
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
      setDebugMessage(`Error loading recordings: ${error.message}`);
    }
  };

  // Load first recording when debug panel is shown
  useEffect(() => {
    if (showDebugPanel && !recordingId) {
      loadFirstRecording();
    }
  }, [showDebugPanel]);

  // Add a function to retry playback with a different URL format
  const retryPlayWithoutTimestamp = () => {
    if (!currentPlayingMarker) return;
    
    console.log('Retrying playback without timestamp');
    
    // If we have a baseUrl (set for direct streaming URLs), try that first
    if (currentPlayingMarker.baseUrl) {
      const markerCopy = {
        ...currentPlayingMarker,
        path: currentPlayingMarker.baseUrl // Use URL without the timestamp fragment
      };
      setCurrentPlayingMarker(markerCopy);
      setPlaybackAttempt(playbackAttempt + 1);
      return;
    }
    
    // For other URLs, try removing the timestamp fragment
    if (currentPlayingMarker.path && currentPlayingMarker.path.includes('#t=')) {
      const baseUrl = currentPlayingMarker.path.split('#t=')[0];
      const markerCopy = {
        ...currentPlayingMarker,
        path: baseUrl
      };
      setCurrentPlayingMarker(markerCopy);
      setPlaybackAttempt(playbackAttempt + 1);
    }
  };

  // Update the state for dashboard player visibility
const [dashboardPlayerVisible, setDashboardPlayerVisible] = useState(false);

// Add a new state for showing all improvement areas
const [showAllImprovementAreas, setShowAllImprovementAreas] = useState(false);

// Note: Other state variables are already defined at the top of the component
  return (
    <AppContainer>
      <Sidebar>
        <SidebarHeader>
          <SidebarTitle>Teacher Dashboard</SidebarTitle>
        </SidebarHeader>
        <NavMenu>
          <NavItem 
            $active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')}
          >
            <i className="fas fa-home"></i> Dashboard
          </NavItem>
          <NavItem 
            $active={activeView === 'stats'} 
            onClick={() => setActiveView('stats')}
          >
            <i className="fas fa-chart-bar"></i> Stats
          </NavItem>
          <NavItem 
            $active={activeView === 'ratings'} 
            onClick={() => setActiveView('ratings')}
          >
            <i className="fas fa-star"></i> Ratings
          </NavItem>
          <NavItem 
            $active={activeView === 'comments'} 
            onClick={() => setActiveView('comments')}
          >
            <i className="fas fa-comments"></i> Comments 
            {newCommentsCount > 0 && (
              <CommentBadgeSmall>{newCommentsCount}</CommentBadgeSmall>
            )}
          </NavItem>
          <NavItem 
            $active={activeView === 'videos'} 
            onClick={() => setActiveView('videos')}
          >
            <i className="fas fa-video"></i> Video List
          </NavItem>
        </NavMenu>

        <LogoutButton onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </LogoutButton>
      </Sidebar>

      <MainContent>
        {activeView === 'dashboard' && (
          renderDashboardPage()
        )}
        
        {activeView === 'comments' && (
          <ContentWrapper>
            <PageTitle>Comments</PageTitle>
            
            {/* New feature notice */}
            <FeatureNotice>
              <i className="fas fa-info-circle"></i> 
              <div>
                <strong>New Feature:</strong> You can now reply to comments from your QA evaluators! 
                Each conversation is limited to 3 replies to keep feedback focused.
              </div>
            </FeatureNotice>
            
            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
              Comments count: {comments.length} | Badge count: {newCommentsCount}
            </div>
            {comments.length === 0 ? (
              <NoCommentsMessage>No new comments</NoCommentsMessage>
            ) : (
              <CommentsList>
                {comments.map((comment, index) => {
                  const evaluatorName = getEvaluatorAlias(comment.qaEvaluator);
                  return (
                    <CommentItem key={index}>
                      <CommentHeader>
                        <CommentVideoName onClick={() => handleCommentClick(comment)}>
                          {extractClassName(comment.videoName)}
                        </CommentVideoName>
                        <CommentDate>{new Date(comment.date).toLocaleDateString()}</CommentDate>
                      </CommentHeader>
                      <CommentEvaluator>
                        <i className="fas fa-user-circle"></i> {evaluatorName}
                      </CommentEvaluator>
                      <CommentText>{comment.comment.length > 100 
                        ? `${comment.comment.substring(0, 100)}...` 
                        : comment.comment}
                      </CommentText>
                      {comment.grade && (
                        <CommentFullGrade>Grade: {comment.grade}</CommentFullGrade>
                      )}
                      
                      {/* Show/Hide Replies toggle if replies exist */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div>
                          <ToggleButton 
                            onClick={() => toggleReplies(comment.evaluationId)}
                            $isExpanded={comment.showReplies}
                          >
                            <i className="fas fa-chevron-right"></i>
                            {comment.showReplies ? 'Hide Replies' : 'Show Replies'}
                            <ReplyCountBubble $isActive={comment.showReplies}>
                              {comment.replies.length}
                            </ReplyCountBubble>
                          </ToggleButton>
                          
                          {/* Render replies if showReplies is true */}
                          {comment.showReplies && (
                            <RepliesContainer>
                              {comment.replies.map((reply, replyIndex) => (
                                <ReplyItem 
                                  key={replyIndex} 
                                  $isQA={reply.reply_type === 'qa'}
                                >
                                  <ReplyHeader>
                                    <ReplyAuthor $isQA={reply.reply_type === 'qa'}>
                                      {reply.reply_type === 'qa' ? (
                                        <><i className="fas fa-user-tie"></i> {getEvaluatorAlias(reply.reply_by)}</>
                                      ) : (
                                        <><i className="fas fa-chalkboard-teacher"></i> You</>
                                      )}
                                    </ReplyAuthor>
                                    <ReplyDate>
                                      {reply.reply_at ? new Date(reply.reply_at).toLocaleString() : 'No date'}
                                    </ReplyDate>
                                  </ReplyHeader>
                                  <ReplyText>{reply.reply_text}</ReplyText>
                                </ReplyItem>
                              ))}
                            </RepliesContainer>
                          )}
                        </div>
                      )}
                      
                      {/* Render reply form if replyingToComment matches this comment's id */}
                      {replyingToComment === comment.evaluationId ? (
                        <ReplyForm>
                          <ReplyTextarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Type your reply here..."
                          />
                          <ReplyButtons>
                            <SubmitReplyButton 
                              onClick={() => handleSubmitReply(comment.evaluationId)}
                              disabled={submittingReply || !replyText.trim()}
                            >
                              {submittingReply ? 'Sending...' : 'Submit Reply'}
                            </SubmitReplyButton>
                            <CancelReplyButton onClick={() => {
                              setReplyingToComment(null);
                              setReplyText('');
                            }}>
                              Cancel
                            </CancelReplyButton>
                          </ReplyButtons>
                        </ReplyForm>
                      ) : (
                        // Only show reply button if total replies < 3
                        comment.replies && comment.replies.length < 3 ? (
                          <ReplyButton onClick={() => setReplyingToComment(comment.evaluationId)}>
                            <i className="fas fa-reply"></i> Reply
                          </ReplyButton>
                        ) : comment.replies && comment.replies.length >= 3 && (
                          <ReplyLimitMessage>
                            <i className="fas fa-info-circle"></i> Maximum replies reached (3/3)
                          </ReplyLimitMessage>
                        )
                      )}
                    </CommentItem>
                  );
                })}
              </CommentsList>
            )}
          </ContentWrapper>
        )}

        {/* Add the stats page */}
        {activeView === 'stats' && renderStatsPage()}

        {activeView === 'videos' && !viewingDetails && (
          <ContentWrapper>
            <PageTitle>Viewing Recordings for: {displayName}</PageTitle>
              <SearchContainer>
                <label>Search by Class Code or Name</label>
                <SearchInput
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              <FilterContainer>
                <FilterLabel>From:</FilterLabel>
                  <DateInput
                    type="date"
                    value={dateFilter.from}
                    onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                  />
                <FilterLabel>To:</FilterLabel>
                  <DateInput
                    type="date"
                    value={dateFilter.to}
                    onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                  />
                {(dateFilter.from || dateFilter.to) && (
                  <ClearFilterButton onClick={() => setDateFilter({ from: '', to: '' })}>
                    <i className="fas fa-times"></i>
                    Clear
                  </ClearFilterButton>
                )}
              </FilterContainer>

              {/* Add class filter buttons */}
              {availableClassCodes.length > 0 && (
                <ClassFilterContainer>
                  <FilterSectionTitle>
                    <i className="fas fa-filter"></i>
                    Filter by class:
                  </FilterSectionTitle>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
                    {availableClassCodes.map(classCode => (
                      <ClassFilterButton 
                        key={classCode}
                        $active={selectedClassCode === classCode}
                        onClick={() => handleClassCodeFilter(classCode)}
                      >
                        {classCode}
                      </ClassFilterButton>
                    ))}
                  </div>
                  {selectedClassCode && (
                    <ClearFilterButton onClick={() => setSelectedClassCode('')}>
                      <i className="fas fa-times"></i>
                      Clear
                    </ClearFilterButton>
                  )}
                </ClassFilterContainer>
              )}
              </SearchContainer>

            {isLoading ? (
              <LoadingMessage>Loading recordings...</LoadingMessage>
            ) : error ? (
              <ErrorMessage>{error}</ErrorMessage>
            ) : filteredVideos.length === 0 ? (
              <NoVideosMessage>
                {searchTerm || dateFilter.from || dateFilter.to || selectedClassCode
                  ? 'No recordings match your search criteria'
                  : 'No recordings found in your directory'}
              </NoVideosMessage>
            ) : (
              <>
                {/* Replace table with grid layout */}
                <RecordingsGrid>
                  {filteredVideos.map((video, index) => {
                    // Extract class code from video
                    const classCode = video.classCode || extractClassName(video.name).split('_')[0];
                    
                    return (
                      <RecordingCard key={index} onClick={() => handleVideoClick(video)}>
                        <RecordingThumbnail>
                          <i className="fas fa-video"></i>
                        </RecordingThumbnail>
                        <RecordingInfo>
                          <RecordingTitle>
                            <ClassBadge>{classCode}</ClassBadge>
                            {extractClassName(video.name)}
                          </RecordingTitle>
                          <RecordingDate>
                            <i className="fas fa-calendar-alt"></i>
                            {extractDateTime(video.name)}
                          </RecordingDate>
                          <RecordingMeta>
                            <span>
                              <i className="fas fa-hdd"></i>
                              {formatFileSize(video.size)}
                            </span>
                            {video.evaluated && (
                              <span style={{ color: '#4CAF50' }}>
                                <i className="fas fa-check-circle"></i>
                                Evaluated
                              </span>
                            )}
                          </RecordingMeta>
                        </RecordingInfo>
                      </RecordingCard>
                    );
                  })}
                </RecordingsGrid>
              </>
            )}
          </ContentWrapper>
        )}

        {activeView === 'videos' && viewingDetails && selectedVideo && (
          <ContentWrapper>
            <PageTitle>Video Recording</PageTitle>
            
            {/* Video Player Section */}
            <VideoContainer>
              {console.log('Video URL being used in details view:', selectedVideo?.path)}
              
              {/* Show loading indicator while video is loading */}
              {videoLoading && (
                <VideoLoadingOverlay>
                  <LoadingSpinner>
                    <i className="fas fa-circle-notch fa-spin"></i>
                  </LoadingSpinner>
                  <div>Loading video...</div>
                </VideoLoadingOverlay>
              )}
              
              <StyledReactPlayer
                ref={videoPlayerRef}
                url={selectedVideo.path}
                width="100%"
                height="100%"
                controls={true}
                playing={true}
                playsinline={true}
                onBuffer={() => setVideoLoading(true)}
                onBufferEnd={() => setVideoLoading(false)}
                onReady={() => {
                  console.log('Detail view video ready to play');
                  setVideoLoading(false);
                }}
                onStart={() => {
                  console.log('Detail view video playback started');
                  setVideoLoading(false);
                }}
                progressInterval={500}
                config={{
                  file: {
                    forceVideo: true,
                    attributes: {
                      controlsList: 'nodownload',
                      preload: 'auto'
                    },
                    hlsOptions: {
                      enableWorker: true,
                      lowLatencyMode: true
                    },
                    forceHLS: false,
                    forceDASH: false
                  }
                }}
                onError={(e) => {
                  console.error('ReactPlayer error:', e);
                  console.log('Failed URL:', selectedVideo.path);
                  setVideoLoading(false);
                  toast.error('Error loading video. Try the direct URL button below.');
                  
                  // Try to reload with a different URL format if possible
                  if (selectedVideo.fileId && selectedVideo.path.includes('stream-drive')) {
                    console.log('Trying alternative URL format');
                    const newUrl = `${config.video.baseStreamUrl}/${encodeURIComponent(selectedVideo.teacherEmail || username)}/${encodeURIComponent(selectedVideo.fileName || selectedVideo.name)}`;
                    setSelectedVideo({
                      ...selectedVideo,
                      path: newUrl
                    });
                  }
                }}
              />
              
              {/* Add the TeacherVideoMarkers component here */}
              {/* TeacherVideoMarkers component removed to avoid overlap with dashboard implementation */}
              
              <button 
                onClick={() => window.open(selectedVideo.path, '_blank')}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  padding: '8px 16px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  zIndex: 10,
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-external-link-alt"></i> Open Direct URL
              </button>
            </VideoContainer>
            
            {/* Video Details */}
            <RecordingDetails>
              <DetailItem>
                <i className="fas fa-file-video"></i>
                <strong>File Name:</strong> 
                <FileDetails>{extractClassName(selectedVideo.name)}</FileDetails>
              </DetailItem>
              <DetailItem>
                <i className="fas fa-chalkboard"></i>
                <strong>Class:</strong> 
                <span>{selectedVideo.classCode || extractClassName(selectedVideo.name).split('_')[0]}</span>
              </DetailItem>
              <DetailItem>
                <i className="fas fa-calendar-alt"></i>
                <strong>Recording Date:</strong> 
                <span>{extractDateTime(selectedVideo.name)}</span>
              </DetailItem>
              <DetailItem>
                <i className="fas fa-clock"></i>
                <strong>Recording Time:</strong> 
                <span>
                  {(() => {
                    // Try to extract time from the filename and convert to 12-hour format
                    if (selectedVideo.name) {
                      // Try to extract time from the format YYYY.MM.DD-HH.MM
                      const timeMatch = selectedVideo.name.match(/\d{4}\.\d{2}\.\d{2}-(\d{2})\.(\d{2})/);
                      if (timeMatch) {
                        const hours = parseInt(timeMatch[1]);
                        const minutes = timeMatch[2];
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const hours12 = hours % 12 || 12; // Convert 0 to 12
                        return `${hours12}:${minutes} ${ampm}`;
                      }
                      
                      // Try to extract time from AM/PM format
                      const ampmMatch = selectedVideo.name.match(/(\d{2})(\d{2})([AP]M)/);
                      if (ampmMatch) {
                        return `${ampmMatch[1]}:${ampmMatch[2]} ${ampmMatch[3]}`;
                      }
                    }
                    
                    return 'Unknown';
                  })()}
                </span>
              </DetailItem>
              <DetailItem>
                <i className="fas fa-hdd"></i>
                <strong>Size:</strong> 
                <span>{formatFileSize(selectedVideo.size)}</span>
              </DetailItem>
              <DownloadButton 
                onClick={() => {
                  if (selectedVideo.downloadUrl) {
                    window.open(selectedVideo.downloadUrl, '_blank');
                  }
                }}
              >
                <i className="fas fa-download"></i> Download Video
              </DownloadButton>
            </RecordingDetails>

            <CloseButton onClick={() => {
              setViewingDetails(false);
              setSelectedVideo(null);
            }}>
              <i className="fas fa-arrow-left"></i> Back to Recordings
            </CloseButton>
          </ContentWrapper>
        )}

        {activeView === 'ratings' && (
          <ContentWrapper>
            <PageTitle>Teacher Rankings</PageTitle>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px'
            }}>
              <div>
                {!rankingsLoading && !rankingsError && teacherRankings.length > 0 && (
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Showing rankings for: {new Date(rankingsMetadata.year, rankingsMetadata.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => {
                    setShowingPreviousMonth(false);
                    fetchTeacherRankings();
                  }}
                  disabled={!showingPreviousMonth || rankingsLoading}
                  style={{ 
                    padding: '8px 16px', 
                    background: !showingPreviousMonth ? '#FFDDC9' : '#f1f1f1', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: !showingPreviousMonth ? 'bold' : 'normal',
                    opacity: !showingPreviousMonth ? 1 : 0.8
                  }}
                >
                  Current Month
                </button>
                <button 
                  onClick={() => {
                    setShowingPreviousMonth(true);
                    fetchTeacherRankings();
                  }}
                  disabled={showingPreviousMonth || rankingsLoading}
                  style={{ 
                    padding: '8px 16px', 
                    background: showingPreviousMonth ? '#FFDDC9' : '#f1f1f1', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: showingPreviousMonth ? 'bold' : 'normal',
                    opacity: showingPreviousMonth ? 1 : 0.8
                  }}
                >
                  Previous Month
                </button>
              </div>
            </div>
            
            {rankingsLoading ? (
              <LoadingContainer>
                <i className="fas fa-spinner fa-spin"></i> Loading teacher rankings...
              </LoadingContainer>
            ) : rankingsError ? (
              <ErrorContainer>
                <i className="fas fa-exclamation-circle"></i> Error: {rankingsError}
                <div style={{ marginTop: '10px' }}>
                  <button 
                    onClick={fetchTeacherRankings} 
                    style={{ 
                      padding: '8px 16px', 
                      background: '#FFDDC9', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fas fa-sync-alt"></i> Retry{showingPreviousMonth ? ' (Previous Month)' : ' (Current Month)'}
                  </button>
                </div>
              </ErrorContainer>
            ) : teacherRankings.length === 0 ? (
              <NoDataMessage>
                No ranking data available {showingPreviousMonth ? 'for the previous month' : 'for the current month'}.
                <div style={{ marginTop: '10px' }}>
                  <button 
                    onClick={fetchTeacherRankings} 
                    style={{ 
                      padding: '8px 16px', 
                      background: '#FFDDC9', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fas fa-sync-alt"></i> Refresh{showingPreviousMonth ? ' (Previous Month)' : ' (Current Month)'}
                  </button>
                </div>
              </NoDataMessage>
            ) : (
              <>
                {currentRank && (
                  <RankingCardContainer>
                    <RankingCard>
                      <RankTopSection>
                        <RankLabel>
                          {showingPreviousMonth ? 'Your Previous Month Rank' : 'Your Current Rank'}
                          {showingPreviousMonth && (
                            <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#666', marginTop: '4px' }}>
                              {new Date(rankingsMetadata.year, rankingsMetadata.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </div>
                          )}
                        </RankLabel>
                        <RankValue $rank={currentRank}>#{currentRank}</RankValue>
                      </RankTopSection>
                      <RankBottomSection>
                        <RankDetail>
                          <RankDetailLabel>Total Teachers</RankDetailLabel>
                          <RankDetailValue>{teacherRankings.length}</RankDetailValue>
                        </RankDetail>
                        <RankDetail>
                          <RankDetailLabel>Your Grade</RankDetailLabel>
                          <RankDetailValue>
                            {teacherRankings.find(t => {
                              const teacherEmail = username.includes('@little-champions.com') ? 
                                username : username.replace('@rhet-corp.com', '@little-champions.com');
                              return t.teacher_id === teacherEmail;
                            })?.grade.toFixed(2) || 'N/A'}
                          </RankDetailValue>
                        </RankDetail>
                        <RankDetail>
                          <RankDetailLabel>Top Grade</RankDetailLabel>
                          <RankDetailValue>{teacherRankings[0]?.grade.toFixed(2) || 'N/A'}</RankDetailValue>
                        </RankDetail>
                      </RankBottomSection>
                    </RankingCard>
                  </RankingCardContainer>
                )}
                
                <RankingsTableContainer>
                  <RankingsTable>
                    <RankingsTableHeader>
                      <tr>
                        <th>Rank</th>
                        <th>Teacher</th>
                        <th>Grade</th>
                        <th>Last Updated</th>
                        <th>Evaluated By</th>
                      </tr>
                    </RankingsTableHeader>
                    <RankingsTableBody>
                      {teacherRankings.map((teacherRank, index) => {
                        // Extract username from email
                        const teacherEmail = teacherRank.teacher_id;
                        const isCurrentTeacher = teacherEmail === (username.includes('@little-champions.com') ? 
                          username : username.replace('@rhet-corp.com', '@little-champions.com'));
                        
                        const teacherName = teacherEmail.split('@')[0].replace('t.', '');
                        const formattedName = teacherName.charAt(0).toUpperCase() + teacherName.slice(1);
                        
                        return (
                          <RankingsTableRow key={index} $isCurrentTeacher={isCurrentTeacher}>
                            <td>{teacherRank.rank}</td>
                            <td>{formattedName}</td>
                            <td>{parseFloat(teacherRank.grade).toFixed(2)}</td>
                            <td>{new Date(teacherRank.updated_at || teacherRank.created_at).toLocaleDateString()}</td>
                            <td>{getEvaluatorAlias(teacherRank.qa_evaluator)}</td>
                          </RankingsTableRow>
                        );
                      })}
                    </RankingsTableBody>
                  </RankingsTable>
                </RankingsTableContainer>
              </>
            )}
          </ContentWrapper>
        )}
      </MainContent>

      {showVideoModal && selectedVideo && (
        <VideoModal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                <ClassBadge>{selectedVideo.classCode || extractClassName(selectedVideo.name).split('_')[0]}</ClassBadge>
                {extractClassName(selectedVideo.name)}
              </ModalTitle>
              <CloseModalButton onClick={() => setShowVideoModal(false)}>×</CloseModalButton>
            </ModalHeader>
            <VideoPlayerContainer>
              {console.log('Video URL being used in modal:', selectedVideo?.path)}
              
              {/* Show loading indicator while video is loading */}
              {videoLoading && (
                <VideoLoadingOverlay>
                  <LoadingSpinner>
                    <i className="fas fa-circle-notch fa-spin"></i>
                  </LoadingSpinner>
                  <div>Loading video...</div>
                </VideoLoadingOverlay>
              )}
              
              <StyledReactPlayer
                ref={modalVideoPlayerRef}
                url={selectedVideo.path}
                width="100%"
                height="100%"
                controls={true}
                playing={true}
                playsinline={true}
                onBuffer={() => setVideoLoading(true)}
                onBufferEnd={() => setVideoLoading(false)}
                onReady={() => {
                  console.log('Video ready to play');
                  setVideoLoading(false);
                }}
                onStart={() => {
                  console.log('Video playback started');
                  setVideoLoading(false);
                }}
                progressInterval={500}
                config={{
                  file: {
                    forceVideo: true,
                    attributes: {
                      controlsList: 'nodownload',
                      preload: 'auto'
                    },
                    hlsOptions: {
                      enableWorker: true,
                      lowLatencyMode: true
                    },
                    forceHLS: false,
                    forceDASH: false
                  }
                }}
                onError={(e) => {
                  console.error('ReactPlayer error:', e);
                  console.log('Failed URL:', selectedVideo.path);
                  setVideoLoading(false);
                  toast.error('Error loading video. Try the direct URL button below.');
                  
                  // Try to reload with a different URL format if possible
                  if (selectedVideo.fileId && selectedVideo.path.includes('stream-drive')) {
                    console.log('Trying alternative URL format');
                    const newUrl = `${config.video.baseStreamUrl}/${encodeURIComponent(selectedVideo.teacherEmail || username)}/${encodeURIComponent(selectedVideo.fileName || selectedVideo.name)}`;
                    setSelectedVideo({
                      ...selectedVideo,
                      path: newUrl
                    });
                  }
                }}
              />
              
              {/* Add an alternative playback button */}
              <button 
                onClick={() => window.open(selectedVideo.path, '_blank')}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  padding: '8px 16px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  zIndex: 10,
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-external-link-alt"></i> Open Direct URL
              </button>
            </VideoPlayerContainer>
            <ModalFooter>
              <ModalVideoDetails>
                <DetailRow>
                  <DetailLabel><i className="fas fa-calendar-alt"></i> Recording Date:</DetailLabel>
                  <DetailValue>{extractDateTime(selectedVideo.name)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel><i className="fas fa-hdd"></i> Size:</DetailLabel>
                  <DetailValue>{formatFileSize(selectedVideo.size)}</DetailValue>
                </DetailRow>
              </ModalVideoDetails>
              <ModalButtons>
                <DownloadButton 
                  onClick={() => {
                    if (selectedVideo.downloadUrl) {
                      window.open(selectedVideo.downloadUrl, '_blank');
                    }
                  }}
                >
                  <i className="fas fa-download"></i> Download
                </DownloadButton>
                <ViewFullButton onClick={() => {
                  setShowVideoModal(false);
                  setViewingDetails(true);
                  setActiveView('videos');
                }}>
                  <i className="fas fa-expand-alt"></i> View Full Page
                </ViewFullButton>
              </ModalButtons>
            </ModalFooter>
          </ModalContent>
        </VideoModal>
      )}

      {/* Debug Panel Toggle - Add this near the bottom of your return statement */}
      
      {/* Custom marker player overlay */}
      <MarkerPlayerOverlay
        visible={dashboardPlayerVisible && currentPlayingMarker !== null}
        markerType={currentPlayingMarker?.marker_type || 'amazing'}
        currentPlayingMarker={currentPlayingMarker}
        playerLoading={playerLoading}
        isPlaying={isPlaying}
        currentTime={currentTime}
        markerProgress={markerProgress}
        handleClose={handleCloseDashboardPlayer}
        dashboardPlayerRef={dashboardPlayerRef}
        setPlayerLoading={setPlayerLoading}
        setIsPlaying={setIsPlaying}
        setCurrentTime={setCurrentTime}
        setMarkerProgress={setMarkerProgress}
        hasPerformedInitialSeek={hasPerformedInitialSeek}
        togglePlay={togglePlay}
        handleProgressClick={handleProgressClick}
        formatTimeDisplay={formatTimeDisplay}
        getElapsedMarkerTime={getElapsedMarkerTime}
        getMarkerDuration={getMarkerDuration}
        playbackAttempt={playbackAttempt}
        retryPlayWithoutTimestamp={retryPlayWithoutTimestamp}
      />
    </AppContainer>
  );
};

// Styled Components
const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f4f4f4;
`;

const Sidebar = styled.div`
  width: 250px;
  background: #FFF8F3; /* Light peach background to match TeacherList */
  color: #333333; /* Darker text color to match TeacherList */
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #EEEEEE;
  background: #FFDDC9; /* Peach color to match TeacherList */
`;

const SidebarTitle = styled.h1`
  font-size: 20px;
  margin: 0;
  color: #333333; /* Darker text color to match TeacherList */
  font-weight: 600;
`;

const NavMenu = styled.nav`
  padding: 20px 0;
  flex: 1;
`;

const NavItem = styled.div`
  padding: 15px 20px;
  cursor: pointer;
  background: ${props => props.$active ? '#FFDDC9' : 'transparent'}; /* Peach when active */
  color: ${props => props.$active ? '#333333' : '#666666'}; /* Darker when active, lighter when inactive */
  transition: all 0.3s ease;
  font-weight: ${props => props.$active ? '500' : 'normal'};
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    font-size: 16px;
    width: 20px;
    text-align: center;
  }

  &:hover {
    background: #FFF0E6; /* Light peach on hover to match TeacherList */
    color: #333333; /* Darker text on hover */
  }
`;

const LogoutButton = styled.button`
  margin: 20px;
  padding: 12px;
  background: #FFDDC9; /* Peach background to match TeacherList */
  color: #333333; /* Dark text to match TeacherList */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    background: #FFD0B5; /* Darker peach on hover */
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const MainContent = styled.main`
  margin-left: 250px;
  flex: 1;
  padding: 20px;
  background: #f4f4f4;
`;

const ContentWrapper = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #EEEEEE;
`;

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

const SearchInput = styled.input`
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
  margin-top: 10px;
`;

const FilterLabel = styled.span`
  color: #666666;
  font-size: 14px;
  font-weight: 500;
`;

const DateInput = styled.input`
  padding: 10px 15px;
  border: 1px solid #EEEEEE;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 3px rgba(255, 221, 201, 0.2);
  }

  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
  }
`;

const TableContainer = styled.div`
  border: 1px solid #EEEEEE;
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 100px;
  background: #FFF8F3;
  padding: 12px 16px;
  font-weight: 600;
  color: #333333;
  border-bottom: 1px solid #EEEEEE;
  
  span {
    padding: 8px;
  }
`;

const VideoList = styled.div`
  display: flex;
  flex-direction: column;
`;

const VideoRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 100px;
  padding: 12px 16px;
  border-bottom: 1px solid #EEEEEE;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #FFF0E6;
  }
  
  ${props => props.$evaluated && `
    border-left: 4px solid #4CAF50;
  `}
`;

const ClassName = styled.div`
  font-weight: 500;
  color: #333333;
  padding: 8px;
`;

const DateTime = styled.div`
  color: #666666;
  padding: 8px;
  display: flex;
  align-items: center;
`;

const ViewButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
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

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666666;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #dc3545;
`;

const NoVideosMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666666;
`;

const VideoName = styled.span`
  font-weight: 500;
  font-size: 1.1em;
  color: #333333;
`;

const VideoDetails = styled.div`
  display: flex;
  gap: 20px;
  color: #666666;
  font-size: 0.9em;
`;

const RecordingDetails = styled.div`
  width: 100%;
  padding: 20px;
  background: #FFF8F3;
  border-radius: 8px;
  border-left: 4px solid #FFDDC9;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #666666;
  
  strong {
    font-weight: 600;
    color: #333333;
    min-width: 120px;
  }
`;

const FileDetails = styled.span`
  font-family: monospace;
  font-size: 0.9em;
  background: #FFF8F3;
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
  border: 1px solid #EEEEEE;
`;

const DownloadButton = styled.button`
  background: #FFDDC9;
  color: #333333;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  margin-top: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: #FFD0B5;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const CloseButton = styled.button`
  background: #FFDDC9;
  color: #333333;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
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
`;

const CommentBadge = styled.span`
  background: #FFDDC9;
  color: #333333;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  margin-left: 8px;
  font-weight: 600;
`;

const EvaluatedBadge = styled.span`
  color: #333333;
  margin-left: 8px;
  font-weight: bold;
  font-size: 14px;
  background: #FFDDC9;
  padding: 2px 6px;
  border-radius: 4px;
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CommentItem = styled.div`
  background: #fff;
  border: 1px solid #EEEEEE;
  border-left: 4px solid #FFDDC9;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-left-color: #FFD0B5;
  }
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const CommentVideoName = styled.div`
  font-weight: 600;
  color: #333333;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
    color: #FFD0B5;
  }
`;

const CommentDate = styled.div`
  color: #666666;
  font-size: 0.9em;
`;

const CommentEvaluator = styled.div`
  color: #4a6fa5;
  font-size: 14px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  
  i {
    font-size: 16px;
    color: #4a6fa5;
  }
`;

const CommentText = styled.div`
  color: #333333;
  margin: 8px 0;
  line-height: 1.5;
  font-size: 14px;
`;



const CommentFullGrade = styled.div`
  font-weight: 500;
  color: #666666;
  margin-top: 8px;
  font-size: 14px;
`;

const NoCommentsMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1em;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const DashboardCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #EEEEEE;
  overflow: hidden;
  transition: all 0.2s ease;
  grid-column: ${props => props.$fullWidth ? '1 / -1' : 'auto'};
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  padding: 15px 20px;
  background: #FFF8F3;
  border-bottom: 1px solid #EEEEEE;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #333333;
  font-size: 18px;
  font-weight: 600;
`;

const CardContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ScoreCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #FFF8F3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
  border: 4px solid #FFDDC9;
`;

const ScoreValue = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: #333333;
`;

const ScoreLabel = styled.div`
  font-size: 12px;
  color: #666666;
  margin-top: 5px;
`;

const ScoreTrend = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin: 10px 0;
  color: ${props => 
    props.$trend === 'up' ? '#28a745' : 
    props.$trend === 'down' ? '#dc3545' : 
    '#666666'
  };
`;

const ComparisonSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
  width: 100%;
  padding-top: 10px;
  border-top: 1px solid #EEEEEE;
`;

const ComparisonLabel = styled.div`
  font-size: 14px;
  color: #666666;
`;

const ComparisonValue = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #333333;
  margin: 5px 0;
`;

const ComparisonIndicator = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.$above ? '#28a745' : '#dc3545'};
  padding: 4px 8px;
  border-radius: 4px;
  background: ${props => props.$above ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'};
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1em;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  width: 100%;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: #FFF8F3;
  border-radius: 8px;
  border: 1px solid #EEEEEE;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background: #FFF0E6;
  }
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #333333;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #666666;
  margin-top: 5px;
  font-weight: 500;
`;

const ActivityAction = styled.button`
  background: #FFDDC9;
  color: #333333;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  
  &:hover {
    background: #FFD0B5;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const ActivityTable = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  border-top: 1px solid #EEEEEE;
`;

const ActivityRow = styled.div`
  display: grid;
  grid-template-columns: 100px 1fr 100px;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #EEEEEE;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #FFF0E6;
  }
  
  &:hover ${ActivityAction} {
    background: #FFD0B5;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const ActivityDate = styled.div`
  font-size: 14px;
  color: #666666;
  padding-left: 10px;
`;

const ActivityContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 15px;
`;

const ActivityTitle = styled.div`
  font-weight: 500;
  color: #333333;
  margin-bottom: 5px;
`;

const ActivityDetails = styled.div`
  font-size: 12px;
  color: #666666;
`;

const ViewAllLink = styled.div`
  font-size: 14px;
  color: #333333;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    text-decoration: underline;
    color: #FFD0B5;
  }
`;

const CommentBadgeSmall = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: #FFDDC9;
  color: #333333;
  font-size: 10px;
  margin-left: 8px;
  padding: 0 5px;
  font-weight: 600;
`;

const CommentsListContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #fff;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #ccc;
  }
`;

const CommentListItem = styled.div`
  padding: 10px 16px;
  border-bottom: 1px solid #EEEEEE;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #FFF0E6;
  }
  
  &:before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #FFDDC9;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  &:hover:before {
    opacity: 1;
  }
`;

const CommentListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const CommentListTitle = styled.div`
  font-weight: 600;
  color: #333333;
  font-size: 13px;
`;

const CommentListDate = styled.div`
  color: #666666;
  font-size: 11px;
`;

const CommentListText = styled.div`
  color: #333333;
  margin: 4px 0;
  line-height: 1.4;
  font-size: 12px;
  max-height: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const CommenterInfo = styled.div`
  font-size: 11px;
  color: #666;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  i {
    color: #FFDDC9;
    font-size: 10px;
  }
`;

const CommentGrade = styled.div`
  font-weight: 500;
  color: #666666;
  margin-top: 3px;
  font-size: 11px;
`;



const VideoModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 80%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid #EEEEEE;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #FFF8F3;
  border-bottom: 1px solid #EEEEEE;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #333333;
  font-size: 18px;
  font-weight: 600;
`;

const CloseModalButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #333333;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  
  &:hover {
    color: #FFD0B5;
  }
`;

const VideoPlayerContainer = styled.div`
  position: relative;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  width: 100%;
`;

const ModalFooter = styled.div`
  padding: 15px 20px;
  border-top: 1px solid #EEEEEE;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalVideoDetails = styled.div`
  flex: 1;
`;

const DetailRow = styled.div`
  display: flex;
  margin-bottom: 5px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.div`
  font-weight: 500;
  color: #333333;
  margin-right: 10px;
  min-width: 120px;
`;

const DetailValue = styled.div`
  color: #666666;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ViewFullButton = styled.button`
  background: #FFDDC9;
  color: #333333;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  
  &:hover {
    background: #FFD0B5;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

// Add class filter styled components
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
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
`;

const RecordingThumbnail = styled.div`
  background: #FFDDC9;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    font-size: 48px;
    color: #333;
    opacity: 0.7;
  }
`;

const RecordingInfo = styled.div`
  padding: 15px;
  flex: 1;
  min-width: 0; /* Needed for flexbox text-overflow to work */
`;

const RecordingTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
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

const VideoContainer = styled.div`
  width: 100%;
  max-height: 70vh;
  position: relative;
  padding-top: 56.25%;
  margin-bottom: 24px;
`;

const StyledReactPlayer = styled(ReactPlayer)`
  position: absolute;
  top: 0;
  left: 0;
`;

const DateFilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 8px 0;
`;

const DateFilterLabel = styled.span`
  font-weight: 500;
  color: #666;
  margin-right: 4px;
`;

const InsightsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .teacher-info {
    h2 {
      font-size: 20px;
      margin: 0 0 5px 0;
      color: #333333;
    }
    
    .email {
      color: #666;
      font-size: 14px;
    }
  }
  
  .teacher-grade {
    background: #FFF8F3;
    padding: 10px 20px;
    border-radius: 8px;
    text-align: center;
    
    .label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .value {
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }
  }
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const InsightCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid ${props => props.$color || '#FFDDC9'};
  transition: all 0.2s ease;
  
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
  
  .subtext {
    font-size: 14px;
    color: #666;
    margin-top: 5px;
  }
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
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

const StrengthWeaknessContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AreaCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  h3 {
    font-size: 18px;
    color: #333333;
    margin: 0 0 15px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    
    i {
      color: ${props => props.$iconColor || '#333'};
    }
  }
  
  ul {
    margin: 0;
    padding: 0 0 0 20px;
    
    li {
      margin-bottom: 12px;
      
      .area-name {
        font-weight: 500;
        color: #333;
      }
      
      .area-score {
        display: inline-block;
        margin-left: 8px;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 14px;
        background: ${props => props.$scoreBackground || '#f0f0f0'};
        color: ${props => props.$scoreColor || '#333'};
      }
      
      .area-details {
        font-size: 14px;
        color: #666;
        margin-top: 4px;
      }
    }
  }
`;

const RecommendationsContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  
  h3 {
    font-size: 18px;
    color: #333333;
    margin: 0 0 15px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const RecommendationCard = styled.div`
  background: #f9f9f9;
  border-radius: 8px;
  padding: 18px;
  margin-bottom: 15px;
  border-left: 4px solid #FFC107;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  
  .area {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    
    .area-name {
      font-weight: 600;
      color: #333;
      font-size: 16px;
    }
    
    .area-score {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 14px;
      background: #ffecb3;
      color: #333;
      font-weight: 500;
    }
  }
  
  .recommendation {
    font-size: 15px;
    color: #333;
    line-height: 1.5;
    
    i {
      color: #FFC107;
      margin-right: 8px;
    }
  }
`;

const EvaluationHistoryContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  
  h3 {
    font-size: 18px;
    color: #333333;
    margin: 0 0 15px 0;
  }
  
  .no-evaluations {
    text-align: center;
    padding: 20px;
    color: #666;
  }
`;

const EvaluationCard = styled.div`
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  
  .eval-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    
    .date {
      font-size: 14px;
      color: #666;
    }
    
    .score {
      font-weight: 600;
      color: #333;
    }
  }
  
  .evaluator {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
  }
  
  .comments {
    font-size: 15px;
    color: #333;
    border-top: 1px solid #eee;
    padding-top: 10px;
    
    .no-comments {
      font-style: italic;
      color: #999;
    }
  }
`;

const GradeCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  
  .grade-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .comparison-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    
    .grade-section, .comparison-section {
      width: 100%;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
  font-size: 18px;
  
  i {
    margin-right: 10px;
    color: #FFDDC9;
  }
`;

const ErrorContainer = styled.div`
  background: #fff0f0;
  border: 1px solid #ffcccc;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  color: #cc0000;
  
  i {
    margin-right: 10px;
  }
`;

const RankingCardContainer = styled.div`
  margin-bottom: 30px;
`;

const RankingCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
`;

const RankTopSection = styled.div`
  background: linear-gradient(135deg, #FFC3A0, #FFAFBD);
  padding: 30px;
  text-align: center;
  color: white;
`;

const RankLabel = styled.div`
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const RankValue = styled.div`
  font-size: 60px;
  font-weight: 700;
  letter-spacing: -1px;
  color: ${props => {
    if (props.$rank <= 3) return 'gold';
    if (props.$rank <= 10) return 'white';
    return 'rgba(255, 255, 255, 0.8)';
  }};
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

const RankBottomSection = styled.div`
  padding: 20px;
  display: flex;
  justify-content: space-around;
`;

const RankDetail = styled.div`
  text-align: center;
`;

const RankDetailLabel = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;

const RankDetailValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #333;
`;

const RankingsTableContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const RankingsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const RankingsTableHeader = styled.thead`
  background-color: #FFF8F3;
  
  th {
    padding: 15px;
    text-align: left;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #FFDDC9;
  }
`;

const RankingsTableBody = styled.tbody`
  tr:nth-child(even) {
    background-color: #fafafa;
  }
`;

const RankingsTableRow = styled.tr`
  transition: background-color 0.2s ease;
  background-color: ${props => props.$isCurrentTeacher ? '#FFF0E6' : 'inherit'};
  font-weight: ${props => props.$isCurrentTeacher ? '600' : 'normal'};
  
  td {
    padding: 15px;
    border-bottom: 1px solid #eee;
  }
  
  &:hover {
    background-color: ${props => props.$isCurrentTeacher ? '#FFE4D6' : '#f5f5f5'};
  }
  
  td:first-child {
    font-weight: 600;
  }
`;

const TeacherInfoSection = styled.div`
  margin-bottom: 20px;
  
  h2 {
    margin-bottom: 10px;
  }
`;

const StatsPreview = styled.div`
  background-color: #FFF9F5;
  border: 1px solid #FFDDC9;
  border-radius: 8px;
  padding: 12px;
  margin: 0 15px 15px 15px;
  
  p {
    margin: 0 0 10px 0;
    font-size: 0.85rem;
    line-height: 1.4;
    color: #555;
  }
  
  strong {
    color: #E57373;
  }
`;

const ViewStatsButton = styled.button`
  background-color: #FFDDC9;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 7px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: block;
  width: 100%;
  text-align: center;
  
  &:hover {
    background-color: #FFB6A9;
  }
`;

const CommentAuthorRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const CommentAuthor = styled.div`
  font-size: 13px;
  color: #666;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 5px;
  
  i {
    color: #FFDDC9;
  }
`;

const CommentRepliesToggle = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 13px;
  margin-top: 10px;
  padding: 0;
  text-decoration: underline;
  cursor: pointer;
  
  &:hover {
    color: #333;
  }
`;

const CommentRepliesList = styled.div`
  margin-top: 10px;
  padding-left: 15px;
  border-left: 2px solid #FFDDC9;
  margin-left: 10px;
`;

const CommentReplyItem = styled.div`
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
  
  &:last-child {
    border-bottom: none;
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
    border-color: #FFDDC9;
    box-shadow: 0 0 0 2px rgba(255, 221, 201, 0.2);
  }
`;

const CommentReplyActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
`;

const CommentReplyButton = styled.button`
  background: #FFDDC9;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #FFD0B5;
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
  color: #666;
  font-size: 13px;
  padding: 0;
  margin-top: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  i {
    font-size: 11px;
  }
  
  &:hover {
    color: #333;
    text-decoration: underline;
  }
`;

// Add needed styled components


const CommentListReplies = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  
  i {
    font-size: 10px;
  }
`;

const EmptyListMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 1.1em;
`;

const MiniRecordingItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #FFF0E6;
  }
`;

const MiniRecordingIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #FFDDC9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  
  i {
    font-size: 24px;
    color: #333;
  }
`;

const MiniRecordingDetails = styled.div`
  flex: 1;
`;

const MiniRecordingTitle = styled.div`
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
`;

const MiniRecordingDate = styled.div`
  font-size: 12px;
  color: #666;
`;

const MiniRecordingStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  
  i {
    font-size: 14px;
    color: #666;
  }
`;

const EvaluatedIndicator = styled.div`
  color: #4CAF50;
  font-weight: bold;
`;

const PendingIndicator = styled.div`
  color: #FFA500;
  font-weight: bold;
`;

// Add the styled component for feature notice
const FeatureNotice = styled.div`
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 15px;
  
  i {
    font-size: 24px;
    color: #2196f3;
  }
  
  div {
    flex: 1;
    color: #555;
    font-size: 14px;
    line-height: 1.5;
  }
  
  strong {
    color: #0d47a1;
  }
`;

// Add the missing MiniRecordingsList styled component
const MiniRecordingsList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #fff;
  border-radius: 8px;
`;

// Add these new styled components for different colored replies
const ReplyItem = styled.div`
  background-color: ${props => props.$isQA ? '#f3f7ff' : '#fff0e6'};
  border-left: 3px solid ${props => props.$isQA ? '#4a6fa5' : '#f6a935'};
  margin-bottom: 8px;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
`;

const ReplyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const ReplyAuthor = styled.div`
  font-weight: 600;
  color: ${props => props.$isQA ? '#4a6fa5' : '#f6a935'};
  display: flex;
  align-items: center;
  gap: 5px;
  
  i {
    font-size: 12px;
  }
`;

const ReplyDate = styled.div`
  font-size: 12px;
  color: #999;
`;

const ReplyText = styled.div`
  color: #333;
  white-space: pre-wrap;
`;

const RepliesContainer = styled.div`
  margin-top: 10px;
  margin-left: 15px;
  padding-left: 10px;
  border-left: 1px dashed #ddd;
`;

const ReplyLimitMessage = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  
  i {
    color: #F6A935;
  }
`;

const ReplyForm = styled.div`
  margin-top: 10px;
  border-top: 1px solid #eee;
  padding-top: 10px;
`;
const ReplyTextarea = styled.textarea`
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
  border-color: #FFDDC9;
  box-shadow: 0 0 0 2px rgba(255, 221, 201, 0.2);
}
`;

const ReplyButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
`;

const SubmitReplyButton = styled.button`
  background: #FFDDC9;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #FFD0B5;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelReplyButton = styled.button`
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

const ReplyButton = styled.button`
  background: #FFDDC9;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #FFD0B5;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Add a bubble component for reply counts
const ReplyCountBubble = styled.span`
  background-color: ${props => props.$isActive ? '#FFDDC9' : '#e0e0e0'};
  color: ${props => props.$isActive ? '#333' : '#666'};
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 6px;
  font-weight: 600;
`;

// Update the toggle button
const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #4a6fa5;
  font-size: 13px;
  padding: 5px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    text-decoration: underline;
  }
  
  i {
    margin-right: 5px;
    font-size: 12px;
    transition: transform 0.2s ease;
    transform: ${props => props.$isExpanded ? 'rotate(90deg)' : 'rotate(0)'};
  }
`;

// Add this styled component at the end of your file

// Empty state components for the Areas for Improvement section
const EmptyState = styled.div`
  padding: 30px;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  color: #28a745;
  margin-bottom: 10px;
`;

const EmptyStateText = styled.p`
  font-size: 16px;
  color: #666;
  margin: 0;
`;

export default TeacherDashboard;
