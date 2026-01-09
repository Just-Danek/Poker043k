import './Card.css';

interface CardBackProps {
    className?: string;
}

export default function CardBack({ className }: CardBackProps) {
    return (
        <div className={`real-card card-back ${className || ''}`}>
            <div className="card-pattern" /> 
        </div>
    );
};