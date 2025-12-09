export interface FootballApiAdapter {
  getTeamInfo(teamId: number): Promise<any> | any;
  getTeamStats(params: {
    leagueId: number;
    season: number;
    teamId: number;
  }): Promise<any> | any;
  getTeamFixtures(params: Record<string, any>): Promise<any> | any;
  getMatch(matchId: number): Promise<any> | any;
  isMockMode(): boolean;
}

export default FootballApiAdapter;
