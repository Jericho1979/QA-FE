import React, { useState } from 'react';
import styled from 'styled-components';
import config from '../../config';

// Styled components with color palette from ColorHunt
// #F59AA3 - Soft pink/coral (for accents and highlights)
// #F5E4C3 - Light beige/cream (for backgrounds and cards)
// #34A7B2 - Teal blue (for icons and buttons)
// #5B2E35 - Deep burgundy (for text and emphasis)

const SpotlightContainer = styled.div`
  background: linear-gradient(135deg, #F5E4C3, #F59AA3);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 25px;
  color: #333333;
  position: relative;
  overflow: hidden;
  border: 1px solid #F59AA3;
  box-shadow: 0 4px 15px rgba(91, 46, 53, 0.15);
`;

const SpotlightHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const SpotlightTitle = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #5B2E35;
`;

const StarIcon = styled.i`
  color: #34A7B2;
`;

const ViewAllButton = styled.div`
  color: #34A7B2;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(245, 154, 163, 0.2);
  padding: 5px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #34A7B2;
    color: #F5E4C3;
    transform: translateY(-2px);
  }
`;

const MomentsContainer = styled.div`
  display: flex;
  gap: 15px;
  overflow-x: auto;
  padding: 5px;
  margin-bottom: 10px;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #F5E4C3;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #F59AA3;
    border-radius: 10px;
  }
`;

const MomentCard = styled.div`
  flex: 0 0 300px;
  background: #F5E4C3;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
  cursor: pointer;
  position: relative;
  border: 1px solid #F59AA3;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 20px rgba(91, 46, 53, 0.2);
  }
`;

// Thumbnail styled component with solid color backgrounds
const MomentThumbnail = styled.div`
  height: 160px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${props => {
    // Use a different solid color based on the index
    switch(props.$patternIndex % 4) {
      case 0:
        return '#F59AA3'; // Soft pink
      case 1:
        return '#F5E4C3'; // Light beige
      case 2:
        return '#34A7B2'; // Teal blue
      case 3:
        return '#5B2E35'; // Deep burgundy
      default:
        return '#F5E4C3';
    }
  }};
`;

// Add a simple icon in the background for visual interest
const ThumbnailIcon = styled.i`
  font-size: 60px;
  color: rgba(255, 255, 255, 0.25);
  position: absolute;
  z-index: 1;
`;

const ThumbnailOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  transition: background 0.3s ease;
  
  ${MomentCard}:hover & {
    background: rgba(91, 46, 53, 0.15);
  }
`;

const PlayIcon = styled.i`
  font-size: 50px;
  color: white;
  opacity: 0.9;
  transition: all 0.2s ease;
  position: relative;
  z-index: 2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  ${MomentCard}:hover & {
    color: #34A7B2;
    transform: scale(1.1);
  }
`;

const DurationBadge = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(52, 167, 178, 0.9);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const MomentContent = styled.div`
  padding: 15px;
`;

const MomentTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: bold;
  color: #333333;
`;

const MomentDetails = styled.div`
  font-size: 12px;
  color: #666666;
  margin-bottom: 8px;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 3px;
  
  i {
    color: #34A7B2;
  }
`;

const MomentDescription = styled.p`
  margin: 10px 0 0 0;
  font-size: 14px;
  color: #333333;
  line-height: 1.4;
`;

const MoreCard = styled.div`
  flex: 0 0 100px;
  background: #F5E4C3;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 20px;
  color: #5B2E35;
  text-align: center;
  transition: all 0.2s ease;
  border: 1px solid #F59AA3;
  
  &:hover {
    background: #34A7B2;
    color: #F5E4C3;
    transform: translateY(-5px);
    
    i {
      color: #F5E4C3;
    }
  }
  
  i {
    color: #F59AA3;
  }
