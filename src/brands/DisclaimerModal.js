import React from "react";
import "./DisclaimerModal.css";

export default function DisclaimerModal({ show, onClose }) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Disclaimer</h2>
        <p>
          This assistant is for educational purposes only and does not provide
          medical advice, diagnosis, or treatment. Always consult a healthcare
          professional for personal health decisions.
        </p>

        <button className="modal-btn" onClick={onClose}>
          I Understand
        </button>
      </div>
    </div>
  );
}
