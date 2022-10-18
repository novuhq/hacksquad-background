import {CronAbstract} from "../runners.interface";
import {prisma} from "../../services/database/connection";

export class UpdateWinnersCron extends CronAbstract<string> {
    name() {
        return "Update Winners";
    }

    schedule() {
        return '0 0 9 * *';
    }

    autostart(): boolean {
        return true;
    }

    async handle() {
        const allTeams = await prisma.team.findMany({
            where: {
                disqualified: false
            },
            orderBy: {
                score: 'desc'
            }
        });


        const findTeamScore = allTeams.slice(0, 60).pop()?.score;
        const winning = allTeams.filter(f => f.score! >= findTeamScore!);
        await Promise.all(winning.map(win => this.pushQueue(win.id)));
    }
}
