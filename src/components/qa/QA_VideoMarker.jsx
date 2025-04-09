import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import apiServiceDefault from '../../services/apiService';

// Destructure the services from the default export
const { markerService } = apiServiceDefault;

const MarkerContainer = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const MarkerTitle = styled.h3`
  color: #333;
  margin-bottom: 16px;
  font-size: 18px;
`;

const MarkerForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 14px;
  color: #555;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TextArea = styled.textarea`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 16px;
`;

const RadioOption = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Button = styled.button`
  padding: 10px 16px;
  background-color: ${props => props.$variant === 'primary' ? '#3498db' : '#e74c3c'};
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.$variant === 'primary' ? '#2980b9' : '#c0392b'};
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 4px;
`;

const MarkersList = styled.div`
  margin-top: 20px;
`;

const MarkerItem = styled.div`
  background-color: white;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
`;

const MarkerInfo = styled.div`
  flex: 1;
`;

const MarkerType = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
  color: white;
  background-color: ${props => props.$type === 'amazing' ? '#27ae60' : '#e74c3c'};
`;

const TimestampText = styled.span`
  color: #7f8c8d;
  font-size: 13px;
  display: block;
  margin-bottom: 4px;
`;

const MarkerActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background-color: ${props => props.$variant === 'delete' ? '#f5f5f5' : '#f0f9ff'};
  color: ${props => props.$variant === 'delete' ? '#e74c3c' : '#3498db'};
  border: 1px solid ${props => props.$variant === 'delete' ? '#e74c3c' : '#3498db'};
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background-color: ${props => props.$variant === 'delete' ? '#f8d7da' : '#e8f4fd'};
  }
