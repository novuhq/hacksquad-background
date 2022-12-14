import {CronAbstract} from "../runners.interface";
import {prisma} from "../../services/database/connection";
import {timer} from "../../services/helpers/timer";

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
                disqualified: false,
                score: {
                    gt: 0
                }
            },
            orderBy: {
                score: 'desc'
            }
        });


        const findTeamScore = allTeams.slice(0, 60).pop()?.score;
        const winning = allTeams.filter(f => f.score! >= findTeamScore!);
        for (const win of winning) {
            await timer(500);
            await this.pushQueue(win.id);
        }
    }
}
