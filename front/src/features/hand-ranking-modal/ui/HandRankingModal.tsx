import { Modal } from '../../../shared/ui/Modal';
import { HAND_RANKINGS } from '../model/constants';
import './HandRankingModal.css';

interface HandRankingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HandRankingModal({ isOpen, onClose }: HandRankingModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Комбинации">
            <div className="combo-list">
                {HAND_RANKINGS.map((hand, idx) => (
                    <div key={idx} className="combo-row">
                        <span className="combo-name">{hand.name}</span>
                        <span className="combo-desc">{hand.desc}</span>
                    </div>
                ))}
            </div>
        </Modal>
    );
};