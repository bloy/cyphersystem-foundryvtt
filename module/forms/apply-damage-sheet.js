import { applyPoolDamage, applyWound, damageToSeverity } from "../utilities/wound-utilities.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class ApplyDamageSheet extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["application", "sheet", "apply-damage-form"],
    position: {
      width: 500,
    },
    tag: "form",
    form: {
      handler: ApplyDamageSheet.#onSubmitForm,
      submitOnChange: false,
      submitOnClose: false,
      closeOnSubmit: false,
    },
    window: {
      resizable: true,
      title: "CYPHERSYSTEM.ApplyDamage"
    }
  }

  static PARTS = {
    form: {
      cssClass: "standard-form",
      template: "systems/cyphersystem/templates/forms/apply-damage-sheet.html",
    }
  }

  get actor() {
    return this.options.document
  }

  get teen() {
    return this.actor?.system?.basic?.unmaskedForm == "Teen" ? true : false;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.woundSeverityChoices = {
      "auto": game.i18n.localize("CYPHERSYSTEM.WoundSeverityAuto"),
      "minor": game.i18n.localize("CYPHERSYSTEM.WoundMinor"),
      "moderate": game.i18n.localize("CYPHERSYSTEM.WoundModerate"),
      "major": game.i18n.localize("CYPHERSYSTEM.WoundMajor"),
    }
    context.severity = "auto";
    context.damage = 0;
    context.poolDamage = 0;
    context.pool = "None";
    context.poolChoices = {
      None: game.i18n.localize("CYPHERSYSTEM.None"),
      Might: game.i18n.localize("CYPHERSYSTEM.Might"),
      Speed: game.i18n.localize("CYPHERSYSTEM.Speed"),
      Intellect: game.i18n.localize("CYPHERSYSTEM.Intellect"),
    };
    return context
  }

  static async #onSubmitForm(event, form, formData) {
    event.preventDefault()
    const damage = parseInt(formData.object.damage) || 0;
    const severity = formData.object.severity;
    const pool = formData.object.pool;
    const poolDamage = parseInt(formData.object.poolDamage) || 0;

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
