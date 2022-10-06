import {CronAbstract} from "../runners.interface";
import {prisma} from "../../services/database/connection";

export class TeamCron extends CronAbstract<string> {
    name() {
        return "Add to a new organization team";
    }

    autostart(): boolean {
        return false;
    }

    schedule() {
        return '*/3 * * * *';
    }

    async handle() {
        const list = await prisma.user.findMany({
            where: {
                githubUserId: null,
                team: {
                    isNot: null
                }
            },
            take: 4
        });

        if (!list.length) {
            return ;
        }

        await Promise.all(list.map(p => {
            return this.pushQueue(p.id);
        }));
    }
}