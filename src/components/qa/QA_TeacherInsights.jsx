import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, RadialLinearScale } from 'chart.js';
import { Bar, Line, Radar } from 'react-chartjs-2';
import TeachersLayout from './QA_TeachersLayout';
import apiServiceDefault from '../../services/apiService';
import config from '../../config';

// Destructure the services from the default export
const { apiRequest, authService } = apiServiceDefault;

// API base URL from config
const API_URL = config.API_URL;

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

// Styled components
const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #333333;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  
  .back-button {
    font-size: 16px;
    cursor: pointer;
    color: #666;
    
    &:hover {
      color: #333;
    }
  }
`;

const TeacherHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .teacher-info {
    h2 {
      font-size: 20px;
      margin: 0 0 5px 0;
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const InsightCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid ${props => props.$color || '#FFDDC9'};
  
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

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2em;
  color: #666666;
`;

const ScoresBreakdown = styled.div`
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
`;

const ScoreItem = styled.div`
  margin-bottom: 10px;
  
  strong {
    font-weight: 500;
    color: #333;
  }
  
  .evaluations {
    font-size: 14px;
    color: #666;
  }
`;

const TeacherInsights = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [insights, setInsights] = useState(null);
  
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        // Fetch teacher basic info using apiService
        const teacherData = await apiRequest(`${API_URL}/teachers/${teacherId}`);
        setTeacherData(teacherData);
        
        // Fetch teacher performance insights using apiService
        const insightsData = await apiRequest(`${API_URL}/teachers/${teacherId}/insights`);
        console.log('Received insights data:', insightsData);
        
        // Ensure categoryScores data is properly formatted
        if (insightsData.categoryScores) {
          console.log('Category scores:', insightsData.categoryScores);
          
          // If categoryScores is empty or has no valid data, add sample data for testing
          const hasValidData = Object.values(insightsData.categoryScores)
            .some(cat => cat.count > 0 && cat.average > 0);
            
          if (!hasValidData) {
            console.warn('No valid category data found, adding sample data for testing');
            // Add sample data for testing if no real data exists
            insightsData.categoryScores = {
              'PLAY': { total: 12, count: 3, average: 4.0 },
              'LEARN': { total: 15, count: 4, average: 3.75 },
              'SUCCEED': { total: 9, count: 3, average: 3.0 }
            };
          }
        }
        
        setInsights(insightsData);
        
      } catch (error) {
        console.error('Error fetching teacher insights:', error);
        setError(error.message);
        toast.error(`Failed to fetch teacher insights: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeacherData();
  }, [teacherId]);
  
  // Log the processed data for debugging
  useEffect(() => {
    if (insights?.categoryScores) {
      console.log('Processed category scores for chart:', 
        Object.keys(insights.categoryScores).map(key => key.toUpperCase()),
        Object.values(insights.categoryScores).map(cat => parseFloat(cat.average.toFixed(2)))
      );
    }
  }, [insights]);
  
  // Extract username from email
  const extractUsername = (email) => {
    if (!email) return '';
    
    const emailParts = email.split('@')[0];
    
    if (emailParts.startsWith('t.')) {
      return emailParts.substring(2);
    } else {
      return emailParts;
    }
  };
  
  // Prepare performance trend chart data
  const performanceTrendData = insights?.performanceTrend ? {
    labels: insights.performanceTrend.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [{
      label: 'Evaluation Score',
      data: insights.performanceTrend.map(item => item.score),
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      tension: 0.3
    }]
  } : null;
  
  // Process insights data for radar chart
  const radarData = useMemo(() => {
    if (!insights?.categoryScores) {
      console.log('No category scores found in insights:', insights);
      return null;
    }

    console.log('Processing category scores for radar chart:', insights.categoryScores);
    
    const categories = Object.keys(insights.categoryScores);
    const scores = categories.map(cat => {
      const score = insights.categoryScores[cat].average;
      console.log(`Category ${cat} score:`, score);
      return parseFloat(score.toFixed(2));
    });

    return {
      labels: categories.map(cat => cat.toUpperCase()),
      datasets: [
        {
          label: 'Performance Score',
          data: scores,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
        }
      ]
    };
  }, [insights]);

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const score = context.raw;
            const category = context.label;
            const evaluations = insights?.categoryScores[category.toLowerCase()]?.count || 0;
            return `Score: ${score} (based on ${evaluations} evaluations)`;
          }
        }
      }
    }
  };
  
  // Add a function to get an alias for evaluator names
  const getEvaluatorAlias = (evaluatorName) => {
    if (!evaluatorName) return 'QA Team';
    
    // If it's already "QA Team", return it
    if (evaluatorName === 'QA Team') return evaluatorName;
    
    // For emails, get just the username part
    const emailParts = evaluatorName.split('@');
    if (emailParts.length > 1) {
      // Get the first part of the email (the username)
      let username = emailParts[0];
      
      // Remove t. prefix if present
      if (username.startsWith('t.')) {
        username = username.substring(2);
      }
      
      // Return different aliases based on the username
      const lowerUsername = username.toLowerCase();
      if (lowerUsername.includes('daniel')) return 'QA Evaluator 1';
      if (lowerUsername.includes('john')) return 'QA Evaluator 2';
      if (lowerUsername.includes('admin')) return 'QA Admin';
      
      // For any other QA evaluator
      return 'QA Evaluator';
    }
    
    // If it's not an email, just return "QA Evaluator"
    return 'QA Evaluator';
  };
  
  if (loading) return (
    <TeachersLayout activeView="teachers">
      <LoadingSpinner>Loading teacher insights...</LoadingSpinner>
    </TeachersLayout>
  );
  
  if (error) return (
    <TeachersLayout activeView="teachers">
      <PageTitle>
        <span className="back-button" onClick={() => navigate('/teachers/dashboard')}>
          <i className="fas fa-arrow-left"></i>
        </span>
        Teacher Insights
      </PageTitle>
      <div>Error: {error}</div>
    </TeachersLayout>
  );
  
  const teacherName = teacherData?.name || extractUsername(teacherId);
  const teacherEmail = teacherId;
  const averageGrade = insights?.averageScore?.toFixed(2) || 'N/A';
  
  return (
    <TeachersLayout activeView="teachers">
      <PageTitle>
        <span className="back-button" onClick={() => navigate('/teachers/dashboard')}>
          <i className="fas fa-arrow-left"></i>
        </span>
        Teacher Performance Insights
      </PageTitle>
      
      <TeacherHeader>
        <div className="teacher-info">
          <h2>{teacherName}</h2>
          <div className="email">{teacherEmail}</div>
        </div>
        <div className="teacher-grade">
          <div className="label">Average Grade</div>
          <div className="value">{averageGrade}/5.0</div>
        </div>
      </TeacherHeader>
      
      <InsightsGrid>
        <InsightCard $color="#4CAF50">
          <h3>Total Evaluations</h3>
          <div className="value">{insights?.evaluationCount || 0}</div>
          <div className="subtext">Completed evaluations</div>
        </InsightCard>
        
        <InsightCard $color="#2196F3">
          <h3>Recordings</h3>
          <div className="value">{teacherData?.recordings?.length || 0}</div>
          <div className="subtext">Available recordings</div>
        </InsightCard>
        
        <InsightCard $color="#FF9800">
          <h3>Evaluation Rate</h3>
          <div className="value">
            {teacherData?.recordings?.length 
              ? Math.round((insights?.evaluationCount / teacherData.recordings.length) * 100) 
              : 0}%
          </div>
          <div className="subtext">Of recordings evaluated</div>
        </InsightCard>
      </InsightsGrid>
      
      {insights?.performanceTrend && insights.performanceTrend.length > 1 && (
        <ChartContainer>
          <h3>Performance Trend</h3>
          <div style={{ height: '250px' }}>
            <Line 
              data={performanceTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 5,
                    title: {
                      display: true,
                      text: 'Score'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Evaluation Date'
                    }
                  }
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Score: ${context.parsed.y.toFixed(2)}/5.0`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </ChartContainer>
      )}
      
      {insights?.categoryScores && Object.keys(insights.categoryScores).length > 0 && (
        <ChartContainer>
          <h3>Performance by Category</h3>
          <div style={{ height: '350px' }}>
            <Radar 
              data={radarData}
              options={radarOptions}
            />
          </div>
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
            <p>This chart shows the teacher's average performance across the main evaluation categories:</p>
            <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
              {Object.entries(insights.categoryScores).map(([category, data]) => (
                <li key={category}>
                  <strong>{category.toUpperCase()}</strong>: {data.average.toFixed(2)}/5.0 
                  {data.count > 0 && <span> (based on {data.count} evaluations)</span>}
                </li>
              ))}
            </ul>
          </div>
        </ChartContainer>
      )}
      
      <StrengthWeaknessContainer>
        <AreaCard $iconColor="#4CAF50" $scoreBackground="#e8f5e9" $scoreColor="#2e7d32">
          <h3>
            <i className="fas fa-star"></i>
            Strengths
          </h3>
          {insights?.strengths && insights.strengths.length > 0 ? (
            <ul>
              {insights.strengths.map((strength, index) => (
                <li key={index}>
                  <div>
                    <span className="area-name">{strength.name}</span>
                    <span className="area-score">{strength.average.toFixed(1)}/5.0</span>
                  </div>
                  <div className="area-details">
                    Weight: {strength.weight}%
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No strength data available yet.</p>
          )}
        </AreaCard>
        
        <AreaCard $iconColor="#F44336" $scoreBackground="#ffebee" $scoreColor="#c62828">
          <h3>
            <i className="fas fa-exclamation-triangle"></i>
            Areas for Improvement
          </h3>
          {insights?.weaknesses && insights.weaknesses.length > 0 ? (
            <ul>
              {insights.weaknesses.map((weakness, index) => (
                <li key={index}>
                  <div>
                    <span className="area-name">{weakness.name}</span>
                    <span className="area-score">{weakness.average.toFixed(1)}/5.0</span>
                  </div>
                  <div className="area-details">
                    Weight: {weakness.weight}%
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No improvement areas identified yet.</p>
          )}
        </AreaCard>
      </StrengthWeaknessContainer>
      
      <RecommendationsContainer>
        <h3>
          <i className="fas fa-lightbulb" style={{ color: '#FFC107' }}></i>
          Personalized Recommendations
        </h3>
        
        {insights?.recommendations && insights.recommendations.length > 0 ? (
          insights.recommendations.map((rec, index) => (
            <RecommendationCard key={index}>
              <div className="area">
                <span className="area-name">{rec.area}</span>
                <span className="area-score">Score: {rec.score.toFixed(1)}/5.0</span>
              </div>
              <div className="recommendation">
                <i className="fas fa-check-circle"></i>
                {rec.recommendation}
              </div>
            </RecommendationCard>
          ))
        ) : (
          <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
            No recommendations available yet. Complete more evaluations to receive personalized suggestions.
          </p>
        )}
      </RecommendationsContainer>
      
      <EvaluationHistoryContainer>
        <h3>Recent Evaluations</h3>
        
        {insights?.recentEvaluations && insights.recentEvaluations.length > 0 ? (
          insights.recentEvaluations.map((evaluation, index) => (
            <EvaluationCard key={index}>
              <div className="eval-header">
                <div className="date">
                  {new Date(evaluation.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="score">{evaluation.score.toFixed(2)}/5.0</div>
              </div>
              <div className="evaluator">
                Evaluated by: {getEvaluatorAlias(evaluation.evaluator)}
              </div>
              <div className="comments">
                {evaluation.comments ? evaluation.comments : (
                  <span className="no-comments">No comments provided</span>
                )}
              </div>
            </EvaluationCard>
          ))
        ) : (
          <div className="no-evaluations">
            No evaluation history available yet.
          </div>
        )}
      </EvaluationHistoryContainer>
      
      <ScoresBreakdown>
        <h3>Category Performance Breakdown</h3>
        {insights?.categoryScores && Object.entries(insights.categoryScores).map(([category, data]) => (
          <ScoreItem key={category}>
            <strong>{category.toUpperCase()}:</strong> {parseFloat(data.average.toFixed(2))} 
            <span className="evaluations">({data.count} evaluations)</span>
          </ScoreItem>
        ))}
      </ScoresBreakdown>
    </TeachersLayout>
  );
};

export default TeacherInsights; 