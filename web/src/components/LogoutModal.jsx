import '../assets/css/components.css'

function LogoutModal({ isOpen, onConfirm, onCancel, onClose }) {
  if (!isOpen) return null

  const handleCancel = onCancel || onClose;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Confirm Logout</h3>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to logout?</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default LogoutModal