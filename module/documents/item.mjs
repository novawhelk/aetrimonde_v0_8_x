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

    data.isowned = this.actor ? true : false;

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
        data.weapon.normal.vslabel = (data.weapon.normal.vsdefense != "") ? data.defenses[`${data.weapon.normal.vsdefense}`].slabel : "";
        data.weapon.thrown.vslabel = (data.weapon.thrown.vsdefense != "") ? data.defenses[`${data.weapon.thrown.vsdefense}`].slabel : "";

        data.weapon.range = data.weapon.range ? data.weapon.range : "";
        data.weapon.mvsr = data.weapon.mvsr ? data.weapon.mvsr : "";
        data.weapon.quals = data.weapon.quals ? data.weapon.quals : "";

        data.weapon.effectivedice = data.weapon.dice;
        if (this.actor) {
          if (this.actor.data.data.isnpc) {
            data.weapon.attack.feat = Math.floor(actorData.tier / 2 + 0.5);
            data.weapon.attack.itemb = actorData.rank === "champion" ? 1 : 0;
            data.weapon.damage.feat = Math.floor(actorData.tier / 2) * 2;
            if (this.actor.data.data.rank === "minion") {
              data.weapon.effectivedice = data.weapon.dice.replaceAll(/(?<=d)\d+(r\d+)?/g, "1")
            } else if (data.weapon.quals.solid && data.equippedmh && data.equippedoh) {
              data.weapon.effectivedice = data.weapon.dice.replaceAll(/$/g, "r2").replaceAll(/r\d*(?=r\d)/g, "")
            }
          } else if (data.weapon.quals.solid && data.equippedmh && data.equippedoh) {
            data.weapon.effectivedice = data.weapon.dice.replaceAll(/$/g, "r2").replaceAll(/r\d*(?=r\d)/g, "")
          }

          data.weapon.normal.amod = (data.weapon.normal.attack === "") ? 0 : actorData.abilities[`${data.weapon.normal.attack}`].mod;
          data.weapon.normal.atotal = data.weapon.normal.amod + data.weapon.prof + data.weapon.attack.feat + data.weapon.attack.itemb + data.weapon.attack.misc;
          data.weapon.normal.dmod = (data.weapon.normal.damage === "") ? 0 : actorData.abilities[`${data.weapon.normal.damage}`].mod;
          data.weapon.normal.dtotal = data.weapon.effectivedice + " + " + (data.weapon.normal.dmod + data.weapon.damage.feat + data.weapon.damage.itemb + data.weapon.damage.misc);

          data.weapon.throwable = data.weapon.quals.heavythrown || data.weapon.quals.lightthrown;
          data.weapon.thrown.amod = (data.weapon.thrown.attack === "") ? 0 : actorData.abilities[`${data.weapon.thrown.attack}`].mod;
          data.weapon.thrown.atotal = data.weapon.thrown.amod + data.weapon.prof + data.weapon.attack.feat + data.weapon.attack.itemb + data.weapon.attack.misc;
          data.weapon.thrown.dmod = (data.weapon.thrown.damage === "") ? 0 : actorData.abilities[`${data.weapon.thrown.damage}`].mod;
          data.weapon.thrown.dtotal = data.weapon.effectivedice + " + " + (data.weapon.thrown.dmod + data.weapon.damage.feat + data.weapon.damage.itemb + data.weapon.damage.misc);
        }
        data.weapon.unarmed = data.weapon.groups ? data.weapon.groups.includes("Unarmed") : false;
        data.weapon.weaponthreat = data.weapon.quals ? data.weapon.quals.critthreat : false;
        data.weapon.normal.hasthreat = data.weapon.weaponthreat ? true : data.weapon.attack.hasthreat;
        data.weapon.thrown.hasthreat = data.weapon.weaponthreat ? true : data.weapon.attack.hasthreat;

        data.weapon.normalaspower = this._weaponAttack();
        data.weapon.thrownaspower = this._weaponAttack(true);
      }
      if (data.isimplement) {

      }
      if (data.isconsumable) {

      }
      if (data.relatedpower) {
        data.power.attack.vslabel = (data.power.attack.vsdefense != "") ? data.defenses[`${data.power.attack.vsdefense}`].label : "";
        data.power.critcontent = [];
        if (data.power.crit.text) {
          data.power.critcontent.push({"source": this.name + " Power Critical:", "criteffect": data.power.crit.text});
        }
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
      if (data.crit.text) {
        data.critcontent.push({"source": this.name + " Critical", "criteffect": data.crit.text});
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
        if (mainweapon.data.weapon.quals.critpotential) {
          data.critcontent.push({"source": "Critical Potential", "criteffect": "[[1<Weapon>]] extra damage."})
        }
        if (mainweapon.data.relatedprops && mainweapon.data.critprops) {
          data.critcontent.push({"source": mainweapon.name, "criteffect": mainweapon.data.critprops})
        }
        if (data.attack.off && offweapon.data.weapon.quals.critpotential) {
          data.critcontent.push({"source": "Critical Potential", "criteffect": "[[1<Weapon>]] extra damage."})
        }
        if (data.attack.off && offweapon.data.relatedprops && offweapon.data.critprops) {
          data.critcontent.push({"source": offweapon.name, "criteffect": offweapon.data.critprops})
        }

        // Issue a warning if it doesn't look like the right items are equipped.
        const missingmelee = data.range.includes("Melee") && (mainweapon.data.weapon.mvsr.value != "melee" || (data.attack.off && offweapon.data.weapon.mvsr.value != "melee"));
        const missingranged = data.range.includes("Ranged") && ((mainweapon.data.weapon.mvsr.value != "ranged" && !mainweapon.data.weapon.throwable) || (data.attack.off && offweapon.data.weapon.mvsr.value != "ranged" && offweapon.data.weapon.throwable));
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
        data.attack.damagebonus = this._powerDamageBonus(this.data, mainweapon.data.weapon);

        const offattbonus = this._powerAttackBonus(this.data, offweapon.data.weapon);
        data.attack.offprof = offweapon.data.weapon.prof;
        data.attack.offfeat = offattbonus.feat;
        data.attack.offitemb = offattbonus.itemb;
        data.attack.offmisc = offattbonus.misc;
        data.attack.offbonus = mod + data.attack.offprof + data.attack.offfeat + data.attack.offitemb + data.attack.offmisc + data.attack.powermisc;
        data.attack.hasoffthreat = offweapon.data.weapon.weaponthreat ? true : data.attack.hasoffthreat;
        data.attack.offdamagebonus = this._powerDamageBonus(this.data, offweapon.data.weapon);

        data.damagebonus = this._powerDamageBonus(this.data);
        data.autoprof = true;
        data.autoweapon = true;
        data.autothreat = mainweapon.data.weapon.weaponthreat;
        data.autooffthreat = offweapon.data.weapon.weaponthreat;
        data.mainequipped = mainweapon;
        data.offequipped = offweapon;
      }
      else if (data.keywords.includes("Unarmed") && ["normal", "lesser", "greater", "feature"].includes(data.powertype)) {
        data.requiresitem = true;
        data.relevantitemtype = "Unarmed Attack";
        data.relevantitems = actor.data.items.filter(entry => (entry.type === "equipment" && entry.data.data.isweapon && entry.data.data.weapon.unarmed && entry.data.data.equippedanywhere));

        let unarmedattack = mainselected ? mainselected : (mainequipped ? mainequipped : defaultweapon);
        if (!unarmedattack.data.data.default){
            unarmedattack.prepareData();
        }
        unarmedattack = unarmedattack.data;

        if (unarmedattack.data.weapon.quals.critpotential) {
          data.critcontent.push({"source": "High Crit Weapon", "criteffect": "[[1<Weapon>]] extra damage."})
        }
        if (unarmedattack.data.relatedprops && unarmedattack.data.critprops) {
          data.critcontent.push({"source": unarmedattack.name, "criteffect": unarmedattack.data.critprops})
        }

        data.warning = data.relevantitems && !data.mainitem;
        data.warningmessage = "You have alternate unarmed attacks; you might need to select one."
        const attbonus = this._powerAttackBonus(this.data, unarmedattack.data.weapon);
        data.attack.prof = unarmedattack.data.weapon.prof;
        data.attack.feat = attbonus.feat;
        data.attack.itemb = attbonus.itemb;
        data.attack.misc = attbonus.misc;
        data.attack.bonus = mod + data.attack.prof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;
        data.attack.hasthreat = unarmedattack.data.weapon.weaponthreat ? true : data.attack.hasthreat;

        data.damagebonus = this._powerDamageBonus(this.data, unarmedattack.data.weapon);
        data.autoprof = true;
        data.unarmed = true;
        data.autoweapon = true;
        data.autothreat = unarmedattack.data.weapon.weaponthreat;
        data.mainequipped = unarmedattack;
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
          data.critcontent.push({"source": shield.name, "criteffect": shield.data.critprops})
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
        data.mainequipped = shield;
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
          data.critcontent.push({"source": imp.name, "criteffect": imp.data.critprops})
        }

        const attbonus = this._powerAttackBonus(this.data, imp.data.implement);
        data.attack.prof = 0;
        data.attack.feat = attbonus.feat;
        data.attack.itemb = attbonus.itemb;
        data.attack.misc = attbonus.misc;
        data.attack.bonus = mod + data.attack.prof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;

        data.damagebonus = this._powerDamageBonus(this.data, imp.data.implement);
        data.autoprof = true;
        data.mainequipped = imp;
      }
      else if (["normal", "lesser", "greater", "feature"].includes(data.powertype)){
        const attbonus = this._powerAttackBonus(this.data);
        data.attack.prof = 0;
        data.attack.bonus = mod + attbonus.feat + attbonus.itemb + attbonus.misc + data.attack.powermisc;
        data.damagebonus = this._powerDamageBonus(this.data)
      }
      else {
        const attbonus = this._powerAttackBonus(this.data);
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
      feat = item.attack.feat ? item.attack.feat : 0;
      itemb = item.attack.itemb;
      if (offitem) {
        feat = Math.max(feat, offitem.attack.feat ? offitem.attack.feat : 0);
        itemb = Math.max(itemb, offitem.attack.itemb);
        misc = Math.max(itemb, offitem.attack.misc);
      }
    }

    const disciplines = this.actor.data.items.filter(entry => entry.type === "discipline")
    for (let d of disciplines) {
      if (power.data.origin.includes(d.data.data.powertype) && power.data.keywords.includes(d.data.data.keyword)) {
        feat = Math.max(feat, d.data.data.attack.feat);
        itemb = Math.max(itemb, d.data.data.attack.itemb);
        misc = Math.max(misc, d.data.data.attack.misc);
      }
    }

    feat = this.actor.data.data.isnpc ? Math.floor(this.actor.data.data.tier / 2 + 0.5) : feat;
    itemb = this.actor.data.data.isnpc ? (this.actor.data.data.rank === "champion" ? 1 : 0) : itemb;
    return {"feat": feat,"itemb": itemb,"misc": misc};
  }

  _powerDamageBonus(power, item = false, offitem = false) {
    const keywords = power.data.keywords;

    let feat = 0;
    let itemb = 0;
    let misc = 0;

    if (item) {
      feat = item.damage.feat ? item.damage.feat : 0;
      itemb = item.damage.itemb;
      if (offitem) {
        feat = Math.max(feat, offitem.damage.feat ? offitem.attack.feat : 0);
        itemb = Math.max(itemb, offitem.damage.itemb);
        misc = Math.max(itemb, offitem.damage.misc);
      }
    }

    const disciplines = this.actor.data.items.filter(entry => entry.type === "discipline")
    for (let d of disciplines) {
      if (power.data.origin.includes(d.data.data.powertype) && power.data.keywords.includes(d.data.data.keyword)) {
        feat = Math.max(feat, d.data.data.damage.feat);
        itemb = Math.max(itemb, d.data.data.damage.itemb);
        misc = Math.max(misc, d.data.data.damage.misc);
      }
    }

    feat = this.actor.data.data.isnpc ? Math.floor(this.actor.data.data.tier / 2) * 2 : feat;
    return {"feat": feat,"itemb": itemb, "misc": misc};
  }

  _weaponAttack(thrown = false) {
    const actorData = this.actor.data;
    const weapon = this.data;

    const attack = thrown ? weapon.data.weapon.thrown : weapon.data.weapon.normal;
    const ranged = weapon.data.weapon.mvsr.value === "ranged"

    const weaponattack = {
      "name": thrown ? "Thrown " + weapon.name : weapon.name,
      "_id": weapon._id,
      "img": weapon.img,
      "dependent": "weaponattack",
      "isweapon": true,
      "isheld": weapon.data.isheld,
      "slot": {
        "value": weapon.data.slot.value
      },
      "equipped": weapon.data.equipped,
      "equippedmh": weapon.data.equippedmh,
      "equippedoh": weapon.data.equippedoh,
      "data": {
        "powertype": "normal",
        "origin": "",
        "flavortext": "",
        "keywords": "Weapon",
        "action": "Main",
        "frequency": "",
        "hasfrequency": false,
        "range": ranged || thrown ? "Ranged " + weapon.data.weapon.range : (weapon.data.weapon.quals.reach ? "Melee " + weapon.data.weapon.quals.reachdist : "Melee 1"),
        "targets": "One creature",
        "warning": weapon.data.warning,
        "warningmessage": weapon.data.warningmessage,
        "provoked": {
          "exists": false,
          "text": ""
        },
        "requirement": {
          "exists": false,
          "text": ""
        },
        "effect": {
          "exists": false,
          "text": ""
        },
        "attack": {
          "exists": true,
          "abil": attack.amod,
          "bonus": attack.atotal,
          "prof": weapon.data.weapon.prof,
          "feat": weapon.data.weapon.attack.feat,
          "itemb": weapon.data.weapon.attack.itemb,
          "misc": weapon.data.weapon.attack.misc,
          "vslabel": attack.vslabel,
          "hasthreat": attack.hasthreat,
          "off": false
        },
        "hit": {
          "text": "[[" + attack.dtotal + "]]" + " damage."
        },
        "crit": {
          "text": ""
        },
        "critcontent": [],
        "miss": {
          "text": ""
        },
        "maintain": {
          "exists": false,
          "text": ""
        },
        "special": {
          "exists": false,
          "text": ""
        },
        "abilities": weapon.data.abilities,
        "defenses": weapon.data.defenses,
        "powertypes": {
            "normal": {
                "label": "Normal Attack"
            }
        }
      },
      "dependent": "weaponattack"
    }
    if (weapon.data.weapon.quals.critpotential) {
      weaponattack.data.critcontent.push({"source": "High Crit Weapon", "criteffect": "[[1<Weapon>]] extra damage."})
    }
    if (weapon.data.relatedprops && weapon.data.critprops) {
      weaponattack.data.critcontent.push({"source": weapon.name, "criteffect": weapon.data.critprops})
    }
    return weaponattack
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

  async post() {
    this.prepareData();
    const itemcopy = deepClone(this.data);
    let template = "";
    let templateData = [];
    if (itemcopy.type === "power") {
      const power = itemcopy;
      power.data.powerlabel = power.data.powertype ? power.data.powertypes[`${power.data.powertype}`].label : "";
      const abilities = {
        "str": "Strength",
        "con": "Constitution",
        "dex": "Dexterity",
        "int": "Intelligence",
        "wis": "Wisdom",
        "cha": "Charisma"
      };
      power.data.attack.abil = power.data.attack.abil ? abilities[`${power.data.attack.abil}`] : "";
      power.data.effect.text = power.data.effect.text.replaceAll("[[", "").replaceAll("]]", "");
      power.data.hit.text = power.data.hit.text.replaceAll("[[", "").replaceAll("]]", "");
      power.data.crit.text = power.data.crit.text.replaceAll("[[", "").replaceAll("]]", "");
      power.data.miss.text = power.data.miss.text.replaceAll("[[", "").replaceAll("]]", "");
      template = `systems/aetrimonde_v0_8_x/templates/chat/power-card.html`;
      templateData = {
        "power": power
      }
    }
    else if (itemcopy.type === "feature") {
      const feature = itemcopy;
      feature.data.source = feature.data.source ? feature.data.sources[`${feature.data.source}`].label : "";
      template = `systems/aetrimonde_v0_8_x/templates/chat/feature-card.html`;
      templateData = {
        "feature": feature
      }
    }
    else if (["equipment"].includes(itemcopy.type)) {
      const item = itemcopy;

      if (item.data.isweapon) {
        item.data.weapon.complexity.value = item.data.weapon.complexity.complexities[`${item.data.weapon.complexity.value}`];
        item.data.weapon.hands.value = item.data.weapon.hands.handses[`${item.data.weapon.hands.value}`];
        item.data.weapon.mvsr.value = item.data.weapon.mvsr.mvsrs[`${item.data.weapon.mvsr.value}`];
        item.data.weapon.textquals = "";

        const quallabels = {
          "bayonet": "Bayonet",
          "bulky": "Bulky",
          "critpotential": "Critical Potential",
          "critthreat": "Critical Threat",
          "heavythrown": "Heavy Thrown",
          "lightthrown": "Light Thrown",
          "magazine": "Magazine",
          "reach": "Reach",
          "solid": "Solid",
          "other": "Other"
        }

        for (let qual in item.data.weapon.quals) {
          if (["reachdist", "loadaction", "magsize", "otherdet"].includes(qual))
            continue

          if (item.data.weapon.quals[qual]) {
            if (qual === "load") {
              item.data.weapon.textquals = item.data.weapon.textquals + "Load " + item.data.weapon.quals.loadaction + ", "
              continue;
            }
            item.data.weapon.textquals = item.data.weapon.textquals + quallabels[qual] + ", "
          }
        }
        item.data.weapon.textquals = item.data.weapon.textquals.slice(0, -2);
      }
      item.data.power.effect.temp = item.data.power.effect.text.replaceAll("[[", "").replaceAll("]]", "");
      item.data.power.hit.temp = item.data.power.hit.text.replaceAll("[[", "").replaceAll("]]", "");
      item.data.power.crit.temp = item.data.power.crit.text.replaceAll("[[", "").replaceAll("]]", "");
      item.data.power.miss.temp = item.data.power.miss.text.replaceAll("[[", "").replaceAll("]]", "");
      template = `systems/aetrimonde_v0_8_x/templates/chat/` + item.type + `-card.html`;
      templateData = {
        "item": item
      };
    }

    const chatHtml = await renderTemplate(template, templateData);

    const chatData = {
      user: game.user.id,
      content: chatHtml,
      speaker: {
        actor: this.actor.id,
        token: this.actor.token,
        alias: this.actor.name
      }
    };
    const rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData.whisper = [game.user.id];
    if (rollMode === "blindroll") chatData.blind = true;
    await ChatMessage.create(chatData);
  }

  /**
  * Handle clickable rolls.
  * @param {Event} event   The originating click event
  * @private
  */
  async roll(mode, onlythis) {
    if (this.type === "power") {
      const power = deepClone(this.data);
      power.data.powerlabel = power.data.powertypes[power.data.powertype].label;

      const template = `systems/aetrimonde_v0_8_x/templates/chat/effect-option-card.html`;
      const templateData = {
        "power": power,
        "greater": power.data.powertype === "greater",
        "cont": !onlythis
      };
      const content = await renderTemplate(template, templateData);
      let d = new Dialog({
        title: "Effect Options",
        content: content,
        buttons: {
          one: {
            label: "Use This Power",
            callback: html => this._RunPower(power)
          },
          two: {
            label: "Show in Chat",
            callback: html => this.post()
          }
        }
      }).render(true);
    }
    else if (this.type === "equipment") {
      if (mode === "weaponattack" && this.data.data.isweapon) {
        this._RunPower(this._weaponAttack());
      }
      else if (mode === "itempower" && this.data.data.relatedpower) {
        const itempower = {"name": this.name + " Power", "data": deepClone(this.data.data.power)};
        this._RunPower(itempower);
      }
    }
    else if (this.type === "skill" || this.type === "perk") {
      const check = this._RollOnceCore(this.data.data.total);

      const template = `systems/aetrimonde_v0_8_x/templates/chat/check-output-card.html`;
      const templateData = {
        "check": deepClone(this.data),
        "rolls": check
      };
      const content = await renderTemplate(template, templateData);

      const chatData = {
        user: game.user.id,
        content: content,
        speaker: {
          actor: this.actor.id,
          token: this.actor.token,
          alias: this.actor.name
        }
      };
      const rollMode = game.settings.get("core", "rollMode");
      if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
      if (rollMode === "selfroll") chatData.whisper = [game.user.id];
      if (rollMode === "blindroll") chatData.blind = true;
      ChatMessage.create(chatData);
    }
  }

  static chatListeners(html) {
    html.on('click', '.chat-card .effect .favor-option', this._onEffectOption.bind(this));
    html.on('click', '.chat-card .effect .conflict-option', this._onEffectOption.bind(this));
    html.on('click', '.chat-card .effect .disfavor-option', this._onEffectOption.bind(this));
    html.on('click', '.chat-card .mode-blocker.core', this._onAttackOption.bind(this));
    html.on('click', '.chat-card .mode-blocker.favor', this._onAttackOption.bind(this));
    html.on('click', '.chat-card .mode-blocker.conflict', this._onAttackOption.bind(this));
    html.on('click', '.chat-card .mode-blocker.disfavor', this._onAttackOption.bind(this));
    html.on('click', '.chat-card .result .normal-option', this._onResultOption.bind(this));
    html.on('click', '.chat-card .result .favor-option', this._onResultOption.bind(this));
    html.on('click', '.chat-card .result .conflict-option', this._onResultOption.bind(this));
    html.on('click', '.chat-card .result .disfavor-option', this._onResultOption.bind(this));
  }

  static async _onEffectOption(event) {
    event.preventDefault();

    // Extract card data
    const button = event.currentTarget;
    const mode = button.classList[1].split("-")[0];
    const current = button.classList[2];
    const replace = current === "false" ? "shown" : "false";

    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message =  game.messages.get(messageId);

    if (game.user.role < 2 || (game.user.role < 3 && game.user.id != message.data.user))
      return;

    const modeRegex = new RegExp(' ' + mode + "-box " + current, 'g');
    const modeString = " " + mode + "-box " + replace;

    const optionRegex = new RegExp(' ' + mode + "-option " + current, 'g');
    const optionString = " " + mode + "-option " + replace;

    const newContent = message.data.content.replaceAll(modeRegex, modeString).replaceAll(optionRegex, optionString)

    if (current === "false") {
      let inline = button;
      for (var i = 1; i <= 3; i ++) {
        inline = inline.nextElementSibling;
        if (!inline)
          break;
      }
      inline = inline ? inline.children[1] : null;
      while (!!inline) {
        if (inline.classList.contains("inline-result")) {
          const resultbox = inline.dataset.roll;
          const roll = Roll.fromJSON(decodeURI(resultbox).replaceAll("%3A", ":").replaceAll("%2C", ",").replaceAll("%2B", "+"))
          game.dice3d.showForRoll(roll);
        }
        inline = inline.nextElementSibling;
      }
    }

    await message.update({"content": newContent})
  }

  static async _onAttackOption(event) {
    event.preventDefault();

    // Extract card data
    const button = event.currentTarget;
    const id = button.dataset.id;
    const mode = button.classList[2]

    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message =  game.messages.get(messageId);

    if (game.user.role < 2 || (game.user.role < 3 && game.user.id != message.data.user))
      return;

    const modeRegex = new RegExp("mode-select " + id + " (core|favor|conflict|disfavor)", 'g');
    const modeString = "mode-select " + id + " " + mode;

    const newContent = message.data.content.replaceAll(modeRegex, modeString);

    await message.update({"content": newContent})
  }

  static async _onResultOption(event) {
    event.preventDefault();

    // Extract card data
    const button = event.currentTarget;
    const result = button.classList[1];
    const mode = button.classList[2].split("-")[0];
    const current = button.classList[3];
    const replace = current === "false" ? "shown" : "false";

    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message =  game.messages.get(messageId);

    if (game.user.role < 2 || (game.user.role < 3 && game.user.id != message.data.user))
      return;

    const modeRegex = new RegExp(' ' + result + ' ' + mode + "-box " + current, 'g');
    const modeString = " " + result + ' ' + mode + "-box " + replace;

    const optionRegex = new RegExp(' ' + result + ' ' + mode + "-option " + current, 'g');
    const optionString = " " + result + ' ' + mode + "-option " + replace;

    const newContent = message.data.content.replaceAll(modeRegex, modeString).replaceAll(optionRegex, optionString)

    if (current === "false") {
      let inline = button;
      for (var i = 1; i <= 4; i ++) {
        inline = inline.nextElementSibling;
        if (!inline)
          break;
      }
      inline = inline ? inline.children[1] : null;
      while (!!inline) {
        if (inline.classList.contains("inline-result")) {
          const resultbox = inline.dataset.roll;
          const roll = Roll.fromJSON(decodeURI(resultbox).replaceAll("%3A", ":").replaceAll("%2C", ",").replaceAll("%2B", "+"))
          game.dice3d.showForRoll(roll);
        }
        inline = inline.nextElementSibling;
      }
    }

    await message.update({"content": newContent})
  }

  async _RunPower(power) {
    if (power.data.effect.exists)
      await this._RunEffect(deepClone(power));
    if (power.data.attack.exists)
      await this._RunAttack(deepClone(power));
      if (power.data.attack.off)
        await this._RunOffAttack(deepClone(power));
  }

  async _RunEffect(power) {
    power.data.effect.rolls = power.data.effect.text.includes("[[");

    power.data.tempeffect = power.data.effect.text ? this._PrepareInlineRolls(power, power.data.effect.text, power.data.damagebonus) : "";

    let targets = [];
    let offtargets = [];
    let targetnames = "";

    if (game.user.targets.size > 0){
      for (let target of game.user.targets) {
        targets.push({"name": target.name,
                      "id": target.data._id});
        targetnames = targetnames + target.name + ", ";
      }
    }
    else {
      targets.push({"name": "Unknown Target",
                    "id": ""});
      targetnames = "Unknown Target, "
    }
    targetnames = targetnames.substring(0, targetnames.length - 2);

    const effect = this._RollOnce(power.data.tempeffect);

    const template = `systems/aetrimonde_v0_8_x/templates/chat/effect-output-card.html`;
    const templateData = {
      "power": power,
      "effect": effect,
      "targetnames": targetnames
    };
    const content = await renderTemplate(template, templateData);

    const chatData = {
      user: game.user.id,
      content: content,
      speaker: {
        actor: this.actor.id,
        token: this.actor.token,
        alias: this.actor.name
      }
    };
    const rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData.whisper = [game.user.id];
    if (rollMode === "blindroll") chatData.blind = true;
    ChatMessage.create(chatData);
  }

  async _RunAttack(power) {
    power.data.hit.rolls = power.data.hit.text.includes("[[");
    power.data.miss.rolls = power.data.miss.text.includes("[[");
    power.data.special.rolls = power.data.special.text.includes("[[");

    power.data.mainhit = power.data.hit.text ? this._PrepareInlineRolls(power, this._SingleWeapon(power.data.hit.text, "main"), power.data.damagebonus) : "";
    power.data.maincrit = power.data.crit.text ? this._PrepareInlineRolls(power, power.data.crit.text, power.data.damagebonus) : "";
    power.data.mainmiss = power.data.miss.text ? this._PrepareInlineRolls(power, power.data.miss.text, power.data.damagebonus) : "";
    power.data.mainspecial = power.data.special.text ? this._PrepareInlineRolls(power, power.data.special.text, power.data.damagebonus) : "";

    let targets = [];
    let offtargets = [];
    let targetnames = "";
    if (game.user.targets.size > 0){
      for (let target of game.user.targets) {
        targets.push({"name": target.name,
                      "id": target.data._id,
                      "rolls": this._RollOnceCore(power.data.attack.bonus, power.data.attack.hasthreat)});
        targetnames = targetnames + (target.actor.data.shortname ? target.actor.data.shortname : target.actor.name) + ", ";
      }
    }
    else {
      targets.push({"name": "Unknown Target",
                    "id": "",
                    "rolls": this._RollOnceCore(power.data.attack.bonus, power.data.attack.hasthreat)});
      targetnames = "Unknown Target, ";
    }
    targetnames = targetnames.substring(0, targetnames.length - 2);

    const template = `systems/aetrimonde_v0_8_x/templates/chat/attack-output-card.html`;

    if (power.data.range.includes("Area") || power.data.range.includes("Close")) {
      const critcontent = [{"source": "Critical Hit", "content": this._RollOnce(this._MakeCrit(power.data.mainhit))}];
      for (let content of power.data.critcontent) {
        critcontent.push({"source": content.source, "content": this._RollOnce(this._PrepareInlineRolls(power, content.criteffect, {"feat": 0, "itemb": 0, "misc": 0}))});
      }

      const templateData = {
        "power": power,
        "targets": targets,
        "hit": this._RollOnce(power.data.mainhit),
        "miss": this._RollOnce(power.data.mainmiss),
        "crit": critcontent,
        "special": this._RollOnce(power.data.mainspecial)
      };
      const content = await renderTemplate(template, templateData);

      const chatData = {
        user: game.user.id,
        content: content,
        speaker: {
          actor: this.actor.id,
          token: this.actor.token,
          alias: this.actor.name
        }
      };
      const rollMode = game.settings.get("core", "rollMode");
      if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
      if (rollMode === "selfroll") chatData.whisper = [game.user.id];
      if (rollMode === "blindroll") chatData.blind = true;
      ChatMessage.create(chatData);
    }
    else {
      for (let target of targets) {
        const critcontent = [{"source": "Critical Hit", "content": this._RollOnce(this._MakeCrit(power.data.mainhit))}];
        for (let content of power.data.critcontent) {
          critcontent.push({"source": content.source, "content": this._RollOnce(this._PrepareInlineRolls(power, content.criteffect, {"feat": 0, "itemb": 0, "misc": 0}))});
        }

        const templateData = {
          "power": power,
          "targets": [target],
          "hit": this._RollOnce(power.data.mainhit),
          "miss": this._RollOnce(power.data.mainmiss),
          "crit": critcontent,
          "special": this._RollOnce(power.data.mainspecial)
        };
        const content = await renderTemplate(template, templateData);

        const chatData = {
          user: game.user.id,
          content: content,
          speaker: {
            actor: this.actor.id,
            token: this.actor.token,
            alias: this.actor.name
          }
        };
        const rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
        if (rollMode === "selfroll") chatData.whisper = [game.user.id];
        if (rollMode === "blindroll") chatData.blind = true;
        ChatMessage.create(chatData);
      }
    }

  }

  async _RunOffAttack(power) {
    power.data.hit.rolls = power.data.hit.text.includes("[[");
    power.data.miss.rolls = power.data.miss.text.includes("[[");
    power.data.special.rolls = power.data.special.text.includes("[[");

    power.data.offhit = power.data.hit.text ? this._PrepareInlineRolls(power, this._SingleWeapon(power.data.hit.text, "off"), power.data.damagebonus) : "";
    power.data.offcrit = power.data.crit.text ? this._PrepareInlineRolls(power, power.data.crit.text, power.data.damagebonus) : "";
    power.data.offmiss = power.data.miss.text ? this._PrepareInlineRolls(power, power.data.miss.text, power.data.damagebonus) : "";
    power.data.offspecial = power.data.special.text ? this._PrepareInlineRolls(power, power.data.special.text, power.data.damagebonus) : "";

    let targets = [];
    let offtargets = [];
    let targetnames = "";
    if (game.user.targets.size > 0){
      for (let target of game.user.targets) {
        targets.push({"name": target.name,
                      "id": target.data._id,
                      "rolls": this._RollOnceCore(power.data.attack.offbonus, power.data.attack.hasoffthreat)});
        targetnames = targetnames + (target.actor.data.shortname ? target.actor.data.shortname : target.actor.name) + ", ";
      }
    }
    else {
      targets.push({"name": "Unknown Target",
                    "id": "",
                    "rolls": this._RollOnceCore(power.data.attack.offbonus, power.data.attack.hasoffthreat)});
      targetnames = "Unknown Target, ";
    }
    targetnames = targetnames.substring(0, targetnames.length - 2);

    const template = `systems/aetrimonde_v0_8_x/templates/chat/attack-off-output-card.html`;

    if (power.data.range.includes("Area") || power.data.range.includes("Close")) {
      const critcontent = [{"source": "Critical Hit", "content": this._RollOnce(this._MakeCrit(power.data.offhit))}];
      for (let content of power.data.critcontent) {
        critcontent.push({"source": content.source, "content": this._RollOnce(this._PrepareInlineRolls(power, content.criteffect, {"feat": 0, "itemb": 0, "misc": 0}))});
      }

      const templateData = {
        "power": power,
        "targets": targets,
        "hit": this._RollOnce(power.data.offhit),
        "miss": this._RollOnce(power.data.offmiss),
        "crit": critcontent,
        "special": this._RollOnce(power.data.offspecial)
      };
      const content = await renderTemplate(template, templateData);

      const chatData = {
        user: game.user.id,
        content: content,
        speaker: {
          actor: this.actor.id,
          token: this.actor.token,
          alias: this.actor.name
        }
      };
      const rollMode = game.settings.get("core", "rollMode");
      if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
      if (rollMode === "selfroll") chatData.whisper = [game.user.id];
      if (rollMode === "blindroll") chatData.blind = true;
      ChatMessage.create(chatData);
    }
    else {
      for (let target of targets) {
        const critcontent = [{"source": "Critical Hit", "content": this._RollOnce(this._MakeCrit(power.data.offhit))}];
        for (let content of power.data.critcontent) {
          critcontent.push({"source": content.source, "content": this._RollOnce(this._PrepareInlineRolls(power, content.criteffect, {"feat": 0, "itemb": 0, "misc": 0}))});
        }

        const templateData = {
          "power": power,
          "targets": [target],
          "hit": this._RollOnce(power.data.offhit),
          "miss": this._RollOnce(power.data.offmiss),
          "crit": critcontent,
          "special": this._RollOnce(power.data.offspecial)
        };
        const content = await renderTemplate(template, templateData);

        const chatData = {
          user: game.user.id,
          content: content,
          speaker: {
            actor: this.actor.id,
            token: this.actor.token,
            alias: this.actor.name
          }
        };
        const rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
        if (rollMode === "selfroll") chatData.whisper = [game.user.id];
        if (rollMode === "blindroll") chatData.blind = true;
        ChatMessage.create(chatData);
      }
    }

  }

  _PrepareInlineRolls(power, content, dambonus) {
    event.preventDefault();

    const actor = this.actor;
    const actorData = this.actor.data.data;
    const defaultweapon = {
      "weapon": {
        "prof": 0,
        "damage": {
          "feat": 0,
          "itemb": 0,
          "misc": 0
        },
        "dice": "1d4",
        "weaponthreat": false,
        "mvsr": "",
        "quals": ""
      },
      "shield": {
        "damage": {
          "feat": 0,
          "itemb": 0,
          "misc": 0
        },
        "dice": "1d4"
      },
      "equippedanywhere": true
    };

    const mainweapon = power.data.mainequipped ? power.data.mainequipped.data : defaultweapon;
    const offweapon = power.data.offequipped ? power.data.offequipped.data : defaultweapon;

    for (let a of ["STR", "CON", "DEX", "INT", "WIS", "CHA"]) {
      const label = a.toLowerCase();
      content = content.replaceAll("<" + a + ">", actorData.abilities[`${label}`].mod)
    }

    let dstrings = content.match(/\[\[[^\[\]]*?(\d+(d\d+(r\d+)?|<Weapon>|<Main-Weapon>|<Off-Weapon>|<Shield>|<Unarmed>) *(\+ *){0,1})*[^\[\]]*?\]\]( additional| extra| critical)?/g);
    if (dstrings) {
      for (let dstring of dstrings) {
        let rstring = dstring.replaceAll("d", "d");
        let dstringdambonus = power.data.damagebonus;
        let subcontent = dstring.match(/\[\[[^\[\]]*?<(Weapon|Main-Weapon)>[^\[\]]*?\]\]/g);
        if (subcontent) {
          let equippedCount = mainweapon.weapon.effectivedice.match(/\d+(?=d)/g);
          let equippedDice = mainweapon.weapon.effectivedice.match(/(?<=d).+/g);
          for (let string of subcontent) {
            const weapon = string.match(/\d<(Weapon|Main-Weapon)>/g)[0];
            const count = weapon.match(/\d+(?=<)/g);
            const replacement = equippedCount * count + "d" + equippedDice;
            const restring = string.replaceAll(weapon, replacement);
            const matchstring = string.replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("+", "\\+")
            rstring = rstring.replaceAll(RegExp(matchstring, "g"), restring);
          }
        }
        subcontent = rstring.match(/\[\[[^\[\]]*?<Off-Weapon>[^\[\]]*?\]\]/g);
        if (subcontent) {
          let equippedCount = offweapon.weapon.effectivedice.match(/\d+(?=d)/g);
          let equippedDice = offweapon.weapon.effectivedice.match(/(?<=d).+/g);
          for (let string of subcontent) {
            const weapon = string.match(/\d<(Off-Weapon)>/g)[0];
            const count = weapon.match(/\d+(?=<)/g);
            const replacement = equippedCount * count + "d" + equippedDice;
            const restring = string.replaceAll(weapon, replacement);
            const matchstring = string.replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("+", "\\+")
            rstring = rstring.replaceAll(RegExp(matchstring, "g"), restring);
          }
        }
        subcontent = rstring.match(/\[\[[^\[\]]*?<Shield>[^\[\]]*?\]\]/g);
        if (subcontent) {
          let equippedCount = mainweapon.shield.dice.match(/\d+(?=d)/g);
          let equippedDice = mainweapon.shield.dice.match(/(?<=d).+/g);
          for (let string of subcontent) {
            const weapon = string.match(/\d<(Shield)>/g)[0];
            const count = weapon.match(/\d+(?=<)/g);
            const replacement = equippedCount * count + "d" + equippedDice;
            const restring = string.replaceAll(weapon, replacement);
            const matchstring = string.replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("+", "\\+")
            rstring = rstring.replaceAll(RegExp(matchstring, "g"), restring);
          }
        }
        subcontent = rstring.match(/\[\[[^\[\]]*?<Unarmed>[^\[\]]*?\]\]/g);
        if (subcontent) {
          let equippedCount = mainweapon.weapon.effectivedice.match(/\d+(?=d)/g);
          let equippedDice = mainweapon.weapon.effectivedice.match(/(?<=d).+/g);
          for (let string of subcontent) {
            const weapon = string.match(/\d<(Unarmed)>/g)[0];
            const count = weapon.match(/\d+(?=<)/g);
            const replacement = equippedCount * count + "d" + equippedDice;
            const restring = string.replaceAll(weapon, replacement);
            const matchstring = string.replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("+", "\\+")
            rstring = rstring.replaceAll(RegExp(matchstring, "g"), restring);
          }
        }
        dstringdambonus = dstringdambonus ? dstringdambonus : {"feat": 0, "itemb": 0, "misc": 0}
        const totaldambonus = parseInt(dstringdambonus.feat) + parseInt(dstringdambonus.itemb) + parseInt(dstringdambonus.misc);
        if (!dstring.match(/(additional|extra|critical)/g) && totaldambonus) {
          rstring = rstring.replace(/\]\]/g, " + " + totaldambonus + "]]");
        }
        content = content.replace(dstring, rstring);
      }
    }

    return content;
  }

  _RollOnce(content) {
    let fContent = content;
    let dContent = content;
    let cContent = content;
    const rolls = content.match(/(?<=\[\[).*?(?=\]\])/g);

    let singleRolls = [];
    if (rolls) {
      for (let roll of rolls) {
        const flat = !roll.match(/\dd\d/g);
        let rollMatch = "[[" + roll + "]]";
        const roll1 = new Roll(roll).evaluate();
        const roll2 = new Roll(roll).evaluate();
        const roll3 = new Roll(roll).evaluate();

        const result1 = roll1._total;
        const result2 = roll2._total;
        const result3 = roll3._total;
        const allrolls = [roll1, roll2, roll3];
        const froll = roll1._total >= roll2._total ? 1 : 2;
        const droll = roll1._total <= roll2._total ? 1 : 2;
        let croll = 0;
        if (roll3._total >= allrolls[froll-1]._total) {
          croll = froll;
        }
        else if (roll3._total <= allrolls[droll-1]._total) {
          croll = droll;
        }
        else {
          croll = 3;
        }
        const frollobj = {
          "class":"Roll",
          "options": {},
          "dice":[],
          "formula":"{" + roll + "," + roll + "}dl1",
          "terms":[{
            "class":"PoolTerm",
            "options":{},
            "evaluated": true,
            "terms": [roll, roll],
            "modifiers": ["dl1"],
            "rolls": [roll1, roll2],
            "total": Math.max(roll1._total, roll2._total),
            "results":[{
              "result":roll1._total,
              "active":roll1._total >= roll2._total,
              "discarded":!(roll1._total >= roll2._total)
            },
            {
              "result":roll2._total,
              "active":!(roll1._total >= roll2._total),
              "discarded":roll1._total >= roll2._total
            }]
          }],
          "total": Math.max(roll1._total, roll2._total),
          "evaluated": true
        }
        const drollobj = {
          "class":"Roll",
          "options": {},
          "dice":[],
          "formula":"{" + roll + "," + roll + "}dh1",
          "terms":[{
            "class":"PoolTerm",
            "options":{},
            "evaluated": true,
            "terms": [roll, roll],
            "modifiers": ["dl1"],
            "rolls": [roll1, roll2],
            "total": Math.min(roll1._total, roll2._total),
            "results":[{
              "result":roll1._total,
              "active":roll1._total <= roll2._total,
              "discarded":!(roll1._total <= roll2._total)
            },
            {
              "result":roll2._total,
              "active":!(roll1._total <= roll2._total),
              "discarded":roll1._total <= roll2._total
            }]
          }],
          "total": Math.min(roll1._total, roll2._total),
          "evaluated": true
        }
        const crollobj = {
          "class":"Roll",
          "options": {},
          "dice":[],
          "formula":"{" + roll + "," + roll + "," + roll + "}dl1dh1",
          "terms":[{
            "class":"PoolTerm",
            "options":{},
            "evaluated": true,
            "terms": [roll, roll, roll],
            "modifiers": ["dl1dh1"],
            "rolls": [roll1, roll2, roll3],
            "total":allrolls[croll-1]._total,
            "results":[{
              "result":roll1._total,
              "active":croll === 1,
              "discarded":croll != 1
            },
            {
              "result":roll2._total,
              "active":croll === 2,
              "discarded":croll != 2
            },
            {
              "result":roll3._total,
              "active":croll === 3,
              "discarded":croll != 3
            }]
          }],
          "total":allrolls[croll-1]._total,
          "evaluated": true
        }
        const fresult = Math.max(result1, result2);
        const dresult = Math.min(result1, result2);
        const cresult = (result1 + result2 + result3 - Math.max(result1, result2, result3) - Math.min(result1, result2, result3));

        const singleRoll = {
          "pre": true,
          "text": content.split(rollMatch, 1)[0],
          "flat": flat,
          "core": {
            "result": result1,
            "formula": roll,
            "json": encodeURIComponent(JSON.stringify(roll1))
          },
          "favor": {
            "result": fresult,
            "formula": frollobj.formula,
            "json": encodeURIComponent(JSON.stringify(frollobj))
          },
          "disfavor": {
            "result": dresult,
            "formula": drollobj.formula,
            "json": encodeURIComponent(JSON.stringify(drollobj))
          },
          "conflict": {
            "result": cresult,
            "formula": crollobj.formula,
            "json": encodeURIComponent(JSON.stringify(crollobj))
          }
        }
        singleRolls.push(singleRoll)
        content = content.split(rollMatch);
        content.shift();
        content = content.join(rollMatch);
      }
    }

    singleRolls.push({"post": content});

    return singleRolls;
  }

  _RollOnceCore(bonus, threat = false) {
    bonus = parseInt(bonus);
    const threatmod = threat ? -2 : 0;
    const allRolls = new Roll("4d10 + " + bonus).evaluate();

    const nDie = {
      "class": "Die",
      "options": {},
      "evaluate": true,
      "number": 2,
      "faces": 10,
      "modifiers": [],
      "results": deepClone(allRolls.terms[0].results.slice(0, 2))
    };
    const nroll = {
      "class":"Roll",
      "options": {},
      "dice":[],
      "formula":"2d10 + " + bonus,
      "terms": [nDie].concat(allRolls.terms.slice(1, 3)),
      "total": allRolls.terms[0].results[0].result + allRolls.terms[0].results[1].result + bonus,
      "evaluated": true,
      "crithit": allRolls.terms[0].results[0].result + allRolls.terms[0].results[1].result >= 18 + threatmod,
      "critmiss": allRolls.terms[0].results[0].result + allRolls.terms[0].results[1].result <= 4
    };

    const fdfDie = {
      "class": "Die",
      "options": {},
      "evaluate": true,
      "number": 3,
      "faces": 10,
      "modifiers": [],
      "results": allRolls.terms[0].results.slice(0, 3)
    };
    let min = 0;
    let max = 0;
    for (let i = 0; i < 3; i++) {
      min = fdfDie.results[i].result < fdfDie.results[min].result ? i : min;
      max = fdfDie.results[i].result > fdfDie.results[max].result ? i : max;
      fdfDie.results[i].active = true;
      fdfDie.results[i].discarded = false;
    }
    const fDie = deepClone(fdfDie);
    const dfDie = deepClone(fdfDie);
    fDie.results[min].active = false;
    fDie.results[min].discarded = true;
    fDie.modifiers = ["dl1"];
    dfDie.results[max].active = false;
    dfDie.results[max].discarded = true;
    dfDie.modifiers = ["dh1"];

    const froll = {
      "class":"Roll",
      "options": {},
      "dice":[],
      "formula":"3d10dl1 + " + bonus,
      "terms": [fDie].concat(allRolls.terms.slice(1, 3)),
      "total": allRolls.terms[0].results[0].result + allRolls.terms[0].results[1].result + allRolls.terms[0].results[2].result - allRolls.terms[0].results[min].result + bonus,
      "evaluated": true,
      "crithit": allRolls.terms[0].results[0].result + allRolls.terms[0].results[1].result + allRolls.terms[0].results[2].result - allRolls.terms[0].results[min].result >= 18 + threatmod,
      "critmiss": allRolls.terms[0].results[0].result + allRolls.terms[0].results[1].result + allRolls.terms[0].results[2].result - allRolls.terms[0].results[min].result <= 4
    }
    const dfroll = {
      "class":"Roll",
      "options": {},
      "dice":[],
      "formula":"3d10dh1 + " + bonus,
      "terms": [dfDie].concat(allRolls.terms.slice(1, 3)),
      "total": allRolls.terms[0].results[0].result + allRolls.terms[0].results[1].result + allRolls.terms[0].results[2].result - allRolls.terms[0].results[max].result + bonus,
      "evaluated": true,
      "crithit": allRolls.terms[0].results[0].result + allRolls.terms[0].results[1].result + allRolls.terms[0].results[2].result - allRolls.terms[0].results[max].result >= 18 + threatmod,
      "critmiss": allRolls.terms[0].results[0].result + allRolls.terms[0].results[1].result + allRolls.terms[0].results[2].result - allRolls.terms[0].results[max].result <= 4
    }

    const cDie = {
      "class": "Die",
      "options": {},
      "evaluate": true,
      "number": 4,
      "faces": 10,
      "modifiers": ["dl1", "dh1"],
      "results": allRolls.terms[0].results
    };
    min = 0;
    max = 0;
    for (let i = 0; i < 4; i++) {
      min = cDie.results[i].result < cDie.results[min].result ? i : min;
      max = cDie.results[i].result > cDie.results[max].result ? i : max;
      cDie.results[i].active = true;
      cDie.results[i].discarded = false;
    }
    cDie.results[min].active = false;
    cDie.results[min].discarded = true;
    cDie.results[max].active = false;
    cDie.results[max].discarded = true;
    cDie.modifiers = ["dl1", "dh1"];

    const croll = {
      "class":"Roll",
      "options": {},
      "dice":[],
      "formula":"4d10dl1dh1 + " + bonus,
      "terms": [cDie].concat(allRolls.terms.slice(1, 3)),
      "total": allRolls.terms[0].results[0].result + allRolls.terms[0].results[1].result + allRolls.terms[0].results[2].result + allRolls.terms[0].results[3].result - allRolls.terms[0].results[min].result - allRolls.terms[0].results[max].result + bonus,
      "evaluated": true,
      "crithit": allRolls.terms[0].results[0].result + allRolls.terms[0].results[1].result + allRolls.terms[0].results[2].result + allRolls.terms[0].results[3].result - allRolls.terms[0].results[min].result - allRolls.terms[0].results[max].result >= 18 + threatmod,
      "critmiss": allRolls.terms[0].results[0].result + allRolls.terms[0].results[1].result + allRolls.terms[0].results[2].result + allRolls.terms[0].results[3].result - allRolls.terms[0].results[min].result - allRolls.terms[0].results[max].result <= 4
    }

    const rolls = {
      "core": {
        "result": nroll.total,
        "formula": nroll.formula,
        "crithit": nroll.crithit,
        "critmiss": nroll.critmiss,
        "json": encodeURIComponent(JSON.stringify(nroll))
      },
      "favor": {
        "result": froll.total,
        "formula": froll.formula,
        "crithit": froll.crithit,
        "critmiss": froll.critmiss,
        "json": encodeURIComponent(JSON.stringify(froll))
      },
      "disfavor": {
        "result": dfroll.total,
        "formula": dfroll.formula,
        "crithit": dfroll.crithit,
        "critmiss": dfroll.critmiss,
        "json": encodeURIComponent(JSON.stringify(dfroll))
      },
      "conflict": {
        "result": croll.total,
        "formula": croll.formula,
        "crithit": croll.crithit,
        "critmiss": croll.critmiss,
        "json": encodeURIComponent(JSON.stringify(croll))
      }
    }

    return rolls;
  }

  _MakeCrit(content, mode, main = false, off = false) {
    content = content ? content : "";

    const actorData = this.actor.data.data;

    content = content.replace(/\[\[\/r */g, "[[");
    if (content.match(/\[\[.*\]\].*and\/or.*\[\[.*\]\]/g)) {
      if (off) {
        content = content.replace(/\[\[.*\]\].*and\/or.*(?=\[\[)/g, "").replace(", depending on which attack(s) hit", "");
      } else if (main) {
        content = content.replace(/(?<=\]\]).*and\/or.*\[\[.*\]\]/g, "").replace(", depending on which attack(s) hit", "");
      }
    }

    const rolls = content.match(/(?<=\[\[).*?(?=\]\])/g)

    if (rolls != null) {
      let uniqueRolls = rolls.filter(function (value, index, self) {return self.indexOf(value) === index; });
      let prefix = "";
      uniqueRolls.forEach(function(roll, index) {
        if (roll.includes("/r ")) {
          roll = roll.replace("/r ", "");
          prefix = "/r ";
        }
        let rollMatch = "[[" + prefix + roll + "]]";
        let fRoll = "[[" + prefix + roll.replaceAll(/(?<=\d)d(?=\d)/g, "*").replaceAll(/r\d*/g, "") + "]]";
        content = content.replaceAll(rollMatch, fRoll);
      });
    }

    return content;
  }

  _SingleWeapon(content, mode) {
    if (content.match(/\[\[.*\]\].*and\/or.*\[\[.*\]\]/g)) {
      if (mode === "off") {
        return(content.replace(/\[\[.*\]\].*and\/or.*(?=\[\[)/g, "").replace(", depending on which attack(s) hit", ""));
      } else {
        return(content.replace(/(?<=\]\]).*and\/or.*\[\[.*\]\]/g, "").replace(", depending on which attack(s) hit", ""));
      }
    }
    return(content);
  }
}
