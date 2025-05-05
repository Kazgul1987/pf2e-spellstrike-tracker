Hooks.once("init", () => {
  console.log("PF2e Spellstrike Tracker | Modul initialisiert");
});

Hooks.once("ready", () => {
  console.log("PF2e Spellstrike Tracker | Modul bereit");
  game.pf2eSpellstrike = {
    markSpellstrikeUsed,
    rechargeSpellstrike
  };
});

// Bei Kampfbeginn automatisch Spellstrike-Effekt setzen
Hooks.on("combatStart", async (combat) => {
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor || actor.type !== "character") continue;

    const hasSpellstrike = actor.items.some(i => i.slug === "spellstrike");
    if (!hasSpellstrike) continue;

    const existing = actor.itemTypes.effect.find(e => e.slug === "spellstrike-available");
    if (existing) continue;

    await actor.setFlag("pf2e-spellstrike", "spellstrikeAvailable", true);
    const effectData = await createSpellstrikeEffect(actor);
    await actor.createEmbeddedDocuments("Item", [effectData]);

    ChatMessage.create({
      content: `${actor.name} beginnt den Kampf mit <strong>Spellstrike verfügbar</strong>.`
    });
  }
});

// Item-Verwendung abfangen: Spellstrike → verbrauchen, Recharge → wiederherstellen
Hooks.on("pf2e.useItem", async (item) => {
  const actor = item.actor;
  if (!actor || actor.type !== "character") return;

  if (item.slug === "spellstrike") {
    await markSpellstrikeUsed(actor);
  }

  if (item.slug === "spellstrike-recharge") {
    await rechargeSpellstrike(actor);
  }
});

// Effekt erzeugen
async function createSpellstrikeEffect(actor) {
  return {
    name: "Spellstrike verfügbar",
    type: "effect",
    img: "icons/magic/symbols/rune-sigil-purple.webp",
    system: {
      slug: "spellstrike-available",
      tokenIcon: { show: true },
      duration: { value: null, unit: "unlimited" },
      rules: [],
      start: { value: null },
      traits: [],
      description: { value: "<p>Dieser Effekt zeigt an, dass Spellstrike bereit ist.</p>" },
      level: { value: actor.system.details.level.value }
    },
    flags: {
      core: {},
      "pf2e": { source: "Magus", level: 1 }
    }
  };
}

// Spellstrike verbrauchen
async function markSpellstrikeUsed(actor) {
  await actor.setFlag("pf2e-spellstrike", "spellstrikeAvailable", false);

  const effect = actor.itemTypes.effect.find(e => e.slug === "spellstrike-available");
  if (effect) await effect.delete();

  ChatMessage.create({ content: `${actor.name} hat Spellstrike verwendet.` });
}

// Spellstrike wiederherstellen
async function rechargeSpellstrike(actor) {
  await actor.setFlag("pf2e-spellstrike", "spellstrikeAvailable", true);

  const existing = actor.itemTypes.effect.find(e => e.slug === "spellstrike-available");
  if (!existing) {
    const effectData = await createSpellstrikeEffect(actor);
    await actor.createEmbeddedDocuments("Item", [effectData]);
  }

  ChatMessage.create({ content: `${actor.name} hat Spellstrike wiederhergestellt.` });
}
