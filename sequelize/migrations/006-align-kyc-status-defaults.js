module.exports = {
  id: "006-align-kyc-status-defaults",
  async up({ queryInterface, transaction }) {
    await queryInterface.sequelize.query(
      `
      ALTER TABLE user_kyc
        ALTER COLUMN verification_status SET DEFAULT 'draft';

      ALTER TABLE seller_kyc
        ALTER COLUMN verification_status SET DEFAULT 'draft';

      UPDATE user_kyc
      SET verification_status = 'draft'
      WHERE verification_status = 'pending';

      UPDATE seller_kyc
      SET verification_status = 'draft'
      WHERE verification_status = 'pending';
      `,
      { transaction },
    );
  },

  async down({ queryInterface, transaction }) {
    await queryInterface.sequelize.query(
      `
      ALTER TABLE user_kyc
        ALTER COLUMN verification_status SET DEFAULT 'pending';

      ALTER TABLE seller_kyc
        ALTER COLUMN verification_status SET DEFAULT 'pending';
      `,
      { transaction },
    );
  },
};
