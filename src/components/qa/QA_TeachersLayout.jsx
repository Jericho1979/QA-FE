import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { handleLogout as logout } from '../../AuthForm';

// Layout Components
const AppWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #FFF8F3;
  font-family: 'Inter', 'Segoe UI', sans-serif;
`;

const Sidebar = styled.aside`
  width: ${props => props.$isCollapsed ? '70px' : '250px'};
  background: #FFFFFF; /* White background */
  color: #333333; /* Dark text */
  display: flex;
  flex-direction: column;
  padding: 0;
  position: fixed;
  height: 100vh;
  top: 0;
  left: 0;
  z-index: 101;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  transition: width 0.3s ease;
  overflow: hidden;

  @media (max-width: 1024px) {
    width: ${props => props.$isCollapsed ? '70px' : '200px'};
  }

  @media (max-width: 768px) {
    transform: ${props => (props.$isOpen ? 'translateX(0)' : 'translateX(-100%)')};
    width: 80%;
    max-width: 300px;
  }
`;

const MainContent = styled.main`
  padding: 30px;
  transition: all 0.3s ease;
  margin-left: ${props => props.$sidebarCollapsed ? '70px' : '250px'};
  width: ${props => props.$sidebarCollapsed ? 'calc(100% - 70px)' : 'calc(100% - 250px)'};
  min-height: 100vh;
  background: #FFF8F3;
  display: flex;
  flex-direction: column;

  @media (max-width: 1024px) {
    margin-left: ${props => props.$sidebarCollapsed ? '70px' : '200px'};
    width: ${props => props.$sidebarCollapsed ? 'calc(100% - 70px)' : 'calc(100% - 200px)'};
  }

  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    padding: 20px;
  }
`;

// Navigation Components
const SidebarHeader = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  background: #FFDDC9; /* Peach background */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
`;

const SidebarTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: #333333; /* Dark text */
  margin: 0;
  display: ${props => props.$isCollapsed ? 'none' : 'block'};

  @media (max-width: 768px) {
    font-size: 20px;
    display: block;
  }
`;

const SidebarIcon = styled.div`
  font-size: 1.5rem;
  color: #333333;
  display: ${props => props.$isCollapsed ? 'block' : 'none'};
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  padding: 0;
  flex: 1;
`;

const NavItem = styled.button`
  padding: 12px 20px;
  cursor: pointer;
  font-weight: ${props => props.$active ? '600' : '400'};
  background: ${props => props.$active ? '#FFF0E6' : 'transparent'}; /* Light peach when active */
  border-left: ${props => props.$active ? '4px solid #FFDDC9' : '4px solid transparent'}; /* Peach accent */
  color: ${props => props.$active ? '#333333' : '#666666'}; /* Darker text when active */
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: ${props => props.$isCollapsed ? 'center' : 'flex-start'};
  border: none;
  width: 100%;
  text-align: left;
  transition: all 0.2s ease;
  
  i {
    width: ${props => props.$isCollapsed ? 'auto' : '20px'};
    text-align: center;
    font-size: 16px;
  }
  
  &:hover {
    background: #FFF0E6; /* Light peach on hover */
    color: #333333; /* Darker text on hover */
  }
`;

const SidebarFooter = styled.div`
  margin-top: auto;
  padding: 15px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CollapseToggle = styled.button`
  background: #FFFFFF;
  border: 1px solid #EEEEEE;
  color: #666666;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  width: 100%;
  transition: all 0.2s ease;
  
  &:hover {
    background: #FFF0E6;
    color: #333333;
  }
`;

const LogoutButton = styled.button`
  padding: 10px;
  background: #FFDDC9;
  color: #333333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  
  &:hover {
    background: #FFD0B5;
  }
`;

const MenuButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: #333333;
  font-size: 24px;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileOverlay = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => (props.$isOpen ? 'block' : 'none')};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
  }
`;

// Content Components
const ContentWrapper = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  padding: 25px;
  border-top: 4px solid #FFDDC9;
  
  h2 {
    margin: 0;
    font-size: 24px;
    color: #333333;
    font-weight: 600;
  }
`;

const TeachersLayout = ({ children, activeView }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleNavClick = (view) => {
    if (view === 'teacherList') {
      navigate('/teachers');
    } else if (view === 'qaTemplates') {
      navigate('/teachers/templates');
    } else if (view === 'dashboard') {
      navigate('/teachers/dashboard');
    } else if (view === 'onlineEvaluation') {
      navigate('/teachers/online-evaluation');
    }
    
    // Close mobile sidebar after navigation
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <AppWrapper>
      <Sidebar $isOpen={isSidebarOpen} $isCollapsed={isSidebarCollapsed}>
        <SidebarHeader>
          <SidebarTitle $isCollapsed={isSidebarCollapsed}>Video Recording Hub</SidebarTitle>
          <SidebarIcon $isCollapsed={isSidebarCollapsed}><i className="fas fa-video"></i></SidebarIcon>
          <MenuButton
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </MenuButton>
        </SidebarHeader>
        
        <NavMenu>
          <NavItem 
            $active={activeView === 'dashboard'} 
            $isCollapsed={isSidebarCollapsed}
            onClick={() => handleNavClick('dashboard')}
          >
            <i className="fas fa-chart-line"></i> {!isSidebarCollapsed && 'Dashboard'}
          </NavItem>
          <NavItem 
            $active={activeView === 'teacherList'} 
            $isCollapsed={isSidebarCollapsed}
            onClick={() => handleNavClick('teacherList')}
          >
            <i className="fas fa-users"></i> {!isSidebarCollapsed && 'Teacher List'}
          </NavItem>
          <NavItem 
            $active={activeView === 'onlineEvaluation'} 
            $isCollapsed={isSidebarCollapsed}
            onClick={() => handleNavClick('onlineEvaluation')}
          >
            <i className="fas fa-clipboard-check"></i> {!isSidebarCollapsed && 'Online Evaluation'}
          </NavItem>
          <NavItem 
            $active={activeView === 'qaTemplates'} 
            $isCollapsed={isSidebarCollapsed}
            onClick={() => handleNavClick('qaTemplates')}
          >
            <i className="fas fa-clipboard-list"></i> {!isSidebarCollapsed && 'QA Templates'}
          </NavItem>
        </NavMenu>
        
        <SidebarFooter>
          <LogoutButton onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> {!isSidebarCollapsed && 'Logout'}
          </LogoutButton>
          
          <CollapseToggle onClick={toggleSidebar}>
            <i className={`fas fa-angle-double-${isSidebarCollapsed ? 'right' : 'left'}`}></i>
          </CollapseToggle>
        </SidebarFooter>
      </Sidebar>
      
      <MobileOverlay $isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(false)} />

      <MainContent $sidebarCollapsed={isSidebarCollapsed}>
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </MainContent>
    </AppWrapper>
  );
};

export default TeachersLayout;
export { ContentWrapper }; 