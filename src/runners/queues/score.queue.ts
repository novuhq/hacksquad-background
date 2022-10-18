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
                users: {
                    include: {
                        social: true,
                        _count: {
                            select: {invited: true}
                        }
                    }
                }
            }
        });

        const filterUsers = data?.users || [];

        let score = 0;
        const prs = [];
        const userArray = [] as Array<{id: string, score: number, issues: Array<{id: string, createdAt: string, title: string, url: string}>}>;
        for (const user of filterUsers) {
            if (user.disqualified) {
                userArray.push({id: user.id, score: 0, issues: []});
                continue;
            }
            const {total, issues} = await GithubService.loadUserPRs(user.handle!);
            const bonus = user.social.find(p => p.type === 'TWITTER') ? 2 : 0;
            const invitedUsers = user?._count?.invited > 0 ? user?._count?.invited > 5 ? 5 : user?._count?.invited : 0;
            score += total + bonus + invitedUsers;
            userArray.push({id: user.id, score: total, issues});
            prs.push(...issues);
        }

        // @ts-ignore
        prs.sort((a, b) => moment(b.createdAt).toDate() - moment(a.createdAt).toDate());

        const findDeletedPRs = await prisma.report.findMany({
            where: {
                pr: {
                    in: prs.map(p => p.id)
                },
                status: 'DELETED'
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
        });

        for (const user of userArray) {
            const newScore = +(user.score - user.issues.map(p => p.id).filter(p => findDeletedPRs.some(g => g.pr === p)).length);
            await prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    score: newScore
                }
            })
        }
    }
}