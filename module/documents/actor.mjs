/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class AetrimondeActor extends Actor {
  async createEmbeddedDocuments(embeddedName, data, options={}) {
    let normaldocs = [];
    for (let datum of data) {
      if(datum.type === "class") {
        const compend = game.packs.get("aetrimonde_v0_8_x.defaultfeatures");
        await compend.getDocuments();
        let addons = [];

        for (let featurename of datum.data.associates) {
          const entry = await compend.getName(featurename).data;
          addons.push(entry);
        }
        this.createEmbeddedDocuments(embeddedName, addons, options);

        const updates = {
          "data.defenses.fort.class": datum.data.classfort,
          "data.defenses.ref.class": datum.data.classref,
          "data.defenses.will.class": datum.data.classwill,
          "data.hp.class": datum.data.classhp,
          "data.resurgs.class": datum.data.classresurgs,
          "data.class": datum.name
        };
        this.update(updates);
      }
      else if(datum.type === "race") {
        const compend = game.packs.get("aetrimonde_v0_8_x.defaultfeatures");
        await compend.getDocuments();
        let addons = [];

        for (let featurename of datum.data.associates) {
          const entry = await compend.getName(featurename).data;
          addons.push(entry);
        }
        this.createEmbeddedDocuments(embeddedName, addons, options);

        for (let i of this.data.items.filter(entry => entry.type === "skill" && datum.data.skillbonuses.includes(entry.name))) {
          if (i.data.data.misc === 0) {
            const update = [{"_id": i.id, "data.misc": 2}];
            await this.updateEmbeddedDocuments("Item", update);
          }
        }
        const updates = {
          "data.race": datum.name,
          "data.speed.base": datum.data.speed
        };
        this.update(updates);
      }
      else if (datum.type === "enchantment") {
        let rightitems = [];
        if (datum.data.isweapon) {
          rightitems = rightitems.concat(this.data.items.filter(entry => entry.type === "equipment" && entry.data.isweapon))
        }
        if (datum.data.isimplement) {
          rightitems = rightitems.concat(this.data.items.filter(entry => entry.type === "equipment" && entry.data.isimplement))
        }
        if (datum.data.isarmor) {
          rightitems = rightitems.concat(this.data.items.filter(entry => entry.type === "equipment" && entry.data.isarmor))
        }
        if (datum.data.isshield) {
          rightitems = rightitems.concat(this.data.items.filter(entry => entry.type === "equipment" && entry.data.isshield))
        }

        const chooserData = {
          "actor": this,
          "item": datum,
          "itemoptions": rightitems
        };
        const template = `systems/aetrimonde/templates/chat/enchant-option-card.html`;
        const dialoghtml = await renderTemplate(template, chooserData)
        let d = new Dialog({
          title: "Choose Item to Enchant",
          content: dialoghtml,
          buttons: {
            one: {
              label: "Enchant!",
              callback: html => this._enchantItem(chooserData, html.find('.chooser'))
            }
          }
        }).render(true);
      }
      else {
        normaldocs.push(datum);
      }
    }
    super.createEmbeddedDocuments(embeddedName, normaldocs, options)
  }

  async _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);

    const allSkills = ["Acrobatics", "Arcana", "Athletics", "Deception", "Endurance", "Engineering", "History", "Insight", "Intimidate", "Medicine", "Nature", "Perception", "Persuasion", "Religion", "Society", "Stealth", "Subterfuge", "Warfare"];
    const compend = game.packs.get("aetrimonde_v0_8_x.defaultskills");
    await compend.getDocuments();

    const defaultSkills = [];
    for (let skillname of allSkills) {
      const skill = await compend.getName(skillname);
      defaultSkills.push(skill.data)
    }
    this.createEmbeddedDocuments("Item", defaultSkills);
  }

  async deleteEmbeddedDocuments(embeddedName, data, options={}) {
    const newEquipment = this.data.data.equipped;
    for (let slot in newEquipment) {
      newEquipment[slot] = newEquipment[slot] === data ? "" : newEquipment[slot];
    }
    this.update({"data.equipped": newEquipment});

    super.deleteEmbeddedDocuments(embeddedName, data, options)
  }

  _enchantItem(chooserData, oldhtml) {
    debugger
    if (oldhtml[0].value === "brandnew") {
      delete chooserData.item._id;
      chooserData.item.type = "equipment";
      this.createEmbeddedDocuments("OwnedItem", chooserData.item);
    }
    else {
      const chosenItem = chooserData.itemoptions.filter(entry => entry._id === oldhtml[0].value)[0];
      const updates = {
        "_id": chosenItem._id,
        "data.eachvalue": chosenItem.data.eachvalue + chooserData.item.data.eachvalue,
        "data.magical": chooserData.item.data.magical,
        "data.relatedprops": chooserData.item.data.relatedprops,
        "data.props": chooserData.item.data.props,
        "data.critprops": chooserData.item.data.critprops,
        "data.relatedpower": chooserData.item.data.relatedpower,
        "data.power": chooserData.item.data.power
      }
      this.updateEmbeddedDocuments("Item", updates)

    }
  }

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
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags.aetrimonde || {};

    //Prepare data common to all Actors
    for (let ability in data.abilities) {
     // Calculate the modifier using d20 rules.
      data.abilities[ability].mod = Math.floor((data.abilities[ability].value - 10) / 2);
    }

    const equipment = this.items.filter(entry => entry.type === "equipment")
    let encumbrance = 0;

    for (let i of equipment) {
      const itemData = i.data.data;

      const armorencumbrance = itemData.isarmor ? itemData.armor.encumbrance : 0;
      const shieldencumbrance = itemData.isshield ? itemData.shield.encumbrance : 0;
      encumbrance = i._isEquipped() ? Math.min(encumbrance, armorencumbrance, shieldencumbrance) : encumbrance;
    }
    data.encumbrance.armor = encumbrance;
    data.encumbrance.total = encumbrance + data.encumbrance.feat + data.encumbrance.item + data.encumbrance.misc;
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

    data.carrycap = data.abilities.str.value * 10;
    data.heavycap = data.abilities.str.value * 20;
    data.dragcap = data.abilities.str.value * 30;

    data.helditems = this.items.filter(entry => (entry.type === "equipment")).filter(entry => (entry.data.data.slot.value === "held")).map(a => ({"id": a.id, "name": a.name}))

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

    const equipment = this.items.filter(entry => entry.type === "equipment")
    let carryweight = 0;
    let gearvalue = 0;

    let armorbonus = 0;
    let armorresist = 0;
    let armorheavy = false;
    let shieldbonus = 0;
    let armorspeed = 0;

    for (let i of equipment) {
      const itemData = i.data.data;
      carryweight = carryweight + itemData.totalweight;
      gearvalue = gearvalue + itemData.totalvalue;

      if (itemData.isarmor) {
        armorbonus = itemData.equippedanywhere ? armorbonus + itemData.armor.acbonus : armorbonus;
        armorresist = itemData.armor.resist > armorresist ? itemData.armor.resist : armorresist;
        armorheavy = armorheavy || (itemData.equippedanywhere ? itemData.armor.isheavy : false);
        armorspeed = itemData.equippedanywhere ? armorspeed + itemData.armor.speed : armorspeed;
      }
      if (itemData.isshield) {
        shieldbonus = itemData.equippedanywhere ? shieldbonus + itemData.shield.defbonus : shieldbonus;
        armorspeed = (itemData.equippedanywhere && !itemData.isarmor) ? armorspeed + itemData.shield.speed : armorspeed;
      }
    }
    data.carryweight = carryweight;
    data.gearvalue = {
      "gp" : Math.floor(gearvalue),
      "sp" : Math.floor(gearvalue * 10 % 10),
      "cp" : Math.floor(gearvalue * 100 % 10)
    };
    data.defenses.ac.armor = armorbonus + shieldbonus;
    data.defenses.ac.heavy = armorheavy;
    data.defenses.ref.shield = shieldbonus;
    data.speed.armor = armorspeed;
    data.armorresist = armorresist;

    data.defenses.ac.abil = data.defenses.ac.heavy ? 0 : Math.max(data.abilities.dex.mod, data.abilities.int.mod);
    data.defenses.fort.abil = Math.max(data.abilities.str.mod, data.abilities.con.mod);
    data.defenses.ref.abil = Math.max(data.abilities.dex.mod, data.abilities.int.mod);
    data.defenses.will.abil = Math.max(data.abilities.wis.mod, data.abilities.cha.mod);

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

    const defenseIncrement = Math.floor(data.tier / 2 + 0.5);
    const damageIncrement = Math.max(0, Math.floor(data.tier / 2));

    this.data.data.defenses.ac.feat = defenseIncrement;
    this.data.data.defenses.fort.feat = defenseIncrement;
    this.data.data.defenses.ref.feat = defenseIncrement;
    this.data.data.defenses.will.feat = defenseIncrement;

    this.data.data.defenses.ac.item = data.rank === "champion" ? 1 : 0;
    this.data.data.defenses.fort.item = data.rank === "champion" ? 1 : 0;
    this.data.data.defenses.ref.item = data.rank === "champion" ? 1 : 0;
    this.data.data.defenses.will.item = data.rank === "champion" ? 1 : 0;

    this.data.data.defenses.ac.total= 10 + data.defenses.ac.abil + data.defenses.ac.armor + this.data.data.defenses.ac.feat + data.defenses.ac.item + data.defenses.ac.misc;
    this.data.data.defenses.fort.total = 10 + data.defenses.fort.abil + data.defenses.fort.class + this.data.data.defenses.fort.feat + data.defenses.fort.item + data.defenses.fort.misc;
    this.data.data.defenses.ref.total = 10 + data.defenses.ref.abil + data.defenses.ref.class + this.data.data.defenses.ref.feat + data.defenses.ref.item + data.defenses.ref.misc + data.defenses.ref.shield;
    this.data.data.defenses.will.total = 10 + data.defenses.will.abil + data.defenses.will.class + this.data.data.defenses.will.feat + data.defenses.will.item + data.defenses.will.misc;

    this.data.data.hp.feat = (4 - 3 * (this.data.data.rank === "minion")) * damageIncrement;
    this.data.data.hp.abil = this.data.data.rank != "minion" ? data.abilities.con.value : data.abilities.con.mod;
    const hpbase = data.hp.class + data.abilities.con.value + data.hp.feat + data.hp.item + data.hp.misc;
    const epsub = (100 + (data.tier % 2 ? 50 : 0)) * 2 ** (((data.tier) - (data.tier) % 2) / 2);
    if (this.data.data.rank === "normal") {
      this.data.data.hp.max = hpbase;
      this.data.data.ep = epsub;
    }
    else if (this.data.data.rank === "elite") {
      this.data.data.hp.max = hpbase * 2;
      this.data.data.ep = epsub * 2;
    }
    else if (this.data.data.rank === "champion") {
      this.data.data.hp.max = hpbase * 4;
      this.data.data.ep = epsub * 5;
    }
    else {
      this.data.data.hp.class = 0;
      this.data.data.hp.max = Math.max(1, data.abilities.con.mod) + data.hp.feat + data.hp.item + data.hp.misc;
      this.data.data.ep = epsub / 5;
    }
    this.data.data.resurgs.max = 1;
    this.data.data.hp.bloodied.value = Math.floor(data.hp.max / 2) + data.hp.bloodied.feat + data.hp.bloodied.item  + data.hp.bloodied.misc;
    this.data.data.resurgs.size.value = Math.floor(data.hp.max / 4) + data.resurgs.size.feat + data.resurgs.size.item  + data.resurgs.size.misc;

    this.data.token.height = this.data.data.sizes.medium.tokensize ? this.data.data.sizes[`${this.data.data.size}`].tokensize : 1;
    this.data.token.width = this.data.data.sizes.medium.tokensize ? this.data.data.sizes[`${this.data.data.size}`].tokensize : 1;
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
