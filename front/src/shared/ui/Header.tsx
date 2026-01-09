import IconButton from './IconButton'
import { ArrowLeft, RefreshCcw } from 'lucide-react'
import './Header.css'

interface HeaderProps {
    title: string;
    onBack: () => void;
    refresh: () => void;
    isLoading: boolean;
}

export default function Header({ title, onBack, refresh, isLoading }: HeaderProps) {
    return (
        <div className="header">
            <IconButton icon={<ArrowLeft size={24} />} onClick={onBack} />
            <h2 className="header-title">{title}</h2>
            <IconButton 
                icon={<RefreshCcw size={20} className={isLoading ? 'spin' : ''} />} 
                onClick={refresh} 
            />
        </div>
    )
}