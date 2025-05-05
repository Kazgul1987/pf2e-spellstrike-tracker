Hooks.once("init", () => {
  console.log("PF2e Spellstrike Tracker | Init");
});

Hooks.once("ready", () => {
  console.log("PF2e Spellstrike Tracker | Ready");
  game.pf2eSpellstrike = {
    markSpellstrikeUsed,
    rechargeSpellstrike
  };
});
