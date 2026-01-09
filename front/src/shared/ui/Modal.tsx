import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className }: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className={`modal-content ${className || ''}`} 
                onClick={(e) => e.stopPropagation()}
            >
                {(title || Boolean(onClose)) && (
                    <div className="modal-header">
                        {title && <h3 className="modal-title">{title}</h3>}
                        <button className="modal-close" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};