import axios from 'axios';

interface GraphQLResponse {
    data: {
        rateLimit: {
            remaining: number
        },
        search: {
            issueCount: number
        }
    }
}
export class GithubService {
    static async loadUserPRs(name: string, page = 1): Promise<number> {
        const {data} : {data: GraphQLResponse} = await axios.post('https://api.github.com/graphql', {
            query: `
                query {
                  rateLimit{
                    remaining
                  }
                  search (first: 100 type: ISSUE query: "label:hacktoberfest-accepted,hacktoberfest -label:spam is:closed author:${name} is:pr sort:created-desc merged:2022-10-01..2022-10-31") {
                    issueCount
                  }
                }
            `
        }, {
            headers: {
                Authorization: `Basic ${process.env.GITHUB_AUTH}`
            }
        });

        return data.data.search.issueCount;
    }
}