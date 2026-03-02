export class MatchFinishedEvent {
  constructor(
    public readonly matchId: number,
    public readonly homeScore: number,
    public readonly awayScore: number,
  ) {}
}
