import {CronAbstract, QueueInterface} from "../runners.interface";
import {prisma} from "../../services/database/connection";
import {GithubService} from "../../services/github/github.service";
import {userInfo} from "os";

export class TeamQueue implements QueueInterface<string> {
    name() {
        return "Add to a new organization team";
    }

    numWorkers() {
        return 5;
    }

    async handle(arg: string) {
        const data = await prisma.user.findUnique({
            where: {
                id: arg
            },
            select: {
                email: true,
                team: true
            }
        });

        if (!data?.team) {
            return ;
        }

        const {id} = (!data.team.githubTeamId) ? await GithubService.createTeam(data.team.name) : {id: data.team.githubTeamId};
        const {id: inviteId} = await GithubService.inviteToOrganization(id, data.email!);

        await prisma.user.update({
            where: {
                id: arg
            },
            data: {
                githubUserId: inviteId
            }
        });

        if (!data.team.githubTeamId) {
            console.log(id);
            await GithubService.createDiscussion(id);

            await prisma.team.update({
                where: {
                    id: data.team.id
                },
                data: {
                    githubTeamId: id
                }
            });
        }
    }
}