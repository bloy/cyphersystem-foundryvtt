export function damageToSeverity(damage) {
  if (!damage || damage <= 0) return null;
  if (damage <= 3) return "minor";
  if (damage <= 7) return "moderate";
  return "major";
}

export function determineWoundTarget(wounds, severity) {
  let target = severity;
  if (severity == "minor" && wounds.minor.value >= wounds.minor.max) {
    target = "moderate"
  }
  if (target == "moderate" && wounds.moderate.value >= wounds.moderate.max) {
    target = "major"
  }
  return target;
}

export function getWounds(actor, teen) {
  return (teen) ? actor.system.teen.combat.wounds : actor.system.combat.wounds;
}

export async function applyWound(actor, severity, teen = false) {
  const wounds = getWounds(actor, teen);
  const target = determineWoundTarget(wounds, severity);
  const path = (teen) ? "system.teen.combat.wounds" : "system.combat.wounds";
  const newValue = Math.min(wounds[target].value + 1, wounds[target].max);
  await actor.update({[`${path}.${target}.value`]: newValue});
  const dead = (target == "major" && newValue >= wounds.major.max);
  if (dead && !teen) {
    await actor.update({"system.combat.damageTrack.state": "Dead"});
  }

  return {target, escalated: target != severity, dead};
}

export async function clearWounds(actor, teen = false) {
  const path = (teen) ? "system.teen.combat.wounds" : "system.combat.wounds";
  const updates = {};
  for (const severity of ["minor", "moderate", "major"]) {
    updates[`${path}.${severity}.value`] = 0;
  }
  if (!teen) {
    updates["system.combat.damageTrack.state"] = "Hale";
  }
  await actor.update(updates);
}

export async function applyPoolDamage(actor, pool, amount, teen = false) {
  if (!pool || !amount || amount <= 0) return;
  const poolKey = pool.toLowerCase();
  const path = (teen) ? `system.teen.pools.${poolKey}.value` : `system.pools.${poolKey}.value`;
  const current = (teen) ? actor.system.teen.pools[poolKey].value : actor.system.pools[poolKey].value;
  const newValue = Math.max(current - amount, 0);
  await actor.update({[path]: newValue})
}
