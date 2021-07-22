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
