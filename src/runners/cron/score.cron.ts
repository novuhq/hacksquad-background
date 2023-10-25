import {CronAbstract} from "../runners.interface";
import {prisma} from "../../services/database/connection";
import {loadSheet} from "../../services/sheets/load.sheets";

export class ScoreCron extends CronAbstract<string> {
    name() {
        return "Scores";
    }

    autostart(): boolean {
        return true;
    }

    schedule() {
        return '0 */2 * * *';
    }

     start = async (page =  1, perPage = 10, sheet: string[]) => {
        const list = await prisma.team.findMany({
            skip: (page - 1) * perPage,
            take: perPage,
            select: {
                id: true
            }
        });

        await Promise.all(list.map((p) => {
            return this.pushQueue(JSON.stringify({id: p.id, sheet: sheet}));
        }));

        if (list.length === perPage) {
            await this.start(page + 1, perPage, sheet);
        }
    }

    async handle() {
        const load = await loadSheet();
        await this.start(1, 10, load);
    }
}