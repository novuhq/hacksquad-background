import {CronAbstract, QueueInterface} from "../runners.interface";
import {prisma} from "../../services/database/connection";
import {GithubService} from "../../services/github/github.service";

export class ScoreQueue implements QueueInterface<string> {
    name() {
        return "Update Score";
    }

    numWorkers() {
        return 5;
    }

    async handle(arg: string) {
        const data = await prisma.team.findUnique({
            where: {
                id: arg
            },
            select: {
                users: true
            }
        });

        let score = 0;
        for (const user of (data?.users || [])) {
            score += await GithubService.loadUserPRs(user.handle!);
        }

        await prisma.team.update({
            where: {
                id: arg
            },
            data: {
                score
            }
        })
    }
}