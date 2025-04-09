import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { fetchTeacherStats, fetchTeacherEvaluationHistory, fetchTeacherCategoryPerformance, fetchTeacherRecordings } from '../../services/apiService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, RadialLinearScale } from 'chart.js';
import { Line, Radar, Bar } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faMinus } from '@fortawesome/free-solid-svg-icons';

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

const TeacherStats = ({ username, displayName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [trendData, setTrendData] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  
  // Function to get an alias for the evaluator name
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
  
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Starting to load stats for teacher ID:', username);
        
        if (!username) {
          console.error('No teacher ID provided to TeacherStats component');
          setError('No teacher ID provided. Please try again later.');
          setLoading(false);
          return;
        }
        
        // Log the properly formatted username
        console.log('Teacher ID normalized for API calls:', username);
        
        // Fetch all data in parallel for better performance
        const results = await Promise.all([
          fetchTeacherStats(username).catch(err => {
            console.error('Error fetching teacher stats:', err);
            return null;
          }),
          fetchTeacherEvaluationHistory(username).catch(err => {
            console.error('Error fetching evaluation history:', err);
            return [];
          }),
          fetchTeacherCategoryPerformance(username).catch(err => {
            console.error('Error fetching category performance:', err);
            return {};
          }),
          fetchTeacherRecordings(username).catch(err => {
            console.error('Error fetching recordings:', err);
            return [];
          })
        ]);
        
        const [statsData, evaluationData, categoryData, recordingsData] = results;
        
        console.log('Stats data loaded:', statsData ? 'Yes' : 'No');
        console.log('Evaluation history count:', evaluationData?.length || 0);
        console.log('Category performance keys:', Object.keys(categoryData || {}));
        console.log('Recordings count:', recordingsData?.length || 0);
        
        // Debug the incoming stats data to understand structure
        if (statsData) {
          console.log('DEBUG: Teacher grade from API:', statsData.teacherGrade);
          console.log('DEBUG: Evaluation count from API:', statsData.evaluationCount);
        }
        
        // Ensure we have recording data available from either source
        const recordingsCount = recordingsData && recordingsData.length > 0 
          ? recordingsData.length 
          : (statsData && statsData.recordingsCount ? statsData.recordingsCount : 0);
          
        console.log('Final recordings count used:', recordingsCount);
        
        // Set state with fetched data, using default values if data is missing
        setStats({
          ...(statsData || {
            teacherGrade: null,
            departmentAverage: "0.00",
            evaluationCount: 0,
            recordingsCount: 0,
            evaluationRate: 0,
            categoryScores: {},
            performanceTrend: [],
            strengths: [],
            weaknesses: [],
            recommendations: [],
            monthlyPerformance: {},
            recentEvaluations: []
          }),
          // Override recordingsCount with the calculated value
          recordingsCount: recordingsCount
        });
        
        // Debug log for recent evaluations
        if (statsData && statsData.recentEvaluations) {
          console.log('Recent evaluations from API:', statsData.recentEvaluations);
        }
        
        setEvaluationHistory(evaluationData || []);
        setCategoryPerformance(categoryData || {});
        setRecordings(recordingsData || []);
        
        // Only try to set chart data if we have valid stats data
        if (statsData) {
          // Prepare performance trend data
          if (statsData.performanceTrend && statsData.performanceTrend.length > 0) {
            const sortedTrend = [...statsData.performanceTrend].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            setTrendData({
              labels: sortedTrend.map(point => new Date(point.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: '2-digit'
              })),
              datasets: [{
                label: 'Performance Score',
                data: sortedTrend.map(point => point.score),
                borderColor: '#FFDDC9',
                backgroundColor: 'rgba(255, 221, 201, 0.2)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
              }]
            });
          }
          
          // Prepare radar chart data
          if (statsData.categoryScores && Object.keys(statsData.categoryScores).length > 0) {
            setRadarData({
              labels: Object.keys(statsData.categoryScores).map(cat => cat.toUpperCase()),
              datasets: [
                {
                  label: 'Performance Score',
                  data: Object.values(statsData.categoryScores).map(cat => parseFloat(cat.average.toFixed(2))),
                  backgroundColor: 'rgba(255, 221, 201, 0.2)',
                  borderColor: '#FFDDC9',
                  borderWidth: 2,
                  pointBackgroundColor: '#FFDDC9',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: '#FFDDC9'
                }
              ]
            });
          }
          
          // Prepare monthly performance data
          if (statsData.monthlyPerformance && Object.keys(statsData.monthlyPerformance).length > 0) {
            const months = Object.keys(statsData.monthlyPerformance).sort();
            
            setMonthlyData({
              labels: months.map(month => {
                const [year, monthNum] = month.split('-');
                return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              }),
              datasets: [{
                label: 'Monthly Average Score',
                data: months.map(month => parseFloat(statsData.monthlyPerformance[month].average.toFixed(2))),
                backgroundColor: 'rgba(33, 150, 243, 0.6)',
                borderColor: '#2196F3',
                borderWidth: 1
              }]
            });
          }
        }
      } catch (err) {
        console.error('Error loading teacher stats:', err);
        setError('Failed to load teacher statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [username]);
  
  // Determine if the teacher has evaluations - check both API response and evaluation history
  const hasApiEvaluations = stats?.evaluationCount > 0 || (stats?.recentEvaluations && stats.recentEvaluations.length > 0);
  const hasHistoryEvaluations = evaluationHistory?.length > 0;
  const hasEvaluations = hasApiEvaluations || hasHistoryEvaluations;
  
  console.log('Evaluation data check:', { 
    hasApiEvaluations, 
    hasHistoryEvaluations, 
    hasEvaluations,
    recentEvaluationsCount: stats?.recentEvaluations?.length || 0,
    evaluationCount: stats?.evaluationCount || 0,
    historyLength: evaluationHistory?.length || 0
  });
  
  // Default values in case the API doesn't return data
  const teacherGradeValue = stats?.teacherGrade?.grade ? parseFloat(stats.teacherGrade.grade).toFixed(2) : '0.00';
  const departmentAverageValue = stats?.departmentAverage ? parseFloat(stats.departmentAverage).toFixed(2) : '0.00';
  
  console.log('TeacherStats component - Stats data received:', {
    teacherGrade: stats?.teacherGrade,
    departmentAverage: stats?.departmentAverage,
    evaluationCount: stats?.evaluationCount,
    hasApiEvaluations,
    hasHistoryEvaluations,
    hasEvaluations
  });
  
  // Calculate trend direction more carefully
  let trendDirection = 'neutral';
  if (stats?.performanceTrend?.length >= 2) {
    const sortedTrend = [...stats.performanceTrend].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstScore = parseFloat(sortedTrend[0].score) || 0;
    const lastScore = parseFloat(sortedTrend[sortedTrend.length - 1].score) || 0;
    
    if (lastScore > firstScore) {
      trendDirection = 'up';
    } else if (lastScore < firstScore) {
      trendDirection = 'down';
    }
  }
  
  const isAboveAverage = parseFloat(teacherGradeValue) > parseFloat(departmentAverageValue);
  
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
            const category = context.label.toLowerCase();
            const evaluations = stats?.categoryScores[category]?.count || 0;
            return `Score: ${score} (based on ${evaluations} evaluations)`;
          }
        }
      }
    }
  };
  
  const getTrendIcon = (direction) => {
    if (direction === 'up') return <FontAwesomeIcon icon={faArrowUp} />;
    if (direction === 'down') return <FontAwesomeIcon icon={faArrowDown} />;
    return <FontAwesomeIcon icon={faMinus} />;
  };
  
  const preparePerformanceTrendData = () => {
    if (!stats || !stats.performanceTrend || stats.performanceTrend.length === 0) {
      // Default data if no trend data available
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'No Performance Data Available',
          data: [0, 0, 0, 0, 0, 0],
          borderColor: '#ccc',
          tension: 0.1,
          fill: false
        }]
      };
    }

    const sortedData = [...stats.performanceTrend].sort((a, b) => new Date(a.month) - new Date(b.month));
    
    return {
      labels: sortedData.map(item => {
        const date = new Date(item.month);
        return date.toLocaleDateString('en-US', { month: 'short' });
      }),
      datasets: [{
        label: 'Performance Score',
        data: sortedData.map(item => parseFloat(item.score || 0).toFixed(1)),
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.2)',
        tension: 0.1,
        fill: true
      }]
    };
  };

  const prepareRadarChartData = () => {
    const defaultCategories = ['Communication', 'Organization', 'Teaching', 'Engagement'];
    
    // Use category performance if available, otherwise use stats.categoryScores
    const categories = Object.keys(categoryPerformance).length > 0 
      ? Object.keys(categoryPerformance) 
      : (stats && stats.categoryScores ? Object.keys(stats.categoryScores) : defaultCategories);
    
    const scores = categories.map(category => {
      if (Object.keys(categoryPerformance).length > 0 && categoryPerformance[category]) {
        return categoryPerformance[category].average || 0;
      } else if (stats && stats.categoryScores && stats.categoryScores[category]) {
        return parseFloat(stats.categoryScores[category]) || 0;
      }
      return 0;
    });
    
    return {
      labels: categories,
      datasets: [{
        label: 'Category Scores',
        data: scores,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(75, 192, 192, 1)'
      }]
    };
  };
  
  if (loading) {
    return (
      <ContentWrapper>
        <PageTitle>Performance Insights</PageTitle>
        <LoadingMessage>
          <LoadingIcon>
            <i className="fas fa-spinner fa-spin"></i>
          </LoadingIcon>
          <div>
            <p>Loading your performance insights...</p>
            <p>This may take a moment if this is your first time viewing statistics.</p>
          </div>
        </LoadingMessage>
      </ContentWrapper>
    );
  }
  
  if (error) {
    return (
      <ContentWrapper>
        <PageTitle>Performance Insights</PageTitle>
        <ErrorMessage>
          <i className="fas fa-exclamation-circle"></i> {error}
          <p>Please try again later or contact support if this issue persists.</p>
        </ErrorMessage>
      </ContentWrapper>
    );
  }
  
  return (
    <ContentWrapper>
      <PageTitle>Performance Insights</PageTitle>
      
      <InsightsHeader>
        <div className="teacher-info">
          <h2>{displayName}</h2>
          <div className="email">{username}</div>
        </div>
        <div className="teacher-grade">
          <div className="label">Average Grade</div>
          <div className="value">{teacherGradeValue}/5.0</div>
        </div>
      </InsightsHeader>
      
      {!hasEvaluations && (
        <NoDataMessage>
          <i className="fas fa-info-circle"></i>
          <p className="emphasis">No evaluations found for {displayName}</p>
          <p>Performance insights will appear here once your classes are evaluated by the QA team.</p>
          <p className="additional-info">
            This may be because you are new or haven't had any classes evaluated yet.
            <br/>
            <span className="debug-note">
              teacherId: {username} | API evaluationCount: {stats?.evaluationCount || 0} | 
              History length: {evaluationHistory?.length || 0}
            </span>
          </p>
        </NoDataMessage>
      )}
      
      {/* Add additional info in case the sidebar shows evaluations but the API doesn't */}
      {window.location.href.includes('debug') && (
        <DebugMessage>
          <details>
            <summary>Debug Information</summary>
            <div style={{ marginTop: '10px' }}>
              <h4>Stats Summary</h4>
              <ul>
                <li>Teacher ID: <code>{username}</code></li>
                <li>Evaluation Count: <code>{stats?.evaluationCount || 0}</code></li>
                <li>Recordings Count: <code>{stats?.recordingsCount || 0}</code></li>
                <li>Raw Evaluation Rate: <code>{stats?.evaluationRate}</code> (type: {typeof stats?.evaluationRate})</li>
                <li>Displayed Rate: <code>{typeof stats?.evaluationRate === 'number' 
                  ? Math.round(stats.evaluationRate)
                  : parseInt(stats?.evaluationRate || 0)}%</code></li>
                <li>Has API Evaluations: <code>{hasApiEvaluations ? 'Yes' : 'No'}</code></li>
                <li>Has History Evaluations: <code>{hasHistoryEvaluations ? 'Yes' : 'No'}</code></li>
              </ul>
              
              <h4>Raw Data</h4>
              <pre>
                {JSON.stringify(stats?.debug || 'No debug info', null, 2)}
              </pre>
            </div>
          </details>
        </DebugMessage>
      )}
      
      {/* Teacher Grade Card */}
      <GradeCard>
        <div className="grade-section">
          <ScoreCircle>
            <ScoreValue>{teacherGradeValue}</ScoreValue>
            <ScoreLabel>Overall Score</ScoreLabel>
          </ScoreCircle>
          
          {hasEvaluations ? (
            <ScoreTrend $trend={trendDirection}>
              {trendDirection === 'up' && '↑ Improving'}
              {trendDirection === 'down' && '↓ Declining'}
              {trendDirection === 'neutral' && '→ Stable'}
            </ScoreTrend>
          ) : (
            <ScoreTrend $trend="neutral">No trend data yet</ScoreTrend>
          )}
        </div>
        
        <div className="comparison-section">
          <ComparisonSection>
            <ComparisonLabel>Department Average:</ComparisonLabel>
            <ComparisonValue>{departmentAverageValue}</ComparisonValue>
            {stats?.teacherGrade ? (
              <ComparisonIndicator $above={isAboveAverage}>
                {isAboveAverage ? 'Above Average' : 'Below Average'}
              </ComparisonIndicator>
            ) : (
              <ComparisonIndicator $above={true}>
                No grade assigned yet
              </ComparisonIndicator>
            )}
          </ComparisonSection>
        </div>
      </GradeCard>
      
      <InsightsGrid>
        <InsightCard $color="#4CAF50">
          <h3>Total Evaluations</h3>
          <div className="value">{stats?.evaluationCount || 0}</div>
          <div className="subtext">Completed evaluations</div>
        </InsightCard>
        
        <InsightCard $color="#2196F3">
          <h3>Recordings</h3>
          <div className="value">{stats?.recordingsCount || recordings.length || 0}</div>
          <div className="subtext">Available recordings</div>
        </InsightCard>
        
        <InsightCard $color="#FF9800">
          <h3>Evaluation Rate</h3>
          <div className="value">
            {typeof stats?.evaluationRate === 'number' 
              ? Math.round(stats.evaluationRate)
              : parseInt(stats?.evaluationRate || 0)
            }%
          </div>
          <div className="subtext">
            Of recordings evaluated
            {window.location.href.includes('debug') && (
              <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                evals: {stats?.evaluationCount || 0} | 
                recs: {stats?.recordingsCount || 0}
              </div>
            )}
          </div>
        </InsightCard>
      </InsightsGrid>
      
      {/* Monthly Performance Chart */}
      {monthlyData && monthlyData.labels.length > 1 ? (
        <ChartContainer>
          <h3>Monthly Performance</h3>
          <div style={{ height: '250px' }}>
            <Bar 
              data={monthlyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 5,
                    title: {
                      display: true,
                      text: 'Average Score'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Month'
                    }
                  }
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Average Score: ${context.parsed.y.toFixed(2)}/5.0`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
            Your average evaluation scores by month
          </div>
        </ChartContainer>
      ) : hasEvaluations && (
        <EmptyChartMessage>
          <h3>Monthly Performance</h3>
          <p>Not enough monthly data available yet. This chart will appear once you have evaluations across multiple months.</p>
        </EmptyChartMessage>
      )}
      
      {/* Radar Chart for Category Performance */}
      {radarData ? (
        <ChartContainer>
          <h3>Performance by Category</h3>
          <div style={{ height: '350px' }}>
            <Radar 
              data={radarData}
              options={radarOptions}
            />
          </div>
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
            <p>This chart shows your average performance across the main evaluation categories:</p>
            <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
              {stats?.categoryScores && Object.entries(stats.categoryScores).map(([category, data]) => (
                <li key={category}>
                  <strong>{category.toUpperCase()}</strong>: {parseFloat(data.average).toFixed(2)}/5.0 
                  {data.count > 0 && <span> (based on {data.count} evaluations)</span>}
                </li>
              ))}
            </ul>
          </div>
        </ChartContainer>
      ) : hasEvaluations && (
        <EmptyChartMessage>
          <h3>Performance by Category</h3>
          <p>Category data not available yet. This chart will appear once you have evaluations with category ratings.</p>
        </EmptyChartMessage>
      )}
      
      {/* Performance Trend Line Chart */}
      {trendData && trendData.labels.length > 1 ? (
        <ChartContainer>
          <h3>Recent Performance Trend</h3>
          <div style={{ height: '250px' }}>
            <Line 
              data={trendData}
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
                        return `Score: ${context.parsed.y}/5.0`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
            Your performance trend across the most recent evaluations
          </div>
        </ChartContainer>
      ) : hasEvaluations && (
        <EmptyChartMessage>
          <h3>Recent Performance Trend</h3>
          <p>Not enough evaluation data available yet. This chart will appear once you have multiple evaluations.</p>
        </EmptyChartMessage>
      )}
      
      {/* Strengths and Weaknesses */}
      {hasEvaluations && (
        <StrengthWeaknessContainer>
          <AreaCard $iconColor="#4CAF50" $scoreBackground="#e8f5e9" $scoreColor="#2e7d32">
            <h3>
              <i className="fas fa-star"></i>
              Your Strengths
            </h3>
            {stats?.strengths && stats.strengths.length > 0 ? (
              <ul>
                {stats.strengths.map((strength, index) => (
                  <li key={index}>
                    <div>
                      <span className="area-name">{strength.name.toUpperCase()}</span>
                      <span className="area-score">{parseFloat(strength.average).toFixed(1)}/5.0</span>
                    </div>
                    <div className="area-details">
                      Weight: {strength.weight}% • {strength.count} evaluations
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
            {stats?.weaknesses && stats.weaknesses.length > 0 ? (
              <ul>
                {stats.weaknesses.map((weakness, index) => (
                  <li key={index}>
                    <div>
                      <span className="area-name">{weakness.name.toUpperCase()}</span>
                      <span className="area-score">{parseFloat(weakness.average).toFixed(1)}/5.0</span>
                    </div>
                    <div className="area-details">
                      Weight: {weakness.weight}% • {weakness.count} evaluations
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No improvement areas identified yet.</p>
            )}
          </AreaCard>
        </StrengthWeaknessContainer>
      )}
      
      {/* Recommendations */}
      {stats?.recommendations && stats.recommendations.length > 0 && (
        <RecommendationsContainer>
          <h3>
            <i className="fas fa-lightbulb" style={{ color: '#FFC107' }}></i>
            Personalized Recommendations
          </h3>
          
          {stats.recommendations.map((rec, index) => (
            <RecommendationCard key={index}>
              <div className="area">
                <span className="area-name">{rec.area}</span>
                <span className="area-score">Score: {parseFloat(rec.score).toFixed(1)}/5.0</span>
              </div>
              <div className="recommendation">
                <i className="fas fa-check-circle"></i>
                {rec.recommendation}
              </div>
            </RecommendationCard>
          ))}
        </RecommendationsContainer>
      )}
      
      {/* Recent Evaluations */}
      {stats?.recentEvaluations && stats.recentEvaluations.length > 0 ? (
        <EvaluationHistoryContainer>
          <h3>Recent Evaluations</h3>
          
          {stats.recentEvaluations.map((evaluation, index) => (
            <EvaluationCard key={index}>
              <div className="eval-header">
                <div className="date">
                  {new Date(evaluation.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="score">{
                  typeof evaluation.score === 'string' 
                    ? parseFloat(evaluation.score).toFixed(2) 
                    : parseFloat(evaluation.score || 0).toFixed(2)
                }/5.0</div>
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
          ))}
        </EvaluationHistoryContainer>
      ) : hasEvaluations && (
        <EmptyChartMessage>
          <h3>Recent Evaluations</h3>
          <p>No evaluation details available yet. These will appear once your classes have been evaluated.</p>
          <p className="debug-note">
            Evaluation data is detected but recentEvaluations array is empty.<br/>
            evaluationCount: {stats?.evaluationCount || 0} | 
            recentEvaluations: {stats?.recentEvaluations?.length || 0} |
            evaluationHistory: {evaluationHistory?.length || 0}
          </p>
        </EmptyChartMessage>
      )}
    </ContentWrapper>
  );
};

// Styled Components
const ContentWrapper = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 20px;
  color: #333;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 30px;
  font-size: 16px;
  color: #555;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
  
  p {
    margin: 5px 0;
  }
`;

const LoadingIcon = styled.div`
  font-size: 32px;
  color: #FFDDC9;
  margin-bottom: 15px;
  
  i {
    animation: spin 1.5s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 30px;
  font-size: 18px;
  color: #d32f2f;
  background-color: #ffebee;
  border-radius: 8px;
  margin: 20px 0;
  
  i {
    font-size: 24px;
    margin-right: 10px;
  }
  
  p {
    font-size: 14px;
    color: #555;
    margin-top: 15px;
  }
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 30px;
  font-size: 16px;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin: 20px 0;
  
  i {
    font-size: 24px;
    color: #FFDDC9;
    margin-bottom: 15px;
    display: block;
  }
  
  p {
    margin: 10px 0;
    line-height: 1.5;
  }
  
  .emphasis {
    font-weight: 500;
    color: #555;
  }
  
  .additional-info {
    font-size: 14px;
    margin-top: 15px;
    color: #777;
  }
  
  .debug-note {
    display: block;
    font-size: 12px;
    margin-top: 10px;
    padding: 5px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    font-family: monospace;
    color: #888;
  }
`;

const EmptyChartMessage = styled.div`
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  h3 {
    margin-top: 0;
    color: #333;
    margin-bottom: 10px;
  }
  
  p {
    color: #666;
    font-size: 0.9rem;
  }
`;

const InsightsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  
  .teacher-info {
    h2 {
      margin: 0;
      font-size: 1.5rem;
      text-transform: capitalize;
    }
    
    .email {
      color: #666;
      font-size: 0.9rem;
      margin-top: 5px;
    }
  }
  
  .teacher-grade {
    text-align: right;
    
    .label {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 5px;
    }
    
    .value {
      font-size: 1.6rem;
      font-weight: bold;
      color: #333;
    }
  }
`;

const GradeCard = styled.div`
  display: flex;
  justify-content: space-between;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  .grade-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 20px;
  }
  
  .comparison-section {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
`;

const ScoreCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #FFF9F5;
  border: 2px solid #FFDDC9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
`;

const ScoreValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #333;
`;

const ScoreLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
`;

const ScoreTrend = styled.div`
  font-size: 0.9rem;
  padding: 5px 10px;
  border-radius: 20px;
  background-color: ${props => 
    props.$trend === 'up' ? '#e8f5e9' : 
    props.$trend === 'down' ? '#ffebee' : 
    '#f5f5f5'
  };
  color: ${props => 
    props.$trend === 'up' ? '#4caf50' : 
    props.$trend === 'down' ? '#f44336' : 
    '#757575'
  };
  display: inline-block;
`;

const ComparisonSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const ComparisonLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
`;

const ComparisonValue = styled.div`
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
`;

const ComparisonIndicator = styled.div`
  font-size: 0.85rem;
  padding: 4px 10px;
  border-radius: 20px;
  background-color: ${props => props.$above ? '#e8f5e9' : '#ffebee'};
  color: ${props => props.$above ? '#4caf50' : '#f44336'};
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const InsightCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-top: 4px solid ${props => props.$color || '#ccc'};
  
  h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1.1rem;
    color: #333;
  }
  
  .value {
    font-size: 2rem;
    font-weight: bold;
    color: ${props => props.$color || '#333'};
    margin-bottom: 5px;
  }
  
  .subtext {
    font-size: 0.85rem;
    color: #666;
  }
`;

const ChartContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.2rem;
    color: #333;
  }
`;

const StrengthWeaknessContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const AreaCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.1rem;
    color: #333;
    display: flex;
    align-items: center;
    
    i {
      margin-right: 10px;
      color: ${props => props.$iconColor};
    }
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      padding: 10px 0;
      border-bottom: 1px solid #f5f5f5;
      
      &:last-child {
        border-bottom: none;
      }
      
      div {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
        
        .area-name {
          font-weight: 500;
        }
        
        .area-score {
          padding: 3px 8px;
          border-radius: 16px;
          background-color: ${props => props.$scoreBackground || '#f5f5f5'};
          color: ${props => props.$scoreColor || '#333'};
          font-size: 0.85rem;
        }
      }
      
      .area-details {
        font-size: 0.85rem;
        color: #666;
      }
    }
  }
  
  p {
    color: #666;
    font-style: italic;
  }
