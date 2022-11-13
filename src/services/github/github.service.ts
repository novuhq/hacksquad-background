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

interface GraphQLPResponse {
    data: {
        search: {
            edges: Array<{
                cursor: string,
                node: {
                    author: {
                        login: string
                    }
                }
            }>
        }
    }
}

const axiosInstance = () => axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        // @ts-ignore
        get Authorization() {
            return `Basic ${process.env.GITHUB_AUTH}`
        }
    }
})
export class GithubService {
    static async loadPrDetails(ids: string[]): Promise<PullsById> {
        try {
            const {data}: { data: PullsById } = await axiosInstance().post('/graphql', {
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
            const {data}: { data: GraphQLResponse } = await axiosInstance().post('/graphql', {
                query: `
query {
    rateLimit{
      remaining
    }
    search (first: 100 type: ISSUE query: "-label:spam,invalid is:closed author:${name?.trim()} is:pr sort:created-desc merged:${year}-10-01..${year}-10-31T23:59:00") {
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
            console.log(`There was a problem getting ${name}`);
            return {total: 0, issues: []};
        }
    }

    static async createTeam(name: string) {
        return (
            await axiosInstance().post(`/orgs/${process.env.GITHUB_ORGANIZATION}/teams`, {
                name,
            })
        ).data;
    }

    static async createDiscussion(githubTeamId: number) {
        return (
            await axiosInstance().post(`/orgs/${process.env.GITHUB_ORGANIZATION}/team/${githubTeamId}/discussions`, {
                title: 'Welcome to HackSquad!',
                body: 'Hi Everybody! Welcome to HackSquad, this is the initial discussion to kick start your conversation, feel free to share with each other information or another communication method! Good luck!',
                private: true
            })
        ).data;
    }

    static async inviteToOrganization(githubTeamId: number, githubEmail: string) {
        return (
            await axiosInstance().post(`/orgs/${process.env.GITHUB_ORGANIZATION}/invitations`, {
                email: githubEmail,
                role: 'direct_member',
                team_ids: [githubTeamId],
            })
        ).data;
    }

    static async loadAllMembersMergedPr(after=''): Promise<string[]> {
        console.log(`taking after ${after}`);
        const query = `
        query {
          search(
            first: 100
            type: ISSUE,
            ${after ? `after: "${after}"` : ''}
            query: "org:novuhq is:pr is:merged merged:${year}-10-01..${year}-10-31T23:59:00"
          ) {
            issueCount,
            edges {
                cursor
                node {
                  ... on PullRequest {
                    author {
                      login
                    }
                 }
                }
            }
          }
        }
        `;

        try {
            const {data}: { data: GraphQLPResponse } = await axiosInstance().post('/graphql', {
                query
            });

            return [
                ...data.data.search.edges.map(e => e.node.author.login),
                ...data.data.search.edges.length === 100 ? await this.loadAllMembersMergedPr(data.data.search.edges[data.data.search.edges.length - 1].cursor) : []
            ]

        }
        catch (err) {
            return []
        }
    }
}