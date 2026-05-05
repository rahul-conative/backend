const { ROLE_ACTIONS } = require("../constants/access-policies");

function canDo(role, action) {
  const allowedActions = ROLE_ACTIONS[role] || [];
  return allowedActions.includes("*") || allowedActions.includes(action);
}

module.exports = { canDo };
