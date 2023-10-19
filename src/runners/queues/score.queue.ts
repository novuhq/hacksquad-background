import {QueueInterface} from "../runners.interface";
import {prisma} from "../../services/database/connection";
import {GithubService} from "../../services/github/github.service";
import moment from 'moment';
import createSlug from "../../services/helpers/create.slug";

export const getOnlyRepo = (url: string) => {
    const urlWithoutGithub = url.replace('https://github.com/', '').replace('https://github.com', '');
    const firstSlash = urlWithoutGithub.startsWith('/') ? urlWithoutGithub.slice(1) : urlWithoutGithub;
    const [owner, name] = firstSlash.split('/');
    return `https://github.com/${owner}/${name}`;
}

export const getOwnerAndName = (url: string) => {
    const urlWithoutGithub = url.replace('https://github.com/', '').replace('https://github.com', '');
    const firstSlash = urlWithoutGithub.startsWith('/') ? urlWithoutGithub.slice(1) : urlWithoutGithub;
    const [owner, name] = firstSlash.split('/');
    return {owner, name};
}

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
                        accounts: true,
                        votes: true,
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
        let allBonus = 0;
        const prs = [];
        const userArray = [] as Array<{id: string, bonus: number, score: number, issues: Array<{id: string, createdAt: string, title: string, url: string}>}>;
        for (const user of filterUsers) {
            const {total, issues} = await GithubService.loadUserPRs(user.handle!, user?.accounts?.[0]?.access_token || '');
            const votes = await prisma.starsGiven.findMany({
                where: {
                    userId: user.id
                }
            });

            const forks = await prisma.forkGiven.findMany({
                where: {
                    userId: user.id
                }
            });

            const filterIssuesAwait = await Promise.all(issues.map(async p => {
                return {issue: p, stars: (await GithubService.totalRepositoryStars(getOnlyRepo(p.url), user?.accounts?.[0]?.access_token || '')) > 200};
            }));
            const filterIssues = filterIssuesAwait.filter(p => p.stars).map(p => p.issue);

            const totalStars = votes.length + forks.length;
            const invitedUsers = user?._count?.invited > 0 ? user?._count?.invited > 5 ? 5 : +user?._count?.invited : 0;
            const bonus = (+invitedUsers) + (+totalStars);
            const theNewScore = ((+filterIssues.length) * 3) + bonus;
            if (!user.disqualified) {
                allBonus += bonus;
                score += theNewScore;
            }
            userArray.push({id: user.id, score: user.disqualified ? 0 : theNewScore, bonus: user.disqualified ? 0 : bonus, issues: filterIssues});
            prs.push(...filterIssues);
        }

        const prMap = prs.map(p => {
            return getOnlyRepo(p.url);
        });

        const findRepositories = Array.from(new Set(prMap));
        const getPreviousRepositories = await prisma.repositories.findMany({
            where: {
                url: {
                    in: findRepositories
                }
            }
        });

        for (const repository of findRepositories) {
            try {
                await prisma.repositories.create({
                    data: {
                        url: repository, date: new Date(), status: 'NOT_DETERMINED',
                    }
                });
            }
            catch (err) {}
        }

        // @ts-ignore
        prs.sort((a, b) => moment(b.createdAt).toDate() - moment(a.createdAt).toDate());

        const notAccepted = getPreviousRepositories.filter(p => p.status !== 'ACCEPTED' && p.status !== 'NOT_DETERMINED').map(p => getOnlyRepo(p.url));

        try {
            const totalScore = prMap.filter(p => notAccepted.includes(p)).length;

            await prisma.team.update({
                where: {
                    id: arg,
                },
                data: {
                    slug: data?.slug! || createSlug(data?.name || ''),
                    score: score - totalScore,
                    bonus: allBonus,
                    prs: JSON.stringify(prs)
                }
            });
        }
        catch (err) {
            console.log(err);
        }

        for (const user of userArray) {
            const totalScore = user.issues.map(p => {
                return getOnlyRepo(p.url);
            }).filter(p => notAccepted.includes(p)).length;
            const newScore = +(user.score - totalScore);

            const disqualified = !!user.issues.find(p => {
                return getPreviousRepositories.filter(p => p.status === 'BANNED').map(d => getOnlyRepo(d.url)).includes(getOnlyRepo(p.url));
            });

            try {
                await prisma.user.update({
                    where: {
                        id: user.id
                    },
                    data: {
                        disqualified: disqualified,
                        score: disqualified ? 0 : newScore,
                        bonus: disqualified ? 0 : user.bonus,
                    }
                });
            }
            catch (err) {
                console.log(err);
            }
        }
    }
}