`;

const RecommendationsContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.2rem;
    color: #333;
    display: flex;
    align-items: center;
    
    i {
      margin-right: 10px;
    }
  }
`;

const RecommendationCard = styled.div`
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 15px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .area {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    
    .area-name {
      font-weight: 500;
    }
    
    .area-score {
      font-size: 0.85rem;
      color: #666;
    }
  }
  
  .recommendation {
    color: #555;
    font-size: 0.95rem;
    line-height: 1.5;
    
    i {
      color: #4CAF50;
      margin-right: 8px;
    }
  }
`;

const EvaluationHistoryContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.2rem;
    color: #333;
  }
`;

const EvaluationCard = styled.div`
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  .eval-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    
    .date {
      font-weight: 500;
    }
    
    .score {
      font-weight: 500;
      color: #FFDDC9;
      background-color: #FFF9F5;
      padding: 3px 10px;
      border-radius: 16px;
    }
  }
  
  .evaluator {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 10px;
  }
  
  .comments {
    font-size: 0.95rem;
    line-height: 1.5;
    color: #555;
    
    .no-comments {
      font-style: italic;
      color: #999;
    }
  }
`;

const DebugMessage = styled.div`
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  details {
    summary {
      font-weight: 500;
      color: #333;
    }
  }
  
  pre {
    margin-top: 10px;
    color: #666;
    font-size: 0.9rem;
  }
`;

export default TeacherStats; 