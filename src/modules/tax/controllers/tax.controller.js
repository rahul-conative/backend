const { okResponse } = require("../../../shared/http/reply");
const { TaxService } = require("../services/tax.service");

class TaxController {
  constructor({ taxService = new TaxService() } = {}) {
    this.taxService = taxService;
  }

  createOrderInvoice = async (req, res) => {
    const invoice = await this.taxService.createInvoice(req.params.orderId);
    res.status(201).json(okResponse(invoice));
  };

  getReport = async (req, res) => {
    const report = await this.taxService.getTaxReport(req.query);
    res.json(okResponse(report));
  };
}

module.exports = { TaxController };

