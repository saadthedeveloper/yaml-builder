/**
 * transform.js — Answer to Helm Values Transformer
 *
 * Converts the flat answers object from the React form into a correctly
 * structured nested JavaScript object that mirrors the Helm values hierarchy.
 *
 * The output of this module is passed to yaml.dump() in App.jsx, which
 * serialises it to the final YAML string.
 *
 * Three steps in order:
 *   1. applyProductFlags  — set enabled/disabled and database flags automatically
 *   2. mapFieldsToHelm    — map user answers to their dot-notation Helm paths
 *   3. cleanObject        — remove empty, null, and undefined values
 */

import { displayConfig } from "./displayConfig"

// ─── Utility: set a value in a nested object using a dot-notation path ────────
export function setNestedValue(obj, path, value) {
  const keys = path.split(".")
  const result = { ...obj }
  let current = result
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...(current[keys[i]] || {}) }
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
  return result
}

// ─── Utility: remove empty/null/undefined values from object recursively ──────
export function cleanObject(obj) {
  if (typeof obj !== "object" || obj === null) return obj
  const cleaned = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === "" || value === null || value === undefined) continue
    if (typeof value === "object" && !Array.isArray(value)) {
      const nested = cleanObject(value)
      if (Object.keys(nested).length > 0) cleaned[key] = nested
    } else {
      cleaned[key] = value
    }
  }
  return cleaned
}

// ─── Utility: convert port string to number ────────────────────────────────────
function toNumber(value) {
  const n = Number(value)
  return isNaN(n) ? value : n
}

// ─── Product-specific automatic flags ─────────────────────────────────────────
function applyProductFlags(helmValues, answers) {
  const selected = answers.products

  // ── Orchestration Cluster ──────────────────────────────────────────────────
  helmValues = setNestedValue(helmValues, "orchestration.enabled", selected.includes("orchestration"))

  // ── Optimize ──────────────────────────────────────────────────────────────
  helmValues = setNestedValue(helmValues, "optimize.enabled", selected.includes("optimize"))

  // ── Identity ───────────────────────────────────────────────────────────────
  helmValues = setNestedValue(helmValues, "identity.enabled", selected.includes("identity"))
  if (selected.includes("identity")) {
    // use external database, disable bundled keycloak postgresql
    helmValues = setNestedValue(helmValues, "identity.externalDatabase.enabled", true)
    helmValues = setNestedValue(helmValues, "identityPostgresql.enabled", false)
  } else {
    helmValues = setNestedValue(helmValues, "identityPostgresql.enabled", false)
  }

  // ── Web Modeler ────────────────────────────────────────────────────────────
  helmValues = setNestedValue(helmValues, "webModeler.enabled", selected.includes("webModeler"))
  if (selected.includes("webModeler")) {
    // use external database, disable bundled postgresql
    helmValues = setNestedValue(helmValues, "webModelerPostgresql.enabled", false)
  } else {
    helmValues = setNestedValue(helmValues, "webModelerPostgresql.enabled", false)
  }

  // ── Connectors ────────────────────────────────────────────────────────────
  helmValues = setNestedValue(helmValues, "connectors.enabled", selected.includes("connectors"))

  // ── Console ───────────────────────────────────────────────────────────────
  helmValues = setNestedValue(helmValues, "console.enabled", selected.includes("console"))

  // ── Database type flags ────────────────────────────────────────────────────
  // Only relevant if orchestration or optimize is selected
  const needsSearchDB = selected.includes("orchestration") || selected.includes("optimize")

  if (needsSearchDB) {
    if (answers.databaseType === "elasticsearch") {
      helmValues = setNestedValue(helmValues, "global.elasticsearch.enabled", true)
      helmValues = setNestedValue(helmValues, "global.elasticsearch.external", true)
      helmValues = setNestedValue(helmValues, "global.opensearch.enabled", false)
      // disable bundled elasticsearch since we use external
      helmValues = setNestedValue(helmValues, "elasticsearch.enabled", false)
    }
    if (answers.databaseType === "opensearch") {
      helmValues = setNestedValue(helmValues, "global.opensearch.enabled", true)
      helmValues = setNestedValue(helmValues, "global.elasticsearch.enabled", false)
      helmValues = setNestedValue(helmValues, "elasticsearch.enabled", false)
    }
  } else {
    // no search DB needed
    helmValues = setNestedValue(helmValues, "global.elasticsearch.enabled", false)
    helmValues = setNestedValue(helmValues, "global.opensearch.enabled", false)
    helmValues = setNestedValue(helmValues, "elasticsearch.enabled", false)
  }

  return helmValues
}

// ─── Map user answers to helm values paths ────────────────────────────────────
function mapFieldsToHelm(helmValues, answers) {
  const visibleSections = displayConfig.sections.filter((s) => s.showIf(answers))

  for (const section of visibleSections) {
    for (const field of section.fields) {
      if (!field.path) continue

      // env_vars type — convert to YAML array of { name, value } objects
      if (field.type === "env_vars") {
        const rows = answers[field.id] || []
        const envArray = rows
          .filter((row) => row.name && row.value)
          .map((row) => ({ name: row.name, value: row.value }))
        if (envArray.length > 0) {
          helmValues = setNestedValue(helmValues, field.path, envArray)
        }
        continue
      }

      let value = answers[field.id]
      if (value === undefined || value === "" || value === null) continue

      // Convert port fields to numbers
      if (field.id.includes("port")) {
        value = toNumber(value)
      }

      helmValues = setNestedValue(helmValues, field.path, value)
    }
  }

  return helmValues
}

// ─── Main transform function ───────────────────────────────────────────────────
export function transformAnswers(answers) {
  let helmValues = {}

  // Step 1: apply automatic product flags (enabled/disabled for all products)
  helmValues = applyProductFlags(helmValues, answers)

  // Step 2: map user filled fields to their yaml paths
  helmValues = mapFieldsToHelm(helmValues, answers)

  // Step 3: remove any empty values
  return cleanObject(helmValues)
}