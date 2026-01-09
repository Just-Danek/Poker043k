import { GameControls } from "../../../features/game-controls/ui/GameControls";
import { useGameStore } from "../../../entities/game/model/store";
import './SideBar.css';

export default function SideBar() {
    const players = useGameStore((state) => state.players);
    const hero = players.find(p => p.isYou);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="poker-stat-box">
                    <span className="label">ВАШИ БАЛЛЫ</span>
                    <span className="value">{hero ? hero.chips : 0}</span>
                </div>
                <div className="poker-stat-box">
                    <span className="label">СТАВКА</span>
                    <span className="value">{hero ? hero.currentBet : 0}</span>
                </div>
            </div>
            <GameControls />
        </div>
    );
}