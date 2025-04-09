import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { authService, userService } from '../../services/apiService';

// Allowed email domain
const ALLOWED_EMAIL_DOMAIN = 'rhet-corp.com';

// Validate email domain
const isAllowedEmailDomain = (email) => {
  return email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserError, setNewUserError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  // Form states for new user
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    user_type: 'teacher'
  });

  // Form states for editing user
  const [editUser, setEditUser] = useState({
    name: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const usersList = await userService.getAllUsers();
      setUsers(usersList);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setCurrentUser(userData);
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const handleLogout = async () => {
    try {
      authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUserTypeChange = async (userId, newType) => {
    try {
      await userService.updateUserType(userId, newType);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, user_type: newType } : user
      ));
      alert(`User type updated to ${newType}`);
    } catch (error) {
      console.error('Error updating user type:', error);
      alert('Failed to update user type');
    }
  };

  const handleDeleteUser = async (userId) => {
    // Check if the user is trying to delete their own account
    if (currentUser && userId === currentUser.id) {
      alert('You cannot delete your own admin account. This ensures there is always at least one admin in the system.');
      return;
    }

    // Check if this is the last admin account
    const adminUsers = users.filter(user => user.user_type === 'admin');
    const isLastAdmin = adminUsers.length === 1 && adminUsers[0].id === userId;
    
    if (isLastAdmin) {
      alert('Cannot delete the last admin account. The system requires at least one admin user.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        alert('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleOpenUserModal = (user) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name || '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsUserModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (editUser.newPassword !== editUser.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    try {
      await userService.updateUser(selectedUser.id, {
        name: editUser.name,
        newPassword: editUser.newPassword
      });
      setUsers(users.map(user =>
        user.id === selectedUser.id ? { ...user, name: editUser.name } : user
      ));
      setIsUserModalOpen(false);
      alert('User information updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user information');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setNewUserError('');

    // Validate email domain
    if (!isAllowedEmailDomain(newUser.email)) {
      setNewUserError(`Only @${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`);
      return;
    }

    try {
      const createdUser = await userService.createUser(newUser);
      setUsers([...users, createdUser]);
      setIsNewUserModalOpen(false);
      setNewUser({
        email: '',
        name: '',
        password: '',
        user_type: 'teacher'
      });
      alert('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      setNewUserError(error.message || 'Failed to create user');
    }
  };

  const handleUserRedirect = (user) => {
    if (user.user_type === 'teacher') {
      // Extract username from email for teachers
      let username = user.email.split('@')[0];
      if (username.startsWith('t.')) {
        username = username.substring(2);
      }
      navigate(`/teacher-dashboard/${username}`);
    } else if (user.user_type === 'qa') {
      navigate('/teachers');
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.user_type && user.user_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppContainer>
      <Sidebar collapsed={isSidebarCollapsed}>
        <SidebarHeader>
          {!isSidebarCollapsed && <SidebarTitle>Admin Dashboard</SidebarTitle>}
          {isSidebarCollapsed && <SidebarIcon><i className="fas fa-tachometer-alt"></i></SidebarIcon>}
        </SidebarHeader>
        
        <NavMenu>
          <NavItem 
            active={activeView === 'users'} 
            onClick={() => setActiveView('users')}
            collapsed={isSidebarCollapsed}
          >
            <i className="fas fa-users"></i> {!isSidebarCollapsed && 'User Management'}
          </NavItem>
          <NavItem 
            active={activeView === 'stats'} 
            onClick={() => setActiveView('stats')}
            collapsed={isSidebarCollapsed}
          >
            <i className="fas fa-chart-bar"></i> {!isSidebarCollapsed && 'System Stats'}
          </NavItem>
          <NavItem 
            active={activeView === 'logs'} 
            onClick={() => setActiveView('logs')}
            collapsed={isSidebarCollapsed}
          >
            <i className="fas fa-history"></i> {!isSidebarCollapsed && 'Activity Logs'}
          </NavItem>
          <NavItem 
            active={activeView === 'settings'} 
            onClick={() => setActiveView('settings')}
            collapsed={isSidebarCollapsed}
          >
            <i className="fas fa-cog"></i> {!isSidebarCollapsed && 'System Settings'}
          </NavItem>
        </NavMenu>
        
        <SidebarFooter>
          <LogoutButton onClick={handleLogout} collapsed={isSidebarCollapsed}>
            <i className="fas fa-sign-out-alt"></i> {!isSidebarCollapsed && 'Logout'}
          </LogoutButton>
          
          <CollapseToggle onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <i className={`fas fa-angle-double-${isSidebarCollapsed ? 'right' : 'left'}`}></i>
          </CollapseToggle>
        </SidebarFooter>
      </Sidebar>

      <MainContent expanded={isSidebarCollapsed}>
        {activeView === 'users' && (
          <ContentWrapper>
            <ContentHeader>
              <h2>User Management</h2>
              <ActionContainer>
                <SearchInput
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <AddUserButton onClick={() => setIsNewUserModalOpen(true)}>
                  <i className="fas fa-user-plus"></i> Add New User
                </AddUserButton>
              </ActionContainer>
            </ContentHeader>

            {isLoading ? (
              <LoadingMessage>Loading users...</LoadingMessage>
            ) : error ? (
              <ErrorMessage>{error}</ErrorMessage>
            ) : filteredUsers.length === 0 ? (
              <NoUsersMessage>
                {searchTerm ? 'No users match your search criteria' : 'No users found'}
              </NoUsersMessage>
            ) : (
              <UserGroupsContainer>
                {/* Admin Users */}
                <UserGroupSection>
                  <UserGroupHeader>
                    <h3>Administrators</h3>
                    <UserCount>{filteredUsers.filter(user => user.user_type === 'admin').length} Users</UserCount>
                  </UserGroupHeader>
                  <UsersTable>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th className="actions-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers
                        .filter(user => user.user_type === 'admin')
                        .map((user) => (
                          <tr key={user.id}>
                            <td>
                              <UserEmail>
                                <i className="fas fa-envelope"></i>
                                {user.email}
                              </UserEmail>
                            </td>
                            <td>
                              <UserName>
                                <i className="fas fa-user"></i>
                                {user.name || 'N/A'}
                              </UserName>
                            </td>
                            <td>
                              <ActionPanel>
                                <UserTypeSelect
                                  value={user.user_type || ''}
                                  onChange={(e) => handleUserTypeChange(user.id, e.target.value)}
                                >
                                  <option value="admin">Admin</option>
                                  <option value="teacher">Teacher</option>
                                  <option value="qa">QA</option>
                                </UserTypeSelect>
                                <ActionButtonsGroup>
                                  <Button onClick={() => handleOpenUserModal(user)}>
                                    <i className="fas fa-user-edit"></i> Edit
                                  </Button>
                                  <DeleteButton 
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={currentUser && user.id === currentUser.id}
                                    title={currentUser && user.id === currentUser.id ? 
                                      "You cannot delete your own account" : "Delete this user"}
                                  >
                                    <i className="fas fa-trash"></i> Delete
                                  </DeleteButton>
                                </ActionButtonsGroup>
                              </ActionPanel>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </UsersTable>
                </UserGroupSection>

                {/* Teacher Users */}
                <UserGroupSection>
                  <UserGroupHeader>
                    <h3>Teachers</h3>
                    <UserCount>{filteredUsers.filter(user => user.user_type === 'teacher').length} Users</UserCount>
                  </UserGroupHeader>
                  <UsersTable>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th className="actions-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers
                        .filter(user => user.user_type === 'teacher')
                        .map((user) => (
                          <tr key={user.id}>
                            <td>
                              <UserEmail>
                                <i className="fas fa-envelope"></i>
                                {user.email}
                              </UserEmail>
                            </td>
                            <td>
                              <UserName>
                                <i className="fas fa-user"></i>
                                {user.name || 'N/A'}
                              </UserName>
                            </td>
                            <td>
                              <ActionPanel>
                                <UserTypeSelect
                                  value={user.user_type || ''}
                                  onChange={(e) => handleUserTypeChange(user.id, e.target.value)}
                                >
                                  <option value="admin">Admin</option>
                                  <option value="teacher">Teacher</option>
                                  <option value="qa">QA</option>
                                </UserTypeSelect>
                                <ActionButtonsGroup>
                                  <Button onClick={() => handleOpenUserModal(user)}>
                                    <i className="fas fa-user-edit"></i> Edit
                                  </Button>
                                  <DeleteButton 
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={currentUser && user.id === currentUser.id}
                                    title={currentUser && user.id === currentUser.id ? 
                                      "You cannot delete your own account" : "Delete this user"}
                                  >
                                    <i className="fas fa-trash"></i> Delete
                                  </DeleteButton>
                                </ActionButtonsGroup>
                              </ActionPanel>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </UsersTable>
                </UserGroupSection>

                {/* QA Users */}
                <UserGroupSection>
                  <UserGroupHeader>
                    <h3>QA Staff</h3>
                    <UserCount>{filteredUsers.filter(user => user.user_type === 'qa').length} Users</UserCount>
                  </UserGroupHeader>
                  <UsersTable>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th className="actions-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers
                        .filter(user => user.user_type === 'qa')
                        .map((user) => (
                          <tr key={user.id}>
                            <td>
                              <UserEmail>
                                <i className="fas fa-envelope"></i>
                                {user.email}
                              </UserEmail>
                            </td>
                            <td>
                              <UserName>
                                <i className="fas fa-user"></i>
                                {user.name || 'N/A'}
                              </UserName>
                            </td>
                            <td>
                              <ActionPanel>
                                <UserTypeSelect
                                  value={user.user_type || ''}
                                  onChange={(e) => handleUserTypeChange(user.id, e.target.value)}
                                >
                                  <option value="admin">Admin</option>
                                  <option value="teacher">Teacher</option>
                                  <option value="qa">QA</option>
                                </UserTypeSelect>
                                <ActionButtonsGroup>
                                  <Button onClick={() => handleOpenUserModal(user)}>
                                    <i className="fas fa-user-edit"></i> Edit
                                  </Button>
                                  <DeleteButton 
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={currentUser && user.id === currentUser.id}
                                    title={currentUser && user.id === currentUser.id ? 
                                      "You cannot delete your own account" : "Delete this user"}
                                  >
                                    <i className="fas fa-trash"></i> Delete
                                  </DeleteButton>
                                </ActionButtonsGroup>
                              </ActionPanel>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </UsersTable>
                </UserGroupSection>

                {/* Other Users (if any) */}
                {filteredUsers.some(user => !user.user_type || !['admin', 'teacher', 'qa'].includes(user.user_type)) && (
                  <UserGroupSection>
                    <UserGroupHeader>
                      <h3>Other Users</h3>
                      <UserCount>
                        {filteredUsers.filter(user => !user.user_type || !['admin', 'teacher', 'qa'].includes(user.user_type)).length} Users
                      </UserCount>
                    </UserGroupHeader>
                    <UsersTable>
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Name</th>
                          <th>User Type</th>
                          <th className="actions-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers
                          .filter(user => !user.user_type || !['admin', 'teacher', 'qa'].includes(user.user_type))
                          .map((user) => (
                            <tr key={user.id}>
                              <td>
                                <UserEmail>
                                  <i className="fas fa-envelope"></i>
                                  {user.email}
                                </UserEmail>
                              </td>
                              <td>
                                <UserName>
                                  <i className="fas fa-user"></i>
                                  {user.name || 'N/A'}
                                </UserName>
                              </td>
                              <td>
                                <UserType>
                                  <i className="fas fa-id-badge"></i>
                                  {user.user_type || 'N/A'}
                                </UserType>
                              </td>
                              <td>
                                <ActionPanel>
                                  <UserTypeSelect
                                    value={user.user_type || ''}
                                    onChange={(e) => handleUserTypeChange(user.id, e.target.value)}
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="qa">QA</option>
                                  </UserTypeSelect>
                                  <ActionButtonsGroup>
                                    <Button onClick={() => handleOpenUserModal(user)}>
                                      <i className="fas fa-user-edit"></i> Edit
                                    </Button>
                                    <DeleteButton 
                                      onClick={() => handleDeleteUser(user.id)}
                                      disabled={currentUser && user.id === currentUser.id}
                                      title={currentUser && user.id === currentUser.id ? 
                                        "You cannot delete your own account" : "Delete this user"}
                                    >
                                      <i className="fas fa-trash"></i> Delete
                                    </DeleteButton>
                                  </ActionButtonsGroup>
                                </ActionPanel>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </UsersTable>
                  </UserGroupSection>
                )}
              </UserGroupsContainer>
            )}
          </ContentWrapper>
        )}

        {activeView === 'stats' && (
          <ContentWrapper>
            <h2>System Statistics</h2>
            <StatsContainer>
              <StatCard backgroundColor="#FFF8F3">
                <StatTitle>Total Users</StatTitle>
                <StatValue>{users.length}</StatValue>
              </StatCard>
              <StatCard backgroundColor="#FFF0E6">
                <StatTitle>Teachers</StatTitle>
                <StatValue>{users.filter(user => user.user_type === 'teacher').length}</StatValue>
              </StatCard>
              <StatCard backgroundColor="#FFE4D6">
                <StatTitle>QA Staff</StatTitle>
                <StatValue>{users.filter(user => user.user_type === 'qa').length}</StatValue>
              </StatCard>
              <StatCard backgroundColor="#FFDDC9">
                <StatTitle>Admins</StatTitle>
                <StatValue>{users.filter(user => user.user_type === 'admin').length}</StatValue>
              </StatCard>
            </StatsContainer>
          </ContentWrapper>
        )}

        {activeView === 'logs' && (
          <ContentWrapper>
            <h2>Activity Logs</h2>
            <p>System activity logs will be displayed here.</p>
          </ContentWrapper>
        )}

        {activeView === 'settings' && (
          <ContentWrapper>
            <h2>System Settings</h2>
            <p>System configuration options will be displayed here.</p>
          </ContentWrapper>
        )}

        {/* User Edit Modal */}
        {isUserModalOpen && (
          <Modal>
            <ModalContent>
              <h3>Edit User Information</h3>
              <form onSubmit={handleUpdateUser}>
                <FormGroup>
                  <label>Name:</label>
                  <input
                    type="text"
                    value={editUser.name}
                    onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                  />
                </FormGroup>
                <FormGroup>
                  <label>New Password:</label>
                  <input
                    type="password"
                    value={editUser.newPassword}
                    onChange={(e) => setEditUser({...editUser, newPassword: e.target.value})}
                  />
                </FormGroup>
                <FormGroup>
                  <label>Confirm New Password:</label>
                  <input
                    type="password"
                    value={editUser.confirmPassword}
                    onChange={(e) => setEditUser({...editUser, confirmPassword: e.target.value})}
                  />
                </FormGroup>
                <ModalButtons>
                  <Button type="submit"><i className="fas fa-save"></i> Save Changes</Button>
                  <Button type="button" onClick={() => setIsUserModalOpen(false)}><i className="fas fa-times"></i> Cancel</Button>
                </ModalButtons>
              </form>
            </ModalContent>
          </Modal>
        )}

        {/* New User Modal */}
        {isNewUserModalOpen && (
          <Modal>
            <ModalContent>
              <h3>Create New User</h3>
              {newUserError && <ErrorMessage>{newUserError}</ErrorMessage>}
              <form onSubmit={handleCreateUser}>
                <FormGroup>
                  <label>Email:</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => {
                      setNewUser({...newUser, email: e.target.value});
                      setNewUserError('');
                    }}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <label>Name:</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <label>Password:</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <label>User Type:</label>
                  <UserTypeSelect
                    value={newUser.user_type}
                    onChange={(e) => setNewUser({...newUser, user_type: e.target.value})}
                  >
                    <option value="teacher">Teacher</option>
                    <option value="qa">QA</option>
                    <option value="admin">Admin</option>
                  </UserTypeSelect>
                </FormGroup>
                <ModalButtons>
                  <Button type="submit"><i className="fas fa-user-plus"></i> Create User</Button>
                  <Button type="button" onClick={() => setIsNewUserModalOpen(false)}><i className="fas fa-times"></i> Cancel</Button>
                </ModalButtons>
              </form>
            </ModalContent>
          </Modal>
        )}
      </MainContent>
    </AppContainer>
  );
};

// Styled Components
const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #FFF8F3;
  font-family: 'Inter', 'Segoe UI', sans-serif;
`;

const Sidebar = styled.div`
  width: ${props => props.collapsed ? '70px' : '250px'};
  background: #FFFFFF; /* White background */
  color: #333333; /* Dark text */
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  transition: width 0.3s ease;
  overflow: hidden;
`;

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

const SidebarTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333333; /* Dark text */
`;

const SidebarIcon = styled.div`
  font-size: 1.5rem;
  color: #333333;
`;

const NavMenu = styled.div`
  flex: 1;
`;

const NavItem = styled.div`
  padding: 12px 20px;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  background: ${props => props.active ? '#FFF0E6' : 'transparent'}; /* Light peach when active */
  border-left: ${props => props.active ? '4px solid #FFDDC9' : '4px solid transparent'}; /* Peach accent */
  color: ${props => props.active ? '#333333' : '#666666'}; /* Darker text when active */
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};
  
  i {
    width: ${props => props.collapsed ? 'auto' : '20px'};
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

const MainContent = styled.div`
  flex: 1;
  padding: 30px;
  background: #FFF8F3;
  overflow-y: auto;
  transition: margin-left 0.3s ease;
`;

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

const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #FFF0E6;
  
  h2 {
    margin: 0;
    font-size: 24px;
    color: #333333;
    font-weight: 600;
  }
`;

const SearchInput = styled.input`
  padding: 10px 15px;
  border: 1px solid #EEEEEE;
  border-radius: 8px;
  font-size: 14px;
  width: 250px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 3px rgba(255, 221, 201, 0.2);
  }
`;

const UsersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #EEEEEE;
  }
  
  th {
    background-color: #FFF8F3;
    font-weight: 600;
    font-size: 14px;
    color: #333333;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  th.actions-header {
    text-align: right;
    min-width: 200px;
    max-width: 200px;
    padding-right: 25px;
    font-weight: 700;
  }
  
  td:last-child {
    text-align: right;
    padding-right: 20px;
  }
  
  tr:nth-child(even) {
    background-color: #FFFBF8;
  }
  
  tr:hover {
    background-color: #FFF0E6;
  }
  
  td {
    font-size: 14px;
    color: #333333;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionPanel = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  gap: 10px;
  width: 100%;
  justify-content: flex-end;
  align-items: center;
`;

const ActionButtonsGroup = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  justify-content: flex-end;
`;

const UserTypeSelect = styled.select`
  padding: 6px 8px;
  border: 1px solid #EEEEEE;
  border-radius: 4px;
  background-color: white;
  flex: 1;
  max-width: 100px;
  font-size: 13px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  margin-left: auto;
  color: #333333;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 3px rgba(255, 221, 201, 0.2);
  }
`;

const Button = styled.button`
  padding: 8px 10px;
  background: #FFDDC9;
  color: #333333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  min-width: 80px;
  max-width: 90px;
  font-size: 13px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    background: #FFD0B5;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const DeleteButton = styled(Button)`
  background: #FF9B8A;
  color: #FFFFFF;
  
  &:hover {
    background: #FF8A76;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    background: #EEEEEE;
    color: #999999;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    
    &:hover {
      background: #EEEEEE;
      transform: none;
      box-shadow: none;
    }
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666666;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #FF5252;
  background-color: #FFEBEE;
  border-radius: 8px;
  margin: 10px 0;
  border-left: 4px solid #FF5252;
`;

const NoUsersMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666666;
  font-style: italic;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const StatCard = styled.div`
  background: ${props => props.backgroundColor || '#FFFFFF'};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #EEEEEE;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const StatTitle = styled.div`
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #333333;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 25px;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-top: 4px solid #FFDDC9;
  
  h3 {
    margin: 0 0 20px 0;
    color: #333333;
    font-weight: 600;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #666666;
  }
  
  input {
    width: 100%;
    padding: 10px;
    border: 1px solid #EEEEEE;
    border-radius: 8px;
    
    &:focus {
      outline: none;
      border-color: #FFDDC9;
      box-shadow: 0 0 0 3px rgba(255, 221, 201, 0.2);
    }
  }
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const AddUserButton = styled(Button)`
  padding: 10px 15px;
  font-size: 14px;
  min-width: 140px;
  max-width: none;
  background: #FFDDC9;
  
  &:hover {
    background: #FFD0B5;
  }
`;

const ActionContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserGroupsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-top: 30px;
`;

const UserGroupSection = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #E3F2FD;
  
  &:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  }
`;

const UserGroupHeader = styled.div`
  background: #FFF0E6;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #FFDDC9;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  
  h3 {
    margin: 0;
    color: #333333;
    font-weight: 600;
    font-size: 16px;
  }
`;

const UserCount = styled.span`
  background: #FFF0E6;
  color: #333333;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  border: 1px solid #FFDDC9;
  
  &::before {
    content: '\f007';
    font-family: 'Font Awesome 6 Free';
    margin-right: 5px;
    font-weight: 900;
  }
`;

const UserEmail = styled.div`
  font-size: 14px;
  color: #666666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
`;

const UserType = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  i {
    color: #42A5F5;
    font-size: 14px;
  }
`;

const UserProfileSection = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(21, 101, 192, 0.2);
  justify-content: center;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #FFDDC9;
  color: #333333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  margin-right: ${props => props.collapsed ? '0' : '12px'};
`;

export default AdminDashboard; 