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
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
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
          const j = deepClone(i);
          j.data.isshield = false;
          armor.push(j);
        }
        if (i.data.isshield) {
          const j = deepClone(i);
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
        "powertype": "normal",
        "origin": "",
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
        "powertypes": {
            "normal": {
                "label": "Normal Attack"
            }
        },
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

    // Power usage handlers
    html.find('.effect-rollable').click(this._RunEffect.bind(this));
    html.find('.run-power').click(this._RunAttack.bind(this));
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
    const posted = this.actor.items.get(event.currentTarget.dataset.power);
    posted.prepareData();
    const itemcopy = deepClone(posted).data;
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

      if (poweritem.data.isweapon) {
        item.data.weapon.complexity.value = item.data.weapon.complexity.complexities[`${item.data.weapon.complexity.value}`];
        item.data.weapon.hands.value = item.data.weapon.hands.handses[`${item.data.weapon.hands.value}`];
        item.data.weapon.mvsr.value = item.data.weapon.mvsr.mvsrs[`${item.data.weapon.mvsr.value}`];
      }
      item.data.power.effect.text = item.data.power.effect.text.replaceAll("[[", "").replaceAll("]]", "");
      item.data.power.hit.text = item.data.power.hit.text.replaceAll("[[", "").replaceAll("]]", "");
      item.data.power.crit.text = item.data.power.crit.text.replaceAll("[[", "").replaceAll("]]", "");
      item.data.power.miss.text = item.data.power.miss.text.replaceAll("[[", "").replaceAll("]]", "");
      template = `systems/aetrimonde_v0_8_x/templates/chat/` + poweritem.type + `-card.html`;
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
    const thisItem = actor.items.get(itemid);
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
      newEquipment[`${equipSlot}`] = itemid === actorData.equipped[`${equipSlot}`] ? "" : itemid;
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

  async _RunEffect(event) {
    const name = event.currentTarget.dataset.name;
    const cont = !event.currentTarget.dataset.effectonly;
    let power = deepClone(this.actor.items.get(event.currentTarget.dataset.power)).data;

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
        targets.push({"name": target.actor.data.shortname ? target.actor.data.shortname : target.actor.name,
                      "id": target.data._id});
        targetnames = targetnames + (target.actor.data.shortname ? target.actor.data.shortname : target.actor.name) + ", ";
      }
    }
    else {
      targets.push({"name": "Unknown Target",
                    "id": ""});
      targetnames = "Unknown Target, "
    }
    targetnames = targetnames.substring(0, targetnames.length - 2);

    if (power.data.effect.text.includes("[[")) {
      const template = `systems/aetrimonde_v0_8_x/templates/chat/effect-option-card.html`;
      const templateData = {
        "power": power,
        "greater": power.data.powertype === "greater",
        "targets": targets ? targets : [],
        "targetnames": targetnames,
        "cont": cont
      };
      const content = await renderTemplate(template, templateData);
      let d = new Dialog({
        title: "Effect Options",
        content: content,
        buttons: {
          one: {
            label: "Roll Effects",
            callback: html => this._outputEffects(templateData, html.find('.target-line'), html.find('.expend-power'))
          }
        }
      }).render(true);
    }
    else {
      const template = `systems/aetrimonde_v0_8_x/templates/chat/effect-option-card.html`;
      const templateData = {
        "power": power,
        "greater": power.data.powertype === "greater",
        "targets": targets ? targets : [],
        "targetnames": targetnames,
        "cont": cont,
        "noroll": true
      };
      const content = await renderTemplate(template, templateData);
      let d = new Dialog({
        title: "Effect Options",
        content: content,
        buttons: {
          one: {
            label: "Use Power",
            callback: html => this._outputEffects(templateData, false, html.find('.expend-power'))
          }
        }
      }).render(true);
    }
  }

  async _RunAttack(event) {
    const name = event.currentTarget.dataset.name;
    const poweritem = deepClone(this.actor.items.get(event.currentTarget.dataset.power));
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
      for (let t of crithits) {
        const critcontent = [];
        if (data.power.data.crit.text) {
          critcontent.push({"content": data.power.name + " Critical: " + this._ApplyFavorDisfavor(data.power.data.crit.text, t.mode, t.main, t.off)});
        }
        const crititems = data.power.data.useditems.filter(entry => (entry.relatedprops && entry.critprops) || (entry.isweapon && entry.weapon.quals.includes("High Crit")));
        for (let item of crititems) {
          if (item.isweapon && item.weapon.quals.includes("High Crit"))
            critcontent.push({"content": "High Crit Weapon: " + this._ApplyFavorDisfavor("[[" + item.weapon.dice + "]] critical damage.", t.mode)})
          if (item.critprops)
            critcontent.push({"content": item.name + " Critical: " + this._ApplyFavorDisfavor(item.critprops, t.mode)});
        }
        const templateData = {
          "type": "Critical Hit",
          "power": data.power,
          "target": t,
          "content": "Critical Hit: " + this._ApplyFavorDisfavor(data.power.data.hit.text, "crit", t.main, t.off),
          "critcontent": critcontent
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
      if (data.power.data.crit.text) {
        critcontent.push({"content": this._RollOnce(data.power.name + " Critical: " + data.power.data.crit.text)});
      }
      const crititems = data.power.data.useditems.filter(entry => entry.relatedprops && entry.critprops);
      for (let item of crititems) {
        critcontent.push({"content": this._RollOnce(item.name + " Critical: " + item.critprops)});
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

    const mainhanditem = actor.data.data.equipped.mainhand ? actor.data.items.find(entry => (entry._id === actor.data.data.equipped.mainhand)).data : "";
    const offhanditem = actor.data.data.equipped.offhand ? actor.data.items.find(entry => (entry._id === actor.data.data.equipped.offhand)).data : "";

    dambonus = dambonus ? dambonus : {"feat": 0, "itemb": 0, "misc": 0}

    for (let a of ["STR", "CON", "DEX", "INT", "WIS", "CHA"]) {
      const label = a.toLowerCase();
      content = content.replaceAll("<" + a + ">", actorData.abilities[`${label}`].mod)
    }

    const defaultmainweapon = mainhanditem.isweapon ? mainhanditem : (offhanditem.isweapon ? offhanditem : defaultweapon);
    const mainweapon = power.data.mainitem ? actor.data.items.filter(entry => entry._id === power.data.mainitem)[0].data : defaultmainweapon;
    const defaultoffweapon = mainhanditem.isweapon ? (offhanditem.isweapon ? offhanditem : defaultweapon) : defaultweapon;
    const offweapon = power.data.offitem ? actor.data.items.filter(entry => entry._id === power.data.offitem)[0].data : defaultoffweapon;
    const unarmattack = power.data.mainitem ? actor.data.items.filter(entry => entry._id === power.data.mainitem)[0].data : defaultweapon;
    const defaultshield = offhanditem.isshield ? offhanditem : (mainhanditem.isshield ? mainhanditem : defaultweapon);
    const equippedItem = power.data.mainitem ? actor.data.items.filter(entry => entry._id === power.data.mainitem)[0].data : defaultshield;
    const shield = equippedItem.isshield ? equippedItem : defaultweapon;

    let dstrings = content.match(/\[\[[^\[\]]*?(\d+(d\d+(r\d+)?|<Weapon>|<Main-Weapon>|<Off-Weapon>|<Shield>|<Unarmed>) *(\+ *){0,1})*[^\[\]]*?\]\]( additional)?/g);
    if (dstrings) {
      for (let dstring of dstrings) {
        let rstring = dstring.replaceAll("d", "d");
        let dstringdambonus = power.data.damagebonus;
        let subcontent = dstring.match(/\[\[[^\[\]]*?<(Weapon|Main-Weapon)>[^\[\]]*?\]\]/g);
        if (subcontent) {
          let equippedCount = mainweapon.weapon.dice.match(/\d+(?=d)/g);
          let equippedDice = mainweapon.weapon.dice.match(/(?<=d).+/g);
          for (let string of subcontent) {
            const weapon = string.match(/\d<(Weapon|Main-Weapon)>/g)[0];
            const count = weapon.match(/\d+(?=<)/g);
            const replacement = equippedCount * count + "d" + equippedDice;
            const restring = string.replaceAll(weapon, replacement);
            const matchstring = string.replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("+", "\\+")
            rstring = rstring.replaceAll(RegExp(matchstring, "g"), restring);
            dstringdambonus = {
              "feat": Math.max(dstringdambonus.feat, mainweapon.weapon.damage.feat),
              "itemb": Math.max(dstringdambonus.itemb, mainweapon.weapon.damage.itemb),
              "misc": Math.max(dstringdambonus.misc, mainweapon.weapon.damage.misc)
            }
          }
        }
        subcontent = rstring.match(/\[\[[^\[\]]*?<Off-Weapon>[^\[\]]*?\]\]/g);
        if (subcontent) {
          let equippedCount = offweapon.weapon.dice.match(/\d+(?=d)/g);
          let equippedDice = offweapon.weapon.dice.match(/(?<=d).+/g);
          for (let string of subcontent) {
            const weapon = string.match(/\d<(Off-Weapon)>/g)[0];
            const count = weapon.match(/\d+(?=<)/g);
            const replacement = equippedCount * count + "d" + equippedDice;
            const restring = string.replaceAll(weapon, replacement);
            const matchstring = string.replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("+", "\\+")
            rstring = rstring.replaceAll(RegExp(matchstring, "g"), restring);
            dstringdambonus = {
              "feat": Math.max(dstringdambonus.feat, offweapon.weapon.damage.feat),
              "itemb": Math.max(dstringdambonus.itemb, offweapon.weapon.damage.itemb),
              "misc": Math.max(dstringdambonus.misc, offweapon.weapon.damage.misc)
            }
          }
        }
        subcontent = rstring.match(/\[\[[^\[\]]*?<Shield>[^\[\]]*?\]\]/g);
        if (subcontent) {
          let equippedCount = shield.shield.dice.match(/\d+(?=d)/g);
          let equippedDice = shield.shield.dice.match(/(?<=d).+/g);
          for (let string of subcontent) {
            const weapon = string.match(/\d<(Shield)>/g)[0];
            const count = weapon.match(/\d+(?=<)/g);
            const replacement = equippedCount * count + "d" + equippedDice;
            const restring = string.replaceAll(weapon, replacement);
            const matchstring = string.replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("+", "\\+")
            rstring = rstring.replaceAll(RegExp(matchstring, "g"), restring);
            dstringdambonus = {
              "feat": Math.max(dstringdambonus.feat, shield.shield.damage.feat),
              "itemb": Math.max(dstringdambonus.itemb, shield.shield.damage.itemb),
              "misc": Math.max(dstringdambonus.misc, shield.shield.damage.misc)
            }
          }
        }
        subcontent = rstring.match(/\[\[[^\[\]]*?<Unarmed>[^\[\]]*?\]\]/g);
        if (subcontent) {
          let equippedCount = unarmattack.weapon.dice.match(/\d+(?=d)/g);
          let equippedDice = unarmattack.weapon.dice.match(/(?<=d).+/g);
          for (let string of subcontent) {
            const weapon = string.match(/\d<(Unarmed)>/g)[0];
            const count = weapon.match(/\d+(?=<)/g);
            const replacement = equippedCount * count + "d" + equippedDice;
            const restring = string.replaceAll(weapon, replacement);
            const matchstring = string.replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("+", "\\+")
            rstring = rstring.replaceAll(RegExp(matchstring, "g"), restring);
            dstringdambonus = {
              "feat": Math.max(dstringdambonus.feat, unarmattack.weapon.damage.feat),
              "itemb": Math.max(dstringdambonus.itemb, unarmattack.weapon.damage.itemb),
              "misc": Math.max(dstringdambonus.misc, unarmattack.weapon.damage.misc)
            }
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
        const frollobj = {
          "class":"Roll",
          "dice":[],
          "formula":"{" + roll + "," + roll + "}dl1",
          "terms":[{
            "class":"DicePool",
            "rolls":[
              roll1,
              roll2
            ],
            "modifiers":[],
            "options":{},
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
          "results":[Math.max(roll1._total, roll2._total)],
          "total":Math.max(roll1._total, roll2._total)
        }
        const drollobj = {
          "class":"Roll",
          "dice":[],
          "formula":"{" + roll + "," + roll + "}dh1",
          "terms":[{
            "class":"DicePool",
            "rolls":[
              roll1,
              roll2
            ],
            "modifiers":[],
            "options":{},
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
          "results":[Math.min(roll1._total, roll2._total)],
          "total":Math.min(roll1._total, roll2._total)
        }
        const crollobj = {
          "class":"Roll",
          "dice":[],
          "formula":"{" + roll + "," + roll + "," + roll + "}dl1dh1",
          "terms":[{
            "class":"DicePool",
            "rolls":[
              roll1,
              roll2,
              roll3
            ],
            "modifiers":[],
            "options":{},
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
          "results":[allrolls[croll-1]._total],
          "total":allrolls[croll-1]._total
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
