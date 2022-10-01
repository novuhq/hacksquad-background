import {CronAbstract} from "../runners.interface";
import {prisma} from "../../services/database/connection";

export class ScoreCron extends CronAbstract<string> {
    name() {
        return "Update Score";
    }

    schedule() {
        return '0 * * * *';
    }

     start = async (page =  1, perPage = 10) => {
        const list = await prisma.team.findMany({
            skip: (page - 1) * perPage,
            take: perPage,
            select: {
                id: true
            }
        });

        await Promise.all(list.map(p => {
            return this.pushQueue(p.id);
        }));

        if (list.length === perPage) {
            await this.start(page + 1, perPage);
        }
    }

    async handle() {
        await this.start();
    }
}