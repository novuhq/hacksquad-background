import {CronAbstract, QueueInterface} from "../runners.interface";
import {prisma} from "../../services/database/connection";
import {GithubService} from "../../services/github/github.service";
import moment from 'moment';
import createSlug from "../../services/helpers/create.slug";

export class ScoreQueue implements QueueInterface<string> {
    name() {
        return "Scores";
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
                name: true,
                slug: true,
                users: true
            }
        });

        let score = 0;
        const prs = [];
        for (const user of (data?.users || [])) {
            const {total, issues} = await GithubService.loadUserPRs(user.handle!);
            score += total;
            prs.push(...issues);
        }

        // @ts-ignore
        prs.sort((a, b) => moment(b.createdAt).toDate() - moment(a.createdAt).toDate());

        const findDeletedPRs = await prisma.report.findMany({
            where: {
                pr: {
                    in: prs.map(p => p.id)
                }
            }
        });

        await prisma.team.update({
            where: {
                id: arg,
            },
            data: {
                slug: data?.slug! || createSlug(data?.name || ''),
                score: score - (findDeletedPRs?.length || 0),
                prs: JSON.stringify(prs)
            }
        })
    }
}