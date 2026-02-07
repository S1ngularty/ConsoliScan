import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Plus,
  Trash2,
  Layers,
  AlertCircle,
  Check,
  Hash,
  Calendar,
  Shield,
} from "lucide-react";
import "../../styles/admin/category/CategoryModalStyle.css";
import { createCategory, updateCategory } from "../../services/categoryService";

function CategoryModal({ isOpen, onClose, onSave, data }) {
  const isEditMode =
    data && typeof data === "object" && data.categoryName !== undefined;

  // BNPC Categories enum
  const bnpcCategories = [
    "RICE",
    "CORN",
    "FRESH_MEAT",
    "FRESH_POULTRY",
    "FRESH_FISH",
    "VEGETABLES",
    "FRUITS",
    "EGGS",
    "COOKING_OIL",
    "SUGAR",
    "MILK",
    "COFFEE",
    "NOODLES",
    "SOAP",
    "DETERGENT",
    "CANNED_GOODS",
    "OTHERS"
  ];

  // Discount scopes
  const discountScopeOptions = ["PWD", "SENIOR", "PROMO", "ALL"];

  const [categories, setCategories] = useState([
    { 
      categoryName: "", 
      id: Date.now(),
      isBNPC: false,
      bnpcCategory: "OTHERS",
      applicableTo: [],
    },
  ]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({});

  // Initialize based on mode
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setIsSubmitting(false);
      setErrors({});
      setTouched({});

      if (isEditMode) {
        // Single edit mode
        setCategories([
          {
            id: data._id || data.id,
            categoryName: data.categoryName || "",
            isBNPC: data.isBNPC || false,
            bnpcCategory: data.bnpcCategory || "OTHERS",
            applicableTo: data.applicableTo || [],
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          },
        ]);
      } else {
        // Bulk create mode
        setCategories([{ 
          categoryName: "", 
          id: Date.now(),
          isBNPC: false,
          bnpcCategory: "OTHERS",
          applicableTo: [],
        }]);
      }
    }
  }, [isOpen, data, isEditMode]);

  if (!isOpen) return null;

  // Validate a single category name
  const validateCategoryName = (name, index) => {
    if (!name.trim()) {
      return "Category name is required";
    }
    if (name.length < 2) {
      return "Category name must be at least 2 characters";
    }
    if (name.length > 50) {
      return "Category name must be less than 50 characters";
    }

    if (!isEditMode) {
      const isDuplicate = categories.some(
        (cat, i) =>
          i !== index &&
          cat.categoryName.toLowerCase() === name.toLowerCase().trim(),
      );
      if (isDuplicate) {
        return "Category name already exists in this list";
      }
    }

    return "";
  };

  const handleAddRow = () => {
    const newCategory = { 
      categoryName: "", 
      id: Date.now(),
      isBNPC: false,
      bnpcCategory: "OTHERS",
      applicableTo: [],
    };
    setCategories([...categories, newCategory]);

    setTimeout(() => {
      const newInput = document.querySelector(
        `input[data-index="${categories.length}"]`,
      );
      if (newInput) newInput.focus();
    }, 100);
  };

  const handleRemoveRow = (index) => {
    if (categories.length > 1) {
      const updated = categories.filter((_, i) => i !== index);
      setCategories(updated);

      if (errors[index]) {
        const newErrors = { ...errors };
        delete newErrors[index];
        setErrors(newErrors);
      }
    }
  };

  // Handle text input changes
  const handleInputChange = (index, field, value) => {
    const updated = [...categories];
    updated[index][field] = value;
    setCategories(updated);

    if (touched[`${index}-${field}`]) {
      let error = "";
      
      if (field === "categoryName") {
        error = validateCategoryName(value, index);
      }

      if (error) {
        setErrors((prev) => ({ ...prev, [`${index}-${field}`]: error }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`${index}-${field}`];
          return newErrors;
        });
      }
    }
  };

  // Handle checkbox toggle
  const handleCheckboxChange = (index, field) => {
    const updated = [...categories];
    updated[index][field] = !updated[index][field];
    
    if (field === "isBNPC" && !updated[index][field]) {
      updated[index].bnpcCategory = "OTHERS";
    }
    
    setCategories(updated);
  };

  // Handle discount scope selection
  const handleDiscountScopeChange = (index, scope) => {
    const updated = [...categories];
    const currentScopes = updated[index].applicableTo || [];
    
    if (currentScopes.includes(scope)) {
      updated[index].applicableTo = currentScopes.filter(s => s !== scope);
    } else {
      updated[index].applicableTo = [...currentScopes, scope];
    }
    
    setCategories(updated);
  };

  const handleInputBlur = (index, field) => {
    setTouched((prev) => ({ ...prev, [`${index}-${field}`]: true }));

    let error = "";
    const value = categories[index][field];
    
    if (field === "categoryName") {
      error = validateCategoryName(value, index);
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [`${index}-${field}`]: error }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${index}-${field}`];
        return newErrors;
      });
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.key === "Enter" && !e.shiftKey && !isEditMode) {
      e.preventDefault();
      if (index === categories.length - 1) {
        handleAddRow();
      } else {
        const nextInput = document.querySelector(
          `input[data-index="${index + 1}"]`,
        );
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleSave = async () => {
    const newTouched = {};
    categories.forEach((_, index) => {
      newTouched[`${index}-categoryName`] = true;
    });
    setTouched(newTouched);

    const validationErrors = {};
    categories.forEach((category, index) => {
      const nameError = validateCategoryName(category.categoryName, index);
      if (nameError) {
        validationErrors[`${index}-categoryName`] = nameError;
      }
    });

    setErrors(validationErrors);

    const hasErrors = Object.keys(validationErrors).length > 0;

    if (hasErrors) {
      const firstErrorKey = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(
        `[data-field="${firstErrorKey}"]`,
      );
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        errorElement.focus();
      }
      return;
    }

    let dataToSave;

    if (isEditMode) {
      dataToSave = {
        _id: categories[0].id,
        id: categories[0].id,
        categoryName: categories[0].categoryName.trim(),
        isBNPC: categories[0].isBNPC,
        bnpcCategory: categories[0].isBNPC ? categories[0].bnpcCategory : "OTHERS",
        applicableTo: categories[0].applicableTo || [],
      };
    } else {
      dataToSave = categories
        .filter((cat) => cat.categoryName.trim())
        .map((cat) => ({
          categoryName: cat.categoryName.trim(),
          isBNPC: cat.isBNPC,
          bnpcCategory: cat.isBNPC ? cat.bnpcCategory : "OTHERS",
          applicableTo: cat.applicableTo || [],
        }));
    }

    if (dataToSave.length === 0 || (isEditMode && !dataToSave.categoryName)) {
      setErrors({ "0-categoryName": "Please enter a category name" });
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (isEditMode) {
        response = await updateCategory(dataToSave._id, dataToSave);
      } else {
        response = await createCategory(dataToSave);
      }
      
      if (onSave) {
        await onSave(dataToSave, isEditMode ? "edit" : "create");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Failed to save category:", error);
      setErrors({
        _form:
          error.message ||
          `Failed to ${isEditMode ? "update" : "create"} category. Please try again.`,
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

  const validCount = categories.filter(
    (cat) =>
      cat.categoryName.trim() &&
      !validateCategoryName(cat.categoryName, categories.indexOf(cat))
  ).length;

  const getTitle = () => {
    return isEditMode ? "Edit Category" : "Create Categories";
  };

  const getSubtitle = () => {
    return isEditMode
      ? "Update category details"
      : "Add multiple categories at once";
  };

  const getButtonText = () => {
    if (isSubmitting) return "Saving...";
    if (success) return "Saved!";

    if (isEditMode) {
      return "Update Category";
    } else {
      return validCount === 0 ? "Save Categories" : `Save ${validCount} ${validCount === 1 ? "Category" : "Categories"}`;
    }
  };

  const renderCategoryInfo = () => {
    if (!isEditMode || !categories[0]) return null;

    const category = categories[0];

    return (
      <div className="category-info">
        {category.id && (
          <div className="category-info-row">
            <Hash size={14} />
            <span className="category-info-text">ID: {category.id}</span>
          </div>
        )}
        {category.createdAt && (
          <div className="category-info-row">
            <Calendar size={14} />
            <span>Created: {new Date(category.createdAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    );
  };

  // Render BNPC and discount fields for a category
  const renderDiscountFields = (index) => {
    const category = categories[index];

    return (
      <div className="category-discount-section">
        <div className="category-section-header">
          <Shield size={14} />
          <span>BNPC & Discount Settings</span>
        </div>

        {/* BNPC Settings */}
        <div className="category-bnpc-settings">
          <div className="category-checkbox-wrapper">
            <input
              type="checkbox"
              id={`bnpc-${index}`}
              checked={category.isBNPC || false}
              onChange={() => handleCheckboxChange(index, "isBNPC")}
              className="category-bnpc-checkbox"
            />
            <label htmlFor={`bnpc-${index}`} className="category-checkbox-label">
              BNPC Category
            </label>
          </div>

          {category.isBNPC && (
            <div className="category-bnpc-category-select">
              <label className="category-select-label">BNPC Category *</label>
              <select
                value={category.bnpcCategory || "OTHERS"}
                onChange={(e) => handleInputChange(index, "bnpcCategory", e.target.value)}
                className="category-select-input"
              >
                {bnpcCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Discount Applicable */}
        <div className="category-discount-applicable">
          <label className="category-applicable-label">Applicable Discounts:</label>
          <div className="category-scope-checkbox-grid">
            {discountScopeOptions.map((scope) => (
              <div key={scope} className="category-scope-checkbox-wrapper">
                <input
                  type="checkbox"
                  id={`${scope}-${index}`}
                  checked={category.applicableTo?.includes(scope) || false}
                  onChange={() => handleDiscountScopeChange(index, scope)}
                  className="category-scope-checkbox"
                />
                <label htmlFor={`${scope}-${index}`} className="category-scope-label">
                  {scope}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="category-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="category-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <header className="category-modal-header">
          <div className="category-header-title">
            <div className="category-icon-circle">
              <Layers size={20} />
            </div>
            <div>
              <h2>{getTitle()}</h2>
              <p className="category-subtitle">{getSubtitle()}</p>
            </div>
          </div>
          {!isEditMode && validCount > 0 && (
            <div className="category-counter-badge">{validCount} ready</div>
          )}
          <button className="category-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {/* BODY */}
        <div className="category-modal-body">
          {isEditMode ? (
            // SINGLE EDIT MODE
            <div className="category-single-mode-container">
              {renderCategoryInfo()}
              <div className="category-single-input-group" data-field="0-categoryName">
                <input
                  type="text"
                  value={categories[0]?.categoryName || ""}
                  onChange={(e) => handleInputChange(0, "categoryName", e.target.value)}
                  onBlur={() => handleInputBlur(0, "categoryName")}
                  placeholder="Enter category name..."
                  autoFocus
                  className={errors["0-categoryName"] ? "category-input-error" : ""}
                />
                {errors["0-categoryName"] && (
                  <div className="category-error-message">
                    <AlertCircle size={12} />
                    <span>{errors["0-categoryName"]}</span>
                  </div>
                )}
              </div>
              {renderDiscountFields(0)}
            </div>
          ) : (
            // BULK CREATE MODE
            <>
              <div className="category-list-container">
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    className="category-item"
                  >
                    <div className={`category-row ${errors[`${index}-categoryName`] ? "category-input-error" : ""}`}>
                      <div className="category-row-number">{index + 1}</div>
                      <div className="category-input-group">
                        <input
                          type="text"
                          value={category.categoryName}
                          onChange={(e) => handleInputChange(index, "categoryName", e.target.value)}
                          onBlur={() => handleInputBlur(index, "categoryName")}
                          onKeyPress={(e) => handleKeyPress(e, index)}
                          placeholder="Enter category name..."
                          autoFocus={
                            index === categories.length - 1 &&
                            categories.length > 1
                          }
                          data-index={index}
                          data-field={`${index}-categoryName`}
                        />
                        {errors[`${index}-categoryName`] && (
                          <div className="category-error-message">
                            <AlertCircle size={12} />
                            <span>{errors[`${index}-categoryName`]}</span>
                          </div>
                        )}
                      </div>
                      {categories.length > 1 && (
                        <button
                          className="category-remove-btn"
                          onClick={() => handleRemoveRow(index)}
                          title="Remove this category"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    {renderDiscountFields(index)}
                  </div>
                ))}
              </div>

              <div className="category-add-button-container">
                <button className="category-add-btn" onClick={handleAddRow} type="button">
                  <Plus size={14} />
                  <span>Add Another Category</span>
                </button>
              </div>
            </>
          )}

          {errors._form && (
            <div className="category-form-error">
              <AlertCircle size={14} />
              <span>{errors._form}</span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="category-modal-footer">
          <button className="category-cancel-btn" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="category-save-btn"
            onClick={handleSave}
            disabled={isSubmitting || (!isEditMode && validCount === 0)}
            type="button"
          >
            {isSubmitting ? (
              <>
                <span className="category-loading-spinner"></span>
                <span>Saving...</span>
              </>
            ) : success ? (
              <>
                <Check size={16} />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save size={16} />
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