import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import apiServiceDefault from '../../services/apiService';

// Destructure the services from the default export
const { markerService, apiService } = apiServiceDefault;

const MarkersContainer = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const SectionTitle = styled.h3`
  color: #333;
  margin-bottom: 16px;
  font-size: 18px;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid #e1e4e8;
`;

const Tab = styled.button`
  padding: 8px 16px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${props => props.active ? '#34A7B2' : '#666'};
  border-bottom: ${props => props.active ? '2px solid #34A7B2' : 'none'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #34A7B2;
    background-color: rgba(245, 154, 163, 0.1);
  }
`;

const MarkersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NoMarkers = styled.p`
  color: #666;
  font-style: italic;
  text-align: center;
  margin: 20px 0;
`;

const MarkerCard = styled.div`
  background-color: white;
  border-radius: 6px;
  padding: 12px;
  border-left: 4px solid ${props => props.type === 'amazing' ? '#F59AA3' : '#34A7B2'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  &:hover {
    box-shadow: 0 3px 6px rgba(91, 46, 53, 0.1);
  }
`;

const MarkerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const MarkerName = styled.h4`
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
  background-color: ${props => props.type === 'amazing' ? '#F59AA3' : '#34A7B2'};
`;

const MarkerTimestamp = styled.div`
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
`;

const MarkerDescription = styled.p`
  font-size: 14px;
  color: #333;
  margin: 8px 0;
`;

const PlayButton = styled.button`
  padding: 6px 12px;
  background-color: #34A7B2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #5B2E35;
  }
`;

const TeacherInfo = styled.div`
  font-size: 13px;
  color: #777;
  margin-top: 8px;
  font-style: italic;
`;

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

/**
 * Component to display video markers for teachers
 */
const TeacherVideoMarkers = ({ 
  teacherId, // Current teacher's ID (email)
  onPlayMarker // Callback when a marker is selected to play
}) => {
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'amazing'
  const [myMarkers, setMyMarkers] = useState([]);
  const [amazingMarkers, setAmazingMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Load markers when component mounts or teacherId changes
  useEffect(() => {
    if (teacherId) {
      loadMarkers();
    }
  }, [teacherId]);
  
  // Load all markers
  const loadMarkers = async () => {
    try {
      setLoading(true);
      
      // Load teacher-specific markers
      const teacherMarkersPromise = markerService.getTeacherMarkers(teacherId);
      
      // Load public amazing moments
      const amazingMarkersPromise = markerService.getPublicAmazingMoments(20);
      
      // Wait for both requests to complete
      const [teacherMarkers, amazingMoments] = await Promise.all([
        teacherMarkersPromise,
        amazingMarkersPromise
      ]);
      
      // Update state
      setMyMarkers(teacherMarkers);
      
      // Filter out the current teacher's markers to avoid duplicates
      const filteredAmazingMarkers = amazingMoments.filter(
        marker => marker.teacher_id !== teacherId
      );
      
      setAmazingMarkers(filteredAmazingMarkers);
    } catch (error) {
      console.error('Error loading markers:', error);
      toast.error('Failed to load markers');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle playing a marker
  const handlePlay = (marker) => {
    console.log('TeacherVideoMarkers: Playing marker:', marker);
    
    try {
      // For safety, validate recording_id
      if (!marker.recording_id) {
        console.error('Marker missing recording_id:', marker);
        toast.error('Cannot play marker: Missing recording data');
        return;
      }
      
      // Make sure the marker has all necessary data
      const enhancedMarker = {
        ...marker,
        // Ensure teacher_id is set - use the marker's teacher_id if available, otherwise use current teacherId
        teacher_id: marker.teacher_id || teacherId,
        // Also set teacher_email for fallback
        teacher_email: marker.teacher_email || null,
        // Ensure start_time and end_time are numbers
        start_time: typeof marker.start_time === 'number' ? marker.start_time : parseInt(marker.start_time) || 0,
        end_time: typeof marker.end_time === 'number' ? marker.end_time : parseInt(marker.end_time) || 60
      };
      
      // Log enhanced marker for debugging
      console.log('Enhanced marker from TeacherVideoMarkers:', {
        id: enhancedMarker.id,
        title: enhancedMarker.title,
        recording_id: enhancedMarker.recording_id,
        teacher_id: enhancedMarker.teacher_id,
        teacher_email: enhancedMarker.teacher_email,
        marker_type: enhancedMarker.marker_type
      });
      
      if (onPlayMarker) {
        onPlayMarker(enhancedMarker);
      } else {
        console.error('No onPlayMarker callback provided');
        toast.error('Unable to play video: Player not available');
      }
    } catch (error) {
      console.error('Error in handlePlay:', error);
      toast.error('Failed to play marker');
    }
  };
  
  // Filter markers based on active tab
  const getDisplayedMarkers = () => {
    if (activeTab === 'my') {
      return myMarkers;
    } else {
      return amazingMarkers;
    }
  };
  
  const markers = getDisplayedMarkers();
  
  return (
    <MarkersContainer>
      <SectionTitle>Video Markers</SectionTitle>
      
      <TabContainer>
        <Tab 
          active={activeTab === 'my'} 
          onClick={() => setActiveTab('my')}
        >
          My Markers ({myMarkers.length})
        </Tab>
        <Tab 
          active={activeTab === 'amazing'} 
          onClick={() => setActiveTab('amazing')}
        >
          Amazing Moments ({amazingMarkers.length})
        </Tab>
      </TabContainer>
      
      {loading ? (
        <div>Loading markers...</div>
      ) : (
        <MarkersList>
          {markers.length === 0 ? (
            <NoMarkers>
              {activeTab === 'my' 
                ? 'You don\'t have any markers yet.' 
                : 'No amazing moments available from other teachers.'}
            </NoMarkers>
          ) : (
            markers.map(marker => (
              <MarkerCard 
                key={marker.id} 
                type={marker.marker_type}
              >
                <MarkerHeader>
                  <MarkerName>
                    {marker.title}
                    <MarkerType type={marker.marker_type}>
                      {marker.marker_type === 'amazing' ? 'Amazing' : 'Incident'}
                    </MarkerType>
                  </MarkerName>
                  
                  <PlayButton onClick={() => handlePlay(marker)}>
                    Play Clip
                  </PlayButton>
                </MarkerHeader>
                
                <MarkerTimestamp>
                  {formatTime(marker.start_time)} - {formatTime(marker.end_time)} 
                  (Duration: {formatTime(marker.end_time - marker.start_time)})
                </MarkerTimestamp>
                
                {marker.description && (
                  <MarkerDescription>
                    {marker.description}
                  </MarkerDescription>
                )}
                
                {activeTab === 'amazing' && marker.teacher_name && (
                  <TeacherInfo>
                    From: {marker.teacher_name} ({marker.teacher_email})
                  </TeacherInfo>
                )}
              </MarkerCard>
            ))
          )}
        </MarkersList>
      )}
    </MarkersContainer>
  );
};

export default TeacherVideoMarkers; 