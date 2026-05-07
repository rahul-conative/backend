const { okResponse } = require("../../../shared/http/reply");
const { CommonManagementService } = require("../services/common-management.service");
const {
  AdminCountryModel,
  AdminStateModel,
  AdminCityModel,
  AdminTaxModel,
  AdminSubTaxModel,
  AdminTaxRuleModel,
} = require("../models/common-management.model");

class CommonManagementController {
  constructor({ commonManagementService = new CommonManagementService() } = {}) {
    this.commonManagementService = commonManagementService;
  }

  sendList(res, result) {
    res.json(okResponse(result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    }));
  }

  listCountries = async (req, res) => this.sendList(res, await this.commonManagementService.listCountries(req.query));
  createCountry = async (req, res) => res.status(201).json(okResponse(await this.commonManagementService.createCountry(req.body)));
  updateCountry = async (req, res) => res.json(okResponse(await this.commonManagementService.updateCountry(req.params.countryId, req.body)));
  setCountryStatus = async (req, res) => res.json(okResponse(await this.commonManagementService.setStatus(AdminCountryModel, req.body.ids || req.body._id, req.body.isDisable)));
  deleteCountries = async (req, res) => res.json(okResponse(await this.commonManagementService.deleteMany(AdminCountryModel, req.body.ids || req.body._id || req.params.countryId)));

  listStates = async (req, res) => this.sendList(res, await this.commonManagementService.listStates(req.query));
  createState = async (req, res) => res.status(201).json(okResponse(await this.commonManagementService.createState(req.body)));
  updateState = async (req, res) => res.json(okResponse(await this.commonManagementService.updateState(req.params.stateId, req.body)));
  setStateStatus = async (req, res) => res.json(okResponse(await this.commonManagementService.setStatus(AdminStateModel, req.body.ids || req.body._id, req.body.isDisable)));
  deleteStates = async (req, res) => res.json(okResponse(await this.commonManagementService.deleteMany(AdminStateModel, req.body.ids || req.body._id || req.params.stateId)));

  listCities = async (req, res) => this.sendList(res, await this.commonManagementService.listCities(req.query));
  createCity = async (req, res) => res.status(201).json(okResponse(await this.commonManagementService.createCity(req.body)));
  updateCity = async (req, res) => res.json(okResponse(await this.commonManagementService.updateCity(req.params.cityId, req.body)));
  setCityStatus = async (req, res) => res.json(okResponse(await this.commonManagementService.setStatus(AdminCityModel, req.body.ids || req.body._id, req.body.isDisable)));
  deleteCities = async (req, res) => res.json(okResponse(await this.commonManagementService.deleteMany(AdminCityModel, req.body.ids || req.body._id || req.params.cityId)));

  listTaxes = async (req, res) => this.sendList(res, await this.commonManagementService.listTaxes(req.query));
  createTax = async (req, res) => res.status(201).json(okResponse(await this.commonManagementService.createTax(req.body)));
  updateTax = async (req, res) => res.json(okResponse(await this.commonManagementService.updateTax(req.params.taxId, req.body)));
  setTaxStatus = async (req, res) => res.json(okResponse(await this.commonManagementService.setStatus(AdminTaxModel, req.body.ids || req.body._id, req.body.isDisable)));
  deleteTaxes = async (req, res) => res.json(okResponse(await this.commonManagementService.deleteMany(AdminTaxModel, req.body.ids || req.body._id || req.params.taxId)));

  listSubTaxes = async (req, res) => this.sendList(res, await this.commonManagementService.listSubTaxes(req.query));
  createSubTax = async (req, res) => res.status(201).json(okResponse(await this.commonManagementService.createSubTax(req.body)));
  updateSubTax = async (req, res) => res.json(okResponse(await this.commonManagementService.updateSubTax(req.params.subTaxId, req.body)));
  setSubTaxStatus = async (req, res) => res.json(okResponse(await this.commonManagementService.setStatus(AdminSubTaxModel, req.body.ids || req.body._id, req.body.isDisable)));
  deleteSubTaxes = async (req, res) => res.json(okResponse(await this.commonManagementService.deleteMany(AdminSubTaxModel, req.body.ids || req.body._id || req.params.subTaxId)));

  listTaxRules = async (req, res) => this.sendList(res, await this.commonManagementService.listTaxRules(req.query));
  createTaxRule = async (req, res) => res.status(201).json(okResponse(await this.commonManagementService.createTaxRule(req.body)));
  updateTaxRule = async (req, res) => res.json(okResponse(await this.commonManagementService.updateTaxRule(req.params.taxRuleId, req.body)));
  setTaxRuleStatus = async (req, res) => res.json(okResponse(await this.commonManagementService.setStatus(AdminTaxRuleModel, req.body.ids || req.body._id, req.body.isDisable)));
  deleteTaxRules = async (req, res) => res.json(okResponse(await this.commonManagementService.deleteMany(AdminTaxRuleModel, req.body.ids || req.body._id || req.params.taxRuleId)));
}

module.exports = { CommonManagementController };
