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
     "systems/aetrimonde_v0_8_x/icons/Dying.png",
     "systems/aetrimonde_v0_8_x/icons/Incapacitated.png",
     "systems/aetrimonde_v0_8_x/icons/Unconscious.png",
     "systems/aetrimonde_v0_8_x/icons/Helpless.png",

     "systems/aetrimonde_v0_8_x/icons/Held.png",
     "systems/aetrimonde_v0_8_x/icons/Acid.png",
     "systems/aetrimonde_v0_8_x/icons/Bleed.png",
     "systems/aetrimonde_v0_8_x/icons/Cold.png",

     "systems/aetrimonde_v0_8_x/icons/Entropy.png",
     "systems/aetrimonde_v0_8_x/icons/Fire.png",
     "systems/aetrimonde_v0_8_x/icons/Force.png",
     "systems/aetrimonde_v0_8_x/icons/Lightning.png",

     "systems/aetrimonde_v0_8_x/icons/Poison.png",
     "systems/aetrimonde_v0_8_x/icons/Psychic.png",
     "systems/aetrimonde_v0_8_x/icons/Radiant.png",
     "systems/aetrimonde_v0_8_x/icons/Thaumic.png",

     "systems/aetrimonde_v0_8_x/icons/Thunder.png",
     "systems/aetrimonde_v0_8_x/icons/Heal.png",
     "systems/aetrimonde_v0_8_x/icons/Regen.png",
     "systems/aetrimonde_v0_8_x/icons/TempHealth.png",

     "systems/aetrimonde_v0_8_x/icons/slowed.png",
     "systems/aetrimonde_v0_8_x/icons/snared.png",
     "systems/aetrimonde_v0_8_x/icons/immobilized.png",
     "systems/aetrimonde_v0_8_x/icons/restrained.png",

     "systems/aetrimonde_v0_8_x/icons/Rooted.png",
     "systems/aetrimonde_v0_8_x/icons/Grabbed.png",
     "systems/aetrimonde_v0_8_x/icons/Charmed.png",
     "systems/aetrimonde_v0_8_x/icons/Dominated.png",

     "systems/aetrimonde_v0_8_x/icons/Prone.png",
     "systems/aetrimonde_v0_8_x/icons/Hover.png",
     "systems/aetrimonde_v0_8_x/icons/Swim.png",
     "systems/aetrimonde_v0_8_x/icons/Fly.png",

     "systems/aetrimonde_v0_8_x/icons/Dazzled.png",
     "systems/aetrimonde_v0_8_x/icons/Blinded.png",
     "systems/aetrimonde_v0_8_x/icons/Deafened.png",
     "systems/aetrimonde_v0_8_x/icons/Invisible.png",

     "systems/aetrimonde_v0_8_x/icons/Surprised.png",
     "systems/aetrimonde_v0_8_x/icons/Staggered.png",
     "systems/aetrimonde_v0_8_x/icons/Dazed.png",
     "systems/aetrimonde_v0_8_x/icons/Stunned.png",

     "systems/aetrimonde_v0_8_x/icons/Challenged.png",
     "systems/aetrimonde_v0_8_x/icons/Intoxicated.png",
     "systems/aetrimonde_v0_8_x/icons/Weakened.png",
     "systems/aetrimonde_v0_8_x/icons/Hidden.png",

     "systems/aetrimonde_v0_8_x/icons/Insubstantial.png",
     "systems/aetrimonde_v0_8_x/icons/Armament.png",
     "systems/aetrimonde_v0_8_x/icons/Armor.png",
     "systems/aetrimonde_v0_8_x/icons/Talisman.png",

     "systems/aetrimonde_v0_8_x/icons/Ward.png",
     "systems/aetrimonde_v0_8_x/icons/Binding.png",
     "systems/aetrimonde_v0_8_x/icons/Seal.png",
     "systems/aetrimonde_v0_8_x/icons/Denounced.png",

     "systems/aetrimonde_v0_8_x/icons/Gadget.png",
     "systems/aetrimonde_v0_8_x/icons/Pursuit.png",
     "systems/aetrimonde_v0_8_x/icons/Hexed.png",
     "systems/aetrimonde_v0_8_x/icons/Vengeance.png",

     "systems/aetrimonde_v0_8_x/icons/AttackUp.png",
     "systems/aetrimonde_v0_8_x/icons/AttackDown.png",
     "systems/aetrimonde_v0_8_x/icons/DefUp.png",
     "systems/aetrimonde_v0_8_x/icons/DefDown.png"
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


Hooks.on("renderChatLog", (app, html, data) => AetrimondeItem.chatListeners(html));

// Hooks.on('diceSoNiceRollStart', (messageId, context) => {
//     //Hide this roll
//     context.blind=true;
// });

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
