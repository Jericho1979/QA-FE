import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import TeachersLayout from './QA_TeachersLayout';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiServiceDefault, { paginatedService } from '../../services/apiService';

// Destructure the services from the default export
const { teacherGradesService } = apiServiceDefault;

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

const TableContainer = styled.div`
  border: 1px solid #EEEEEE;
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 150px 100px 100px;
  background: #FFF8F3;
  padding: 12px 16px;
  font-weight: 600;
  color: #333333;
  border-bottom: 1px solid #EEEEEE;
  
  span {
    padding: 8px;
  }
`;

const HeaderCell = styled.div`
  padding: 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
  
  &:hover {
    color: #FF9A5C;
  }
  
  i {
    margin-left: 5px;
    font-size: 14px;
  }
`;

const TeacherRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 150px 100px 100px;
  padding: 12px 16px;
  border-bottom: 1px solid #EEEEEE;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #FFF0E6;
  }
`;

const TeacherName = styled.div`
  font-weight: 500;
  color: #333333;
  padding: 8px;
`;

const TeacherEmail = styled.div`
  color: #666666;
  padding: 8px;
`;

const EvaluationStatus = styled.div`
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.$evaluated ? '#d4edda' : '#f8d7da'};
  color: ${props => props.$evaluated ? '#155724' : '#721c24'};
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

const SortingControls = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const SortButton = styled.button`
  padding: 8px 16px;
  background: ${props => props.$active ? '#FFDDC9' : '#f1f1f1'};
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: ${props => props.$active ? '600' : '400'};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? '#FFD0B5' : '#e5e5e5'};
  }
`;

const FilterOption = styled.div`
  display: flex;
  align-items: center;
  margin-left: 20px;
  
  input {
    margin-right: 5px;
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

const NoTeachersMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666666;
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

const TeacherGrade = styled.div`
  padding: 8px;
  font-weight: 500;
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  span {
    padding: 2px 8px;
    border-radius: 10px;
    background-color: #e9ecef;
    font-size: 13px;
  }
  
  .tc-grade {
    background-color: #e0f7fa;
  }
