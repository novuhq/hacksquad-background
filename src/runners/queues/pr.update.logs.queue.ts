import {CronAbstract, QueueInterface} from "../runners.interface";
import {prisma} from "../../services/database/connection";
import {GithubService} from "../../services/github/github.service";
import {userInfo} from "os";

export class PrUpdateLogsQueue implements QueueInterface<string[]> {
    name() {
        return "Update Prs detail";
    }

    numWorkers() {
        return 1;
    }

    async handle(arg: string[]) {
        const prs = (await GithubService.loadPrDetails(arg, '')).data.nodes;
        for (const pr of prs) {
            await prisma.actionLogs.updateMany({
                where: {
                    pr: pr.id
                },
                data: {
                    prDetails: JSON.stringify(pr)
                }
            });
        }
        console.log(`processed ${JSON.stringify(arg)}`);
    }
}