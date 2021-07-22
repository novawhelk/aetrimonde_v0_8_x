/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class AetrimondeActor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags.aetrimonde || {};

    data.gpower.max = 3 + (data.race === "Human" ? 1 : 0) + (["Fighter", "Ranger", "Rogue", "Tactician"].includes(data.class) ? 1 : 0);

    //Prepare data common to all Actors
    for (let [key, ability] of Object.entries(data.abilities)) {
     // Calculate the modifier using d20 rules.
      ability.mod = Math.floor((ability.value - 10) / 2);
      this.update({[`data.abilities.${key}.mod`]: ability.mod});
    }

    data.carrycap = data.abilities.str.value * 10;
    data.heavycap = data.abilities.str.value * 20;
    data.dragcap = data.abilities.str.value * 30;

    data.helditems = this.items.filter(entry => (entry.type === "equipment")).filter(entry => (entry.data.data.slot.value === "held")).map(a => ({"_id": a.data._id, "name": a.data.name}))

    const equipment = this.items.filter(entry => entry.type === "equipment")
    let carryweight = 0;
    let gearvalue = 0;
    let encumbrance = 0;
    for (let i of equipment) {
      carryweight = carryweight + i.data.data.totalweight;
      gearvalue = gearvalue + i.data.data.totalvalue;
      encumbrance = ((i.data.data.isarmor || i.data.data.isshield) && i.data.data.equippedanywhere) ? Math.min(encumbrance, i.data.data.shield.encumbrance, i.data.data.armor.encumbrance) : encumbrance;
    }

    const cash = data.cash;
    if (!isNaN(cash) && !isNaN(parseFloat(cash))) {
      const gp = Math.floor(cash);
      const sp = Math.floor(cash * 10 % 10);
      const cp = Math.floor(cash * 100 % 10);
      data.cash = cash != 0 ? ((gp > 0 ? " " + gp + "gp " : "") + (sp > 0 ? " " + sp + "sp " : "") + (cp > 0 ? " " + cp + "cp " : "")) : "0gp";
    }

    const credit = data.credit;
    if (!isNaN(credit) && !isNaN(parseFloat(credit))) {
      const gp = Math.floor(credit);
      const sp = Math.floor(credit * 10 % 10);
      const cp = Math.floor(credit * 100 % 10);
      data.credit = cash != 0 ? ((gp > 0 ? " " + gp + "gp " : "") + (sp > 0 ? " " + sp + "sp " : "") + (cp > 0 ? " " + cp + "cp " : "")) : "0gp";
    }

    const valuables = data.valuables;
    if (!isNaN(valuables) && !isNaN(parseFloat(valuables))) {
      const gp = Math.floor(valuables);
      const sp = Math.floor(valuables * 10 % 10);
      const cp = Math.floor(valuables * 100 % 10);
      data.valuables = cash != 0 ? ((gp > 0 ? " " + gp + "gp " : "") + (sp > 0 ? " " + sp + "sp " : "") + (cp > 0 ? " " + cp + "cp " : "")) : "0gp";
    }

    data.defenses.ac.abil = data.defenses.ac.heavy ? 0 : Math.max(data.abilities.dex.mod, data.abilities.int.mod);
    data.defenses.fort.abil = Math.max(data.abilities.str.mod, data.abilities.con.mod);
    data.defenses.ref.abil = Math.max(data.abilities.dex.mod, data.abilities.int.mod);
    data.defenses.will.abil = Math.max(data.abilities.wis.mod, data.abilities.cha.mod);

    data.defenses.ref.shield = data.shield ? this.items.filter(entry => (entry._id === data.shield))[0].data.data.acbonus : 0;

    data.defenses.ac.total= 10 + data.defenses.ac.abil + data.defenses.ac.armor + data.defenses.ac.feat + data.defenses.ac.item + data.defenses.ac.misc;
    data.defenses.fort.total = 10 + data.defenses.fort.abil + data.defenses.fort.class + data.defenses.fort.feat + data.defenses.fort.item + data.defenses.fort.misc;
    data.defenses.ref.total = 10 + data.defenses.ref.abil + data.defenses.ref.class + data.defenses.ref.feat + data.defenses.ref.item + data.defenses.ref.misc + data.defenses.ref.shield;
    data.defenses.will.total = 10 + data.defenses.will.abil + data.defenses.will.class + data.defenses.will.feat + data.defenses.will.item + data.defenses.will.misc;

    data.hp.abil = data.abilities.con.value;
    data.hp.max = data.hp.class + data.abilities.con.value + data.hp.feat + data.hp.item + data.hp.misc;
    data.resurgs.max = data.resurgs.class + Math.max(data.abilities.con.mod, 0) + data.resurgs.feat + data.resurgs.item + data.resurgs.misc;
    data.hp.bloodied.value = Math.floor(data.hp.max / 2) + data.hp.bloodied.feat + data.hp.bloodied.item  + data.hp.bloodied.misc;
    data.resurgs.size.value = Math.floor(data.hp.max / 4) + data.resurgs.size.feat + data.resurgs.size.item  + data.resurgs.size.misc;

    data.initiative.total = data.abilities.dex.mod + data.initiative.feat + data.initiative.item + data.initiative.misc;
    data.speed.total = data.speed.base + data.speed.armor + data.speed.feat + data.speed.item + data.speed.misc;
    data.encumbrance.total = data.encumbrance.armor + data.encumbrance.feat + data.encumbrance.item + data.encumbrance.misc;

    // data.perceptionpassive = 10 + this.items.filter(entry => (entry.data.type === "skill" && entry.data.name === "Perception"))[0].data.data.total;
    // data.insightpassive = 10 + this.items.filter(entry => (entry.data.type === "skill" && entry.data.name === "Insight"))[0].data.data.total;
    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    const data = actorData.data;
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const data = actorData.data;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.data.type !== 'character') return;


  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.data.type !== 'npc') return;

    // Process additional NPC data here.
  }

}
