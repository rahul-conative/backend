const { okResponse } = require("../../../shared/http/reply");
const { RbacService } = require("../services/rbac.service");

class PermissionController {
  constructor({ rbacService = new RbacService() } = {}) {
    this.rbacService = rbacService;
  }

  listPermissions = async (req, res) => {
    const result = await this.rbacService.listPermissions(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  getPermission = async (req, res) => {
    const permission = await this.rbacService.getPermission(req.params.permissionId);
    res.json(okResponse(permission));
  };

  createPermission = async (req, res) => {
    const permission = await this.rbacService.createPermission(req.body);
    res.status(201).json(okResponse(permission));
  };

  updatePermission = async (req, res) => {
    const permission = await this.rbacService.updatePermission(
      req.params.permissionId,
      req.body,
    );
    res.json(okResponse(permission));
  };
}

module.exports = { PermissionController };
