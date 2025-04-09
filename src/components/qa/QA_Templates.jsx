import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import TeachersLayout from './QA_TeachersLayout';
import { toast } from 'react-hot-toast';
import apiServiceDefault from '../../services/apiService';
import config from '../../config';

// Destructure the services from the default export
const { apiRequest } = apiServiceDefault;

// API base URL from config
const API_URL = config.API_URL;

// Styled components for this view
const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #333333;
  margin: 0 0 24px 0;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2em;
  color: #666666;
`;

// Template management styled components
const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
`;

const TemplateForm = styled.div`
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
  border-top: 4px solid #FFDDC9;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 15px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #DDDDDD;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #FFDDC9;
    box-shadow: 0 0 0 3px rgba(255, 221, 201, 0.2);
  }
  
  &[type="number"] {
    -moz-appearance: textfield;
  }
  
  &[type="number"]::-webkit-outer-spin-button,
  &[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const NumberInput = styled(FormInput)`
  width: ${props => props.width || '100%'};
  text-align: center;
`;

const AddButton = styled.button`
  background: #FFDDC9;
  color: #333333;
  border: none;
  border-radius: 6px;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #FFD0B5;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  i {
    font-size: 14px;
  }
`;

const RemoveButton = styled.button`
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  margin-left: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #d32f2f;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const CreateButton = styled.button`
  background: #FFDDC9;
  color: #333333;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #FFD0B5;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  i {
    font-size: 16px;
  }
`;

const DeleteButton = styled.button`
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  transition: background 0.3s;
  
  &:hover {
    background: #d32f2f;
  }
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const TemplateCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
`;

const TemplateCardHeader = styled.div`
  padding: 15px;
  background: #FFDDC9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #FFD0B5;
  }
`;

const TemplateCardTitle = styled.h4`
  margin: 0;
  color: #333333;
  font-weight: 600;
`;

const TemplateCardContent = styled.div`
  padding: 15px;
  max-height: ${props => props.$isExpanded ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.5s ease, padding 0.3s ease;
  padding: ${props => props.$isExpanded ? '15px' : '0 15px'};
`;

const CategorySection = styled.div`
  margin-bottom: 15px;
`;

const CategoryTitle = styled.h5`
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333333;
`;

const SubcategoryList = styled.ul`
  padding-left: 20px;
  margin: 5px 0;
`;

const SubcategoryItem = styled.li`
  margin-bottom: 4px;
`;

const ToggleIcon = styled.span`
  transition: transform 0.3s ease;
  display: inline-block;
  margin-right: 8px;
  transform: ${props => props.$isExpanded ? 'rotate(90deg)' : 'rotate(0)'};
`;

const FormCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #EEEEEE;
  overflow: hidden;
`;

const FormCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const FormCardTitle = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 16px;
`;

const FormCardContent = styled.div`
  margin-left: 20px;
`;

const WeightIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-top: 5px;
  font-size: 13px;
  color: ${props => props.$isValid ? '#4CAF50' : '#f44336'};
`;

const FormHint = styled.div`
  font-size: 13px;
  color: #666;
  margin-top: 5px;
  font-style: italic;
`;

const FormDivider = styled.div`
  height: 1px;
  background: #eee;
  margin: 20px 0;
`;

const FormRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  align-items: flex-end;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
`;

const FormColumn = styled.div`
  flex: ${props => props.$flex || 1};
  min-width: ${props => props.$minWidth || 'auto'};
  max-width: ${props => props.$maxWidth || 'none'};
`;

const WeightInput = styled.div`
  display: flex;
  align-items: center;
  width: 180px;
  flex-shrink: 0;
  
  span {
    white-space: nowrap;
    font-size: 14px;
  }
  
  span:first-child {
    width: 60px;
    text-align: right;
    margin-right: 8px;
    flex-shrink: 0;
  }
  
  span:last-child {
    width: 15px;
    margin-left: 8px;
    flex-shrink: 0;
  }
  
  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    
    span:first-child {
      width: 60px;
      text-align: left;
    }
  }
`;

const SubcategoryRow = styled.div`
  display: flex;
  margin-bottom: 15px;
  align-items: center;
  gap: 15px;
  flex-wrap: nowrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    
    ${WeightInput} {
      margin-left: 0;
      margin-top: 8px;
    }
  }
`;

const RatingLabelRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
  flex-wrap: nowrap;
  
  @media (max-width: 768px) {
    flex-wrap: nowrap;
  }
`;

// Create a specific component for the checkbox container
const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  height: 42px;
  padding-bottom: 0;
  
  label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  
  input {
    margin-right: 8px;
    width: 16px;
    height: 16px;
  }
`;

// Add a styled component for the page header
const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
`;

// Add a styled component for the section header
const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

// Add a styled component for the tooltip
const Tooltip = styled.div`
  position: relative;
  display: inline-block;
  margin-left: 8px;
  
  .tooltip-icon {
    color: #999;
    cursor: help;
    font-size: 14px;
  }
  
  .tooltip-text {
    visibility: hidden;
    width: 250px;
    background-color: #333;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 8px;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.3s;
    font-size: 12px;
    font-weight: normal;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
  }
`;