`;

/**
 * Formats seconds into HH:MM:SS or MM:SS format
 */
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
 * Converts MM:SS or HH:MM:SS format to seconds
 */
const timeToSeconds = (timeString) => {
  if (!timeString) return 0;
  
  // Split the time string into components
  const parts = timeString.split(':').map(part => parseInt(part) || 0);
  
  // If it's HH:MM:SS format (3 parts)
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  } 
  // If it's MM:SS format (2 parts)
  else {
    return (parts[0] * 60) + parts[1];
  }
};

/**
 * Converts seconds to MM:SS or HH:MM:SS format for input fields
 */
const secondsToTimeString = (seconds) => {
  if (!seconds && seconds !== 0) return '';
  
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
 * Video marker component for QA to add markers to recordings
 */
const QA_VideoMarker = ({ 
  videoRef, // Reference to the video player
  recordingId, // ID of the current recording
  teacherId, // ID/Email of the teacher
  onMarkerSelect // Callback when a marker is selected to play
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [markerType, setMarkerType] = useState('amazing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  // Editing state
  const [editingMarkerId, setEditingMarkerId] = useState(null);
  const formRef = useRef(null);
  
  // Load existing markers for this recording
  useEffect(() => {
    if (recordingId) {
      loadMarkers();
    }
  }, [recordingId]);
  
  // Update current time when video plays
  useEffect(() => {
    console.log('VideoMarker - videoRef changed:', videoRef);
    
    if (!videoRef) {
      console.warn('VideoMarker - videoRef is null or undefined');
      return;
    }
    
    // Set up a retry mechanism to handle cases where the video element
    // isn't immediately available
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 500; // 500ms between retries
    
    const setupVideoListener = () => {
      const video = videoRef?.current;
      console.log('VideoMarker - videoRef.current:', video);
      
      if (!video) {
        if (retryCount < maxRetries) {
          console.log(`VideoMarker - Retry attempt ${retryCount + 1}/${maxRetries}`);
          retryCount++;
          // Try again after a delay
          setTimeout(setupVideoListener, retryInterval);
          return;
        }
        console.warn('VideoMarker - Maximum retries reached. videoRef.current is still null or undefined');
        return;
      }
      
      // Log video object properties to debug
      console.log('VideoMarker - videoRef.current properties:', {
        hasGetInternalPlayer: typeof video.getInternalPlayer === 'function',
        hasAddEventListener: typeof video.addEventListener === 'function',
        hasGetCurrentTime: typeof video.getCurrentTime === 'function',
        hasSeekTo: typeof video.seekTo === 'function',
        type: video.constructor ? video.constructor.name : 'unknown'
      });
      
      const getVideoElement = () => {
        // Try to get direct HTML5 video element
        if (video.tagName && video.tagName.toLowerCase() === 'video') {
          return video;
        }
        
        // Try to get internal player from ReactPlayer
        if (video.getInternalPlayer && typeof video.getInternalPlayer === 'function') {
          try {
            const internalPlayer = video.getInternalPlayer();
            if (internalPlayer && internalPlayer.nodeName === 'VIDEO') {
              return internalPlayer;
            }
            // For YouTube/Vimeo/etc. via ReactPlayer that don't directly expose video element
            if (internalPlayer) {
              console.log('Found non-standard player:', internalPlayer);
              return video; // Use ReactPlayer instance itself
            }
          } catch (err) {
            console.warn('Error accessing internal player:', err);
          }
        }
        
        // Check if the ref points to a wrapper that contains a video element
        if (video.querySelector) {
          try {
            const videoEl = video.querySelector('video');
            if (videoEl) {
              return videoEl;
            }
          } catch (err) {
            console.warn('Error querying for video element:', err);
          }
        }
        
        // If videoRef.current is already a HTML5 video element
        if (video.addEventListener && typeof video.addEventListener === 'function') {
          return video;
        }
        
        // ReactPlayer doesn't have the video element ready yet, retry later
        if (retryCount < maxRetries) {
          console.log(`VideoMarker - Video element not found. Retry attempt ${retryCount + 1}/${maxRetries}`);
          retryCount++;
          // Try again after a delay
          setTimeout(setupVideoListener, retryInterval);
          return null;
        }
        
        // If we've tried enough times and still can't find a video element
        console.warn('Could not find valid video element for event listener after multiple attempts');
        return null;
      };
      
      const videoElement = getVideoElement();
      if (!videoElement) {
        // Don't output warning here since we already did it in getVideoElement
        return;
      }
      
      const handleTimeUpdate = () => {
        // For ReactPlayer instances, get time differently
        if (video.getCurrentTime && typeof video.getCurrentTime === 'function') {
          setCurrentTime(video.getCurrentTime());
        } else if (videoElement.currentTime !== undefined) {
          setCurrentTime(videoElement.currentTime);
        }
      };
      
      try {
        // For ReactPlayer, try to use its event handler first
        if (typeof video.addEventListener !== 'function' && 
            typeof video.on === 'function') {
          video.on('progress', (state) => {
            if (state && typeof state.playedSeconds === 'number') {
              setCurrentTime(state.playedSeconds);
            }
          });
          return () => {
            if (typeof video.off === 'function') {
              video.off('progress');
            }
          };
        }
        
        // For standard HTML5 video elements
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        return () => {
          videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        };
      } catch (error) {
        console.error('Error adding event listener to video element:', error);
        
        // Fallback to polling the current time as a last resort
        if (video.getCurrentTime && typeof video.getCurrentTime === 'function') {
          const intervalId = setInterval(() => {
            try {
              setCurrentTime(video.getCurrentTime());
            } catch (e) {
              console.error('Error getting current time:', e);
              clearInterval(intervalId);
            }
          }, 200);
          
          return () => clearInterval(intervalId);
        }
      }
    };
    
    // Start the setup process
    return setupVideoListener();
  }, [videoRef]);
  
  // Load markers for the current recording
  const loadMarkers = async () => {
    try {
      setLoading(true);
      const data = await markerService.getMarkersByRecording(recordingId);
      setMarkers(data);
    } catch (error) {
      console.error('Error loading markers:', error);
      toast.error('Failed to load markers');
    } finally {
      setLoading(false);
    }
  };
  
  // Set current video position as start or end time
  const setCurrentPosition = (type) => {
    if (!videoRef?.current) return;
    
    // Try to get the current time from ReactPlayer first
    let currentTime = 0;
    if (typeof videoRef.current.getCurrentTime === 'function') {
      currentTime = videoRef.current.getCurrentTime();
    } 
    // Then try to get it from the internal player
    else if (videoRef.current.getInternalPlayer && typeof videoRef.current.getInternalPlayer === 'function') {
      const player = videoRef.current.getInternalPlayer();
      if (player && player.currentTime !== undefined) {
        currentTime = player.currentTime;
      }
    }
    // Otherwise just use state
    else {
      currentTime = currentTime;
    }
    
    const time = Math.floor(currentTime);
    if (type === 'start') {
      setStartTime(time);
    } else {
      setEndTime(time);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (startTime >= endTime) {
      toast.error('End time must be greater than start time');
      return;
    }
    
    try {
      setLoading(true);
      
      // Set is_public based on marker type and user selection
      // For 'amazing' type, respect the user's selection
      // For 'incident' type, always set to false
      const is_public_value = markerType === 'amazing' ? isPublic : false;
      
      const markerData = {
        recording_id: recordingId,
        teacher_id: teacherId,
        marker_type: markerType,
        start_time: startTime,
        end_time: endTime,
        title,
        description,
        is_public: is_public_value
      };
      
      let result;
      
      if (editingMarkerId) {
        // Update existing marker
        result = await markerService.updateMarker(editingMarkerId, markerData);
        toast.success('Marker updated successfully');
      } else {
        // Create new marker
        result = await markerService.createMarker(markerData);
        toast.success('Marker added successfully');
      }
      
      // Refresh markers list
      await loadMarkers();
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving marker:', error);
      toast.error('Failed to save marker');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset the form to default values
  const resetForm = () => {
    setStartTime(0);
    setEndTime(0);
    setMarkerType('amazing');
    setTitle('');
    setDescription('');
    setIsPublic(true);
    setEditingMarkerId(null);
    
    // Reset form validation state
    if (formRef.current) {
      formRef.current.reset();
    }
  };
  
  // Edit an existing marker
  const handleEdit = (marker) => {
    setStartTime(marker.start_time);
    setEndTime(marker.end_time);
    setMarkerType(marker.marker_type);
    setTitle(marker.title || '');
    setDescription(marker.description || '');
    setIsPublic(marker.is_public);
    setEditingMarkerId(marker.id);
    
    // Scroll to form
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Delete a marker
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this marker?')) {
      return;
    }
    
    try {
      setLoading(true);
      await markerService.deleteMarker(id);
      toast.success('Marker deleted successfully');
      
      // Refresh markers list
      await loadMarkers();
      
      // Reset form if we were editing this marker
      if (editingMarkerId === id) {
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting marker:', error);
      toast.error('Failed to delete marker');
    } finally {
      setLoading(false);
    }
  };
  
  // Play a marker
  const handlePlay = (marker) => {
    if (onMarkerSelect) {
      onMarkerSelect(marker);
    }
    
    if (videoRef?.current) {
      // Check if we're dealing with a ReactPlayer instance
      if (typeof videoRef.current.seekTo === 'function') {
        videoRef.current.seekTo(marker.start_time, 'seconds');
      } 
      // Try using the internal player if it's available
      else if (videoRef.current.getInternalPlayer && typeof videoRef.current.getInternalPlayer === 'function') {
        const player = videoRef.current.getInternalPlayer();
        if (player) {
          player.currentTime = marker.start_time;
          if (typeof player.play === 'function') {
            player.play();
          }
        }
      }
      // Fall back to standard HTML5 video element
      else if (videoRef.current.currentTime !== undefined) {
        videoRef.current.currentTime = marker.start_time;
        if (typeof videoRef.current.play === 'function') {
          videoRef.current.play();
        }
      }
    }
  };
  
  return (
    <MarkerContainer>
      <MarkerTitle>Video Markers</MarkerTitle>
      
      <MarkerForm ref={formRef} onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Current Video Position: {formatTime(currentTime)}</Label>
          <ButtonGroup>
            <Button 
              type="button" 
              $variant="primary" 
              onClick={() => setCurrentPosition('start')}
            >
              Set as Start
            </Button>
            <Button 
              type="button" 
              $variant="primary" 
              onClick={() => setCurrentPosition('end')}
            >
              Set as End
            </Button>
          </ButtonGroup>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="start_time">Start Time (HH:MM:SS or MM:SS)</Label>
          <Input
            id="start_time"
            type="text"
            pattern="([0-9]{2}:)?[0-9]{2}:[0-9]{2}"
            placeholder="00:00"
            value={secondsToTimeString(startTime)}
            onChange={(e) => setStartTime(timeToSeconds(e.target.value))}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="end_time">End Time (HH:MM:SS or MM:SS)</Label>
          <Input
            id="end_time"
            type="text"
            pattern="([0-9]{2}:)?[0-9]{2}:[0-9]{2}"
            placeholder="00:00"
            value={secondsToTimeString(endTime)}
            onChange={(e) => setEndTime(timeToSeconds(e.target.value))}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Marker Type</Label>
          <RadioGroup>
            <RadioOption>
              <input
                type="radio"
                id="amazing"
                name="marker_type"
                value="amazing"
                checked={markerType === 'amazing'}
                onChange={() => setMarkerType('amazing')}
              />
              <Label htmlFor="amazing">Amazing Moment</Label>
            </RadioOption>
            
            <RadioOption>
              <input
                type="radio"
                id="incident"
                name="marker_type"
                value="incident"
                checked={markerType === 'incident'}
                onChange={() => setMarkerType('incident')}
              />
              <Label htmlFor="incident">Incident</Label>
            </RadioOption>
          </RadioGroup>
        </FormGroup>
        
        {markerType === 'amazing' && (
          <FormGroup>
            <Label>Visibility</Label>
            <RadioGroup>
              <RadioOption>
                <input
                  type="radio"
                  id="public"
                  name="visibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                />
                <Label htmlFor="public">Public (visible to all teachers)</Label>
              </RadioOption>
              
              <RadioOption>
                <input
                  type="radio"
                  id="private"
                  name="visibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                />
                <Label htmlFor="private">Private (only visible to this teacher)</Label>
              </RadioOption>
            </RadioGroup>
          </FormGroup>
        )}
        
        <FormGroup>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter a title for this marker"
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <TextArea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description for this marker"
          />
        </FormGroup>
        
        <ButtonGroup>
          <Button
            type="submit"
            $variant="primary"
            disabled={loading}
          >
            {editingMarkerId ? 'Update Marker' : 'Add Marker'}
          </Button>
          
          {editingMarkerId && (
            <Button
              type="button"
              onClick={resetForm}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </ButtonGroup>
      </MarkerForm>
      
      <MarkersList>
        <h4>Existing Markers ({markers.length})</h4>
        
        {markers.length === 0 ? (
          <p>No markers added yet.</p>
        ) : (
          markers.map(marker => (
            <MarkerItem key={marker.id}>
              <MarkerInfo>
                <div>
                  {marker.title}
                  <MarkerType $type={marker.marker_type}>
                    {marker.marker_type === 'amazing' ? 'Amazing' : 'Incident'}
                  </MarkerType>
                  {marker.marker_type === 'amazing' && (
                    <span> ({marker.is_public ? 'Public' : 'Private'})</span>
                  )}
                </div>
                <TimestampText>
                  {formatTime(marker.start_time)} - {formatTime(marker.end_time)}
                </TimestampText>
                {marker.description && (
                  <div style={{ fontSize: '14px' }}>{marker.description}</div>
                )}
              </MarkerInfo>
              
              <MarkerActions>
                <ActionButton
                  $variant="play"
                  onClick={() => handlePlay(marker)}
                >
                  Play
                </ActionButton>
                <ActionButton
                  $variant="edit"
                  onClick={() => handleEdit(marker)}
                >
                  Edit
                </ActionButton>
                <ActionButton
                  $variant="delete"
                  onClick={() => handleDelete(marker.id)}
                >
                  Delete
                </ActionButton>
              </MarkerActions>
            </MarkerItem>
          ))
        )}
      </MarkersList>
    </MarkerContainer>
  );
};

export default QA_VideoMarker; 