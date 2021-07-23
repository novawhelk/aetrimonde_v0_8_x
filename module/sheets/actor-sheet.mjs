import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class AetrimondeActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["aetrimonde", "sheet", "actor"],
      template: "systems/aetrimonde_v0_8_x/templates/actor/actor-sheet.html",
      width: 800,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
    });
  }

  /** @override */
  get template() {
    return `systems/aetrimonde_v0_8_x/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.data.abilities)) {
      v.label = game.i18n.localize(CONFIG.AETRIMONDE.abilities[k]) ?? k;
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const features = {
      "feat": {
        "label": "Feats",
        "entries": []
      },
      "rfeature": {
        "label": "Race Features",
        "entries": []
      },
      "cfeature": {
        "label": "Class Features",
        "entries": []
      },
      "ifeature": {
        "label": "Item Properties",
        "entries": []
      },
      "prof": {
        "label": "Proficiencies",
        "entries": []
      },
      "other": {
        "label": "Other",
        "entries": []
      }
    };
    const skills = [];
    const perks = [];
    const languages = [];
    const logentries = [];
    const powers = {
      "favorites": {
        "label": "Favorites",
        "entries": []
      },
      "normal": {
        "label": "Normal Attacks",
        "entries": []
      },
      "lesser": {
        "label": "Lesser Powers",
        "entries": []
      },
      "greater": {
        "label": "Greater Powers",
        "entries": []
      },
      "feature": {
        "label": "Feature Powers",
        "entries": []
      },
      "item": {
        "label": "Item Powers",
        "entries": []
      },
      "other": {
        "label": "Other Powers (and Things Like Powers)",
        "entries": []
      }
    };
    const gear = [];
    const weapons = [];
    const imps = [];
    const disciplines = [];
    const armor = [];
    const consumables = [];
    const rituals = [];
    const resists = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;

      // Append to gear.
      if (i.type === 'feature') {
        if (i.data.source != undefined && i.data.source != "") {
          features[i.data.source].entries.push(i);
        }
        else {
          features.other.entries.push(i);
        }
      }
      // Append to skills.
      else if (i.type === 'skill') {
        skills.push(i);
      }
      // Append to perks.
      else if (i.type === 'perk') {
        perks.push(i);
      }
      // Append to languages.
      else if (i.type === 'language') {
        languages.push(i);
      }
      // Append to journal.
      else if (i.type === 'logentry') {
        logentries.push(i);
      }
      // Append to disciplines
      else if (i.type === 'discipline') {
        disciplines.push(i);
      }
      // Append to rituals
      else if (i.type === 'ritual') {
        rituals.push(i);
      }
      // Append to resistances
      else if (i.type === 'resistance') {
        resists.push(i);
      }
      else if (i.type === 'equipment') {
        if (i.data.isweapon) {
          weapons.push(i);
          const weaponattack = this.weaponAttack(i, i.data.weapon.attack.abil, i.data.weapon.mvsr.value === "ranged")
          powers.normal.entries.push(weaponattack);
          if (i.data.weapon.mvsr.value === "melee" && i.data.weapon.range) {
            const throwabil = i.data.weapon.quals? (i.data.weapon.quals.includes("Heavy Thrown") ? "str" : "dex") : "dex";
            const thrownattack = this.weaponAttack(i, throwabil, true);
            thrownattack.name = "Thrown " + i.name;
            powers.normal.entries.push(thrownattack);
          }
        }
        if (i.data.isarmor) {
          const j = JSON.parse(JSON.stringify(i));
          j.data.isshield = false;
          armor.push(j);
        }
        if (i.data.isshield) {
          const j = JSON.parse(JSON.stringify(i));
          j.data.isarmor = false;
          armor.push(j);
        }
        if (i.data.isimplement) {
          imps.push(i);
        }
        if (i.data.isconsumable) {
          consumables.push(i);
        }
        if (i.data.relatedprops) {
          const itemprops = {
            "name": i.name,
            "_id": i._id,
            "img": i.img,
            "dependent": true,
            "data": {
              "source": "ifeature",
              "benefit": i.data.props
            }
          }
          features.ifeature.entries.push(itemprops)
        }
        if (i.data.relatedpower) {
          const itempower = {
            "name": i.name,
            "_id": i._id,
            "img": i.img,
            "dependent": true,
            "data": i.data.power
          };
          itempower.json = JSON.stringify(itempower);
          powers.item.entries.push(itempower)
        }
        if (!(i.data.isarmor || i.data.isshield || i.data.isweapon || i.data.isimplement || i.data.isconsumable)) {
          gear.push(i);
        }
      }
      // Append to powers.
      else if (i.type === 'power') {
        i.json = JSON.stringify(i);
        if (i.data.favorite) {
          powers.favorites.entries.push(i);
        }
        if (i.data.powertype != undefined && i.data.powertype != "" && i.data.powertype != "Power Type") {
          powers[i.data.powertype].entries.push(i);
        }
        else {
          powers.other.entries.push(i);
        }
      }
    }

    // Assign and return;
    context.features = features;
    context.skills = skills;
    context.perks = perks;
    context.languages = languages;
    context.logentries = logentries;
    context.disciplines = disciplines;
    context.rituals = rituals;
    context.resists = resists;
    context.powers = powers;
    context.armor = armor;
    context.weapons = weapons;
    context.imps = imps;
    context.consumables = consumables;
    context.gear = gear;
  }

  weaponAttack(weapon, abil, ranged) {
    const actorData = this.actor.data;

    const safeabil = abil === "" ? (ranged ? "dex" : "str") : abil;
    const weaponattack = {
      "name": weapon.name,
      "_id": weapon._id,
      "img": weapon.img,
      "dependent": true,
      "isweapon": true,
      "isheld": weapon.data.isheld,
      "slot": {
        "value": weapon.data.slot.value
      },
      "equipped": weapon.data.equipped,
      "equippedmh": weapon.data.equippedmh,
      "equippedoh": weapon.data.equippedoh,
      "data": {
        "powergroup": "normal",
        "powertype": "",
        "flavortext": "",
        "keywords": "Weapon",
        "action": "Main",
        "frequency": "",
        "hasfrequency": false,
        "range": weapon.data.weapon.mvsr.value === "ranged" ? "Ranged " + weapon.data.weapon.range : (weapon.data.weapon.quals ? (weapon.data.weapon.quals.match(/Reach/g) ? (weapon.data.weapon.quals.match(/Reach \d+/g) ? "Melee " + weapon.data.weapon.quals.match(/(?<=Reach )\d+/g) : "Melee 2") : "Melee 1") : "Melee 1"),
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
          "abil": actorData.data.abilities[`${safeabil}`].mod,
          "bonus": actorData.data.abilities[`${safeabil}`].mod + weapon.data.weapon.prof + weapon.data.weapon.attack.feat + weapon.data.weapon.attack.itemb + weapon.data.weapon.attack.misc,
          "prof": weapon.data.weapon.prof,
          "feat": weapon.data.weapon.attack.feat,
          "itemb": weapon.data.weapon.attack.itemb,
          "misc": weapon.data.weapon.attack.misc,
          "vslabel": weapon.data.weapon.attack.vslabel,
          "hasthreat": weapon.data.weapon.attack.hasthreat,
          "off": false
        },
        "hit": {
          "text": "[[" + weapon.data.weapon.damage.total + "]]" + (weapon.data.weapon.damage.type ? weapon.data.weapon.damage.type: " ") + "damage."
        },
        "crit": {
          "text": ""
        },
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
        "useditems": [weapon.data]
      }
    }
    if (ranged) {
      weaponattack.data.range = "Ranged " + weapon.data.weapon.range;
    }
    else {
      if (weapon.data.weapon.quals) {
        if (weapon.data.weapon.quals.match(/Reach \d+/g)) {
          weaponattack.data.range = "Melee " + weapon.data.weapon.quals.match(/(?<=Reach )\d+/g);
        }
        else if (weapon.data.weapon.quals.match(/Reach/g)) {
          weaponattack.data.range = "Melee 2";
        }
        else {
          weaponattack.data.range = "Melee 1";
        }
      }
      else {
        weaponattack.data.range = "Melee 1";
      }
    }
    weaponattack.json = JSON.stringify(weaponattack);
    return weaponattack
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Share owned Item in Chat
    html.find('.item-post').click(this._onItemPost.bind(this));

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    // Rest and recovery handlers
    html.find('.dayrest-clickable').click(this._dayRest.bind(this));
    html.find('.longrest-clickable').click(this._longRest.bind(this));
    html.find('.shortrest-clickable').click(this._shortRest.bind(this));
    html.find('.triumph-clickable').click(this._triumph.bind(this));
    html.find('.respite-clickable').click(this._respite.bind(this));
    html.find('.resurgence-clickable').click(this._useResurgence.bind(this));
    html.find('.recovery-roll-clickable').click(this._RollToRecover.bind(this))

    // Detail view handlers
    html.find('.expander').click(this._expandEntry.bind(this));

    // Equipment management
    html.find('.equipment-toggle').click(this._equipmentToggle.bind(this));

    // Quick skill training toggle
    html.find('.skill-trained').click(this._skillToggle.bind(this));
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  async _onItemPost(event) {
    const poweritem = JSON.parse(JSON.stringify(this.actor.items.get(event.currentTarget.dataset.power)));
    let power = [];
    let template = "";
    let templateData = [];
    if (poweritem.type === "power") {
      power = poweritem;
      power.data.powergroup = power.data.powergroup ? power.data.powertypes[`${power.data.powergroup}`].label : "";
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
      template = `systems/aetrimonde/templates/chat/power-card.html`;
      templateData = {
        "power": power
      }
    }
    else if (poweritem.type === "feature") {
      const feature = poweritem;
      feature.data.source = feature.data.source ? feature.data.sources[`${feature.data.source}`].label : "";
      template = `systems/aetrimonde/templates/chat/feature-card.html`;
      templateData = {
        "feature": feature
      }
    }
    else if (["equipment"].includes(poweritem.type)) {
      const item = poweritem;

      if (poweritem.data.isweapon) {
        item.data.weapon.complexity.value = item.data.weapon.complexity.complexities[`${item.data.weapon.complexity.value}`];
        item.data.weapon.hands.value = item.data.weapon.hands.handses[`${item.data.weapon.hands.value}`];
        item.data.weapon.mvsr.value = item.data.weapon.mvsr.mvsrs[`${item.data.weapon.mvsr.value}`];
      }
      item.data.power.effect.text = item.data.power.effect.text.replaceAll("[[", "").replaceAll("]]", "");
      item.data.power.hit.text = item.data.power.hit.text.replaceAll("[[", "").replaceAll("]]", "");
      item.data.power.crit.text = item.data.power.crit.text.replaceAll("[[", "").replaceAll("]]", "");
      item.data.power.miss.text = item.data.power.miss.text.replaceAll("[[", "").replaceAll("]]", "");
      template = `systems/aetrimonde/templates/chat/` + poweritem.type + `-card.html`;
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
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData()).roll();
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  _dayRest(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const dataset = element.dataset;

    const actorData = this.actor.data.data;

    const updates = {
      "data.hp.value" : actorData.hp.max,
      "data.resurgs.value" : actorData.resurgs.max,
      "data.gpower.value" : actorData.gpower.max,
      "data.hp.temp" : "",
      "data.hassecondwind" : true
    }
    this.actor.update(updates);
  }

  _longRest(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const dataset = element.dataset;

    const actorData = this.actor.data.data;

    const updates = {
      "data.resurgs.value" : actorData.resurgs.max,
      "data.gpower.value" : actorData.gpower.max,
      "data.hp.temp" : "",
      "data.hassecondwind" : true
    }
    this.actor.update(updates);
  }

  _shortRest(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const dataset = element.dataset;

    const actorData = this.actor.data.data;

    const updates = {
      "data.gpower.value" : actorData.gpower.max,
      "data.hp.temp" : "",
      "data.hassecondwind" : true
    }
    this.actor.update(updates);
  }

  _triumph(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const dataset = element.dataset;

    const actorData = this.actor.data.data;

    const updates = {
      "data.resurgs.value" : Math.min(actorData.resurgs.value + 1, actorData.resurgs.max)
    }
    this.actor.update(updates);
  }

  _respite(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const dataset = element.dataset;

    const actorData = this.actor.data.data;

    const updates = {
      "data.gpower.value" : Math.min(actorData.gpower.value + 1, actorData.gpower.max),
      "data.hassecondwind" : true
    }
    this.actor.update(updates);
  }

  _useResurgence(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const dataset = element.dataset;

    const actorData = this.actor.data.data;

    const updates = {
      "data.resurgs.value" : Math.max(actorData.resurgs.value - 1, 0),
      "data.hp.value": (actorData.resurgs.value > 0) ? ((actorData.hp.value > 0) ? Math.min(actorData.hp.max, actorData.hp.value + actorData.resurgs.size.value) : actorData.resurgs.size.value) : actorData.hp.value
    }
    this.actor.update(updates);
  }

  _RollToRecover(event) {
    event.preventDefault();

    const bonus = event.currentTarget.nextElementSibling.value;
    event.currentTarget.nextElementSibling.value = "";

    let roll = new Roll("2d10 + " + bonus);
    let label = "Rolling to Recover";


    roll.roll().toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label
    });
  }

  _expandEntry(event) {
    event.preventDefault();
    const thisitem = this.actor.items.get(event.currentTarget.dataset.id);
    if (!event.currentTarget.parentElement.parentElement.className.includes("favorite")){
      thisitem.update({"data.expanded": !thisitem.data.data.expanded});
    }
  }

  _equipmentToggle(event) {
    event.preventDefault();
    const itemid = event.currentTarget.dataset.id;
    const equipSlot = event.currentTarget.dataset.slot;
    const actor = this.actor;
    const actorData = actor.data.data;
    const thisItem = actor.items.get(event.currentTarget.dataset.id);
    const thisItemData = thisItem.data.data;
    const newEquipment = actorData.equipped;
    if (equipSlot === "ring") {
      if (thisItemData.equipped) {
        if (actorData.equipped.ring1 === itemid) {
          newEquipment.ring1 = "";
        }
        else {
          newEquipment.ring2 = "";
        }
      }
      else {
        if (actorData.equipped.ring1) {
          newEquipment.ring2 = itemid;
        }
        else {
          newEquipment.ring1 = itemid;
        }
      }
    }
    else if (equipSlot != "noslot") {
      newEquipment[`${equipSlot}`] = itemid === actorData.equipped[`${equipSlot}`] ? "" : thisItem.id;
    }
    actor.update({"data.equipped": newEquipment});
  }

  _skillToggle(event) {
    event.preventDefault();
    const thisitem = this.actor.items.get(event.currentTarget.dataset.id)
    if (thisitem.data.data.trained) {
      thisitem.update({"data.trained": false});
    }
    else {
      thisitem.update({"data.trained": true});
    }
  }
}
