function convertSchema(schema, required = false) {
  const converted = Object.fromEntries([
    "type", "description", "title", "default", "examples", "enum", "const", "additionalProperties",
  ].filter(key => schema[key] !== undefined).map(key => [key, schema[key]]));
  if (schema.properties) converted.properties = parameterProperties(schema);
  if (schema.items) converted.items = convertSchema(schema.items);
  if (schema.oneOf) converted.oneOf = schema.oneOf.map(item => convertSchema(item));
  if (required) converted.required = true;
  return converted;
}

export function approvedAnswer(answer, id) {
  const selection = answer.answers.find(item => item.id === id);
  return selection?.selected.length === 1
    && selection.selected[0] === "Approve"
    && selection.custom === undefined;
}

export function parameterProperties(schema) {
  const required = new Set(schema.required || []);
  return Object.fromEntries(Object.entries(schema.properties || {}).map(([key, value]) => [
    key,
    convertSchema(value, required.has(key)),
  ]));
}
