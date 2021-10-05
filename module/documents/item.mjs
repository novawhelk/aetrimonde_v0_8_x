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
        data.power.attack.vslabel = (data.power.attack.vsdefense != "") ? data.defenses[`${data.power.attack.vsdefense}`].slabel : "";
        data.power.critcontent = [];
        if (data.power.crit) {
          data.power.critcontent.push({"source": this.name + "Power Critical:", "criteffect": data.power.crit.text});
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
      if (data.crit) {
        data.critcontent.push({"source": this.name + " Critical:", "criteffect": data.crit.text});
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
          data.critcontent.push({"source": "Critical Potential:", "criteffect": "[[1<Weapon>]] extra damage."})
        }
        if (mainweapon.data.relatedprops && mainweapon.data.critprops) {
          data.critcontent.push({"source": mainweapon.name + " Critical:", "criteffect": mainweapon.data.critprops})
        }
        if (data.attack.off && offweapon.data.weapon.quals.critpotential) {
          data.critcontent.push({"source": "Critical Potential:", "criteffect": "[[1<Weapon>]] extra damage."})
        }
        if (data.attack.off && offweapon.data.relatedprops && offweapon.data.critprops) {
          data.critcontent.push({"source": offweapon.name + " Critical:", "criteffect": offweapon.data.critprops})
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
          data.critcontent.push({"source": "High Crit Weapon:", "criteffect": "[[1<Weapon>]] extra damage."})
        }
        if (unarmedattack.data.relatedprops && unarmedattack.data.critprops) {
          data.critcontent.push({"source": unarmedattack.name + " Critical:", "criteffect": unarmedattack.data.critprops})
        }

        data.warning = data.relevantitems && !data.mainitem;
        data.warningmessage = "You have alternate unarmed attacks; you might need to select one."
        const attbonus = this._powerAttackBonus(this.data, unarmedattack.data.weapon);
        data.attack.prof = unarmedattack.data.weapon.prof;
        data.attack.feat = attbonus.feat;
        data.attack.itemb = attbonus.itemb;
        data.attack.misc = attbonus.misc;
        data.attack.bonus = mod + data.attack.prof + data.attack.feat + data.attack.itemb + data.attack.misc + data.attack.powermisc;
        data.attack.hasthreat = unarmedattack.data.weaponthreat ? true : data.attack.hasthreat;

        data.damagebonus = this._powerDamageBonus(this.data, unarmedattack.data.weapon);
        data.autoprof = true;
        data.unarmed = true;
        data.autoweapon = true;
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
      weaponattack.data.critcontent.push({"source": "High Crit Weapon:", "criteffect": "[[1<Weapon>]] extra damage."})
    }
    if (weapon.data.relatedprops && weapon.data.critprops) {
      weaponattack.data.critcontent.push({"source": weapon.name + " Critical:", "criteffect": weapon.data.critprops})
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
      power.data.powertype = power.data.powertype ? power.data.powertypes[`${power.data.powertype}`].label : "";
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
      }
      item.data.power.effect.text = item.data.power.effect.text.replaceAll("[[", "").replaceAll("]]", "");
      item.data.power.hit.text = item.data.power.hit.text.replaceAll("[[", "").replaceAll("]]", "");
      item.data.power.crit.text = item.data.power.crit.text.replaceAll("[[", "").replaceAll("]]", "");
      item.data.power.miss.text = item.data.power.miss.text.replaceAll("[[", "").replaceAll("]]", "");
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
      this._RunEffect(deepClone(this.data), onlythis);
    }
    else if (this.type === "equipment") {
      if (mode === "weaponattack" && this.data.data.isweapon) {
        this._RunEffect(this._weaponAttack(), onlythis);
      }
      else if (mode === "itempower" && this.data.data.relatedpower) {
        const itempower = {"name": this.name + " Power", "data": deepClone(this.data.data.power)};
        this._RunEffect(itempower, onlythis);
      }
    }
  }

  static chatListeners(html) {
    html.on('click', '.chat-card .favor-option', this._onChatCardOption.bind(this));
    html.on('click', '.chat-card .conflict-option', this._onChatCardOption.bind(this));
    html.on('click', '.chat-card .disfavor-option', this._onChatCardOption.bind(this));
  }

  static async _onChatCardOption(event) {
    event.preventDefault();

    // Extract card data
    const button = event.currentTarget;
    const mode = button.classList[1].split("-")[0]

    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message =  game.messages.get(messageId);

    const modeRegex = new RegExp(' ' + mode + "-box false", 'g');
    const modeString = " " + mode + "-box";

    const optionRegex = new RegExp(' ' + mode + "-option false", 'g');
    const optionString = " " + mode + "-option shown";

    const newContent = message.data.content.replaceAll(modeRegex, modeString).replaceAll(optionRegex, optionString);

    await message.update({"content": newContent})
  }

  async _RunEffect(power, onlythis) {
    power.data.effect.text = power.data.effect.text ? this._PrepareInlineRolls(power, power.data.effect.text, power.data.damagebonus) : "";
    power.data.hit.text = power.data.hit.text ? this._PrepareInlineRolls(power, power.data.hit.text, power.data.damagebonus) : "";
    power.data.crit.text = power.data.crit.text ? this._PrepareInlineRolls(power, power.data.crit.text, power.data.damagebonus) : "";
    power.data.miss.text = power.data.miss.text ? this._PrepareInlineRolls(power, power.data.miss.text, power.data.damagebonus) : "";
    power.data.maintain.text = power.data.maintain.text ? this._PrepareInlineRolls(power, power.data.maintain.text, power.data.damagebonus) : "";
    power.data.special.text = power.data.special.text ? this._PrepareInlineRolls(power, power.data.special.text, power.data.damagebonus) : "";

    power.data.powerlabel = power.data.powertype ? power.data.powertypes[`${power.data.powertype}`].label : ""

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

    const effect = this._RollOnce(power.data.effect.text);
    debugger;

    const template = `systems/aetrimonde_v0_8_x/templates/chat/effect-output-card.html`;
    const templateData = {
      "power": power,
      "effect": effect,
      "targetnames": targetnames
    };
    const content = await renderTemplate(template, templateData);

    const chatData = {
      user: game.user._id,
      content: content,
      speaker: {
        actor: this.actor._id,
        token: this.actor.token,
        alias: this.actor.name
      }
    };
    const rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData.whisper = [game.user._id];
    if (rollMode === "blindroll") chatData.blind = true;
    await ChatMessage.create(chatData);
  }

  async _RunAttack(event) {
    let power = JSON.parse(event.currentTarget.dataset.power);

    power.data.effect.text = power.data.effect.text ? this._PrepareInlineRolls(power, power.data.effect.text, power.data.damagebonus) : "";
    power.data.hit.text = power.data.hit.text ? this._PrepareInlineRolls(power, power.data.hit.text, power.data.damagebonus) : "";
    power.data.crit.text = power.data.crit.text ? this._PrepareInlineRolls(power, power.data.crit.text, power.data.damagebonus) : "";
    power.data.miss.text = power.data.miss.text ? this._PrepareInlineRolls(power, power.data.miss.text, power.data.damagebonus) : "";
    power.data.maintain.text = power.data.maintain.text ? this._PrepareInlineRolls(power, power.data.maintain.text, power.data.damagebonus) : "";
    power.data.special.text = power.data.special.text ? this._PrepareInlineRolls(power, power.data.special.text, power.data.damagebonus) : "";

    let targets = [];
    let offtargets = [];
    let targetnames = "";
    if (game.user.targets.size > 0){
      for (let target of game.user.targets) {
        targets.push({"name": target.actor.data.shortname ? target.actor.data.shortname : target.actor.name,
                      "id": target.data._id});
        targetnames = targetnames + (target.actor.data.shortname ? target.actor.data.shortname : target.actor.name) + ", ";
      }
    }
    else {
      targets.push({"name": "Unknown Target",
                    "id": ""});
      targetnames = "Unknown Target, ";
    }
    if (power.data.attack.off && !event.currentTarget.dataset.nooff) {
      offtargets = JSON.parse(JSON.stringify(targets));
    }
    if (event.currentTarget.dataset.nomain) {
      targets = [];
    }
    targetnames = targetnames.substring(0, targetnames.length - 2);

    const template = `systems/aetrimonde_v0_8_x/templates/chat/attack-option-card.html`;
    const templateData = {
      "power": power,
      "greater": power.data.powertype === "greater",
      "targets": targets ? targets : [],
      "offtargets": offtargets ? offtargets : [],
      "targetnames": targetnames
    };
    const content = await renderTemplate(template, templateData);
    let d = new Dialog({
      title: "Attack Options",
      content: content,
      buttons: {
        one: {
          label: "Roll Attacks",
          callback: html => this._runHitMiss(templateData, html.find('.target-line'), html.find('.expend-power'))
        }
      }
    }).render(true);
  }

  async _outputEffects(data, html, expendPower) {
    if (expendPower.length === 1) {
      if (expendPower[0].checked) {
        if (data.power.data.powertype === "greater") {
          this.actor.update({"data.gpower.value": Math.max(this.actor.data.data.gpower.value - 1, 0)});
        }
      }
    }
    let mode = "core";
    if (html) {
      const target = html[0].children;
      if (target[1].children[0].checked) {
        mode = "core";
      }
      else if (target[2].children[0].checked) {
        mode = "favor";
      }
      else if (target[3].children[0].checked) {
        mode = "conflict";
      }
      else {
        mode = "disfavor";
      }
    }

    data.power.data.effect.text = this._ApplyFavorDisfavor(data.power.data.effect.text, mode);

    if (!data.cont) {
      data.power.data.hit.text = data.power.data.hit.text.replaceAll("[[", "").replaceAll("]]", "");
      data.power.data.crit.text = data.power.data.crit.text.replaceAll("[[", "").replaceAll("]]", "");
      data.power.data.miss.text = data.power.data.miss.text.replaceAll("[[", "").replaceAll("]]", "");
    }

    if (!data.power.data.attack.exists || !data.cont) {
      const template = `systems/aetrimonde_v0_8_x/templates/chat/effect-card.html`;
      const chatHtml = await renderTemplate(template, data);

      const chatData = {
        user: game.user._id,
        content: chatHtml,
        speaker: {
          actor: this.actor._id,
          token: this.actor.token,
          alias: this.actor.name
        }
      };
      const rollMode = game.settings.get("core", "rollMode");
      if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
      if (rollMode === "selfroll") chatData.whisper = [game.user._id];
      if (rollMode === "blindroll") chatData.blind = true;
      await ChatMessage.create(chatData);
    }
    else {
      if (data.power.data.attack.off && !data.nooff) {
        data.offtargets = JSON.parse(JSON.stringify(data.targets));
      }
      if (data.nomain) {
        data.targets = [];
      }
      data.showeffect = data.power.data.effect.text;
      const template = `systems/aetrimonde_v0_8_x/templates/chat/attack-option-card.html`
      const content = await renderTemplate(template, data);
      let d = new Dialog({
        title: "Attack Options",
        content: content,
        buttons: {
          one: {
            label: "Roll Attacks",
            callback: html => this._runHitMiss(data, html.find('.target-line'), html.find('.expend-power'))
          }
        }
      }).render(true);
    }
  }

  async _runHitMiss(data, oldhtml, expendPower) {
    if (expendPower.length === 1) {
      if (expendPower[0].checked) {
        if (data.power.data.powertype === "greater") {
          this.actor.update({"data.gpower.value": Math.max(this.actor.data.data.gpower.value - 1, 0)});
        }
      }
    }
    let i = 0;
    const nummain = data.targets.length;
    while (i < oldhtml.length) {
      const target = oldhtml[i].children;

      const relevanttarget = (!oldhtml[i].className.includes("off-hand") ? data.targets[i] : data.offtargets[i - nummain]);
      const relevantbonus = (!oldhtml[i].className.includes("off-hand") ? data.power.data.attack.bonus : data.power.data.attack.offbonus);
      const relevantthreat = (!oldhtml[i].className.includes("off-hand") ? data.power.data.attack.hasthreat : data.power.data.attack.offthreat);
      if (target[1].children[0].checked) {
        relevanttarget.mode = "core";
        relevanttarget.roll = new Roll("2d10 + " + relevantbonus).evaluate();
      }
      else if (target[2].children[0].checked) {
        relevanttarget.mode = "favor";
        relevanttarget.roll = new Roll("3d10dl1 + " + relevantbonus).evaluate();
      }
      else if (target[3].children[0].checked) {
        relevanttarget.mode = "conflict";
        relevanttarget.roll = new Roll("4d10dl1dh1 + " + relevantbonus).evaluate();
      }
      else {
        relevanttarget.mode = "disfavor";
        relevanttarget.roll = new Roll("3d10dh1 + " + relevantbonus).evaluate()
      }
      relevanttarget.rolltotal = relevanttarget.roll._total;
      relevanttarget.rolljson = escape(JSON.stringify(relevanttarget.roll));
      if (relevanttarget.roll._total - relevantbonus >= (relevantthreat ? 16 : 18)) {
        relevanttarget.crithit = true;
      }
      else if (relevanttarget - relevantbonus <= 4) {
        relevanttarget.critmiss = false;
      }
      relevanttarget.vs = data.power.data.attack.vslabel;
      i = i + 1;
    }

    const chattemplate = `systems/aetrimonde_v0_8_x/templates/chat/attack-card.html`;
    const chathtml = await renderTemplate(chattemplate, data);
    const chatData = {
      user: game.user._id,
      content: chathtml,
      speaker: {
        actor: this.actor._id,
        token: this.actor.token,
        alias: this.actor.name
      }
    };
    const rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData.whisper = [game.user._id];
    if (rollMode === "blindroll") chatData.blind = true;
    await ChatMessage.create(chatData);

    const template = `systems/aetrimonde_v0_8_x/templates/chat/hitmiss-option-card.html`;
    const dialoghtml = await renderTemplate(template, data)
    let d = new Dialog({
      title: "Assign Hits, Favor and Disfavor",
      content: dialoghtml,
      buttons: {
        one: {
          label: "Roll Hits and Misses",
          callback: html => this._outputHitMiss(data, html.find('.target-line'))
        }
      }
    }).render(true);
  }

  async _outputHitMiss(data, html) {
    let i = 0;
    const nummain = data.targets.length;
    const numoff = data.offtargets ? data.offtargets.length : 0;
    const crithits = [];
    const critmisses = [];
    const hits = [];
    const misses = [];

    while (i < html.length) {
      const target = html[i].children;
      const relevanttarget = (!html[i].className.includes("off-hand") ? data.targets[i] : data.offtargets[i - nummain]);
      relevanttarget.main = (i < nummain);
      relevanttarget.off = (i >= nummain);
      if (!data.power.data.attack.exists) {
        if (target[1].children[0].checked) {
          relevanttarget.mode = "core";
        }
        else if (target[2].children[0].checked) {
          relevanttarget.mode = "favor";
        }
        else if (target[3].children[0].checked) {
          relevanttarget.mode = "conflict";
        }
        else {
          relevanttarget.mode = "disfavor";
        }
      }
      else if (!relevanttarget.crithit && !relevanttarget.critmiss) {
        if (target[4].children[0].checked) {
          relevanttarget.mode = "core";
        }
        else if (target[5].children[0].checked) {
          relevanttarget.mode = "favor";
        }
        else if (target[6].children[0].checked) {
          relevanttarget.mode = "conflict";
        }
        else {
          relevanttarget.mode = "disfavor";
        }
        if (target[1].children[0].checked) {
          relevanttarget.hit = "true";
          hits.push(relevanttarget);
        }
        else if (target[2].children[0].checked) {
          relevanttarget.miss = "true";
          misses.push(relevanttarget);
        }
      }
      else {
        if (target[4].children[0].checked) {
          relevanttarget.mode = "core";
        }
        else if (target[5].children[0].checked) {
          relevanttarget.mode = "favor";
        }
        else if (target[6].children[0].checked) {
          relevanttarget.mode = "conflict";
        }
        else {
          relevanttarget.mode = "disfavor";
        }
        if (relevanttarget.crithit) {
          crithits.push(relevanttarget)
        }
        if (relevanttarget.critmiss) {
          critmisses.push(relevanttarget)
        }
      }
      i = i + 1;
    }

    const template = `systems/aetrimonde_v0_8_x/templates/chat/hitmiss-card.html`;

    if (!data.power.data.range.includes("Close") && !data.power.data.range.includes("Area")) {
      for (let content of data.power.data.critcontent) {
        content.criteffect = this._PrepareInlineRolls(data.power, content.criteffect, {"feat": 0, "itemb": 0, "misc": 0})
      }
      for (let t of crithits) {
        const templateData = {
          "type": "Critical Hit",
          "power": data.power,
          "target": t,
          "content": "Critical Hit: " + this._ApplyFavorDisfavor(data.power.data.hit.text, "crit", t.main, t.off),
          "critcontent": data.power.data.critcontent
        }
        const chathtml = await renderTemplate(template, templateData);
        const chatData = {
          user: game.user._id,
          content: chathtml,
          speaker: {
            actor: this.actor._id,
            token: this.actor.token,
            alias: this.actor.name
          }
        };
        const rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
        if (rollMode === "selfroll") chatData.whisper = [game.user._id];
        if (rollMode === "blindroll") chatData.blind = true;
        await ChatMessage.create(chatData);
      }
      for (let t of hits) {
        const templateData = {
          "type": "Hit",
          "power": data.power,
          "target": t,
          "content": "Hit: " + this._ApplyFavorDisfavor(data.power.data.hit.text, t.mode, t.main, t.off)
        }
        const chathtml = await renderTemplate(template, templateData);
        const chatData = {
          user: game.user._id,
          content: chathtml,
          speaker: {
            actor: this.actor._id,
            token: this.actor.token,
            alias: this.actor.name
          }
        };
        const rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
        if (rollMode === "selfroll") chatData.whisper = [game.user._id];
        if (rollMode === "blindroll") chatData.blind = true;
        await ChatMessage.create(chatData);
      }
      if (data.power.data.miss.text) {
        for (let t of misses) {
          const templateData = {
            "type": "Miss",
            "power": data.power,
            "target": t,
            "content": "Miss: " + this._ApplyFavorDisfavor(data.power.data.miss.text, t.mode, t.main, t.off)
          }
          const chathtml = await renderTemplate(template, templateData);
          const chatData = {
            user: game.user._id,
            content: chathtml,
            speaker: {
              actor: this.actor._id,
              token: this.actor.token,
              alias: this.actor.name
            }
          };
          const rollMode = game.settings.get("core", "rollMode");
          if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
          if (rollMode === "selfroll") chatData.whisper = [game.user._id];
          if (rollMode === "blindroll") chatData.blind = true;
          await ChatMessage.create(chatData);
        }
      }
    }
    else {
      const allHits = [{"content": this._RollOnce(data.power.data.hit.text)}];
      const allMisses = [{"content": this._RollOnce(data.power.data.miss.text)}];

      const critcontent = [];
      for (let content of data.power.data.critcontent) {
        critcontent.push({"content": this._RollOnce(this._PrepareInlineRolls(data.power, content.source + content.criteffect, {"feat": 0, "itemb": 0, "misc": 0}))});
      }

      const sortedCrits = {
        "core": "",
        "favor": "",
        "disfavor": "",
        "conflict": ""
      }
      for (let t of crithits) {
        if (t.mode === "core") {
          sortedCrits.core = sortedCrits.core + t.name + ", ";
        }
        else if (t.mode === "favor") {
          sortedCrits.favor = sortedCrits.favor + t.name + ", ";
        }
        else if (t.mode === "disfavor") {
          sortedCrits.disfavor = sortedCrits.disfavor + t.name + ", ";
        }
        else {
          sortedCrits.conflict = sortedCrits.conflict + t.name + ", ";
        }
      }
      sortedCrits.core = sortedCrits.core.slice(0, -2);
      sortedCrits.favor = sortedCrits.favor.slice(0, -2);
      sortedCrits.disfavor = sortedCrits.disfavor.slice(0, -2);
      sortedCrits.conflict = sortedCrits.conflict.slice(0, -2);

      for (let mode in sortedCrits) {
        if (sortedCrits[mode]){
          const templateData = {
            "type": "Critical Hit",
            "power": data.power,
            "hitnames": sortedCrits[mode],
            "content": "Critical Hit: " + this._ApplyFavorDisfavor(data.power.data.hit.text, "crit"),
            "entries": critcontent,
            "core": mode === "core",
            "favor": mode === "favor",
            "disfavor": mode === "disfavor",
            "conflict": mode === "conflict"
          }
          const chathtml = await renderTemplate(template, templateData);
          const chatData = {
            user: game.user._id,
            content: chathtml,
            speaker: {
              actor: this.actor._id,
              token: this.actor.token,
              alias: this.actor.name
            }
          };
          const rollMode = game.settings.get("core", "rollMode");
          if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
          if (rollMode === "selfroll") chatData.whisper = [game.user._id];
          if (rollMode === "blindroll") chatData.blind = true;
          await ChatMessage.create(chatData);
        }
      }

      const sortedHits = {
        "core": "",
        "favor": "",
        "disfavor": "",
        "conflict": ""
      }
      for (let t of hits) {
        if (t.mode === "core") {
          sortedHits.core = sortedHits.core + t.name + ", ";
        }
        else if (t.mode === "favor") {
          sortedHits.favor = sortedHits.favor + t.name + ", ";
        }
        else if (t.mode === "disfavor") {
          sortedHits.disfavor = sortedHits.disfavor + t.name + ", ";
        }
        else {
          sortedHits.conflict = sortedHits.conflict + t.name + ", ";
        }
      }
      sortedHits.core = sortedHits.core.slice(0, -2);
      sortedHits.favor = sortedHits.favor.slice(0, -2);
      sortedHits.disfavor = sortedHits.disfavor.slice(0, -2);
      sortedHits.conflict = sortedHits.conflict.slice(0, -2);

      for (let mode in sortedHits) {
        if (sortedHits[mode]){
          const templateData = {
            "type": "Hit",
            "power": data.power,
            "hitnames": sortedHits[mode],
            "entries": allHits,
            "core": mode === "core",
            "favor": mode === "favor",
            "disfavor": mode === "disfavor",
            "conflict": mode === "conflict"
          }
          const chathtml = await renderTemplate(template, templateData);
          const chatData = {
            user: game.user._id,
            content: chathtml,
            speaker: {
              actor: this.actor._id,
              token: this.actor.token,
              alias: this.actor.name
            }
          };
          const rollMode = game.settings.get("core", "rollMode");
          if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
          if (rollMode === "selfroll") chatData.whisper = [game.user._id];
          if (rollMode === "blindroll") chatData.blind = true;
          await ChatMessage.create(chatData);
        }
      }

      if (data.power.data.miss.text) {
        const sortedMisses = {
          "core": "",
          "favor": "",
          "disfavor": "",
          "conflict": ""
        }
        for (let t of misses) {
          if (t.mode === "core") {
            sortedMisses.core = sortedMisses.core + t.name + ", ";
          }
          else if (t.mode === "favor") {
            sortedMisses.favor = sortedMisses.favor + t.name + ", ";
          }
          else if (t.mode === "disfavor") {
            sortedMisses.disfavor = sortedMisses.disfavor + t.name + ", ";
          }
          else {
            sortedMisses.conflict = sortedMisses.conflict + t.name + ", ";
          }
        }
        sortedMisses.core = sortedMisses.core.slice(0, -2);
        sortedMisses.favor = sortedMisses.favor.slice(0, -2);
        sortedMisses.disfavor = sortedMisses.disfavor.slice(0, -2);
        sortedMisses.conflict = sortedMisses.conflict.slice(0, -2);

        for (let mode in sortedMisses) {
          if (sortedMisses[mode]){
            const templateData = {
              "type": "Miss",
              "power": data.power,
              "hitnames": sortedMisses[mode],
              "entries": allMisses,
              "core": mode === "core",
              "favor": mode === "favor",
              "disfavor": mode === "disfavor",
              "conflict": mode === "conflict"
            }
            const chathtml = await renderTemplate(template, templateData);
            const chatData = {
              user: game.user._id,
              content: chathtml,
              speaker: {
                actor: this.actor._id,
                token: this.actor.token,
                alias: this.actor.name
              }
            };
            const rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
            if (rollMode === "selfroll") chatData.whisper = [game.user._id];
            if (rollMode === "blindroll") chatData.blind = true;
            await ChatMessage.create(chatData);
          }
        }
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

    let dstrings = content.match(/\[\[[^\[\]]*?(\d+(d\d+(r\d+)?|<Weapon>|<Main-Weapon>|<Off-Weapon>|<Shield>|<Unarmed>) *(\+ *){0,1})*[^\[\]]*?\]\]( additional)?/g);
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
          let equippedCount = unarmattack.weapon.effectivedice.match(/\d+(?=d)/g);
          let equippedDice = unarmattack.weapon.effectivedice.match(/(?<=d).+/g);
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
        if (!dstring.includes("additional") && totaldambonus) {
          rstring = rstring.replace(/\]\]/g, " + " + totaldambonus + "]]");
        }
        content = content.replace(dstring, rstring);
      }
    }

    return content;
  }

  _ApplyFavorDisfavor(content, mode, main = false, off = false) {
    event.preventDefault();

    content = content ? content : "";

    const actorData = this.actor.data.data;

    if (content.match(/\[\[.*\]\].*and\/or.*\[\[.*\]\]/g)) {
      if (off) {
        content = content.replace(/\[\[.*\]\].*and\/or.*(?=\[\[)/g, "").replace(", depending on which attack(s) hit", "");
      } else if (main) {
        content = content.replace(/(?<=\]\]).*and\/or.*\[\[.*\]\]/g, "").replace(", depending on which attack(s) hit", "");
      }
    }

    const rolls = content.match(/(?<=\[\[).*?(?=\]\])/g)
    if (mode === "favor") {
      if (rolls != null) {
        let uniqueRolls = rolls.filter(function (value, index, self) {return self.indexOf(value) === index; });
        let prefix = "";
        uniqueRolls.forEach(function(roll, index) {

          if (roll.includes("/r ")) {
            roll = roll.replace("/r ", "");
            prefix = "/r ";
          }
          let rollMatch = "[[" + prefix + roll + "]]";
          let fRoll = "[[" + prefix + "{" + roll + "," + roll + "}dl1]]";
          content = content.replaceAll(rollMatch, fRoll);
        });
      }
    }
    else if (mode === "disfavor") {
      if (rolls != null) {
        let uniqueRolls = rolls.filter(function (value, index, self) {return self.indexOf(value) === index; });
        let prefix = "";
        uniqueRolls.forEach(function(roll, index) {

          if (roll.includes("/r ")) {
            roll = roll.replace("/r ", "");
            prefix = "/r ";
          }
          let rollMatch = "[[" + prefix + roll + "]]";
          let fRoll = "[[" + prefix + "{" + roll + "," + roll + "}dh1]]";
          content = content.replaceAll(rollMatch, fRoll);
        });
      }
    }
    else if (mode === "conflict") {
      if (rolls != null) {
        let uniqueRolls = rolls.filter(function (value, index, self) {return self.indexOf(value) === index; });
        let prefix = "";
        uniqueRolls.forEach(function(roll, index) {

          if (roll.includes("/r ")) {
            roll = roll.replace("/r ", "");
            prefix = "/r ";
          }
          let rollMatch = "[[" + prefix + roll + "]]";
          let fRoll = "[[" + prefix + "{" + roll + "," + roll +  "," + roll + "}dl1dh1]]";
          content = content.replaceAll(rollMatch, fRoll);
        });
      }
    }
    else if (mode === "crit") {
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
        debugger;
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
}
