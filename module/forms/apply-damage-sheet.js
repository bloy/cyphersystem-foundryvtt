import { applyPoolDamage, applyWound, damageToSeverity } from "../utilities/wound-utilities.js";

export class ApplyDamageSheet extends FormApplication {
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    this.teen = (actor.system.basic.unmaskedForm == "Teen" ? true : false);
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["cyphersystem", "sheet", "apply-damage-form"],
      template: "systems/cyphersystem/templates/forms/apply-damage-sheet.html",
      title: game.i18n.localize("CYPHERSYSTEM.ApplyDamage"),
      closeOnSubmit: false,
      submitOnChange: false,
      submitOnClose: false,
      width: 450,
      height: "auto",
    });
  }

  getData() {
    const data = super.getData();
    data.woundSeverityChoices = {
      "auto": game.i18n.localize("CYPHERSYSTEM.WoundSeverityAuto"),
      "minor": game.i18n.localize("CYPHERSYSTEM.WoundMinor"),
      "moderate": game.i18n.localize("CYPHERSYSTEM.WoundModerate"),
      "major": game.i18n.localize("CYPHERSYSTEM.WoundMajor"),
    }
    data.severity = "auto";
    data.damage = 0;
    data.poolDamage = 0;
    data.pool = "None";
    data.poolChoices = {
      None: game.i18n.localize("CYPHERSYSTEM.None"),
      Might: game.i18n.localize("CYPHERSYSTEM.Might"),
      Speed: game.i18n.localize("CYPHERSYSTEM.Speed"),
      Intellect: game.i18n.localize("CYPHERSYSTEM.Intellect"),
    };
    return data
  }

  /** @override */
  async _updateObject(event, formData) {
    const damage = parseInt(formData.damage) || 0;
    const severity = formData.severity;
    const pool = formData.pool;
    const poolDamage = parseInt(formData.poolDamage) || 0;

    let woundSeverity;
    if (severity == "auto") {
      woundSeverity = damageToSeverity(damage);
      if (!woundSeverity) {
        return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.WoundSeverityAutoFail"));
      }
    } else {
      woundSeverity = severity;
    }
    const result = await applyWound(this.actor, woundSeverity, this.teen);

    if (pool && pool != "None" && poolDamage > 0) {
      await applyPoolDamage(this.actor, pool, poolDamage, this.teen);
    }
    this.close();
    const woundLabel = game.i18n.localize("CYPHERSYSTEM.Wound" + result.target.capitalize());
    if (result.dead) {
      ui.notifications.warn(game.i18n.format("CYPHERSYSTEM.WoundDead", {name: this.actor.name}));
    } else if (result.escalated) {
      ui.notifications.info(game.i18n.format("CYPHERSYSTEM.WoundEscalated", {wound: woundLabel}));
    } else {
      ui.notifications.info(game.i18n.format("CYPHERSYSTEM.WoundSuffered", {wound: woundLabel}));
    }
  }
}