`;

const InfoMessage = styled.div`
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
  color: #5B2E35;
  background: #F5E4C3;
  padding: 8px;
  border-radius: 8px;
  
  i {
    color: #34A7B2;
    margin-right: 5px;
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background: #F5E4C3;
  border-radius: 8px;
  margin: 20px 0;
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  color: #34A7B2;
  margin-bottom: 15px;
`;

const EmptyStateText = styled.p`
  font-size: 16px;
  color: #5B2E35;
  margin: 0;
  max-width: 400px;
`;

// Add some decorative elements to make thumbnails more interesting
const ThumbnailDecoration = styled.div`
  position: absolute;
  ${props => props.position || 'top-left'}: 0;
  width: ${props => props.size || '30px'};
  height: ${props => props.size || '30px'};
  background: ${props => props.color || '#F59AA3'};
  opacity: 0.3;
  border-radius: ${props => props.shape === 'circle' ? '50%' : '0'};
  z-index: 1;
`;

const AmazingMomentsSpotlight = ({ 
  amazingMoments, 
  showAllAmazingMoments, 
  setShowAllAmazingMoments, 
  handlePlayDashboardMarker, 
  formatTime, 
  getRecordingName 
}) => {
  // Track which thumbnails have failed to load
  const [failedThumbnails, setFailedThumbnails] = useState({});
  
  // Don't render if there are no amazing moments
  if (!amazingMoments || amazingMoments.length === 0) {
    return (
      <SpotlightContainer>
        <SpotlightHeader>
          <SpotlightTitle>
            <StarIcon className="fas fa-star" /> Amazing Moments Spotlight
          </SpotlightTitle>
        </SpotlightHeader>
        
        <EmptyStateContainer>
          <EmptyStateIcon>
            <i className="fas fa-star"></i>
          </EmptyStateIcon>
          <EmptyStateText>
            No amazing moments found. When notable teaching achievements are marked, they'll appear here for celebration and inspiration.
          </EmptyStateText>
        </EmptyStateContainer>
      </SpotlightContainer>
    );
  }
  
  // Limit the moments displayed based on the showAllAmazingMoments toggle
  const momentsToDisplay = showAllAmazingMoments ? amazingMoments : amazingMoments.slice(0, 3);
  
  // Function to handle thumbnail load failure
  const handleThumbnailError = (markerId) => {
    setFailedThumbnails(prev => ({...prev, [markerId]: true}));
  };
  
  // Function to get icon for thumbnail background based on index
  const getThumbnailIcon = (index) => {
    switch(index % 4) {
      case 0: return "fa-video";
      case 1: return "fa-chalkboard-teacher";
      case 2: return "fa-lightbulb";
      case 3: return "fa-comment";
      default: return "fa-star";
    }
  };
  
  return (
    <SpotlightContainer>
      <SpotlightHeader>
        <SpotlightTitle>
          <StarIcon className="fas fa-star" /> Amazing Moments Spotlight
        </SpotlightTitle>
        <ViewAllButton onClick={() => setShowAllAmazingMoments(!showAllAmazingMoments)}>
          {showAllAmazingMoments ? 'Collapse' : 'View All'} 
          <i className={`fas fa-${showAllAmazingMoments ? 'compress-alt' : 'arrow-right'}`}></i>
        </ViewAllButton>
      </SpotlightHeader>
      
      <MomentsContainer>
        {/* Display either the first 3 moments or all moments based on state */}
        {momentsToDisplay.map((marker, index) => {
          const duration = (marker.end_time && marker.start_time) 
            ? (marker.end_time - marker.start_time) 
            : 0;
          
          // Check if we have a fileId (cloud storage)
          const hasFileId = marker.fileId || (marker.path && marker.path.includes('stream-drive'));
          const fileId = marker.fileId || (marker.path ? marker.path.split('/').pop() : null);
          
          // Create a simple direct URL for the video poster
          let thumbnailUrl = null;
          
          if (hasFileId && fileId) {
            // For cloud storage files
            thumbnailUrl = `${config.video.baseDriveStreamUrl}/${fileId}#t=10`;
          } else if (marker.recording_id) {
            // For local files
            const teacherId = marker.teacher_id || marker.teacher_email || '';
            const teacherIdPart = teacherId ? teacherId.split('@')[0] : '';
            
            // Extract filename if recording_id contains a path
            let recordingId = marker.recording_id;
            if (recordingId.includes('/')) {
              recordingId = recordingId.split('/').pop();
            }
            
            // Use the stream URL with a timestamp for the poster
            thumbnailUrl = `${config.video.baseStreamUrl}/${encodeURIComponent(teacherIdPart)}/${encodeURIComponent(recordingId)}#t=10`;
          }
          
          return (
            <MomentCard key={marker.id} onClick={() => handlePlayDashboardMarker(marker)}>
              <MomentThumbnail $patternIndex={index}>
                <ThumbnailIcon className={`fas ${getThumbnailIcon(index)}`} />
                <ThumbnailOverlay />
                <PlayIcon className="fas fa-play-circle" />
                <DurationBadge>{formatTime(duration)}</DurationBadge>
              </MomentThumbnail>
              
              <MomentContent>
                <MomentTitle>
                  {marker.title || `Amazing Moment #${marker.id}`}
                </MomentTitle>
                
                <MomentDetails>
                  <DetailRow>
                    <i className="fas fa-film"></i>
                    {marker.recording_id ? getRecordingName(marker.recording_id) : 'Unknown Recording'}
                  </DetailRow>
                  
                  <DetailRow>
                    <i className="fas fa-clock"></i>
                    {formatTime(marker.start_time || 0)} - {formatTime(marker.end_time || 0)}
                  </DetailRow>
                </MomentDetails>
                
                {marker.description && (
                  <MomentDescription>
                    {marker.description.length > 80 
                      ? `${marker.description.slice(0, 80)}...` 
                      : marker.description}
                  </MomentDescription>
                )}
              </MomentContent>
            </MomentCard>
          );
        })}
        
        {/* Only show the "See more" button if we're not showing all and have more than 3 moments */}
        {!showAllAmazingMoments && amazingMoments.length > 3 && (
          <MoreCard onClick={() => setShowAllAmazingMoments(true)}>
            <i className="fas fa-ellipsis-h" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
            <div>See {amazingMoments.length - 3} more</div>
          </MoreCard>
        )}
        
        {/* Show "See less" button when showing all and have more than 3 */}
        {showAllAmazingMoments && amazingMoments.length > 3 && (
          <MoreCard onClick={() => setShowAllAmazingMoments(false)}>
            <i className="fas fa-compress-alt" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
            <div>Show less</div>
          </MoreCard>
        )}
      </MomentsContainer>
      
      <InfoMessage>
        <i className="fas fa-info-circle"></i> 
        These amazing moments showcase your best teaching practices
      </InfoMessage>
    </SpotlightContainer>
  );
};

export default AmazingMomentsSpotlight; 