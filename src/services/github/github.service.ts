import axios from 'axios';
import moment from 'moment';

const year = moment().format('YYYY');
interface PullsById {
    "data": {
        "nodes": Array<{
            "id": string,
            "createdAt": string,
            "title": string,
            "url": string
        }>
    }
}
interface GraphQLResponse {
    data: {
        rateLimit: {
            remaining: number
        },
        search: {
            issueCount: number,
            edges: Array<{
                node: {
                    id: string;
                    createdAt: string,
                    title: string,
                    url: string
                }
            }>
        }
    }
}

const axiosInstance = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Authorization: `Basic ${process.env.GITHUB_AUTH}`
    }
})
export class GithubService {
    static async loadPrDetails(ids: string[]): Promise<PullsById> {
        try {
            const {data}: { data: PullsById } = await axiosInstance.post('/graphql', {
                query: `
query { 
  nodes(ids: ${JSON.stringify(ids)}) {
    ... on PullRequest {
        id
        createdAt
        title
        url
    }
  }
}
            `
            });

            return data;
        }
        catch (err) {
            return {
                data: {
                    nodes: []
                }
            }
        }
    }

    static async loadUserPRs(name: string): Promise<{total: number, issues: Array<{id: string, createdAt: string, title: string, url: string}>}> {
        console.log('Calculating ' + name);
        try {
            const {data}: { data: GraphQLResponse } = await axiosInstance.post('/graphql', {
                query: `
query {
    rateLimit{
      remaining
    }
    search (first: 100 type: ISSUE query: "-label:spam,invalid is:closed author:${name} is:pr sort:created-desc merged:${year}-10-01..${year}-10-31") {
        issueCount
        edges {
            node {
                ... on PullRequest {
                    id
                    createdAt
                    title
                    url
                }
            }
        }
    }
}
            `
            });

            return {total: data.data.search.issueCount || 0, issues: data?.data?.search?.edges?.map(e => e.node) || []};
        }
        catch (err) {
            return {total: 0, issues: []};
        }
    }

    static async createTeam(name: string) {
        return (
            await axiosInstance.post(`/orgs/${process.env.GITHUB_ORGANIZATION}/teams`, {
                name,
            })
        ).data;
    }

    static async createDiscussion(githubTeamId: number) {
        return (
            await axiosInstance.post(`/orgs/${process.env.GITHUB_ORGANIZATION}/team/${githubTeamId}/discussions`, {
                title: 'Welcome to HackSquad!',
                body: 'Hi Everybody! Welcome to HackSquad, this is the initial discussion to kick start your conversation, feel free to share information with each other here or move to another communication method! Good luck!',
                private: true
            })
        ).data;
    }

    static async inviteToOrganization(githubTeamId: number, githubEmail: string) {
        return (
            await axiosInstance.post(`/orgs/${process.env.GITHUB_ORGANIZATION}/invitations`, {
                email: githubEmail,
                role: 'direct_member',
                team_ids: [githubTeamId],
            })
        ).data;
    }
}
