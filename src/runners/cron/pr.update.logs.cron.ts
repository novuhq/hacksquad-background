import {CronAbstract} from "../runners.interface";
import {prisma} from "../../services/database/connection";
import {chunk} from "lodash";

export class PrUpdateLogsCron extends CronAbstract<string[]> {
    name() {
        return "Update Prs detail";
    }

    autostart(): boolean {
        return true;
    }

    schedule() {
        return '0 * * * *';
    }

    async handle() {
        const list = await prisma.actionLogs.findMany({
            where: {
                prDetails: null,
                pr: {
                    not: null
                }
            },
            select: {
                pr: true,
            },
        });

        console.log(`Found ${list.length} results`);

        return Promise.all(chunk(list.map(p => p.pr!), 50).map(p => this.pushQueue(p)));
    }
}