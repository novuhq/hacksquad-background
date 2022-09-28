import axios from 'axios';
import moment from 'moment';

const year = moment().format('YYYY');
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
    static async loadUserPRs(name: string): Promise<number> {
        const {data} : {data: GraphQLResponse} = await axios.post('https://api.github.com/graphql', {
            query: `
                query {
                  rateLimit{
                    remaining
                  }
                  search (first: 1 type: ISSUE query: "-label:spam,invalid is:closed author:${name} is:pr sort:created-desc merged:${year}-10-01..${year}-10-31") {
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