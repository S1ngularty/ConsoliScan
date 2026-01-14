import React from "react";
import { AlertCircle, HelpCircle } from "lucide-react";
import "../../styles/common/ConfirmModalStyle.css";

function ConfirmModalComponent({ isOpen, title, message, onConfirm, onCancel, type = "danger" }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-container" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-body">
          <div className={`confirm-icon-box ${type}`}>
            {type === "danger" ? <AlertCircle size={24} /> : <HelpCircle size={24} />}
          </div>
          
          <div className="confirm-text">
            <h3>{title || "Are you sure?"}</h3>
            <p>{message || "This action cannot be undone. Do you wish to proceed?"}</p>
          </div>
        </div>

        <div className="confirm-footer">
          <button className="confirm-btn cancel" onClick={onCancel}>
            No, Cancel
          </button>
          <button className={`confirm-btn action ${type}`} onClick={onConfirm}>
            Yes, Proceed
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModalComponent;