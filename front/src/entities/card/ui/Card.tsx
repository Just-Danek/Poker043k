import './Card.css';

interface CardProps {
    value: string;
    isHero?: boolean;
    style?: React.CSSProperties;
    className?: string;
}

export default function Card({ value, isHero, style, className }: CardProps) {
    const isRed = value.includes('♥') || value.includes('♦') || value.includes('h') || value.includes('d');

    return (
        <div
            className={`${isHero ? 'hero' : 'real'}-card ${className || ''}`}
            style={{ color: isRed ? 'red' : 'black', ...style }}
        >
            {value}
        </div>
    );
};