const QATemplates = () => {
  const [evaluationTemplates, setEvaluationTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]); // Needed for isTemplateInUse function
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [expandedTemplates, setExpandedTemplates] = useState({}); // Track which templates are expanded
  
  // New template state
  const [newTemplate, setNewTemplate] = useState({ 
    name: '', 
    categories: [{ 
      name: '', 
      subcategories: [{ name: '', weight: 10 }] 
    }],
    ratingScale: {
      min: 1,
      max: 5,
      allowDecimals: true,
      labels: [
        { value: 5, label: 'Exceeds Performance' },
        { value: 4, label: 'Meets Performance' },
        { value: 3, label: 'Company Standard' },
        { value: 2, label: 'Poor' },
        { value: 1, label: 'Unsatisfactory' }
      ]
    }
  });

  useEffect(() => {
    fetchEvaluationTemplates();
  }, []);

  // Fetch evaluation templates from the database
  const fetchEvaluationTemplates = async () => {
    try {
      const data = await apiRequest(`${API_URL}/evaluation-templates`);
      console.log('Fetched evaluation templates:', data); // Debug log
      
      // Default rating labels
      const defaultLabels = [
        { value: 5, label: 'Exceeds Performance' },
        { value: 4, label: 'Meets Performance' },
        { value: 3, label: 'Company Standard' },
        { value: 2, label: 'Poor' },
        { value: 1, label: 'Unsatisfactory' }
      ];
      
      // Only update if we got templates back
      if (data && data.length > 0) {
        // Transform the data to match the expected format
        const transformedTemplates = data.map(template => {
          // Parse categories if it's a string
          let categories = template.categories;
          if (typeof categories === 'string') {
            try {
              categories = JSON.parse(categories);
            } catch (e) {
              console.error('Error parsing categories:', e);
              categories = [];
            }
          }
          
          // Parse rating scale if it's a string
          let ratingScale = template.ratingScale || template.rating_scale;
          if (typeof ratingScale === 'string') {
            try {
              ratingScale = JSON.parse(ratingScale);
            } catch (e) {
              console.error('Error parsing rating scale:', e);
              ratingScale = {
                min: 1,
                max: 5,
                allowDecimals: true,
                labels: defaultLabels
              };
            }
          }
          
          // Ensure rating scale has all required properties
          ratingScale = {
            min: ratingScale?.min || 1,
            max: ratingScale?.max || 5,
            allowDecimals: ratingScale?.allowDecimals ?? true,
            labels: Array.isArray(ratingScale?.labels) && ratingScale.labels.length > 0 
              ? ratingScale.labels 
              : defaultLabels
          };
          
          return {
            id: template.id,
            name: template.name,
            categories: categories || [],
            ratingScale
          };
        });
        
        console.log('Transformed templates:', transformedTemplates);
        setEvaluationTemplates(transformedTemplates);
      }
    } catch (error) {
      console.error('Error fetching evaluation templates:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Template management functions
  const handleAddCategory = () => {
    setNewTemplate({
      ...newTemplate,
      categories: [
        ...newTemplate.categories,
        { name: '', subcategories: [{ name: '', weight: 10 }] }
      ]
    });
  };

  const handleRemoveCategory = (categoryIndex) => {
    const updatedCategories = [...newTemplate.categories];
    updatedCategories.splice(categoryIndex, 1);
    setNewTemplate({
      ...newTemplate,
      categories: updatedCategories
    });
  };

  const handleCategoryNameChange = (categoryIndex, value) => {
    const updatedCategories = [...newTemplate.categories];
    updatedCategories[categoryIndex].name = value;
    setNewTemplate({
      ...newTemplate,
      categories: updatedCategories
    });
  };

  const handleAddSubcategory = (categoryIndex) => {
    const updatedCategories = [...newTemplate.categories];
    updatedCategories[categoryIndex].subcategories.push({ name: '', weight: 10 });
    setNewTemplate({
      ...newTemplate,
      categories: updatedCategories
    });
  };

  const handleRemoveSubcategory = (categoryIndex, subcategoryIndex) => {
    const updatedCategories = [...newTemplate.categories];
    updatedCategories[categoryIndex].subcategories.splice(subcategoryIndex, 1);
    setNewTemplate({
      ...newTemplate,
      categories: updatedCategories
    });
  };

  const handleSubcategoryNameChange = (categoryIndex, subcategoryIndex, value) => {
    const updatedCategories = [...newTemplate.categories];
    updatedCategories[categoryIndex].subcategories[subcategoryIndex].name = value;
    setNewTemplate({
      ...newTemplate,
      categories: updatedCategories
    });
  };

  const handleSubcategoryWeightChange = (categoryIndex, subcategoryIndex, value) => {
    const updatedCategories = [...newTemplate.categories];
    updatedCategories[categoryIndex].subcategories[subcategoryIndex].weight = parseInt(value, 10) || 0;
    setNewTemplate({
      ...newTemplate,
      categories: updatedCategories
    });
  };

  const handleRatingScaleChange = (field, value) => {
    setNewTemplate(prev => ({
      ...prev,
      ratingScale: {
        ...prev.ratingScale,
        [field]: value
      }
    }));
  };

  const handleRatingLabelChange = (index, value, labelType) => {
    setNewTemplate(prev => {
      const newLabels = [...prev.ratingScale.labels];
      if (labelType === 'value') {
        newLabels[index] = { ...newLabels[index], value: parseFloat(value) };
      } else {
        newLabels[index] = { ...newLabels[index], label: value };
      }
      return {
        ...prev,
        ratingScale: {
          ...prev.ratingScale,
          labels: newLabels
        }
      };
    });
  };

  const addRatingLabel = () => {
    setNewTemplate(prev => ({
      ...prev,
      ratingScale: {
        ...prev.ratingScale,
        labels: [...prev.ratingScale.labels, { value: '', label: '' }]
      }
    }));
  };

  const removeRatingLabel = (index) => {
    setNewTemplate(prev => ({
      ...prev,
      ratingScale: {
        ...prev.ratingScale,
        labels: prev.ratingScale.labels.filter((_, i) => i !== index)
      }
    }));
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    // Validate rating scale
    if (newTemplate.ratingScale.min >= newTemplate.ratingScale.max) {
      alert('Maximum rating must be greater than minimum rating');
      return;
    }

    // Validate categories and subcategories
    for (const category of newTemplate.categories) {
      if (!category.name.trim()) {
        alert('Please fill in all category names');
        return;
      }

      for (const subcategory of category.subcategories) {
        if (!subcategory.name.trim()) {
          alert('Please fill in all subcategory names');
          return;
        }
        
        if (subcategory.weight <= 0) {
          alert('Weight must be greater than 0');
          return;
        }
      }
    }

    // Validate total weight is 100%
    const totalWeight = newTemplate.categories.reduce((sum, category) => {
      return sum + category.subcategories.reduce((subSum, subcategory) => {
        return subSum + subcategory.weight;
      }, 0);
    }, 0);

    if (totalWeight !== 100) {
      alert(`Total weight must be 100%. Current total: ${totalWeight}%`);
      return;
    }

    // Create template data
    const newId = `template_${Date.now()}`;
    const newTemplateData = {
      name: newTemplate.name,
      categories: newTemplate.categories,
      ratingScale: newTemplate.ratingScale
    };
    
    try {
      // Save template to database using apiRequest
      const serverTemplate = await apiRequest(`${API_URL}/evaluation-templates`, {
        method: 'POST',
        body: JSON.stringify(newTemplateData),
      });
      
      // Transform the response to match the expected format
      const savedTemplate = {
        id: serverTemplate.id,
        name: serverTemplate.name,
        categories: typeof serverTemplate.categories === 'string' 
          ? JSON.parse(serverTemplate.categories) 
          : serverTemplate.categories,
        ratingScale: typeof serverTemplate.rating_scale === 'string' 
          ? JSON.parse(serverTemplate.rating_scale) 
          : serverTemplate.rating_scale
      };
      
      // Update local state with the saved template
      setEvaluationTemplates([
        ...evaluationTemplates,
        savedTemplate
      ]);
      
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert(`Error saving template: ${error.message}`);
      
      // Still update local state even if server save fails
      const localTemplate = {
        id: newId,
        ...newTemplateData
      };
      
      setEvaluationTemplates([
        ...evaluationTemplates,
        localTemplate
      ]);
    }

    // Reset form
    setNewTemplate({ 
      name: '', 
      categories: [{ 
        name: '', 
        subcategories: [{ name: '', weight: 10 }] 
      }],
      ratingScale: {
        min: 1,
        max: 5,
        allowDecimals: true,
        labels: [
          { value: 5, label: 'Exceeds Performance' },
          { value: 4, label: 'Meets Performance' },
          { value: 3, label: 'Company Standard' },
          { value: 2, label: 'Poor' },
          { value: 1, label: 'Unsatisfactory' }
        ]
      }
    });
  };

  // Function to check if a template is in use
  const isTemplateInUse = (templateId) => {
    const templateName = evaluationTemplates.find(t => t.id === templateId)?.name;
    return comments.some(comment => 
      comment.type === 'evaluation' && comment.template === templateName
    );
  };

  // Function to delete a template
  const handleDeleteTemplate = async (id) => {
    // Check if template is in use
    if (isTemplateInUse(id)) {
      const templateName = evaluationTemplates.find(t => t.id === id)?.name;
      alert(`Cannot delete template "${templateName}" because it is being used in evaluations.`);
      return;
    }
    
    // Confirm deletion
    const templateName = evaluationTemplates.find(t => t.id === id)?.name;
    if (window.confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      try {
        // Delete template from database
        await apiRequest(`${API_URL}/evaluation-templates/${id}`, {
          method: 'DELETE',
        });
        
        // Update local state
        setEvaluationTemplates(evaluationTemplates.filter(template => template.id !== id));
        alert('Template deleted successfully!');
      } catch (error) {
        console.error('Error deleting template:', error);
        alert(`Error deleting template: ${error.message}`);
        
        // Still update local state even if server delete fails
        setEvaluationTemplates(evaluationTemplates.filter(template => template.id !== id));
      }
    }
  };

  // Function to edit a template
  const handleEditTemplate = (template) => {
    console.log("Original template:", template);
    
    // Ensure ratingScale and labels are properly initialized with default values
    const defaultLabels = [
      { value: 5, label: 'Exceeds Performance' },
      { value: 4, label: 'Meets Performance' },
      { value: 3, label: 'Company Standard' },
      { value: 2, label: 'Poor' },
      { value: 1, label: 'Unsatisfactory' }
    ];
    
    // Use default labels if none exist or if the array is empty
    const ratingScale = {
      min: template.ratingScale?.min || 1,
      max: template.ratingScale?.max || 5,
      allowDecimals: template.ratingScale?.allowDecimals ?? true,
      labels: Array.isArray(template.ratingScale?.labels) && template.ratingScale.labels.length > 0 
        ? template.ratingScale.labels 
        : defaultLabels
    };
    
    const editTemplate = {
      ...template,
      ratingScale
    };
    
    console.log("Initialized template for editing:", editTemplate);
    setEditingTemplate(editTemplate);
  };

  // Function to update a template
  const handleUpdateTemplate = async () => {
    if (!editingTemplate.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    // Validate rating scale
    if (editingTemplate.ratingScale.min >= editingTemplate.ratingScale.max) {
      alert('Maximum rating must be greater than minimum rating');
      return;
    }

    // Validate categories and subcategories
    for (const category of editingTemplate.categories) {
      if (!category.name.trim()) {
        alert('Please fill in all category names');
        return;
      }

      for (const subcategory of category.subcategories) {
        if (!subcategory.name.trim()) {
          alert('Please fill in all subcategory names');
          return;
        }
        
        if (subcategory.weight <= 0) {
          alert('Weight must be greater than 0');
          return;
        }
      }
    }

    // Validate total weight is 100%
    const totalWeight = editingTemplate.categories.reduce((sum, category) => {
      return sum + category.subcategories.reduce((subSum, subcategory) => {
        return subSum + subcategory.weight;
      }, 0);
    }, 0);

    if (totalWeight !== 100) {
      alert(`Total weight must be 100%. Current total: ${totalWeight}%`);
      return;
    }

    // Default rating labels
    const defaultLabels = [
      { value: 5, label: 'Exceeds Performance' },
      { value: 4, label: 'Meets Performance' },
      { value: 3, label: 'Company Standard' },
      { value: 2, label: 'Poor' },
      { value: 1, label: 'Unsatisfactory' }
    ];

    // Ensure rating scale has labels
    const ratingScale = {
      ...editingTemplate.ratingScale,
      labels: Array.isArray(editingTemplate.ratingScale?.labels) && editingTemplate.ratingScale.labels.length > 0 
        ? editingTemplate.ratingScale.labels 
        : defaultLabels
    };

    // Prepare the template data for update
    const templateData = {
      name: editingTemplate.name,
      categories: editingTemplate.categories,
      ratingScale
    };
    
    console.log("Updating template with data:", templateData);

    try {
      // Save updated template to database
      const serverTemplate = await apiRequest(`${API_URL}/evaluation-templates/${editingTemplate.id}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
      });
      
      console.log("Server response:", serverTemplate);
      
      // Transform the response to match the expected format
      let updatedTemplate;
      
      try {
        // Parse categories if it's a string
        let categories = serverTemplate.categories;
        if (typeof categories === 'string') {
          categories = JSON.parse(categories);
        }
        
        // Parse rating scale if it's a string
        let ratingScale = serverTemplate.ratingScale || serverTemplate.rating_scale;
        if (typeof ratingScale === 'string') {
          ratingScale = JSON.parse(ratingScale);
        }
        
        // Ensure rating scale has all required properties and default labels
        ratingScale = {
          min: ratingScale?.min || 1,
          max: ratingScale?.max || 5,
          allowDecimals: ratingScale?.allowDecimals ?? true,
          labels: Array.isArray(ratingScale?.labels) && ratingScale.labels.length > 0 
            ? ratingScale.labels 
            : defaultLabels
        };
        
        updatedTemplate = {
          id: serverTemplate.id,
          name: serverTemplate.name,
          categories: categories || [],
          ratingScale
        };
      } catch (error) {
        console.error('Error parsing server response:', error);
        // If parsing fails, use the original edited template
        updatedTemplate = { ...editingTemplate };
      }
      
      console.log("Updated template:", updatedTemplate);
      
      // Update local state with the updated template
      setEvaluationTemplates(templates => 
        templates.map(t => t.id === editingTemplate.id ? updatedTemplate : t)
      );
      
      alert('Template updated successfully!');
    } catch (error) {
      console.error('Error updating template:', error);
      alert(`Error updating template: ${error.message}`);
      
      // Still update local state even if server update fails
      setEvaluationTemplates(templates => 
        templates.map(t => t.id === editingTemplate.id ? editingTemplate : t)
      );
    }
    
    setEditingTemplate(null);
  };

  // Function to toggle template expansion
  const toggleTemplateExpansion = (templateId) => {
    setExpandedTemplates(prev => ({
      ...prev,
      [templateId]: !prev[templateId]
    }));
  };

  // Function to toggle all templates
  const toggleAllTemplates = (expand) => {
    const newState = {};
    evaluationTemplates.forEach(template => {
      newState[template.id] = expand;
    });
    setExpandedTemplates(newState);
  };

  if (loading) return (
    <TeachersLayout activeView="qaTemplates">
      <LoadingSpinner>Loading...</LoadingSpinner>
    </TeachersLayout>
  );
  
  if (error) return (
    <TeachersLayout activeView="qaTemplates">
      <div>Error: {error}</div>
    </TeachersLayout>
  );

  return (
    <TeachersLayout activeView="qaTemplates">
      <PageHeader>
        <PageTitle>QA Templates</PageTitle>
      </PageHeader>
      
      {!editingTemplate ? (
        <>
          {/* Create New Template Section */}
          <div style={{ marginBottom: '30px' }}>
            <SectionHeader>
              <SectionTitle>
                Create New Template
                <Tooltip>
                  <i className="fas fa-question-circle tooltip-icon"></i>
                  <span className="tooltip-text">Create a new evaluation template with categories and subcategories. Each template can be used to evaluate teacher performance.</span>
                </Tooltip>
              </SectionTitle>
            </SectionHeader>
            <TemplateForm>
              <FormGroup>
                <FormLabel>Template Name</FormLabel>
                <FormInput 
                  type="text" 
                  value={newTemplate.name} 
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  placeholder="Enter a descriptive name for your template"
                />
                <FormHint>Choose a clear name that describes the purpose of this evaluation template</FormHint>
              </FormGroup>
              
              <FormGroup>
                <FormLabel>
                  Rating Scale Settings
                  <Tooltip>
                    <i className="fas fa-question-circle tooltip-icon"></i>
                    <span className="tooltip-text">Define the minimum and maximum rating values and whether decimal ratings are allowed. You can also add labels to describe what each rating value means.</span>
                  </Tooltip>
                </FormLabel>
                <FormCard>
                  <FormRow>
                    <FormColumn $minWidth="120px" $maxWidth="200px">
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Minimum Rating</label>
                      <NumberInput
                        type="number"
                        step="0.1"
                        value={newTemplate.ratingScale.min}
                        onChange={(e) => handleRatingScaleChange('min', parseFloat(e.target.value))}
                        width="100%"
                      />
                    </FormColumn>
                    <FormColumn $minWidth="120px" $maxWidth="200px">
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Maximum Rating</label>
                      <NumberInput
                        type="number"
                        step="0.1"
                        value={newTemplate.ratingScale.max}
                        onChange={(e) => handleRatingScaleChange('max', parseFloat(e.target.value))}
                        width="100%"
                      />
                    </FormColumn>
                    <FormColumn>
                      <CheckboxContainer>
                        <label>
                          <input
                            type="checkbox"
                            checked={newTemplate.ratingScale.allowDecimals}
                            onChange={(e) => handleRatingScaleChange('allowDecimals', e.target.checked)}
                          />
                          <span>Allow Decimal Ratings</span>
                        </label>
                      </CheckboxContainer>
                    </FormColumn>
                  </FormRow>

                  <FormDivider />
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>Rating Labels</label>
                    <FormHint style={{ marginBottom: '15px' }}>Define what each rating value means (e.g., 5 = Exceeds Performance)</FormHint>
                    
                    {newTemplate.ratingScale.labels.map((label, index) => (
                      <RatingLabelRow key={index}>
                        <FormInput
                          type="number"
                          step={newTemplate.ratingScale.allowDecimals ? "0.1" : "1"}
                          value={label.value}
                          onChange={(e) => handleRatingLabelChange(index, e.target.value, 'value')}
                          placeholder="Value"
                          style={{ width: '80px', minWidth: '80px' }}
                        />
                        <FormInput
                          type="text"
                          value={label.label}
                          onChange={(e) => handleRatingLabelChange(index, e.target.value, 'label')}
                          placeholder="Label Description"
                          style={{ flex: 1, minWidth: '150px' }}
                        />
                        <RemoveButton
                          onClick={() => removeRatingLabel(index)}
                        >
                          <i className="fas fa-times"></i>
                        </RemoveButton>
                      </RatingLabelRow>
                    ))}
                    <AddButton
                      onClick={addRatingLabel}
                    >
                      <i className="fas fa-plus"></i> Add Rating Label
                    </AddButton>
                  </div>
                </FormCard>
              </FormGroup>
              
              <FormGroup>
                <FormLabel>
                  Categories and Subcategories
                  <Tooltip>
                    <i className="fas fa-question-circle tooltip-icon"></i>
                    <span className="tooltip-text">Create categories (e.g., PLAY, LEARN) and subcategories with weights. The total weight across all subcategories must equal 100%.</span>
                  </Tooltip>
                </FormLabel>
                <FormHint style={{ marginBottom: '15px' }}>Create categories (e.g., PLAY, LEARN) and subcategories with weights. Total weight must equal 100%.</FormHint>
                
                {newTemplate.categories.map((category, categoryIndex) => (
                  <FormCard key={categoryIndex}>
                    <FormCardHeader>
                      <FormInput 
                        type="text" 
                        value={category.name} 
                        onChange={(e) => handleCategoryNameChange(categoryIndex, e.target.value)}
                        placeholder="Category Name (e.g., PLAY, LEARN)"
                        style={{ fontWeight: 'bold', flex: 1 }}
                      />
                      {newTemplate.categories.length > 1 && (
                        <RemoveButton 
                          onClick={() => handleRemoveCategory(categoryIndex)}
                        >
                          <i className="fas fa-times"></i>
                        </RemoveButton>
                      )}
                    </FormCardHeader>
                    
                    <FormCardContent>
                      <FormCardTitle style={{ marginBottom: '10px' }}>Subcategories</FormCardTitle>
                      
                      {category.subcategories.map((subcategory, subcategoryIndex) => (
                        <SubcategoryRow key={subcategoryIndex}>
                          <FormColumn $flex={3}>
                            <FormInput 
                              type="text" 
                              value={subcategory.name} 
                              onChange={(e) => handleSubcategoryNameChange(categoryIndex, subcategoryIndex, e.target.value)}
                              placeholder="Subcategory Name"
                            />
                          </FormColumn>
                          <WeightInput>
                            <span>Weight:</span>
                            <NumberInput 
                              type="number" 
                              min="1" 
                              max="100"
                              value={subcategory.weight} 
                              onChange={(e) => handleSubcategoryWeightChange(categoryIndex, subcategoryIndex, e.target.value)}
                              width="60px"
                            />
                            <span>%</span>
                          </WeightInput>
                          {category.subcategories.length > 1 && (
                            <RemoveButton 
                              onClick={() => handleRemoveSubcategory(categoryIndex, subcategoryIndex)}
                            >
                              <i className="fas fa-times"></i>
                            </RemoveButton>
                          )}
                        </SubcategoryRow>
                      ))}
                      
                      <AddButton 
                        onClick={() => handleAddSubcategory(categoryIndex)}
                      >
                        <i className="fas fa-plus"></i> Add Subcategory
                      </AddButton>
                    </FormCardContent>
                  </FormCard>
                ))}
                
                <AddButton 
                  onClick={handleAddCategory}
                  style={{ marginTop: '20px' }}
                >
                  <i className="fas fa-plus"></i> Add Category
                </AddButton>
                
                {/* Weight total indicator */}
                {(() => {
                  const totalWeight = newTemplate.categories.reduce((sum, category) => {
                    return sum + category.subcategories.reduce((subSum, subcategory) => {
                      return subSum + subcategory.weight;
                    }, 0);
                  }, 0);
                  
                  return (
                    <WeightIndicator $isValid={totalWeight === 100}>
                      <i className={totalWeight === 100 ? "fas fa-check-circle" : "fas fa-exclamation-circle"} style={{ marginRight: '5px' }}></i>
                      Total Weight: {totalWeight}% {totalWeight === 100 ? '(Valid)' : `(Must equal 100%, currently ${totalWeight}%)`}
                    </WeightIndicator>
                  );
                })()}
              </FormGroup>
              
              <CreateButton onClick={handleCreateTemplate}>
                <i className="fas fa-save"></i> Create Template
              </CreateButton>
            </TemplateForm>
          </div>
          
          {/* Display the templates */}
          {evaluationTemplates.length > 0 ? (
            <div>
              <SectionHeader>
                <SectionTitle>
                  Available Templates
                  <Tooltip>
                    <i className="fas fa-question-circle tooltip-icon"></i>
                    <span className="tooltip-text">These are your saved evaluation templates. Click on a template header to expand or collapse it. You can edit or delete templates as needed.</span>
                  </Tooltip>
                </SectionTitle>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => toggleAllTemplates(true)}
                    style={{
                      background: '#FFDDC9',
                      color: '#333333',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => toggleAllTemplates(false)}
                    style={{
                      background: '#EEEEEE',
                      color: '#333333',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Collapse All
                  </button>
                </div>
              </SectionHeader>
              <TemplateGrid>
                {evaluationTemplates.map(template => (
                  <TemplateCard key={template.id}>
                    <TemplateCardHeader onClick={() => toggleTemplateExpansion(template.id)}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <ToggleIcon $isExpanded={expandedTemplates[template.id]}>▶</ToggleIcon>
                        <TemplateCardTitle>{template.name}</TemplateCardTitle>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {isTemplateInUse(template.id) && (
                          <span style={{ 
                            fontSize: '12px', 
                            background: '#e8f5e9', 
                            color: '#388e3c', 
                            padding: '2px 6px', 
                            borderRadius: '4px'
                          }}>
                            In Use
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the header click
                            handleEditTemplate(template);
                          }}
                          style={{
                            background: '#FFDDC9',
                            color: '#333333',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <DeleteButton 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the header click
                            handleDeleteTemplate(template.id);
                          }}
                          disabled={isTemplateInUse(template.id)}
                          style={{ 
                            opacity: isTemplateInUse(template.id) ? 0.5 : 1,
                            cursor: isTemplateInUse(template.id) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Delete
                        </DeleteButton>
                      </div>
                    </TemplateCardHeader>
                    <TemplateCardContent $isExpanded={expandedTemplates[template.id]}>
                      {template.categories.map((category, categoryIndex) => (
                        <CategorySection key={categoryIndex}>
                          <CategoryTitle>{category.name}</CategoryTitle>
                          <SubcategoryList>
                            {category.subcategories.map((subcategory, subcategoryIndex) => (
                              <SubcategoryItem key={subcategoryIndex}>
                                {subcategory.name} ({subcategory.weight}%)
                              </SubcategoryItem>
                            ))}
                          </SubcategoryList>
                        </CategorySection>
                      ))}
                    </TemplateCardContent>
                  </TemplateCard>
                ))}
              </TemplateGrid>
            </div>
          ) : (
            <p>No templates available.</p>
          )}
        </>
      ) : (
        <div>
          <SectionHeader>
            <SectionTitle>
              Edit Template: {editingTemplate.name}
              <Tooltip>
                <i className="fas fa-question-circle tooltip-icon"></i>
                <span className="tooltip-text">Make changes to your template. Remember to ensure the total weight equals 100%.</span>
              </Tooltip>
            </SectionTitle>
            <button
              onClick={() => setEditingTemplate(null)}
              style={{
                background: '#666',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-times"></i> Cancel
            </button>
          </SectionHeader>
          
          <TemplateForm>
            <FormGroup>
              <FormLabel>Template Name</FormLabel>
              <FormInput 
                type="text" 
                value={editingTemplate.name} 
                onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                placeholder="Enter a descriptive name for your template"
              />
              <FormHint>Choose a clear name that describes the purpose of this evaluation template</FormHint>
            </FormGroup>
            
            <FormGroup>
              <FormLabel>
                Rating Scale Settings
                <Tooltip>
                  <i className="fas fa-question-circle tooltip-icon"></i>
                  <span className="tooltip-text">Define the minimum and maximum rating values and whether decimal ratings are allowed. You can also add labels to describe what each rating value means.</span>
                </Tooltip>
              </FormLabel>
              <FormCard>
                <FormRow>
                  <FormColumn $minWidth="120px" $maxWidth="200px">
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Minimum Rating</label>
                    <NumberInput
                      type="number"
                      step="0.1"
                      value={editingTemplate.ratingScale.min}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        ratingScale: {
                          ...editingTemplate.ratingScale,
                          min: parseFloat(e.target.value)
                        }
                      })}
                      width="100%"
                    />
                  </FormColumn>
                  <FormColumn $minWidth="120px" $maxWidth="200px">
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Maximum Rating</label>
                    <NumberInput
                      type="number"
                      step="0.1"
                      value={editingTemplate.ratingScale.max}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        ratingScale: {
                          ...editingTemplate.ratingScale,
                          max: parseFloat(e.target.value)
                        }
                      })}
                      width="100%"
                    />
                  </FormColumn>
                  <FormColumn>
                    <CheckboxContainer>
                      <label>
                        <input
                          type="checkbox"
                          checked={editingTemplate.ratingScale.allowDecimals}
                          onChange={(e) => setEditingTemplate({
                            ...editingTemplate,
                            ratingScale: {
                              ...editingTemplate.ratingScale,
                              allowDecimals: e.target.checked
                            }
                          })}
                          id="editAllowDecimals"
                        />
                        <span>Allow Decimal Ratings</span>
                      </label>
                    </CheckboxContainer>
                  </FormColumn>
                </FormRow>

                <FormDivider />

                <div>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>Rating Labels</label>
                  <FormHint style={{ marginBottom: '15px' }}>Define what each rating value means (e.g., 5 = Exceeds Performance)</FormHint>
                  
                  {editingTemplate.ratingScale.labels.map((label, index) => (
                    <RatingLabelRow key={index}>
                      <FormInput
                        type="number"
                        step={editingTemplate.ratingScale.allowDecimals ? "0.1" : "1"}
                        value={label.value}
                        onChange={(e) => {
                          const newLabels = [...editingTemplate.ratingScale.labels];
                          newLabels[index] = { ...label, value: parseFloat(e.target.value) };
                          setEditingTemplate({
                            ...editingTemplate,
                            ratingScale: {
                              ...editingTemplate.ratingScale,
                              labels: newLabels
                            }
                          });
                        }}
                        placeholder="Value"
                        style={{ width: '80px', minWidth: '80px' }}
                      />
                      <FormInput
                        type="text"
                        value={label.label}
                        onChange={(e) => {
                          console.log("Editing label:", index, e.target.value);
                          const newLabels = [...editingTemplate.ratingScale.labels];
                          newLabels[index] = { ...label, label: e.target.value };
                          setEditingTemplate({
                            ...editingTemplate,
                            ratingScale: {
                              ...editingTemplate.ratingScale,
                              labels: newLabels
                            }
                          });
                        }}
                        placeholder="Label Description"
                        style={{ flex: 1, minWidth: '150px' }}
                      />
                      <RemoveButton
                        onClick={() => {
                          const newLabels = editingTemplate.ratingScale.labels.filter((_, i) => i !== index);
                          setEditingTemplate({
                            ...editingTemplate,
                            ratingScale: {
                              ...editingTemplate.ratingScale,
                              labels: newLabels
                            }
                          });
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </RemoveButton>
                    </RatingLabelRow>
                  ))}
                  <AddButton
                    onClick={() => {
                      setEditingTemplate({
                        ...editingTemplate,
                        ratingScale: {
                          ...editingTemplate.ratingScale,
                          labels: [...editingTemplate.ratingScale.labels, { value: '', label: '' }]
                        }
                      });
                    }}
                  >
                    <i className="fas fa-plus"></i> Add Rating Label
                  </AddButton>
                </div>
              </FormCard>
            </FormGroup>
            
            <FormGroup>
              <FormLabel>
                Categories and Subcategories
                <Tooltip>
                  <i className="fas fa-question-circle tooltip-icon"></i>
                  <span className="tooltip-text">Create categories (e.g., PLAY, LEARN) and subcategories with weights. The total weight across all subcategories must equal 100%.</span>
                </Tooltip>
              </FormLabel>
              <FormHint style={{ marginBottom: '15px' }}>Create categories (e.g., PLAY, LEARN) and subcategories with weights. Total weight must equal 100%.</FormHint>
              
              {editingTemplate.categories.map((category, categoryIndex) => (
                <FormCard key={categoryIndex}>
                  <FormCardHeader>
                    <FormInput 
                      type="text" 
                      value={category.name} 
                      onChange={(e) => {
                        const newCategories = [...editingTemplate.categories];
                        newCategories[categoryIndex].name = e.target.value;
                        setEditingTemplate({
                          ...editingTemplate,
                          categories: newCategories
                        });
                      }}
                      placeholder="Category Name (e.g., PLAY, LEARN)"
                      style={{ fontWeight: 'bold', flex: 1 }}
                    />
                    {editingTemplate.categories.length > 1 && (
                      <RemoveButton 
                        onClick={() => {
                          const newCategories = editingTemplate.categories.filter((_, i) => i !== categoryIndex);
                          setEditingTemplate({
                            ...editingTemplate,
                            categories: newCategories
                          });
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </RemoveButton>
                    )}
                  </FormCardHeader>
                  
                  <FormCardContent>
                    <FormCardTitle style={{ marginBottom: '10px' }}>Subcategories</FormCardTitle>
                    
                    {category.subcategories.map((subcategory, subcategoryIndex) => (
                      <SubcategoryRow key={subcategoryIndex}>
                        <FormColumn $flex={3}>
                          <FormInput 
                            type="text" 
                            value={subcategory.name} 
                            onChange={(e) => {
                              const newCategories = [...editingTemplate.categories];
                              newCategories[categoryIndex].subcategories[subcategoryIndex].name = e.target.value;
                              setEditingTemplate({
                                ...editingTemplate,
                                categories: newCategories
                              });
                            }}
                            placeholder="Subcategory Name"
                          />
                        </FormColumn>
                        <WeightInput>
                          <span>Weight:</span>
                          <NumberInput 
                            type="number" 
                            min="1" 
                            max="100"
                            value={subcategory.weight} 
                            onChange={(e) => {
                              const newCategories = [...editingTemplate.categories];
                              newCategories[categoryIndex].subcategories[subcategoryIndex].weight = parseInt(e.target.value, 10) || 0;
                              setEditingTemplate({
                                ...editingTemplate,
                                categories: newCategories
                              });
                            }}
                            width="60px"
                          />
                          <span>%</span>
                        </WeightInput>
                        {category.subcategories.length > 1 && (
                          <RemoveButton 
                            onClick={() => {
                              const newCategories = [...editingTemplate.categories];
                              newCategories[categoryIndex].subcategories = category.subcategories.filter((_, i) => i !== subcategoryIndex);
                              setEditingTemplate({
                                ...editingTemplate,
                                categories: newCategories
                              });
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </RemoveButton>
                        )}
                      </SubcategoryRow>
                    ))}
                    
                    <AddButton 
                      onClick={() => {
                        const newCategories = [...editingTemplate.categories];
                        newCategories[categoryIndex].subcategories.push({ name: '', weight: 10 });
                        setEditingTemplate({
                          ...editingTemplate,
                          categories: newCategories
                        });
                      }}
                    >
                      <i className="fas fa-plus"></i> Add Subcategory
                    </AddButton>
                  </FormCardContent>
                </FormCard>
              ))}
              
              {/* Weight total indicator */}
              {(() => {
                const totalWeight = editingTemplate.categories.reduce((sum, category) => {
                  return sum + category.subcategories.reduce((subSum, subcategory) => {
                    return subSum + subcategory.weight;
                  }, 0);
                }, 0);
                
                return (
                  <WeightIndicator $isValid={totalWeight === 100}>
                    <i className={totalWeight === 100 ? "fas fa-check-circle" : "fas fa-exclamation-circle"} style={{ marginRight: '5px' }}></i>
                    Total Weight: {totalWeight}% {totalWeight === 100 ? '(Valid)' : `(Must equal 100%, currently ${totalWeight}%)`}
                  </WeightIndicator>
                );
              })()}
            </FormGroup>
            
            <AddButton 
              onClick={() => {
                setEditingTemplate({
                  ...editingTemplate,
                  categories: [
                    ...editingTemplate.categories,
                    { name: '', subcategories: [{ name: '', weight: 10 }] }
                  ]
                });
              }}
              style={{ marginTop: '20px' }}
            >
              <i className="fas fa-plus"></i> Add Category
            </AddButton>
            
            <CreateButton onClick={handleUpdateTemplate}>
              <i className="fas fa-save"></i> Update Template
            </CreateButton>
          </TemplateForm>
        </div>
      )}
    </TeachersLayout>
  );
};

export default QATemplates; 