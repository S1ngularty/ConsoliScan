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
} from "lucide-react";
import "../../styles/admin/CategoryModalStyle.css";
import { createCategory, updateCategory } from "../../services/categoryService";

function CategoryModal({ isOpen, onClose, onSave, data }) {
  // data prop determines mode:
  // - undefined/null: Bulk create mode
  // - object with id and name: Single edit mode
  const isEditMode =
    data && typeof data === "object" && data.categoryName !== undefined;

  const [categories, setCategories] = useState([
    { categoryName: "", id: Date.now() },
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
        // Single edit mode - data is a single category object
        setCategories([
          {
            id: data._id || data.id,
            categoryName: data.categoryName || "",
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          },
        ]);
      } else {
        // Bulk create mode
        setCategories([{ categoryName: "", id: Date.now() }]);
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

    // Check for duplicates in bulk create mode only
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
    const newCategory = { categoryName: "", id: Date.now() };
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

  const handleInputChange = (index, value) => {
    const updated = [...categories];
    updated[index].categoryName = value;
    setCategories(updated);

    // Validate on change if touched
    if (touched[index]) {
      const error = validateCategoryName(value, index);
      if (error) {
        setErrors((prev) => ({ ...prev, [index]: error }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[index];
          return newErrors;
        });
      }
    }
  };

  const handleInputBlur = (index) => {
    setTouched((prev) => ({ ...prev, [index]: true }));

    const error = validateCategoryName(categories[index].categoryName, index);
    if (error) {
      setErrors((prev) => ({ ...prev, [index]: error }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
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
    // Mark all as touched
    const newTouched = {};
    categories.forEach((_, index) => {
      newTouched[index] = true;
    });
    setTouched(newTouched);

    // Validate all categories
    const validationErrors = {};
    categories.forEach((category, index) => {
      const error = validateCategoryName(category.categoryName, index);
      if (error) {
        validationErrors[index] = error;
      }
    });

    setErrors(validationErrors);

    // Check for errors
    const hasErrors = Object.keys(validationErrors).length > 0;

    if (hasErrors) {
      // Scroll to first error
      const firstErrorIndex = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(
        `input[data-index="${firstErrorIndex}"]`,
      );
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        errorElement.focus();
      }
      return;
    }

    // Prepare data for saving
    let dataToSave;

    if (isEditMode) {
      // For edit mode: send object with id and name
      dataToSave = {
        id: categories[0].id,
        categoryName: categories[0].categoryName.trim(),
      };
    } else {
      // For create mode: send array of names
      dataToSave = categories
        .filter((cat) => cat.categoryName.trim())
        .map((cat) => ({ categoryName: cat.categoryName.trim() }));
    }

    if (dataToSave.length === 0 || (isEditMode && !dataToSave.categoryName)) {
      setErrors({ 0: "Please enter a category name" });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log(dataToSave)
      const response = await (isEditMode
        ? updateCategory(dataToSave.categoryName,dataToSave.id)
        : createCategory(dataToSave));
      if (onSave) {
        await onSave(dataToSave, isEditMode ? "edit" : "create");
      }

      // Show success animation
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

  // Calculate valid categories count
  const validCount = categories.filter(
    (cat) =>
      cat.categoryName.trim() &&
      !validateCategoryName(cat.categoryName, categories.indexOf(cat)),
  ).length;

  const getTitle = () => {
    return isEditMode ? "Edit Category" : "Create Categories";
  };

  const getSubtitle = () => {
    return isEditMode
      ? "Update category name"
      : "Add multiple categories at once";
  };

  const getButtonText = () => {
    if (isSubmitting) return "Saving...";
    if (success) return "Saved!";

    if (isEditMode) {
      return "Update Category";
    } else {
      return `Save ${validCount} ${validCount === 1 ? "Category" : "Categories"}`;
    }
  };

  // Render category info for edit mode
  const renderCategoryInfo = () => {
    if (!isEditMode || !categories[0]) return null;

    const category = categories[0];

    return (
      <div
        className="category-info"
        style={{
          background: "#f8fafc",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        {category.id && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
              fontSize: "0.9rem",
              color: "#64748b",
            }}
          >
            <Hash size={14} />
            <span style={{ fontFamily: "monospace", color: "#475569" }}>
              ID: {category.id}
            </span>
          </div>
        )}
        {category.createdAt && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.9rem",
              color: "#64748b",
            }}
          >
            <Calendar size={14} />
            <span>
              Created: {new Date(category.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-container-dynamic"
        onClick={(e) => e.stopPropagation()}
      >
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
          {!isEditMode && validCount > 0 && (
            <div className="counter-badge">{validCount} ready</div>
          )}
          <button className="close-x" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {/* BODY */}
        <div className="modal-body-dynamic">
          {isEditMode ? (
            // SINGLE EDIT MODE
            <div className="single-input-container">
              {renderCategoryInfo()}
              <div className="single-input-group">
                <input
                  type="text"
                  value={categories[0]?.categoryName || ""}
                  onChange={(e) => handleInputChange(0, e.target.value)}
                  onBlur={() => handleInputBlur(0)}
                  placeholder="Enter category name..."
                  autoFocus
                />
                {errors[0] && (
                  <div className="error-message">
                    <AlertCircle size={12} />
                    <span>{errors[0]}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // BULK CREATE MODE
            <>
              <div className="category-rows-container">
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    className={`category-input-row ${errors[index] ? "input-error" : ""}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="row-number">{index + 1}</div>
                    <div className="input-group">
                      <input
                        type="text"
                        value={category.categoryName}
                        onChange={(e) =>
                          handleInputChange(index, e.target.value)
                        }
                        onBlur={() => handleInputBlur(index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        placeholder="Enter category name..."
                        autoFocus={
                          index === categories.length - 1 &&
                          categories.length > 1
                        }
                        data-index={index}
                      />
                      {errors[index] && (
                        <div className="error-message">
                          <AlertCircle size={12} />
                          <span>{errors[index]}</span>
                        </div>
                      )}
                    </div>
                    {categories.length > 1 && (
                      <button
                        className="discard-row-btn"
                        onClick={() => handleRemoveRow(index)}
                        title="Remove this category"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button className="add-another-btn" onClick={handleAddRow}>
                <Plus size={16} />
                <span>Add Another Category</span>
              </button>
            </>
          )}

          {errors._form && (
            <div className="error-message" style={{ justifyContent: "center" }}>
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
