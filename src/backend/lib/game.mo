import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/game";

module {
  /// Record one finished run and return its assigned id.
  public func recordRun(
    results : Map.Map<Nat, Types.GameResult>,
    state : { var nextRunId : Nat },
    score : Nat,
  ) : Nat {
    let id = state.nextRunId;
    state.nextRunId := id + 1;
    results.add(id, { id; score; timestamp = Time.now() });
    id;
  };

  /// Return every recorded run, newest first.
  public func listRuns(results : Map.Map<Nat, Types.GameResult>) : [Types.GameResult] {
    let all = results.values().toArray();
    all.sort(func(a, b) = if (a.id > b.id) { #less } else if (a.id < b.id) { #greater } else { #equal });
  };
};
