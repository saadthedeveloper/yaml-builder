/**
 * displayConfig.js - UI Display Configuration
 *
 * The single file responsible for what the user sees in the form.
 * Defines which products are available, which sections appear, and
 * which fields are rendered - all driven by the user's current answers.
 *
 * This is the primary file for ongoing maintenance. Most day-to-day
 * changes - adding fields, reordering sections, adjusting conditions -
 * happen here only.
 *
 * Structure:
 *   products  - list of selectable Camunda products
 *   sections  - list of form sections, each with a showIf condition
 *     fields  - list of inputs, each mapping to a Helm values path
 *
 * To add a new field:
 *   1. Find the path in schema.json by searching for a keyword
 *   2. Add a field entry to the relevant section below
 *   3. Save - the UI updates automatically
 */

export const displayConfig = {

  // ─── Products ───────────────────────────────────────────────────────────────
  products: [
    { id: 'orchestration', label: 'Orchestration Cluster' },
    { id: 'optimize',      label: 'Optimize' },
    { id: 'identity',      label: 'Management Identity' },
    { id: 'webModeler',    label: 'Web Modeler' },
    { id: 'connectors',    label: 'Connectors' },
    { id: 'console',       label: 'Console' },
  ],

  // ─── Sections ───────────────────────────────────────────────────────────────
  // Each section has:
  //   id        - unique identifier
  //   title     - displayed in the UI
  //   showIf    - function that takes answers and returns true/false
  //   fields    - list of fields to render in this section
  //
  // Each field has:
  //   id        - unique identifier, used to store the answer
  //   path      - dot-notation path in the Helm values YAML (null for UI-only fields)
  //   label     - displayed in the UI
  //   type      - text | password | radio | checkbox | env_vars
  //   options   - (radio only) list of options
  //   required  - whether the field must be filled before generating

  sections: [

    // ── Database Type ──────────────────────────────────────────────────────────
    // Only shown if orchestration or optimize is selected
    {
      id: 'databaseType',
      title: 'Database Type',
      showIf: (answers) =>
        answers.products.includes('orchestration') ||
        answers.products.includes('optimize'),
      fields: [
        {
          id: 'databaseType',
          path: null,
          label: 'Select Database Type',
          type: 'radio',
          options: ['elasticsearch', 'opensearch'],
          required: true,
        }
      ]
    },

    // ── Shared Elasticsearch ───────────────────────────────────────────────────
    // Shown when BOTH orchestration AND optimize are selected with elasticsearch
    {
      id: 'sharedElasticsearch',
      title: 'Shared Elasticsearch Configuration',
      showIf: (answers) =>
        answers.products.includes('orchestration') &&
        answers.products.includes('optimize') &&
        answers.databaseType === 'elasticsearch',
      fields: [
        { id: 'es_username', path: 'global.elasticsearch.auth.username',            label: 'Username',    type: 'text',     required: true  },
        { id: 'es_password', path: 'global.elasticsearch.auth.secret.inlineSecret', label: 'Password',    type: 'password', required: true  },
        { id: 'es_protocol', path: 'global.elasticsearch.url.protocol',             label: 'Protocol',    type: 'radio',    required: true, options: ['http', 'https'] },
        { id: 'es_host',     path: 'global.elasticsearch.url.host',                 label: 'Host',        type: 'text',     required: true  },
        { id: 'es_port',     path: 'global.elasticsearch.url.port',                 label: 'Port',        type: 'text',     required: true  },
        { id: 'es_tls',      path: 'global.elasticsearch.tls.enabled',              label: 'Enable TLS',  type: 'checkbox', required: false },
      ]
    },

    // ── Shared OpenSearch ──────────────────────────────────────────────────────
    // Shown when BOTH orchestration AND optimize are selected with opensearch
    {
      id: 'sharedOpensearch',
      title: 'Shared OpenSearch Configuration',
      showIf: (answers) =>
        answers.products.includes('orchestration') &&
        answers.products.includes('optimize') &&
        answers.databaseType === 'opensearch',
      fields: [
        { id: 'os_username', path: 'global.opensearch.auth.username',            label: 'Username',   type: 'text',     required: true  },
        { id: 'os_password', path: 'global.opensearch.auth.secret.inlineSecret', label: 'Password',   type: 'password', required: true  },
        { id: 'os_protocol', path: 'global.opensearch.url.protocol',             label: 'Protocol',   type: 'radio',    required: true, options: ['http', 'https'] },
        { id: 'os_host',     path: 'global.opensearch.url.host',                 label: 'Host',       type: 'text',     required: true  },
        { id: 'os_port',     path: 'global.opensearch.url.port',                 label: 'Port',       type: 'text',     required: true  },
        { id: 'os_tls',      path: 'global.opensearch.tls.enabled',              label: 'Enable TLS', type: 'checkbox', required: false },
      ]
    },

    // ── Standalone Elasticsearch ───────────────────────────────────────────────
    // Shown when ONLY orchestration OR ONLY optimize is selected with elasticsearch
    {
      id: 'standaloneElasticsearch',
      title: 'Elasticsearch Configuration',
      // !== acts as XOR - true only when exactly one of orchestration/optimize is selected
      // (not both, not neither). When both are selected the shared section is shown instead.
      showIf: (answers) =>
        (answers.products.includes('orchestration') !== answers.products.includes('optimize')) &&
        answers.databaseType === 'elasticsearch',
      fields: [
        { id: 'es_username', path: 'global.elasticsearch.auth.username',            label: 'Username',   type: 'text',     required: true  },
        { id: 'es_password', path: 'global.elasticsearch.auth.secret.inlineSecret', label: 'Password',   type: 'password', required: true  },
        { id: 'es_protocol', path: 'global.elasticsearch.url.protocol',             label: 'Protocol',   type: 'radio',    required: true, options: ['http', 'https'] },
        { id: 'es_host',     path: 'global.elasticsearch.url.host',                 label: 'Host',       type: 'text',     required: true  },
        { id: 'es_port',     path: 'global.elasticsearch.url.port',                 label: 'Port',       type: 'text',     required: true  },
        { id: 'es_tls',      path: 'global.elasticsearch.tls.enabled',              label: 'Enable TLS', type: 'checkbox', required: false },
      ]
    },

    // ── Standalone OpenSearch ──────────────────────────────────────────────────
    // Shown when ONLY orchestration OR ONLY optimize is selected with opensearch
    {
      id: 'standaloneOpensearch',
      title: 'OpenSearch Configuration',
      // !== acts as XOR - true only when exactly one of orchestration/optimize is selected
      // (not both, not neither). When both are selected the shared section is shown instead.
      showIf: (answers) =>
        (answers.products.includes('orchestration') !== answers.products.includes('optimize')) &&
        answers.databaseType === 'opensearch',
      fields: [
        { id: 'os_username', path: 'global.opensearch.auth.username',            label: 'Username',   type: 'text',     required: true  },
        { id: 'os_password', path: 'global.opensearch.auth.secret.inlineSecret', label: 'Password',   type: 'password', required: true  },
        { id: 'os_protocol', path: 'global.opensearch.url.protocol',             label: 'Protocol',   type: 'radio',    required: true, options: ['http', 'https'] },
        { id: 'os_host',     path: 'global.opensearch.url.host',                 label: 'Host',       type: 'text',     required: true  },
        { id: 'os_port',     path: 'global.opensearch.url.port',                 label: 'Port',       type: 'text',     required: true  },
        { id: 'os_tls',      path: 'global.opensearch.tls.enabled',              label: 'Enable TLS', type: 'checkbox', required: false },
      ]
    },

    // ── Management Identity Database ───────────────────────────────────────────
    {
      id: 'identityDatabase',
      title: 'Management Identity Database',
      showIf: (answers) => answers.products.includes('identity'),
      fields: [
        { id: 'identity_db_host',     path: 'identity.externalDatabase.host',                  label: 'Host',          type: 'text',     required: true  },
        { id: 'identity_db_port',     path: 'identity.externalDatabase.port',                  label: 'Port',          type: 'text',     required: true  },
        { id: 'identity_db_username', path: 'identity.externalDatabase.username',              label: 'Username',      type: 'text',     required: true  },
        { id: 'identity_db_password', path: 'identity.externalDatabase.secret.inlineSecret',   label: 'Password',      type: 'password', required: true  },
        { id: 'identity_db_name',     path: 'identity.externalDatabase.database',              label: 'Database Name', type: 'text',     required: true  },
      ]
    },

    // ── Web Modeler Database ───────────────────────────────────────────────────
    {
      id: 'webModelerDatabase',
      title: 'Web Modeler Database',
      showIf: (answers) => answers.products.includes('webModeler'),
      fields: [
        { id: 'wm_db_host',     path: 'webModeler.restapi.externalDatabase.host',                  label: 'Host',          type: 'text',     required: true  },
        { id: 'wm_db_port',     path: 'webModeler.restapi.externalDatabase.port',                  label: 'Port',          type: 'text',     required: true  },
        { id: 'wm_db_user',     path: 'webModeler.restapi.externalDatabase.user',                  label: 'Username',      type: 'text',     required: true  },
        { id: 'wm_db_password', path: 'webModeler.restapi.externalDatabase.secret.inlineSecret',   label: 'Password',      type: 'password', required: true  },
        { id: 'wm_db_name',     path: 'webModeler.restapi.externalDatabase.database',              label: 'Database Name', type: 'text',     required: true  },
      ]
    },

    // ── Orchestration Environment Variables ────────────────────────────────────
    {
      id: 'orchestrationEnv',
      title: 'Orchestration Cluster Environment Variables',
      showIf: (answers) => answers.products.includes('orchestration'),
      fields: [
        { id: 'orchestration_env', path: 'orchestration.env', label: 'Environment Variables', type: 'env_vars', required: false }
      ]
    },

    // ── Optimize Environment Variables ─────────────────────────────────────────
    {
      id: 'optimizeEnv',
      title: 'Optimize Environment Variables',
      showIf: (answers) => answers.products.includes('optimize'),
      fields: [
        { id: 'optimize_env', path: 'optimize.env', label: 'Environment Variables', type: 'env_vars', required: false }
      ]
    },

    // ── Identity Environment Variables ─────────────────────────────────────────
    {
      id: 'identityEnv',
      title: 'Management Identity Environment Variables',
      showIf: (answers) => answers.products.includes('identity'),
      fields: [
        { id: 'identity_env', path: 'identity.env', label: 'Environment Variables', type: 'env_vars', required: false }
      ]
    },

    // ── Web Modeler Environment Variables ──────────────────────────────────────
    {
      id: 'webModelerEnv',
      title: 'Web Modeler Environment Variables',
      showIf: (answers) => answers.products.includes('webModeler'),
      fields: [
        { id: 'webModeler_env', path: 'webModeler.env', label: 'Environment Variables', type: 'env_vars', required: false }
      ]
    },

    // ── Connectors Environment Variables ───────────────────────────────────────
    {
      id: 'connectorsEnv',
      title: 'Connectors Environment Variables',
      showIf: (answers) => answers.products.includes('connectors'),
      fields: [
        { id: 'connectors_env', path: 'connectors.env', label: 'Environment Variables', type: 'env_vars', required: false }
      ]
    },

    // ── Console Environment Variables ──────────────────────────────────────────
    {
      id: 'consoleEnv',
      title: 'Console Environment Variables',
      showIf: (answers) => answers.products.includes('console'),
      fields: [
        { id: 'console_env', path: 'console.env', label: 'Environment Variables', type: 'env_vars', required: false }
      ]
    },

  ]
}