const { okResponse } = require("../../../shared/http/reply");
const { RbacService } = require("../services/rbac.service");

class ModuleController {
  constructor({ rbacService = new RbacService() } = {}) {
    this.rbacService = rbacService;
  }

  listModules = async (req, res) => {
    const result = await this.rbacService.listModules(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  permissionManagement = async (req, res) => {
    const result = await this.rbacService.getPermissionManagementMatrix(
      req.query,
    );
    res.json(okResponse(result));
  };

  getModule = async (req, res) => {
    const module = await this.rbacService.getModule(req.params.moduleId);
    res.json(okResponse(module));
  };

  createModule = async (req, res) => {
    const module = await this.rbacService.createModule(req.body);
    res.status(201).json(okResponse(module));
  };

  updateModule = async (req, res) => {
    const module = await this.rbacService.updateModule(
      req.params.moduleId,
      req.body,
    );
    res.json(okResponse(module));
  };

  deleteModule = async (req, res) => {
    await this.rbacService.deleteModule(req.params.moduleId);
    res.status(204).send();
  };
}

module.exports = { ModuleController };
