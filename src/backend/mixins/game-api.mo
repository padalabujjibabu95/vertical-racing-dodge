import Map "mo:core/Map";
import GameLib "../lib/game";
import Types "../types/game";

mixin (
  results : Map.Map<Nat, Types.GameResult>,
  state : { var nextRunId : Nat },
) {
  /// Record one finished run for the signed-in caller and return its id.
  public shared ({ caller }) func recordRun(score : Nat) : async Nat {
    ignore caller;
    GameLib.recordRun(results, state, score);
  };

  /// Read back every recorded run, newest first.
  public query func listRuns() : async [Types.GameResult] {
    GameLib.listRuns(results);
  };
};
