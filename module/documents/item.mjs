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
    // if (itemData.type === 'power') this._preparePowerData(itemData);
    // if (itemData.type === 'equipment') this._prepareEquipmentData(itemData);
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
    // if (actorData) {
    //   // if (this.data.data.slot.value === "held" && this.data.data.isweapon && this.data.data.hands.value === "2h") {
    //   //   if ((actorData.equipped.mainhand === this._id && actorData.equipped.offhand != this._id))
    //   // }
    //   const newEquipment = actorData.equipped;
    //   for (let slot in newEquipment) {
    //     newEquipment[`${slot}`] = (newEquipment[`${slot}`] != this._id || (slot.includes(data.slot.value) || (data.slot.value === "held" && ["mainhand", "offhand"].includes(slot)))) ? newEquipment[`${slot}`] : "";
    //   }
    //   this.actor.update({"data.equipped": newEquipment});
    //
    //   data.equipped = data.slot.value != "held" ? (data.slot.value === "noslot" || (data.slot.value === "ring" && (actorData.equipped.ring1 === this._id || actorData.equipped.ring2 === this._id)) || this._id === actorData.equipped[`${data.slot.value}`]) : false;
    //   data.equippedmh = (this._id === actorData.equipped.mainhand);
    //   data.equippedoh = (this._id === actorData.equipped.offhand);
    //   data.equippedanywhere = data.equipped || data.equippedmh || data.equippedoh;
    //   if (data.isweapon && data.slot.value === "held" && data.weapon.hands.value === "2h" && data.equippedanywhere && (!data.equippedmh || !data.equippedoh)) {
    //     data.warning = true;
    //     data.warningmessage = "This weapon requires two hands to wield properly."
    //   }
    //   data.npcowner = this.actor.data.type === "npc";
    // }

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
