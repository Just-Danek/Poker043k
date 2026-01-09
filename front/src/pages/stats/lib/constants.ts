import type { LucideIcon } from "lucide-react";
import { Gamepad2, Trophy, Coins, Crown } from "lucide-react";

interface CardParam {
    label: string;
    key: string;
    icon: LucideIcon;
    color: string;
    highlight?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    format?: (value: any) => string | number;
}

export const CARDS_PARAMS: CardParam[] = [
    { label: 'Всего игр', key: 'totalGames', icon: Gamepad2, color: '#94a3b8' },
    { label: 'Победы', key: 'wins', icon: Trophy, color: '#fbbf24', highlight: true },
    { label: 'Оборот фишек', key: 'totalTurnover', icon: Coins, color: '#f59e0b', format: (val: number) => new Intl.NumberFormat('ru-RU').format(val) },
    { label: 'Лучшая рука', key: 'bestHand', icon: Crown, color: '#d946ef' },
]