`;

// Extract username from email
const extractUsername = (email) => {
  if (!email) return '';
  
  const emailParts = email.split('@')[0];
  
  // Check if it starts with 't.'
  if (emailParts.startsWith('t.')) {
    // Extract the part after 't.'
    return emailParts.substring(2); // Remove 't.'
  } else {
    // If it doesn't start with 't.', just use the whole part before @
    return emailParts;
  }
};

// Fetch teacher grades from the teacher_grades table
const fetchTeacherGrades = async () => {
  try {
    // Use the new teacherGradesService to fetch all teacher grades
    console.log('Fetching teacher grades...');
    const data = await teacherGradesService.getAllTeacherGrades();
    console.log('Teacher grades fetched successfully:', data);
    
    // Convert the array of teacher grades to an object indexed by teacher_id (email)
    const gradesMap = {};
    
    if (Array.isArray(data)) {
      data.forEach(grade => {
        if (grade && grade.teacher_id) {
          // Get the effective grade (either regular grade or trial class grade)
          const effectiveGrade = grade.grade;
          
          gradesMap[grade.teacher_id] = {
            grade: effectiveGrade,
            tc_grades: grade.tc_grades,
            qa_evaluator: grade.qa_evaluator,
            evaluation_ids: grade.evaluation_ids || [],
            month: grade.month,
            year: grade.year
          };
        }
      });
      
      console.log(`Processed ${Object.keys(gradesMap).length} teacher grades`);
      
      // Get current month and year
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // 0-indexed
      const currentYear = currentDate.getFullYear();
      console.log(`Current month/year: ${currentMonth}/${currentYear}`);
      
      return gradesMap;
    } else {
      console.warn('Teacher grades API did not return an array:', data);
      return {};
    }
  } catch (error) {
    console.error('Error fetching teacher grades:', error);
    toast.error('Failed to fetch teacher grades. Using fallback data.');
    
    // For demonstration purposes only - return mock data if the API fails
    // This would be replaced by proper error handling in production
    const fallbackData = {};
    
    // Log the full error details for debugging
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return fallbackData;
  }
};

const TeacherList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [teacherGrades, setTeacherGrades] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showOnlyNotEvaluated, setShowOnlyNotEvaluated] = useState(false);
  
  // Set page size for teacher pagination
  const PAGE_SIZE = 50;

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Helper function to check if a teacher has been evaluated
  const hasTeacherBeenEvaluated = (teacherEmail) => {
    // Teacher is considered evaluated if they have a record in the teacherGrades object
    // with either a regular grade or a trial class grade
    const gradeData = teacherGrades[teacherEmail];
    if (!gradeData) return false;
    
    const hasRegularGrade = gradeData.grade !== null && gradeData.grade !== undefined && !isNaN(parseFloat(gradeData.grade));
    const hasTrialClassGrade = gradeData.tc_grades !== null && gradeData.tc_grades !== undefined && !isNaN(parseFloat(gradeData.tc_grades));
    
    return hasRegularGrade || hasTrialClassGrade;
  };

  const getTeacherGrade = (teacherEmail) => {
    return teacherGrades[teacherEmail]?.grade || null;
  };

  const getQAEvaluator = (teacherEmail) => {
    return teacherGrades[teacherEmail]?.qa_evaluator || null;
  };

  const fetchTeachers = async (pageToken = null) => {
    try {
      // If we're loading the first page, show full loading state
      if (!pageToken) {
        setLoading(true);
        setTeachers([]);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);
      
      // Use the new paginated service
      const response = await paginatedService.getTeachersPaginated(PAGE_SIZE, pageToken);
      console.log('Fetched paginated teachers:', response);
      
      if (!response || !response.items) {
        throw new Error('Invalid response from API');
      }
      
      // Process teachers to ensure they have the necessary properties
      const processedTeachers = response.items.map(teacher => {
        return {
          ...teacher,
          name: teacher.name || extractUsername(teacher.email) || 'Unknown Teacher',
          email: teacher.email || '',
          id: teacher.id || ''
        };
      });
      
      // If this is the first page, replace the teachers array
      // Otherwise, append to existing teachers
      if (!pageToken) {
        setTeachers(processedTeachers);
        // Fetch teacher grades after fetching teachers on first page load
        const gradesData = await fetchTeacherGrades();
        setTeacherGrades(gradesData);
      } else {
        setTeachers(prevTeachers => [...prevTeachers, ...processedTeachers]);
      }
      
      // Update pagination info
      setNextPageToken(response.nextPageToken);
      setAllLoaded(!response.nextPageToken);
      
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError(error.message);
      toast.error('Failed to fetch teachers');
      
      // If we're loading the first page, set empty array
      if (!pageToken) {
        setTeachers([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (nextPageToken && !loadingMore) {
      fetchTeachers(nextPageToken);
    }
  };

  const handleTeacherClick = (teacherEmail) => {
    navigate(`/teachers/recordings/${encodeURIComponent(teacherEmail)}`);
  };

  const handleSort = (field) => {
    // If clicking on the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking on a different field, set new field and default to asc
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort teachers based on search term and sort criteria
  const filteredAndSortedTeachers = useMemo(() => {
    // First filter by search term
    let result = teachers.filter(teacher => 
      teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Apply "not evaluated" filter if enabled
    if (showOnlyNotEvaluated) {
      result = result.filter(teacher => !hasTeacherBeenEvaluated(teacher.email));
    }
    
    // Then sort
    return result.sort((a, b) => {
      let valueA, valueB;
      
      // Determine values to compare based on sort field
      switch (sortField) {
        case 'name':
          valueA = a.name?.toLowerCase() || '';
          valueB = b.name?.toLowerCase() || '';
          break;
        case 'email':
          valueA = a.email?.toLowerCase() || '';
          valueB = b.email?.toLowerCase() || '';
          break;
        case 'evaluation':
          valueA = hasTeacherBeenEvaluated(a.email) ? 1 : 0;
          valueB = hasTeacherBeenEvaluated(b.email) ? 1 : 0;
          break;
        case 'grade':
          // Get the best grade value (regular or trial class)
          const gradesA = teacherGrades[a.email] || {};
          const gradesB = teacherGrades[b.email] || {};
          
          // Use regular grade if available, otherwise use trial class grade
          valueA = (gradesA.grade !== null && gradesA.grade !== undefined) ? 
            parseFloat(gradesA.grade) : 
            (gradesA.tc_grades !== null && gradesA.tc_grades !== undefined) ? 
              parseFloat(gradesA.tc_grades) : 0;
              
          valueB = (gradesB.grade !== null && gradesB.grade !== undefined) ? 
            parseFloat(gradesB.grade) : 
            (gradesB.tc_grades !== null && gradesB.tc_grades !== undefined) ? 
              parseFloat(gradesB.tc_grades) : 0;
          break;
        default:
          valueA = a.name?.toLowerCase() || '';
          valueB = b.name?.toLowerCase() || '';
      }
      
      // Compare based on direction
      if (sortDirection === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
  }, [teachers, teacherGrades, searchTerm, sortField, sortDirection, showOnlyNotEvaluated]);

  // Render sort arrow icon
  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <i className="fas fa-sort-up"></i> 
      : <i className="fas fa-sort-down"></i>;
  };

  // Helper function to display grade with label
  const formatGradeDisplay = (teacherEmail) => {
    const gradeData = teacherGrades[teacherEmail];
    
    if (!gradeData) return null;
    
    // Check if we have regular grade, trial class grade, or both
    const hasRegularGrade = gradeData.grade !== null && gradeData.grade !== undefined && !isNaN(parseFloat(gradeData.grade));
    const hasTrialClassGrade = gradeData.tc_grades !== null && gradeData.tc_grades !== undefined && !isNaN(parseFloat(gradeData.tc_grades));
    
    if (!hasRegularGrade && !hasTrialClassGrade) return null;
    
    return (
      <>
        {hasRegularGrade && <span title="Regular Grade">{gradeData.grade}</span>}
        {hasTrialClassGrade && <span className="tc-grade" title="Trial Class Grade">{gradeData.tc_grades}</span>}
      </>
    );
  };

  if (loading) return (
    <TeachersLayout activeView="teacherList">
      <LoadingSpinner>Loading...</LoadingSpinner>
    </TeachersLayout>
  );
  
  if (error) return (
    <TeachersLayout activeView="teacherList">
      <div>Error: {error}</div>
    </TeachersLayout>
  );

  return (
    <TeachersLayout activeView="teacherList">
      <PageTitle>Teacher List</PageTitle>
      
      <SearchContainer>
        <SearchBar 
          type="text" 
          placeholder="Search teachers..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchContainer>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#FFF8F3', borderRadius: '5px', borderLeft: '4px solid #FF9A5C' }}>
        <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
        <span>
          Showing teacher grades for the current month only. <br/>
          <span style={{ display: 'inline-block', marginTop: '8px' }}>
            <span style={{ backgroundColor: '#e9ecef', padding: '2px 8px', borderRadius: '10px', marginRight: '8px', fontSize: '13px' }}>4.5</span> = Regular grade
            <span style={{ backgroundColor: '#e0f7fa', padding: '2px 8px', borderRadius: '10px', marginLeft: '15px', marginRight: '8px', fontSize: '13px' }}>4.2</span> = Trial class grade
          </span>
        </span>
      </div>
      
      <SortingControls>
        <SortButton 
          $active={sortField === 'name'} 
          onClick={() => handleSort('name')}
        >
          Sort by Name {renderSortIcon('name')}
        </SortButton>
        <SortButton 
          $active={sortField === 'email'} 
          onClick={() => handleSort('email')}
        >
          Sort by Email {renderSortIcon('email')}
        </SortButton>
        <SortButton 
          $active={sortField === 'evaluation'} 
          onClick={() => handleSort('evaluation')}
        >
          Sort by Status {renderSortIcon('evaluation')}
        </SortButton>
        <SortButton 
          $active={sortField === 'grade'} 
          onClick={() => handleSort('grade')}
        >
          Sort by Grade {renderSortIcon('grade')}
        </SortButton>
        
        <FilterOption>
          <input 
            type="checkbox" 
            id="showNotEvaluated" 
            checked={showOnlyNotEvaluated}
            onChange={() => setShowOnlyNotEvaluated(!showOnlyNotEvaluated)}
          />
          <label htmlFor="showNotEvaluated">Show only not evaluated</label>
        </FilterOption>
      </SortingControls>
      
      {filteredAndSortedTeachers.length > 0 ? (
        <>
          <TableContainer>
            <TableHeader>
              <HeaderCell onClick={() => handleSort('name')}>
                Teacher Name {renderSortIcon('name')}
              </HeaderCell>
              <HeaderCell onClick={() => handleSort('email')}>
                Email {renderSortIcon('email')}
              </HeaderCell>
              <HeaderCell onClick={() => handleSort('evaluation')}>
                Evaluation Status {renderSortIcon('evaluation')}
              </HeaderCell>
              <HeaderCell onClick={() => handleSort('grade')}>
                Grade {renderSortIcon('grade')}
              </HeaderCell>
              <div>Actions</div>
            </TableHeader>
            
            {filteredAndSortedTeachers.map((teacher) => (
              <TeacherRow key={teacher.email}>
                <TeacherName>{teacher.name || extractUsername(teacher.email)}</TeacherName>
                <TeacherEmail>{teacher.email}</TeacherEmail>
                <EvaluationStatus>
                  {(() => {
                    const gradeData = teacherGrades[teacher.email];
                    if (!gradeData) {
                      return <StatusBadge $evaluated={false}>Not Evaluated</StatusBadge>;
                    }
                    
                    const hasRegularGrade = gradeData.grade !== null && gradeData.grade !== undefined && !isNaN(parseFloat(gradeData.grade));
                    const hasTrialClassGrade = gradeData.tc_grades !== null && gradeData.tc_grades !== undefined && !isNaN(parseFloat(gradeData.tc_grades));
                    
                    if (hasRegularGrade && hasTrialClassGrade) {
                      return (
                        <>
                          <StatusBadge $evaluated={true}>Fully Evaluated</StatusBadge>
                          <small style={{ color: '#777' }}>by {getQAEvaluator(teacher.email)}</small>
                        </>
                      );
                    } else if (hasRegularGrade) {
                      return (
                        <>
                          <StatusBadge $evaluated={true}>Regular Evaluated</StatusBadge>
                          <small style={{ color: '#777' }}>by {getQAEvaluator(teacher.email)}</small>
                        </>
                      );
                    } else if (hasTrialClassGrade) {
                      return (
                        <>
                          <StatusBadge $evaluated={true}>Trial Evaluated</StatusBadge>
                          <small style={{ color: '#777' }}>by {getQAEvaluator(teacher.email)}</small>
                        </>
                      );
                    } else {
                      return <StatusBadge $evaluated={false}>Not Evaluated</StatusBadge>;
                    }
                  })()}
                </EvaluationStatus>
                <TeacherGrade>
                  {formatGradeDisplay(teacher.email)}
                </TeacherGrade>
                <div>
                  <ViewButton 
                    onClick={() => handleTeacherClick(teacher.email)}
                  >
                    View
                  </ViewButton>
                </div>
              </TeacherRow>
            ))}
          </TableContainer>
          
          {/* Pagination controls */}
          {!searchTerm && !showOnlyNotEvaluated && (
            <PaginationControls>
              {loadingMore ? (
                <LoadingIndicator>
                  <i className="fas fa-spinner fa-spin"></i>
                  Loading more teachers...
                </LoadingIndicator>
              ) : !allLoaded ? (
                <LoadMoreButton 
                  onClick={handleLoadMore}
                  disabled={loadingMore || !nextPageToken}
                >
                  Load More Teachers
                </LoadMoreButton>
              ) : (
                <p>All teachers loaded</p>
              )}
            </PaginationControls>
          )}
        </>
      ) : (
        <NoTeachersMessage>
          {teachers.length === 0 ? 
            'No teachers found. Please check your connection to the server.' : 
            'No teachers match your search criteria.'}
        </NoTeachersMessage>
      )}
    </TeachersLayout>
  );
};

export default TeacherList; 