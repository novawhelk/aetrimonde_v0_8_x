// Import document classes.
import { AetrimondeActor } from "./documents/actor.mjs";
import { AetrimondeItem } from "./documents/item.mjs";
// Import sheet classes.
import { AetrimondeActorSheet } from "./sheets/actor-sheet.mjs";
import { AetrimondeItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { AETRIMONDE } from "./helpers/config.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.aetrimonde = {
    AetrimondeActor,
    AetrimondeItem,
    rollItemMacro
  };

  // Add custom constants for configuration.
  CONFIG.AETRIMONDE = AETRIMONDE;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
   CONFIG.Combat.initiative = {
     formula: "2d10 + @initiative.total",
     decimals: 2
   };
   
   CONFIG.statusEffects = [
     "systems/aetrimonde/icons/Dying.png",
     "systems/aetrimonde/icons/Incapacitated.png",
     "systems/aetrimonde/icons/Unconscious.png",
     "systems/aetrimonde/icons/Helpless.png",

     "systems/aetrimonde/icons/Held.png",
     "systems/aetrimonde/icons/Acid.png",
     "systems/aetrimonde/icons/Bleed.png",
     "systems/aetrimonde/icons/Cold.png",

     "systems/aetrimonde/icons/Entropy.png",
     "systems/aetrimonde/icons/Fire.png",
     "systems/aetrimonde/icons/Force.png",
     "systems/aetrimonde/icons/Lightning.png",

     "systems/aetrimonde/icons/Poison.png",
     "systems/aetrimonde/icons/Psychic.png",
     "systems/aetrimonde/icons/Radiant.png",
     "systems/aetrimonde/icons/Thaumic.png",

     "systems/aetrimonde/icons/Thunder.png",
     "systems/aetrimonde/icons/Heal.png",
     "systems/aetrimonde/icons/Regen.png",
     "systems/aetrimonde/icons/TempHealth.png",

     "systems/aetrimonde/icons/slowed.png",
     "systems/aetrimonde/icons/snared.png",
     "systems/aetrimonde/icons/immobilized.png",
     "systems/aetrimonde/icons/restrained.png",

     "systems/aetrimonde/icons/Rooted.png",
     "systems/aetrimonde/icons/Grabbed.png",
     "systems/aetrimonde/icons/Charmed.png",
     "systems/aetrimonde/icons/Dominated.png",

     "systems/aetrimonde/icons/Prone.png",
     "systems/aetrimonde/icons/Hover.png",
     "systems/aetrimonde/icons/Swim.png",
     "systems/aetrimonde/icons/Fly.png",

     "systems/aetrimonde/icons/Dazzled.png",
     "systems/aetrimonde/icons/Blinded.png",
     "systems/aetrimonde/icons/Deafened.png",
     "systems/aetrimonde/icons/Invisible.png",

     "systems/aetrimonde/icons/Surprised.png",
     "systems/aetrimonde/icons/Staggered.png",
     "systems/aetrimonde/icons/Dazed.png",
     "systems/aetrimonde/icons/Stunned.png",

     "systems/aetrimonde/icons/Challenged.png",
     "systems/aetrimonde/icons/Intoxicated.png",
     "systems/aetrimonde/icons/Weakened.png",
     "systems/aetrimonde/icons/Hidden.png",

     "systems/aetrimonde/icons/Insubstantial.png",
     "systems/aetrimonde/icons/Armament.png",
     "systems/aetrimonde/icons/Armor.png",
     "systems/aetrimonde/icons/Talisman.png",

     "systems/aetrimonde/icons/Ward.png",
     "systems/aetrimonde/icons/Binding.png",
     "systems/aetrimonde/icons/Seal.png",
     "systems/aetrimonde/icons/Denounced.png",

     "systems/aetrimonde/icons/Gadget.png",
     "systems/aetrimonde/icons/Pursuit.png",
     "systems/aetrimonde/icons/Hexed.png",
     "systems/aetrimonde/icons/Vengeance.png",

     "systems/aetrimonde/icons/AttackUp.png",
     "systems/aetrimonde/icons/AttackDown.png",
     "systems/aetrimonde/icons/DefUp.png",
     "systems/aetrimonde/icons/DefDown.png"
   ];

   CONFIG.conditionTypes = {
     "Dying" : "Dying",
     "Incapacitated" : "Incapacitated",
     "Unconscious" : "Unconscious",
     "Helpless" : "Helpless",
     "Held" : "Held",
     "Acid" : "Acid",
     "Bleed" : "Bleed",
     "Cold" : "Cold",
     "Entropy" : "Entropy",
     "Fire" : "Fire",
     "Force" : "Force",
     "Lightning" : "Lightning",
     "Poison" : "Poison",
     "Psychic" : "Psychic",
     "Radiant" : "Radiant",
     "Thaumic" : "Thaumic",
     "Thunder" : "Thunder",
     "Heal" : "Heal",
     "Regen" : "Regen",
     "TempHealth" : "TempHealth",
     "slowed" : "Slowed",
     "snared" : "Snared",
     "immobilized" : "Immobilized",
     "restrained" : "Restrained",
     "Rooted" : "Rooted",
     "Grabbed" : "Grabbed",
     "Charmed" : "Charmed",
     "Dominated" : "Dominated",
     "Prone" : "Prone",
     "Hover" : "Hover",
     "Swim" : "Swim",
     "Fly" : "Fly",
     "Dazzled" : "Dazzled",
     "Blinded" : "Blinded",
     "Deafened" : "Deafened",
     "Invisible" : "Invisible",
     "Surprised" : "Surprised",
     "Staggered" : "Staggered",
     "Dazed" : "Dazed",
     "Stunned" : "Stunned",
     "Challenged" : "Challenged",
     "Intoxicated" : "Intoxicated",
     "Weakened" : "Weakened",
     "Hidden" : "Hidden",
     "Insubstantial" : "Insubstantial",
     "Armament" : "Armament",
     "Armor" : "Armor",
     "Talisman" : "Talisman",
     "Ward" : "Ward",
     "Binding" : "Binding",
     "Seal" : "Seal",
     "Denounced" : "Denounced",
     "Gadget" : "Gadget",
     "Pursuit" : "Pursuit",
     "Hexed" : "Hexed",
     "Vengeance" : "Vengeance",
     "AttackUp" : "AttackUp",
     "AttackDown" : "AttackDown",
     "DefUp" : "DefUp",
     "DefDown" : "DefDown"
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = AetrimondeActor;
  CONFIG.Item.documentClass = AetrimondeItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("aetrimonde", AetrimondeActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("aetrimonde", AetrimondeItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.aetrimonde.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "aetrimonde.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}
