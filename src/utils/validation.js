// src/utils/validation.js
// Note: You need to install yup first:
// npm install yup --save

// Import Yup if installed
let yup;
try {
  yup = require('yup');
} catch (err) {
  console.warn('Yup not installed. Run: npm install yup --save');
  // Create a placeholder yup object to prevent errors if the package isn't installed yet
  yup = {
    object: () => ({ shape: () => ({}) }),
    string: () => ({ 
      email: () => ({ required: () => ({}) }),
      min: () => ({ required: () => ({}) }),
      oneOf: () => ({ required: () => ({}) }),
      required: () => ({})
    }),
    number: () => ({ min: () => ({ max: () => ({}) }) }),
    boolean: () => ({}),
    array: () => ({ of: () => ({}) }),
    ref: () => ({})
  };
}

// Define validation schemas for form validation
export const validateForm = async (schema, data) => {
  try {
    const validData = await schema.validate(data, { abortEarly: false });
    return { isValid: true, data: validData, errors: {} };
  } catch (err) {
    // Format the validation errors into a user-friendly object
    const formattedErrors = {};
    
    if (err.inner && err.inner.length > 0) {
      err.inner.forEach(error => {
        formattedErrors[error.path] = error.message;
      });
    }
    
    return { isValid: false, data: null, errors: formattedErrors };
  }
};

// Login form validation schema
export const loginSchema = yup.object().shape({
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

// Registration form validation schema
export const registerSchema = yup.object().shape({
  name: yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Password confirmation is required')
});

// Create user form validation schema
export const createUserSchema = yup.object().shape({
  name: yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  userType: yup.string()
    .oneOf(['admin', 'teacher', 'qa'], 'Invalid user type')
    .required('User type is required')
});

// Add more validation schemas as needed
export default {
  validateForm,
  loginSchema,
  registerSchema,
  createUserSchema
}; 