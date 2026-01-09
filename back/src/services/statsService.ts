import {prisma} from '../db'

export const statsService = {
  async getStats(userId: number) {
    const stats = await prisma.userStats.findUnique({
      where: { userId: BigInt(userId) }
    });
    
    if (!stats) {
      return {
        userId,
        totalGames: 0,
        wins: 0,
        totalTurnover: 0,
        bestHand: null,
        bestHandRank: 0
      };
    }

    return {
      userId: Number(stats.userId),
      totalGames: stats.totalGames,
      wins: stats.wins,
      totalTurnover: Number(stats.totalTurnover),
      bestHand: stats.bestHand
    };
  },

  async recordGame(userId: number, isWin: boolean, turnover: number) {
    const uid = BigInt(userId);
    const turnoverBig = BigInt(Math.floor(turnover)); 

    await prisma.userStats.upsert({
      where: { userId: uid },
      create: {
        userId: uid,
        totalGames: 1,
        wins: isWin ? 1 : 0,
        totalTurnover: turnoverBig
      },
      update: {
        totalGames: { increment: 1 },
        wins: { increment: isWin ? 1 : 0 },
        totalTurnover: { increment: turnoverBig }
      }
    });
  },

  async updateBestHand(userId: number, handName: string, rank: number) {
    const uid = BigInt(userId);
    
    const current = await prisma.userStats.findUnique({
      where: { userId: uid },
      select: { bestHandRank: true }
    });

    if (!current || rank > current.bestHandRank) {
      await prisma.userStats.upsert({
        where: { userId: uid },
        create: {
          userId: uid,
          bestHand: handName,
          bestHandRank: rank
        },
        update: {
          bestHand: handName,
          bestHandRank: rank
        }
      });
    }
  }
};
