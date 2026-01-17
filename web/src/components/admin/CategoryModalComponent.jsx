import React, { useState, useEffect, useCallback } from "react";
import { 
  X, 
  Save, 
  Folder, 
  Plus, 
  Trash2, 
  Layers, 
  AlertCircle,
  Check,
  Calendar,
  Hash,
  Users,
  Edit,
  ArrowLeft
} from "lucide-react";
import "../../styles/admin/CategoryModalStyle.css";

function CategoryModal({ isOpen, onClose, onSave, data, mode = "create" }) {
  // Modes: "create" (bulk create), "edit" (single edit), "bulk-edit"
  const [activeMode, setActiveMode] = useState(mode);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize based on mode and data
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSuccess(false);
      setIsSubmitting(false);
      setErrors({});
      setTouched({});

      if (mode === "edit" && data) {
        // Single edit mode - data is a single category object
        setActiveMode("edit");
        setCategories([{
          id: data._id || data.id,
          name: data.name || "",
          description: data.description || "",
          status: data.status || "active",
          parentCategory: data.parentCategory || "",
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        }]);
      } else if (mode === "bulk-edit" && Array.isArray(data)) {
        // Bulk edit mode - data is an array of categories
        setActiveMode("bulk-edit");
        setCategories(data.map(cat => ({
          id: cat._id || cat.id,
          name: cat.name || "",
          description: cat.description || "",
          status: cat.status || "active",
          parentCategory: cat.parentCategory || "",
          createdAt: cat.createdAt || new Date().toISOString(),
          updatedAt: cat.updatedAt || new Date().toISOString()
        })));
      } else {
        // Bulk create mode
        setActiveMode("create");
        setCategories([{ 
          name: "", 
          description: "",
          status: "active",
          parentCategory: "",
          id: Date.now() 
        }]);
      }

      setTimeout(() => setLoading(false), 300);
    }
  }, [isOpen, data, mode]);

  if (!isOpen) return null;

  // Validate a single category
  const validateCategory = useCallback((category, index) => {
    const errors = {};

    // Name validation
    if (!category.name.trim()) {
      errors.name = "Category name is required";
    } else if (category.name.length < 2) {
      errors.name = "Category name must be at least 2 characters";
    } else if (category.name.length > 50) {
      errors.name = "Category name must be less than 50 characters";
    } else {
      // Check for duplicates (excluding current index in bulk modes)
      if (activeMode === "create" || activeMode === "bulk-edit") {
        const isDuplicate = categories.some((cat, i) => 
          i !== index && 
          cat.name.toLowerCase() === category.name.toLowerCase().trim()
        );
        if (isDuplicate) {
          errors.name = "Category name already exists in this list";
        }
      }
    }

    // Description validation
    if (category.description && category.description.length > 500) {
      errors.description = "Description must be less than 500 characters";
    }

    return errors;
  }, [categories, activeMode]);

  // Validate all categories
  const validateAll = useCallback(() => {
    const newErrors = {};
    categories.forEach((category, index) => {
      const categoryErrors = validateCategory(category, index);
      if (Object.keys(categoryErrors).length > 0) {
        newErrors[index] = categoryErrors;
      }
    });
    return newErrors;
  }, [categories, validateCategory]);

  const handleAddRow = () => {
    const newCategory = { 
      name: "", 
      description: "",
      status: "active",
      parentCategory: "",
      id: Date.now() 
    };
    setCategories([...categories, newCategory]);
    
    setTimeout(() => {
      const newInput = document.querySelector(`input[data-index="${categories.length}"][data-field="name"]`);
      if (newInput) newInput.focus();
    }, 100);
  };

  const handleRemoveRow = (index) => {
    if (categories.length > 1 || activeMode === "create") {
      const updated = categories.filter((_, i) => i !== index);
      setCategories(updated);
      
      if (errors[index]) {
        const newErrors = { ...errors };
        delete newErrors[index];
        setErrors(newErrors);
      }
    }
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
    
    // Clear error for this field if it exists
    if (touched[index]?.[field] && errors[index]?.[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          delete newErrors[index][field];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }
  };

  const handleInputBlur = (index, field) => {
    setTouched(prev => ({
      ...prev,
      [index]: { ...prev[index], [field]: true }
    }));
    
    const categoryErrors = validateCategory(categories[index], index);
    if (categoryErrors[field]) {
      setErrors(prev => ({
        ...prev,
        [index]: { ...prev[index], [field]: categoryErrors[field] }
      }));
    } else if (errors[index]?.[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          delete newErrors[index][field];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (index === categories.length - 1 && activeMode === "create") {
        handleAddRow();
      } else {
        const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleSave = async () => {
    // Mark all fields as touched
    const newTouched = {};
    categories.forEach((_, index) => {
      newTouched[index] = { name: true, description: true };
    });
    setTouched(newTouched);
    
    // Validate
    const validationErrors = validateAll();
    setErrors(validationErrors);
    
    // Check for errors
    const hasErrors = Object.keys(validationErrors).length > 0;
    
    if (hasErrors) {
      // Scroll to first error
      const firstErrorIndex = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(`input[data-index="${firstErrorIndex}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      return;
    }
    
    // Prepare data for saving
    const dataToSave = categories.map(category => {
      const { id, ...rest } = category;
      
      if (activeMode === "edit" || activeMode === "bulk-edit") {
        // For edit modes, include the original ID
        return {
          ...rest,
          id: category.id // This should be the database ID
        };
      } else {
        // For create mode, don't include the temporary ID
        return rest;
      }
    });
    
    setIsSubmitting(true);
    
    try {
      if (onSave) {
        await onSave(dataToSave, activeMode);
      }
      
      // Show success animation
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error("Failed to save categories:", error);
      setErrors({ 
        _form: error.message || `Failed to ${activeMode} categories. Please try again.` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModeChange = (newMode) => {
    if (newMode === activeMode) return;
    
    setActiveMode(newMode);
    setErrors({});
    setTouched({});
    
    if (newMode === "create") {
      setCategories([{ 
        name: "", 
        description: "",
        status: "active",
        parentCategory: "",
        id: Date.now() 
      }]);
    }
  };

  // Calculate valid categories count
  const validCount = categories.filter(cat => {
    const errors = validateCategory(cat, categories.indexOf(cat));
    return !errors.name && !errors.description;
  }).length;

  const getTitle = () => {
    switch (activeMode) {
      case "edit":
        return "Edit Category";
      case "bulk-edit":
        return `Edit ${categories.length} Categories`;
      default:
        return "Bulk Create Categories";
    }
  };

  const getSubtitle = () => {
    switch (activeMode) {
      case "edit":
        return "Update category details";
      case "bulk-edit":
        return "Update multiple categories at once";
      default:
        return "Add multiple categories in one go";
    }
  };

  const getButtonText = () => {
    if (isSubmitting) return "Saving...";
    if (success) return "Saved!";
    
    switch (activeMode) {
      case "edit":
        return "Update Category";
      case "bulk-edit":
        return `Update ${validCount} Categories`;
      default:
        return `Save ${validCount} Categories`;
    }
  };

  // Render category details for edit modes
  const renderCategoryDetails = (category, index) => {
    if (activeMode === "create") return null;
    
    return (
      <div className="category-details">
        <div className="detail-item">
          <span className="detail-label">
            <Hash size={12} /> Category ID
          </span>
          <span className="detail-value id">{category.id}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">
            <Users size={12} /> Status
          </span>
          <span className={`status-badge ${category.status === 'active' ? 'status-active' : 'status-inactive'}`}>
            {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
          </span>
        </div>
        {category.createdAt && (
          <div className="detail-item">
            <span className="detail-label">
              <Calendar size={12} /> Created
            </span>
            <span className="detail-value">
              {new Date(category.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
        {category.updatedAt && category.updatedAt !== category.createdAt && (
          <div className="detail-item">
            <span className="detail-label">
              <Edit size={12} /> Last Updated
            </span>
            <span className="detail-value">
              {new Date(category.updatedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container-dynamic" onClick={(e) => e.stopPropagation()}>
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading...</div>
          </div>
        )}
        
        {/* HEADER */}
        <header className="modal-header">
          <div className="header-title">
            <div className="icon-circle">
              <Layers size={20} />
            </div>
            <div>
              <h2>{getTitle()}</h2>
              <p className="subtitle">{getSubtitle()}</p>
            </div>
          </div>
          {validCount > 0 && (
            <div className="counter-badge">
              {validCount} ready
            </div>
          )}
          <button className="close-x" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {/* MODE SELECTOR (only for create mode) */}
        {mode === "create" && (
          <div className="type-selector" style={{ margin: '0 24px 16px' }}>
            <button 
              className={`type-btn ${activeMode === "create" ? "active" : ""}`}
              onClick={() => handleModeChange("create")}
            >
              Bulk Create
            </button>
            <button 
              className={`type-btn ${activeMode === "single" ? "active" : ""}`}
              onClick={() => handleModeChange("single")}
            >
              Single Category
            </button>
          </div>
        )}

        {/* BODY */}
        <div className="modal-body-dynamic">
          <div className="category-rows-container">
            {categories.map((category, index) => (
              <div key={category.id} style={{ position: 'relative' }}>
                {renderCategoryDetails(category, index)}
                
                <div 
                  className={`category-input-row ${errors[index]?.name ? 'input-error' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="row-number">
                    {index + 1}
                  </div>
                  <div className="input-group">
                    <input 
                      type="text" 
                      value={category.name}
                      onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                      onBlur={() => handleInputBlur(index, "name")}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      placeholder="Enter category name..."
                      autoFocus={index === categories.length - 1 && categories.length > 1}
                      data-index={index}
                      data-field="name"
                    />
                    {errors[index]?.name && (
                      <div className="error-message">
                        <AlertCircle size={12} />
                        <span>{errors[index].name}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Description input for single category */}
                  {(activeMode === "edit" || activeMode === "single") && (
                    <div className="input-group" style={{ marginTop: '8px' }}>
                      <textarea
                        value={category.description}
                        onChange={(e) => handleFieldChange(index, "description", e.target.value)}
                        onBlur={() => handleInputBlur(index, "description")}
                        placeholder="Category description (optional)"
                        rows="2"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          resize: 'vertical'
                        }}
                      />
                      {errors[index]?.description && (
                        <div className="error-message">
                          <AlertCircle size={12} />
                          <span>{errors[index].description}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Remove button - hide for single edit mode */}
                  {(activeMode === "create" || activeMode === "bulk-edit") && categories.length > 1 && (
                    <button 
                      className="discard-row-btn" 
                      onClick={() => handleRemoveRow(index)}
                      title="Remove this category"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add button - hide for edit modes */}
          {(activeMode === "create" || activeMode === "bulk-edit") && (
            <button className="add-another-btn" onClick={handleAddRow}>
              <Plus size={16} />
              <span>Add Another Category</span>
            </button>
          )}

          {errors._form && (
            <div className="error-message" style={{ justifyContent: 'center' }}>
              <AlertCircle size={14} />
              <span>{errors._form}</span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={isSubmitting || validCount === 0}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner"></span>
                <span>Saving...</span>
              </>
            ) : success ? (
              <>
                <Check size={18} className="success-check" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>{getButtonText()}</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default CategoryModal;