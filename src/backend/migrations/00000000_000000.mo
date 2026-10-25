import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";

module {
  public type OldActor = {};
  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    results : Map.Map<Nat, { id : Nat; score : Nat; timestamp : Int }>;
    gameState : { var nextRunId : Nat };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      results = Map.empty();
      gameState = { var nextRunId = 0 };
    };
  };
};
