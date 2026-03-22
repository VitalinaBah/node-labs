const Ajv = require("ajv");

const ajv = new Ajv();

const envSchema = {
  type: "object",
  properties: {
    PORT: { type: "string", pattern: "^[0-9]+$" },
    HOSTNAME: { type: "string", minLength: 1 },
    NODE_ENV: { type: "string", enum: ["development", "production"] },
  },
  required: ["PORT", "NODE_ENV"],
  additionalProperties: true,
};

const validate = ajv.compile(envSchema);

module.exports = validate;
