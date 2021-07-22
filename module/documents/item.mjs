/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class AetrimondeItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();

    // Get the Item's data
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : this.data;
    const data = itemData.data;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (itemData.type === 'skill') this._prepareSkillData(itemData);
    if (itemData.type === 'perk') this._preparePerkData(itemData);
    if (itemData.type === 'power') this._preparePowerData(itemData);
    if (itemData.type === 'equipment') this._prepareEquipmentData(itemData);
    if (itemData.type === 'ritual') this._prepareRitualData(itemData);
  }

  _prepareSkillData(itemData) {
    const data = itemData.data;

    if (this.actor) {
      const actorData = this.actor.data.data;
      const mod = (data.abil === "") ? 0 : actorData.abilities[`${data.abil}`].mod;
      // const training = data.trained ? (actorData.isnpc ? 5 + Math.floor(actorData.tier / 2 + 0.5) * 2 : 5) : 0;
      const training = data.trained ? 5 : 0;
      const encumbrance = data.encumbered ? actorData.encumbrance.total : 0;

      data.mod = mod;
      data.total = mod + training + encumbrance + data.feat + data.itemb + data.misc;
    }
    else {
      data.mod = 0;
      data.total = 0;
    };
  }

  _preparePerkData(itemData) {
    const data = itemData.data;

    if (this.actor) {
      const actorData = this.actor.data.data;
      const mod = (data.abil === "") ? 0 : actorData.abilities[`${data.abil}`].mod;
      const encumbrance = data.encumbered ? actorData.encumbrance.total : 0;

      data.mod = mod;
      data.total = mod + 5 + encumbrance + data.feat + data.itemb + data.misc;
    }
    else {
      data.mod = 0;
      data.total = 0;
    };
  }

  _prepareRitualData(itemData) {
    const data = itemData.data;

    data.skilllabel = data.keyskill ? data.skills[`${data.keyskill}`].label : "";
  }

  _prepareEquipmentData(itemData) {
    const data = itemData.data;
    const actorData = this.actor ? this.actor.data.data : "";

    data.totalweight = data.eachweight * data.quantity;
    data.totalvalue = data.eachvalue * data.quantity;
    data.totalgp = Math.floor(data.totalvalue);
    data.totalsp = Math.floor(data.totalvalue * 10 % 10);
    data.totalcp = Math.floor(data.totalvalue * 100 % 10);

    data.multitype = (data.isarmor + data.isshield + data.isweapon + data.isimplement + data.isconsumable) > 1;
    data.multiple = data.quantity > 1;
    data.slotlabel = data.slot.slots[`${data.slot.value}`];
    data.isheld = data.slot.value === "held";
    if (actorData) {
      const unslotted = data.slot.value === "noslot";
      const equippedring = data.slot.value === "ring" && (actorData.equipped.ring1 === this._id || actorData.equipped.ring2 === this._id);
      const equippedworn = !(["ring", "noslot", "held"].includes(data.slot.value)) && actorData.equipped[`${data.slot.value}`] === this._id;
      data.equippedmh = (this._id === actorData.equipped.mainhand);
      data.equippedoh = (this._id === actorData.equipped.offhand);
      data.equippedanywhere = unslotted || equippedring || equippedworn || data.equippedmh || data.equippedoh;
      if (data.isweapon && data.slot.value === "held" && data.weapon.hands.value === "2h" && data.equippedanywhere && (!data.equippedmh || !data.equippedoh)) {
        data.warning = true;
        data.warningmessage = "This weapon requires two hands to wield properly."
      }
      data.npcowner = this.actor.data.type === "npc";
    }

    if (data.isarmor) {
      data.armor.grouplabel = (data.armor.group.value != "") ? data.armor.group.groups[`${data.armor.group.value}`] : "";
    }
    if (data.isshield) {
      data.shield.grouplabel = (data.shield.group.value != "") ? data.shield.group.groups[`${data.shield.group.value}`] : "";
    }
    if (data.isweapon) {
      data.weapon.attack.vslabel = (data.weapon.attack.vsdefense != "") ? data.defenses[`${data.weapon.attack.vsdefense}`].slabel : "";
      if (this.actor) {
        if (this.actor.data.data.isnpc) {
          data.weapon.attack.feat = Math.floor(actorData.tier / 2 + 0.5);
          data.weapon.attack.itemb = actorData.rank === "champion" ? 1 : 0;
          data.weapon.damage.feat = Math.floor(actorData.tier / 2) * 2;
        }
        data.weapon.attack.mod = (data.weapon.attack.abil === "") ? 0 : actorData.abilities[`${data.weapon.attack.abil}`].mod;
        data.weapon.attack.bonus = data.weapon.attack.mod + data.weapon.prof + data.weapon.attack.feat + data.weapon.attack.itemb + data.weapon.attack.misc;
        data.weapon.damage.mod = (data.weapon.damage.abil === "") ? 0 : actorData.abilities[`${data.weapon.damage.abil}`].mod;
        const dbonus = (data.weapon.damage.mod + data.weapon.damage.feat + data.weapon.damage.itemb + data.weapon.damage.misc)
        data.weapon.damage.total = data.weapon.dice + " + " + dbonus;
      }
      data.weapon.unarmed = data.weapon.groups ? data.weapon.groups.includes("Unarmed") : false;
      data.weapon.weaponthreat = data.weapon.quals ? data.weapon.quals.includes("Critical Threat") : false;
      data.weapon.attack.hasthreat = data.weapon.weaponthreat ? true : data.weapon.attack.hasthreat;
    }
    if (data.isimplement) {

    }
    if (data.isconsumable) {

    }
    if (data.relatedpower) {
      data.power.attack.vslabel = (data.power.attack.vsdefense != "") ? data.defenses[`${data.power.attack.vsdefense}`].slabel : "";
    }
  }

  _preparePowerData(itemData) {
    const data = itemData.data;
    const actor = this.actor;

    if (this.actor) {
      data.autoprof = false;
      const actorData = actor.data.data;
      const defaultweapon = {
        "weapon": {
          "prof": 0,
          "attack": {
            "feat": 0,
            "itemb": 0,
            "misc": 0
          },
          "weaponthreat": false,
          "mvsr": "",
          "quals": ""
        },
        "shield": {
          "attack": {
            "feat": 0,
            "itemb": 0,
            "misc": 0
          }
        },
        "equippedanywhere": true
      };

      const mainhanditem = actor.data.data.equipped.mainhand ? actor.data.items.find(entry => (entry._id === actor.data.data.equipped.mainhand)).data : "";
      const offhanditem = actor.data.data.equipped.offhand ? actor.data.items.find(entry => (entry._id === actor.data.data.equipped.offhand)).data : "";

      const mod = (data.attack.abil === "") ? 0 : actorData.abilities[`${data.attack.abil}`].mod;
      data.attack.mod = mod;
      data.attack.powermisc = data.attack.powermisc ? data.attack.powermisc : 0;
      const attbonus = this._powerAttackBonus(this.data);

      data.relevantitemtype = "Item";
      data.relevantoffitemtype = "Off-Weapon";

      data.useditems = [];

      if ( data.keywords.includes("Weapon") && ["normal", "lesser", "greater", "feature"].includes( data.powertype)) {
        data.requiresitem = true;
        data.relevantitemtype = data.attack.off ? "Main-Weapon" : "Weapon";
        data.relevantitems = actor.data.items.filter(entry => (entry.type === "equipment" && entry.data.isweapon));
        const defaultmainweapon = mainhanditem.isweapon ? mainhanditem : (offhanditem.isweapon ? offhanditem : defaultweapon);
        const defaultoffweapon = mainhanditem.isweapon ? (offhanditem.isweapon ? offhanditem : defaultweapon) : defaultweapon;
        const mainweapon = data.mainitem ? actor.data.items.filter(entry => entry._id === data.mainitem)[0].data : defaultmainweapon;
        const offweapon = data.offitem ? actor.data.items.filter(entry => entry._id === data.offitem)[0].data : defaultoffweapon;
        data.useditems = data.useditems.concat(mainweapon);
        if (mainweapon != offweapon)
        data.useditems = data.useditems.concat(offweapon);
        const missingmelee = (data.range.includes("Melee") && ((mainweapon.weapon.mvsr.value != "melee" && offweapon.weapon.mvsr.value != "melee") || (data.attack.off && (mainweapon.weapon.mvsr.value != "melee" || offweapon.weapon.mvsr.value != "melee" || actorData.equipped.mainhand === actorData.equipped.offhand))));
        const missingranged = (data.range.includes("Ranged") && ((mainweapon.weapon.mvsr.value != "ranged" && offweapon.weapon.mvsr.value != "ranged" && !mainweapon.weapon.quals.includes("Thrown") && !offweapon.weapon.quals.includes("Thrown")) || (data.attack.off && ((mainweapon.weapon.mvsr.value != "ranged" && !mainweapon.weapon.quals.includes("Thrown")) || (offweapon.weapon.mvsr.value != "ranged" && !offweapon.weapon.quals.includes("Thrown")) || actorData.equipped.mainhand === actorData.equipped.offhand))));
        data.warning = missingmelee || missingranged || (data.mainitem && (!mainweapon.equippedmh && (mainweapon.slot != "held" && !mainweapon.equippedanywhere))) || (data.attack.off && data.offitem && (!offweapon.equippedoh && (offweapon.slot != "held" && !offweapon.equippedanywhere)));
        data.warningmessage = "You might not have the right item(s) equipped.";
        data.attack.prof = mainweapon.weapon.prof;
        data.attack.feat = Math.max(attbonus.feat, mainweapon.weapon.attack.feat);
        data.attack.itemb = Math.max(attbonus.itemb, mainweapon.weapon.attack.itemb);
        data.attack.misc = attbonus.misc + mainweapon.weapon.attack.misc;
        data.attack.bonus = mod + data.attack.prof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;
        data.attack.hasthreat = mainweapon.weapon.weaponthreat ? true : data.attack.hasthreat;
        data.attack.offprof = offweapon.weapon.prof;
        data.attack.offfeat = Math.max(attbonus.feat, offweapon.weapon.attack.feat);
        data.attack.offitemb = Math.max(attbonus.itemb, offweapon.weapon.attack.itemb);
        data.attack.offmisc = attbonus.misc + offweapon.weapon.attack.misc;
        data.attack.offbonus = mod + data.attack.offprof + data.attack.offfeat + data.attack.offitemb + data.attack.offmisc + data.attack.powermisc;
        data.attack.hasoffthreat = offweapon.weapon.weaponthreat ? true : data.attack.hasoffthreat;
        data.damagebonus = this._powerDamageBonus(this.data)
        data.autoprof = true;
        data.autoweapon = true;
      }
      else if (  data.keywords.includes("Unarmed") && ["normal", "lesser", "greater", "feature"].includes(data.powertype)) {
        data.requiresitem = true;
        data.relevantitemtype = "Unarmed Attack";
        data.relevantitems = actor.data.items.filter(entry => (entry.type === "equipment" && entry.data.isweapon && entry.data.weapon.unarmed && entry.data.equippedanywhere));
        const unarmedattack = data.mainitem ? actor.data.items.filter(entry => entry._id === data.mainitem)[0].data.weapon : defaultweapon.weapon;
        data.useditems = data.useditems.concat(unarmedattack);
        data.warning = data.relevantitems && !data.mainitem;
        data.warningmessage = "You have alternate unarmed attacks; you might need to select one."
        data.attack.prof = unarmedattack.prof;
        data.attack.feat = Math.max(attbonus.feat, unarmedattack.attack.feat);
        data.attack.itemb = Math.max(attbonus.itemb, unarmedattack.attack.itemb);
        data.attack.misc = attbonus.misc + unarmedattack.attack.misc;
        data.attack.bonus = mod + data.attack.prof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;
        data.attack.hasthreat = unarmedattack.weaponthreat ? true : data.attack.hasthreat;
        data.damagebonus = this._powerDamageBonus(this.data)
        data.autoprof = true;
        data.unarmed = true;
        data.autoweapon = true;
      }
      else if (data.keywords.includes("Shield") && ["normal", "lesser", "greater", "feature"].includes(data.powertype)) {
        data.requiresitem = true;
        data.relevantitemtype = "Shield";
        data.relevantitems = actor.data.items.filter(entry => (entry.type === "equipment" && entry.data.isshield));
        const defaultshield = offhanditem.isshield ? offhanditem : (mainhanditem.isshield ? mainhanditem : defaultweapon);
        const shield = data.mainitem ? actor.data.items.filter(entry => entry._id === data.mainitem)[0].data : defaultshield;
        data.useditems = data.useditems.concat(shield);
        data.warning = !data.mainitem && !shield.shield.dice || !shield.equippedanywhere;
        data.warningmessage = "You might not have the right item(s) equipped.";
        data.attack.feat = Math.max(attbonus.feat, shield.shield.attack.feat);
        data.attack.itemb = Math.max(attbonus.itemb, shield.shield.attack.itemb);
        data.attack.misc = attbonus.misc + shield.shield.attack.misc;
        data.attack.prof = 0;
        data.attack.bonus = mod + data.attack.prof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;
        data.damagebonus = this._powerDamageBonus(this.data)
        data.autoprof = true;
        data.autoweapon = true;
      }
      else if (data.keywords.includes("Implement") && ["normal", "lesser", "greater", "feature"].includes(data.powertype)) {
        data.attack.prof = 0;
        data.attack.feat = attbonus.feat;
        data.attack.itemb = attbonus.itemb;
        data.attack.misc = attbonus.misc;
        data.attack.bonus = mod + data.attack.prof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;
        data.damagebonus = this._powerDamageBonus(this.data)
        data.autoprof = true;
        const imps = this.actor.data.items.filter(entry => entry.type === "equipment" && entry.data.isimplement && this._isEquipped(entry));
        if (imps.length) {
          for (const imp of imps) {
            // if (this._isEquipped(imp))
            data.useditems = data.useditems.concat(imp.data);
          }
        }
      }
      else if (["normal", "lesser", "greater", "feature"].includes(data.powertype) && !this.actor.data.data.isnpc){
        data.attack.prof = 0;
        data.attack.bonus = mod + attbonus.feat + attbonus.itemb + attbonus.misc + data.attack.powermisc;
        data.damagebonus = this._powerDamageBonus(this.data)
      }
      else {
        data.attack.feat = Math.max(data.attack.feat, attbonus.feat);
        data.attack.itemb = Math.max(data.attack.itemb, attbonus.itemb);
        data.attack.misc = data.attack.misc + attbonus.misc;
        data.attack.bonus = mod + data.attack.prof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;
        data.attack.offbonus = mod + data.attack.offprof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;
        data.isnpc = this.actor ? (this.actor.data.type === "npc") : false;
      }

      data.attack.vslabel = (data.attack.vsdefense != "") ? data.defenses[`${data.attack.vsdefense}`].slabel : "";

      if (data.powertype === "normal" || data.powertype === "lesser" || data.powertype === "greater") {
        data.hasfrequency = false;
      }
      else {
        data.hasfrequency = true;
      }
    };
  }

  _isEquipped(item) {
    const data = item.data;
    const actorData = this.actor ? this.actor.data.data : false;

    if (!actorData)
      return false;

    const equipped = data.slot.value != "held" ? (data.slot.value === "noslot" || (data.slot.value === "ring" && (actorData.equipped.ring1 === item._id || actorData.equipped.ring2 === item._id)) || item._id === actorData.equipped[`${data.slot.value}`]) : false;
    const equippedmh = (item._id === actorData.equipped.mainhand);
    const equippedoh = (item._id === actorData.equipped.offhand);
    return equipped || equippedmh || equippedoh;
  }

  _powerAttackBonus(power) {
    const keywords = power.data.keywords;

    let feat = 0;
    let itemb = 0;
    let misc = 0;

    if (keywords.includes("Implement")) {
      const imps = this.actor.data.items.filter(entry => entry.type === "equipment" && entry.data.isimplement && entry.data.equippedanywhere);
      for (let i of imps) {
        itemb = Math.max(itemb, i.data.implement.attack.itemb);
        misc = Math.max(misc, i.data.implement.attack.misc);
      }
    }

    const disciplines = this.actor.data.items.filter(entry => entry.type === "discipline")
    for (let d of disciplines) {
      if (power.data.powertype.includes(d.data.powertype) && power.data.keywords.includes(d.data.keyword)) {
        feat = Math.max(feat, d.data.attack.feat);
        itemb = Math.max(itemb, d.data.attack.itemb);
        misc = Math.max(misc, d.data.attack.misc);
      }
    }

    feat = this.actor.data.data.isnpc ? Math.floor(this.actor.data.data.tier / 2 + 0.5) : feat;
    itemb = this.actor.data.data.isnpc ? (this.actor.data.data.rank === "champion" ? 1 : 0) : itemb;
    return {"feat": feat,"itemb": itemb,"misc": misc};
  }

  _powerDamageBonus(power) {
    const keywords = power.data.keywords;

    let feat = 0;
    let itemb = 0;
    let misc = 0;

    if (keywords.includes("Implement") && this.actor.data.data.implement) {
      const imps = this.actor.data.items.filter(entry => entry.type === "equipment" && entry.data.equippedanywhere && entry.data.isimplement);
      for (let i of imps) {
        itemb = Math.max(itemb, i.data.implement.damage.itemb);
        misc = Math.max(misc, i.data.implement.damage.misc);
      }
    }

    const disciplines = this.actor.data.items.filter(entry => entry.type === "discipline")
    for (let d of disciplines) {
      if (power.data.powertype.includes(d.data.powertype) && power.data.keywords.includes(d.data.keyword)) {
        feat = Math.max(feat, d.data.damage.feat);
        itemb = Math.max(itemb, d.data.damage.itemb);
        misc = Math.max(misc, d.data.damage.misc);
      }
    }
    return {"feat": feat,"itemb": itemb, "misc": misc};
  }

  /**
  * Prepare a data object which is passed to any Roll formulas which are created related to this Item
  * @private
  */
  getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);

    return rollData;
  }

  /**
  * Handle clickable rolls.
  * @param {Event} event   The originating click event
  * @private
  */
  async roll() {
    const item = this.data;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.data.data.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.data.description ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData).roll();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }
}
