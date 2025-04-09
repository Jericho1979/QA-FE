import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { authService } from './services/apiService';
import rhetLogo from './assets/rhet@rhet.jpg'; // Import the logo

// Allowed email domain
const ALLOWED_EMAIL_DOMAIN = 'rhet-corp.com';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const toggleForm = () => {
    setIsLogin(!isLogin);
  };
  
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = re.test(email);
    
    if (!isValid) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    // Check if email is from allowed domain
    if (!email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
      setEmailError(`Only @${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`);
      return false;
    }
    
    setEmailError('');
    return true;
  };
  
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (e.target.value) {
      validateEmail(e.target.value);
    } else {
      setEmailError('');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setError('');
    
    // Validate email
    if (!validateEmail(email)) {
      return;
    }
    
    // Validate password
    if (!password) {
      setError('Password is required');
      return;
    }
    
    // For registration, validate confirm password
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let response;
      
      if (isLogin) {
        // Login
        console.log('Attempting login with:', email);
        response = await authService.login(email, password);
      } else {
        // Register
        console.log('Attempting registration with:', { email, name });
        
        // Make sure name is not empty or undefined
        const username = name || email.split('@')[0];
        console.log('Using username for registration:', username);
        
        response = await authService.register(email, password, username);
      }
      
      console.log('Authentication successful:', response);
      
      // Remove localStorage token storage
      // The authentication token is now stored in an HttpOnly cookie set by the server
      
      // Redirect based on user type
      const userType = response.user.userType;
      
      if (userType === 'admin') {
        navigate('/admin');
      } else if (userType === 'teacher') {
        navigate(`/teacher-dashboard/${response.user.email}`);
      } else if (userType === 'qa') {
        navigate('/teachers');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <PageContainer>
      <AuthLayout>
        <FormSection>
          <FormContent>
            <FormHeader>
              {isLogin ? 'Welcome Back!!' : 'Create Account'}
            </FormHeader>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <Form onSubmit={handleSubmit}>
              {!isLogin && (
                <InputGroup>
                  <InputLabel>Name</InputLabel>
                  <InputWrapper>
                    <InputIcon>
                      <i className="fas fa-user"></i>
                    </InputIcon>
                    <StyledInput
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </InputWrapper>
                </InputGroup>
              )}
              
              <InputGroup>
                <InputLabel>Email</InputLabel>
                <InputWrapper>
                  <InputIcon>
                    <i className="fas fa-envelope"></i>
                  </InputIcon>
                  <StyledInput
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="email@gmail.com"
                    required
                  />
                </InputWrapper>
                {emailError && <InputError>{emailError}</InputError>}
              </InputGroup>
              
              <InputGroup>
                <InputLabel>Password</InputLabel>
                <InputWrapper>
                  <InputIcon>
                    <i className="fas fa-lock"></i>
                  </InputIcon>
                  <StyledInput
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <PasswordToggle onClick={togglePasswordVisibility}>
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </PasswordToggle>
                </InputWrapper>
              </InputGroup>
              
              {!isLogin && (
                <InputGroup>
                  <InputLabel>Confirm Password</InputLabel>
                  <InputWrapper>
                    <InputIcon>
                      <i className="fas fa-lock"></i>
                    </InputIcon>
                    <StyledInput
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                    <PasswordToggle onClick={togglePasswordVisibility}>
                      <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </PasswordToggle>
                  </InputWrapper>
                </InputGroup>
              )}
              
              <ForgotPasswordLink>Forgot Password?</ForgotPasswordLink>
              
              <SubmitButton type="submit" disabled={isLoading}>
                {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
              </SubmitButton>
              
              <Divider>
                <DividerText>or</DividerText>
              </Divider>
              
              <SocialButtonsContainer>
                <SocialButton type="button">
                  <i className="fab fa-google"></i>
                </SocialButton>
                <SocialButton type="button">
                  <i className="fab fa-facebook-f"></i>
                </SocialButton>
                <SocialButton type="button">
                  <i className="fab fa-apple"></i>
                </SocialButton>
              </SocialButtonsContainer>
              
              <ToggleFormText>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <ToggleFormLink onClick={toggleForm}>
                  {isLogin ? "Sign up" : "Sign in"}
                </ToggleFormLink>
              </ToggleFormText>
            </Form>
          </FormContent>
        </FormSection>
        
        <ImageSection>
          <IllustrationContainer>
            {/* Illustration would go here */}
          </IllustrationContainer>
        </ImageSection>
      </AuthLayout>
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #FFF8F3;
  padding: 20px;
  font-family: 'Inter', 'Segoe UI', sans-serif;
`;

const AuthLayout = styled.div`
  display: flex;
  width: 100%;
  max-width: 1200px;
  min-height: 600px;
  background-color: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    flex-direction: column;
    max-width: 450px;
  }
`;

const FormSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
  
  @media (max-width: 768px) {
    padding: 30px 20px;
  }
`;

const FormContent = styled.div`
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
`;

const FormHeader = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 30px;
`;

const Form = styled.form`
  width: 100%;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #666666;
  margin-bottom: 8px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background-color: #F9F9F9;
  border: 1px solid #EEEEEE;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:focus-within {
    border-color: #1976D2;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
  }
`;

const InputIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  color: #999999;
`;

const StyledInput = styled.input`
  flex: 1;
  padding: 12px 10px 12px 0;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #333333;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: #BBBBBB;
  }
`;

const PasswordToggle = styled.button`
  background: none;
  border: none;
  color: #999999;
  cursor: pointer;
  padding: 0 15px;
  font-size: 14px;
  
  &:hover {
    color: #666666;
  }
`;

const InputError = styled.div`
  color: #E53935;
  font-size: 12px;
  margin-top: 5px;
`;

const ForgotPasswordLink = styled.div`
  text-align: right;
  font-size: 14px;
  color: #666666;
  margin-bottom: 25px;
  cursor: pointer;
  
  &:hover {
    color: #1976D2;
    text-decoration: underline;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  background: #FFDDC9;
  color: #333333;
  border: none;
  border-radius: 8px;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #FFD0B5;
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #F0F0F0;
    color: #999999;
    cursor: not-allowed;
    transform: none;
  }
`;

const Divider = styled.div`
  position: relative;
  text-align: center;
  margin: 25px 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #EEEEEE;
  }
`;

const DividerText = styled.span`
  position: relative;
  background-color: #FFFFFF;
  padding: 0 15px;
  color: #999999;
  font-size: 14px;
`;

const SocialButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 25px;
`;

const SocialButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #EEEEEE;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666666;
  
  &:hover {
    background: #F9F9F9;
    transform: translateY(-2px);
  }
`;

const ToggleFormText = styled.p`
  text-align: center;
  font-size: 14px;
  color: #666666;
  margin-top: 10px;
`;

const ToggleFormLink = styled.span`
  color: #1976D2;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ImageSection = styled.div`
  flex: 1;
  background-color: #FFF8F3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const IllustrationContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ErrorMessage = styled.div`
  background-color: #FFEBEE;
  color: #E53935;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  border-left: 4px solid #E53935;
`;

export default AuthForm;

// Export handleLogout for use in other components
export const handleLogout = async () => {
  try {
    authService.logout();
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};
