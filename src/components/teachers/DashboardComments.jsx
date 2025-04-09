import React from 'react';
import styled from 'styled-components';

// Internal styled components
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

const CommentListReplies = styled.div`
  font-size: 11px;
  color: #666;
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  i {
    font-size: 9px;
  }
`;

const EmptyListMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 1.1em;
`;

const DashboardComments = ({ comments, onCommentClick, extractClassName, getEvaluatorAlias }) => {
  // Limit the number of comments shown to 5
  const recentComments = comments.slice(0, 5);
  
  return (
    <>
      {comments.length === 0 ? (
        <EmptyListMessage>No new comments</EmptyListMessage>
      ) : (
        <CommentsListContainer>
          {recentComments.map((comment, index) => (
            <CommentListItem key={index} onClick={() => onCommentClick(comment)}>
              <CommentListHeader>
                <CommentListTitle>{extractClassName(comment.videoName)}</CommentListTitle>
                <CommentListDate>{new Date(comment.date).toLocaleDateString()}</CommentListDate>
              </CommentListHeader>
              <CommenterInfo>
                <i className="fas fa-user-circle"></i> {getEvaluatorAlias(comment.qaEvaluator)}
              </CommenterInfo>
              <CommentListText>
                {comment.comment.length > 60 
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
    </>
  );
};

export default DashboardComments; 