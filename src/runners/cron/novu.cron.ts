import {CronAbstract} from "../runners.interface";
import {prisma} from "../../services/database/connection";
import {GithubService} from "../../services/github/github.service";
import {difference} from "lodash";
import moment from "moment";

export class NovuCron extends CronAbstract<string> {
    name() {
        return "Novu";
    }

    autostart(): boolean {
        return false;
    }

    schedule() {
        return '0 * * * *';
    }

    start = async (page =  1, perPage = 10) => {
        if (moment().month() === 10) {
            return ;
        }

        const all = await GithubService.loadAllMembersMergedPr('', '');
        const calculate = all.reduce((all, current) => {
            all[current] = (all[current] || 0) + 1;
            return all;
        }, {} as any);

        const winners = Object.keys(calculate).reduce((all, key) => {
            if (calculate[key] >= 3) {
                all.push(key);
            }

            return all;
        }, [] as string[]);

        const winning = await prisma.winners.findMany({
            where: {
                type: 'NOVU',
                user: {
                    handle: {
                        in: winners
                    }
                }
            },
            select: {
                user: {
                    select: {
                        handle: true
                    }
                }
            }
        });

        const alreadyInDb = winning.map(w => w.user.handle);
        const findNewToInsert = difference(winners, alreadyInDb);
        await Promise.all(findNewToInsert.map(async f => {
            const user = await prisma.user.findFirst({
                where: {
                    handle: f
                }
            });

            if (!user) {
                return ;
            }

            try {
                await prisma.winners.create({
                    data: {
                        month: moment().month(),
                        year: moment().year(),
                        userId: user.id,
                        lastDateClaim: moment().add(2, 'month').toDate(),
                        type: 'NOVU'
                    }
                });
            }
            catch (err) {
                return ;
            }
        }));
    }

    async handle() {
        await this.start();
    }
}