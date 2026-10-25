import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import Map "mo:core/Map";
import GameApi "mixins/game-api";
import ApiDocMixin "mixins/api-doc";
import Types "types/game";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  let results : Map.Map<Nat, Types.GameResult>;
  let gameState : { var nextRunId : Nat };
  include GameApi(results, gameState);

  include Expose({
    entities = [
      results.toEntity("gameResult", "GameResult", "id")
        .sample({ id = 0; score = 0; timestamp = 0 })
        .controllerOnly()
        .build(),
    ];
  });

  include ApiDocMixin();
};
