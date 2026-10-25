import Common "../types/common";

module {
  /// One finished run of the racing game.
  public type GameResult = {
    id : Common.RunId;
    score : Nat;
    timestamp : Common.Timestamp;
  };
};
