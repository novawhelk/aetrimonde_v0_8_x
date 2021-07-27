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
    const actor = this.actor ? this.actor : "";

    if (actor.data) {
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
    const actor = this.actor ? this.actor : "";

    if (actor.data) {
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
    const actor = this.actor ? this.actor : "";

    if (actor.data) {
      const actorData = actor.data.data;
      data.totalweight = data.eachweight * data.quantity;
      data.totalvalue = data.eachvalue * data.quantity;
      data.totalgp = Math.floor(data.totalvalue);
      data.totalsp = Math.floor(data.totalvalue * 10 % 10);
      data.totalcp = Math.floor(data.totalvalue * 100 % 10);

      data.multitype = (data.isarmor + data.isshield + data.isweapon + data.isimplement + data.isconsumable) > 1;
      data.multiple = data.quantity > 1;
      data.slotlabel = data.slot.slots[`${data.slot.value}`];
      data.isheld = data.slot.value === "held";

      data.equippedmh = (this.id === actorData.equipped.mainhand);
      data.equippedoh = (this.id === actorData.equipped.offhand);
      data.equippedanywhere = this._isEquipped();
      if (data.isweapon && data.slot.value === "held" && data.weapon.hands.value === "2h" && data.equippedanywhere && (!data.equippedmh || !data.equippedoh)) {
        data.warning = true;
        data.warningmessage = "This weapon requires two hands to wield properly."
      }
      data.npcowner = this.actor.data.type === "npc";

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

          data.weapon.range = data.weapon.range ? data.weapon.range : "";
          data.weapon.mvsr = data.weapon.mvsr ? data.weapon.mvsr : "";
          data.weapon.quals = data.weapon.quals ? data.weapon.quals : "";
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


  }

  _preparePowerData(itemData) {
    const data = itemData.data;
    const actor = this.actor ? this.actor : "";

    if (actor.data) {
      data.autoprof = false;
      const actorData = actor.data.data;
      const defaultweapon = {
        "data": {
          "data": {
            "weapon": {
              "prof": 0,
              "attack": {
                "feat": 0,
                "itemb": 0,
                "misc": 0
              },
              "damage": {
                "feat": 0,
                "itemb": 0,
                "misc": 0
              },
              "weaponthreat": false,
              "mvsr": "",
              "quals": "",
              "range": ""
            },
            "shield": {
              "attack": {
                "feat": 0,
                "itemb": 0,
                "misc": 0
              },
              "damage": {
                "feat": 0,
                "itemb": 0,
                "misc": 0
              }
            },
            "implement": {
              "attack": {
                "feat": 0,
                "itemb": 0,
                "misc": 0
              },
              "damage": {
                "feat": 0,
                "itemb": 0,
                "misc": 0
              }
            },
            "equippedanywhere": true,
            "default": true
          }
        }
      };

      const mainequipped = actor.data.data.equipped.mainhand ? actor.items.get(actor.data.data.equipped.mainhand) : "";
      const offequipped = actor.data.data.equipped.offhand ? actor.items.get(actor.data.data.equipped.offhand) : "";
      const mainselected = data.mainitem ? actor.items.get(data.mainitem) : "";
      const offselected = data.offitem ? actor.items.get(data.offitem) : "";

      const mod = (data.attack.abil === "") ? 0 : actorData.abilities[`${data.attack.abil}`].mod;
      data.attack.mod = mod;
      data.attack.powermisc = data.attack.powermisc ? data.attack.powermisc : 0;

      data.relevantitemtype = "Item";
      data.relevantoffitemtype = "Off-Weapon";

      data.critcontent = [];
      if (data.attack.crit) {
        data.critcontent.push({"source": this.name + " Critical:", "criteffect": data.attack.crit});
      }

      if ( data.keywords.includes("Weapon") && ["normal", "lesser", "greater", "feature"].includes( data.powertype)) {
        // Set up data for item-select dropdown
        data.requiresitem = true;
        data.relevantitemtype = data.attack.off ? "Main-Weapon" : "Weapon";
        data.relevantitems = actor.data.items.filter(entry => (entry.type === "equipment" && entry.data.data.isweapon));

        // Determine which item(s) to use with this power.
        let mainweapon = defaultweapon;
        let offweapon = defaultweapon;
        if (mainselected) {
          mainweapon = mainselected;
          if (offselected) { // If main- and off-weapon both selected
            offweapon = offselected;
          }
          else if (offequipped) { // If main-weapon selected but not off-weapon, and there is something equipped in the off-hand
            offweapon = offequipped.data.data.isweapon ? offequipped : defaultweapon;
          }
        }
        else if (offselected) {
          offweapon = offselected;
          if (offweapon != mainequipped) { // If off-weapon selected but not main-weapon, and the item equipped in main-hand is not the selected off-weapon
            mainweapon = mainequipped.data.data.isweapon ? mainequipped : defaultweapon;
          }
        }
        else {
          if (mainequipped) { // If nothing selected but something is equipped in main-hand
            mainweapon = mainequipped.data.data.isweapon ? mainequipped : defaultweapon;
          }
          if (offequipped) { // If nothing selected but something is equipped in off-hand
            offweapon = offequipped.data.data.isweapon ? offequipped : defaultweapon;
          }
        }
        if (!mainweapon.data.data.default){
            mainweapon.prepareData();
        }
        if (!offweapon.data.data.default){
            offweapon.prepareData();
        }
        mainweapon = mainweapon.data;
        offweapon = offweapon.data;

        // Save list of used weapons. REPLACE THIS ASAP: Try constructing an array of critical effects based on the power's crit effect and those of the chosen items.
        if (mainweapon.data.weapon.quals.includes("High Crit")) {
          data.critcontent.push({"source": "High Crit Weapon:", "criteffect": "[[1<Weapon>]] extra damage."})
        }
        if (mainweapon.data.relatedprops && mainweapon.data.critprops) {
          data.critcontent.push({"source": mainweapon.name + " Critical:", "criteffect": mainweapon.data.critprops})
        }
        if (offweapon.data.weapon.quals.includes("High Crit")) {
          data.critcontent.push({"source": "High Crit Weapon:", "criteffect": "[[1<Weapon>]] extra damage."})
        }
        if (offweapon.data.relatedprops && offweapon.data.critprops) {
          data.critcontent.push({"source": offweapon.name + " Critical:", "criteffect": offweapon.data.critprops})
        }

        // Issue a warning if it doesn't look like the right items are equipped.
        const missingmelee = data.range.includes("Melee") && (mainweapon.data.weapon.mvsr.value != "melee" || (data.attack.off && offweapon.data.weapon.mvsr.value != "melee"));
        const missingranged = data.range.includes("Ranged") && ((mainweapon.data.weapon.mvsr.value != "ranged" && !mainweapon.data.weapon.quals.includes("Thrown")) || (data.attack.off && offweapon.data.weapon.mvsr.value != "ranged" && offweapon.data.weapon.quals.includes("Thrown")));
        data.warning = missingmelee || missingranged || !mainweapon.data.equippedanywhere || (data.attack.off && !offweapon.data.equippedanywhere);
        data.warningmessage = "You might not have the right item(s) equipped.";

        // Calculate all the bonuses for attacks and damage.
        const attbonus = this._powerAttackBonus(this.data, mainweapon.data.weapon);
        data.attack.prof = mainweapon.data.weapon.prof;
        data.attack.feat = attbonus.feat;
        data.attack.itemb = attbonus.itemb;
        data.attack.misc = attbonus.misc;
        data.attack.bonus = mod + data.attack.prof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;
        data.attack.hasthreat = mainweapon.data.weapon.weaponthreat ? true : data.attack.hasthreat;
        data.attack.damagebonus = this._powerDamageBonus(this.data, mainweapon.data.data.weapon);

        const offattbonus = this._powerAttackBonus(this.data, offweapon.data.weapon);
        data.attack.offprof = offweapon.data.weapon.prof;
        data.attack.offfeat = offattbonus.feat;
        data.attack.offitemb = offattbonus.itemb;
        data.attack.offmisc = offattbonus.misc;
        data.attack.offbonus = mod + data.attack.offprof + data.attack.offfeat + data.attack.offitemb + data.attack.offmisc + data.attack.powermisc;
        data.attack.hasoffthreat = offweapon.data.weapon.weaponthreat ? true : data.attack.hasoffthreat;
        data.attack.offdamagebonus = this._powerDamageBonus(this.data, offweapon.data.data.weapon);

        data.damagebonus = this._powerDamageBonus(this.data);
        data.autoprof = true;
        data.autoweapon = true;
        data.mainitem = mainweapon;
        data.offitem = offweapon;
      }
      else if (data.keywords.includes("Unarmed") && ["normal", "lesser", "greater", "feature"].includes(data.powertype)) {
        data.requiresitem = true;
        data.relevantitemtype = "Unarmed Attack";
        data.relevantitems = actor.data.items.filter(entry => (entry.type === "equipment" && entry.data.data.isweapon && entry.data.data.weapon.unarmed && entry.data.data.equippedanywhere));

        const unarmedattack = mainselected ? mainselected : (mainequipped ? mainequipped : defaultweapon);
        if (!unarmedattack.data.data.default){
            unarmedattack.prepareData();
        }
        unarmedattack = unarmedattack.data;

        if (unarmedattack.data.weapon.quals.includes("High Crit")) {
          data.critcontent.push({"source": "High Crit Weapon:", "criteffect": "[[1<Weapon>]] extra damage."})
        }
        if (unarmedattack.data.relatedprops && unarmedattack.data.critprops) {
          data.critcontent.push({"source": unarmedattack.name + " Critical:", "criteffect": unarmedattack.data.critprops})
        }

        data.warning = data.relevantitems && !data.mainitem;
        data.warningmessage = "You have alternate unarmed attacks; you might need to select one."
        const attbonus = this._powerAttackBonus(this.data, unarmedattack.data.weapon);
        data.attack.prof = unarmedattack.data.prof;
        data.attack.feat = attbonus.feat;
        data.attack.itemb = attbonus.itemb;
        data.attack.misc = attbonus.misc;
        data.attack.bonus = mod + data.attack.prof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;
        data.attack.hasthreat = unarmedattack.data.weaponthreat ? true : data.attack.hasthreat;

        data.damagebonus = this._powerDamageBonus(this.data, unarmedattack.data.weapon);
        data.autoprof = true;
        data.unarmed = true;
        data.autoweapon = true;
        data.mainitem = unarmedattack;
      }
      else if (data.keywords.includes("Shield") && ["normal", "lesser", "greater", "feature"].includes(data.powertype)) {
        data.requiresitem = true;
        data.relevantitemtype = "Shield";
        data.relevantitems = actor.data.items.filter(entry => (entry.type === "equipment" && entry.data.data.isshield));

        let shield = defaultweapon;
        if (mainselected) {
          shield = mainselected;
        }
        else if (offequipped) {
          if (offequipped.data.data.isshield) {
            shield = offequipped;
          }
          else if (mainequipped) {
            if (mainequipped.data.data.isshield) {
              shield = mainequipped;
            }
          }
        }
        else if (mainequipped) {
          if (mainequipped.data.data.isshield) {
            shield = mainequipped;
          }
        }
        if (!shield.data.data.default){
            shield.prepareData();
        }
        shield = shield.data;

        if (shield.data.relatedprops && shield.data.critprops) {
          data.critcontent.push({"source": shield.name + " Critical:", "criteffect": shield.data.critprops})
        }

        data.warning = !shield.data.isshield || !shield.data.shield.dice || !shield.data.equippedanywhere;
        data.warningmessage = "You might not have the right item(s) equipped.";
        const attbonus = this._powerAttackBonus(this.data, shield.data.shield);
        data.attack.prof = 0;
        data.attack.feat = attbonus.feat;
        data.attack.itemb = attbonus.itemb;
        data.attack.misc = attbonus.misc;
        data.attack.bonus = mod + data.attack.prof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;

        data.damagebonus = this._powerDamageBonus(this.data, shield.data.shield);
        data.autoprof = true;
        data.autoweapon = true;
        data.mainitem = shield;
      }
      else if (data.keywords.includes("Implement") && ["normal", "lesser", "greater", "feature"].includes(data.powertype)) {
        let imp = defaultweapon;
        if (mainselected) {
          imp = mainselected;
        }
        else if (mainequipped) {
          if (mainequipped.data.data.isimplement) {
            imp = mainequipped;
          }
          else if (offequipped) {
            if (offequipped.data.data.isimplement) {
              imp = offequipped;
            }
          }
        }
        else if (offequipped) {
          if (offequipped.data.data.isimplement) {
            imp = offequipped;
          }
        }
        if (!imp.data.data.default){
            imp.prepareData();
        }
        imp = imp.data;

        if (imp.data.relatedprops && imp.data.critprops) {
          data.critcontent.push({"source": imp.name + " Critical:", "criteffect": imp.data.critprops})
        }

        const attbonus = this._powerAttackBonus(this.data, imp.data.implement);
        data.attack.prof = 0;
        data.attack.feat = attbonus.feat;
        data.attack.itemb = attbonus.itemb;
        data.attack.misc = attbonus.misc;
        data.attack.bonus = mod + data.attack.prof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;

        data.damagebonus = this._powerDamageBonus(this.data, imp.data.implement);
        data.autoprof = true;
        data.mainitem = imp;
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

  _isEquipped() {
    const data = this.data.data;
    const actorData = this.actor ? this.actor.data : false;

    if (!actorData || this.type != "equipment")
      return false;

    const unslotted = data.slot.value === "noslot";
    const equippedring = data.slot.value === "ring" && (actorData.data.equipped.ring1 === this.id || actorData.data.equipped.ring2 === this.id);
    const equippedworn = !(["ring", "noslot", "held"].includes(data.slot.value)) && actorData.data.equipped[`${data.slot.value}`] === this.id;
    const equippedmh = (this.id === actorData.data.equipped.mainhand);
    const equippedoh = (this.id === actorData.data.equipped.offhand);

    return unslotted || equippedring || equippedworn || equippedmh || equippedoh;
  }

  _powerAttackBonus(power, item = false, offitem = false) {
    const keywords = power.data.keywords;

    let feat = 0;
    let itemb = 0;
    let misc = 0;

    if (item) {
      feat = item.attack.feat;
      itemb = item.attack.itemb;
      if (offitem) {
        feat = Math.max(feat, offitem.attack.feat ? offitem.attack.feat : 0);
        itemb = Math.max(itemb, offitem.attack.itemb);
        misc = Math.max(itemb, offitem.attack.misc);
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

  _powerDamageBonus(power, item = false) {
    const keywords = power.data.keywords;

    let feat = 0;
    let itemb = 0;
    let misc = 0;

    if (item) {
      feat = item.damage.feat;
      itemb = item.damage.itemb;
      if (offitem) {
        feat = Math.max(feat, offitem.damage.feat ? offitem.attack.feat : 0);
        itemb = Math.max(itemb, offitem.damage.itemb);
        misc = Math.max(itemb, offitem.damage.misc);
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
