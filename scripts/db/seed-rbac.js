const { v4: uuidv4 } = require("uuid");
const {
  sequelize,
} = require("../../src/infrastructure/sequelize/sequelize-client");
const {
  DEFAULT_PLATFORM_MODULES,
  DEFAULT_SELLER_MODULES,
} = require("../../src/shared/auth/module-access");

const STANDARD_PERMISSION_ACTIONS = [
  { key: "add", label: "Add" },
  { key: "edit", label: "Edit" },
  { key: "update", label: "Update" },
  { key: "delete", label: "Delete" },
  { key: "view", label: "View" },
];

const LEGACY_MODULE_SLUGS = ["product", "user", "order", "seller", "settings"];

const MODULE_DETAILS = {
  rbac: {
    name: "RBAC Management",
    description: "Role-Based Access Control management",
    icon: "shield",
    order: 1,
  },
  users: {
    name: "User Management",
    description: "User accounts and profiles",
    icon: "user",
    order: 2,
  },
  products: {
    name: "Product Management",
    description: "Product catalog and management",
    icon: "box",
    order: 3,
  },
  carts: {
    name: "Cart Management",
    description: "Shopping carts and checkout baskets",
    icon: "shopping-bag",
    order: 4,
  },
  orders: {
    name: "Order Management",
    description: "Orders and transactions",
    icon: "shopping-cart",
    order: 5,
  },
  payments: {
    name: "Payment Management",
    description: "Payments, refunds, and payment operations",
    icon: "credit-card",
    order: 6,
  },
  platform: {
    name: "Platform Management",
    description: "Platform catalog, geography, and content configuration",
    icon: "settings",
    order: 7,
  },
  sellers: {
    name: "Seller Management",
    description: "Seller accounts and administration",
    icon: "store",
    order: 8,
  },
  notifications: {
    name: "Notification Management",
    description: "Notifications and communication preferences",
    icon: "bell",
    order: 9,
  },
  analytics: {
    name: "Analytics",
    description: "Analytics and reporting",
    icon: "chart",
    order: 10,
  },
  pricing: {
    name: "Pricing Management",
    description: "Coupons, pricing rules, and promotions",
    icon: "tag",
    order: 11,
  },
  wallets: {
    name: "Wallet Management",
    description: "Wallet balances and wallet transactions",
    icon: "wallet",
    order: 12,
  },
  tax: {
    name: "Tax Management",
    description: "Tax invoices, reports, and filings",
    icon: "receipt",
    order: 13,
  },
  subscriptions: {
    name: "Subscription Management",
    description: "Plans, subscriptions, and platform fees",
    icon: "repeat",
    order: 14,
  },
  warranty: {
    name: "Warranty Management",
    description: "Warranty registration and claims",
    icon: "badge-check",
    order: 15,
  },
  loyalty: {
    name: "Loyalty Management",
    description: "Loyalty points and customer rewards",
    icon: "gift",
    order: 16,
  },
  recommendations: {
    name: "Recommendation Management",
    description: "Product recommendations and personalization",
    icon: "sparkles",
    order: 17,
  },
  returns: {
    name: "Return Management",
    description: "Returns, refunds, and reverse logistics",
    icon: "undo",
    order: 18,
  },
  fraud: {
    name: "Fraud Management",
    description: "Fraud detection and risk review",
    icon: "alert-triangle",
    order: 19,
  },
  "dynamic-pricing": {
    name: "Dynamic Pricing",
    description: "Dynamic pricing rules and simulations",
    icon: "activity",
    order: 20,
  },
  delivery: {
    name: "Delivery Management",
    description: "Delivery, tracking, and logistics",
    icon: "truck",
    order: 21,
  },
  admin: {
    name: "Admin Dashboard",
    description: "Admin panel and operations dashboard",
    icon: "dashboard",
    order: 22,
  },
  "sellers/commissions": {
    name: "Seller Commission Management",
    description: "Seller commissions, settlements, and payouts",
    icon: "percent",
    order: 23,
  },
};

function titleize(value) {
  return String(value)
    .replace(/[/-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function makeModuleList() {
  const moduleSlugs = Array.from(
    new Set(["rbac", ...DEFAULT_PLATFORM_MODULES, ...DEFAULT_SELLER_MODULES]),
  );

  return moduleSlugs
    .map((slug, index) => {
      const details = MODULE_DETAILS[slug] || {};
      const name = details.name || `${titleize(slug)} Management`;

      return {
        id: uuidv4(),
        name,
        slug,
        description:
          details.description || `${name} permissions and access controls`,
        icon: details.icon || "grid",
        order: details.order || index + 1,
      };
    })
    .sort(
      (left, right) =>
        left.order - right.order || left.name.localeCompare(right.name),
    );
}

function makePermissionList(modules) {
  return modules.flatMap((module) =>
    STANDARD_PERMISSION_ACTIONS.map((action) => ({
      moduleId: module.id,
      name: `${action.label} ${module.name}`,
      slug: `${module.slug}:${action.key}`,
      action: action.key,
    })),
  );
}

function permissionSlugsFor(moduleSlug, actions = STANDARD_PERMISSION_ACTIONS) {
  return actions.map((action) => {
    const actionKey = typeof action === "string" ? action : action.key;
    return `${moduleSlug}:${actionKey}`;
  });
}

function permissionSlugsForModules(
  moduleSlugs,
  actions = STANDARD_PERMISSION_ACTIONS,
) {
  return moduleSlugs.flatMap((moduleSlug) =>
    permissionSlugsFor(moduleSlug, actions),
  );
}

async function seedRbac() {
  const transaction = await sequelize.transaction();

  try {
    await sequelize.authenticate();
    console.log("✓ Database connected\n");

    const modules = makeModuleList();

    // Insert or update modules
    for (const module of modules) {
      const [existingModules] = await sequelize.query(
        `SELECT id FROM modules
         WHERE slug = :slug OR name = :name
         LIMIT 1`,
        {
          replacements: { slug: module.slug, name: module.name },
          transaction,
        },
      );

      if (existingModules.length > 0) {
        module.id = existingModules[0].id;
        await sequelize.query(
          `UPDATE modules
           SET name = :name,
               slug = :slug,
               description = :description,
               icon = :icon,
               "order" = :order,
               active = true,
               updated_at = NOW()
           WHERE id = :id`,
          {
            replacements: module,
            transaction,
          },
        );
      } else {
        await sequelize.query(
          `INSERT INTO modules (id, name, slug, description, icon, "order", active, created_at, updated_at)
           VALUES (:id, :name, :slug, :description, :icon, :order, true, NOW(), NOW())`,
          {
            replacements: module,
            transaction,
          },
        );
      }
    }

    console.log(`✓ Created ${modules.length} modules`);

    const permissions = makePermissionList(modules);

    // Insert permissions
    const permissionIds = {};
    for (const perm of permissions) {
      const [existingPermissions] = await sequelize.query(
        `SELECT id FROM permissions WHERE slug = :slug LIMIT 1`,
        {
          replacements: { slug: perm.slug },
          transaction,
        },
      );

      if (existingPermissions.length > 0) {
        const id = existingPermissions[0].id;
        permissionIds[perm.slug] = id;
        await sequelize.query(
          `UPDATE permissions
           SET module_id = :moduleId,
               name = :name,
               action = :action,
               active = true,
               updated_at = NOW()
           WHERE id = :id`,
          {
            replacements: { id, ...perm },
            transaction,
          },
        );
      } else {
        const id = uuidv4();
        permissionIds[perm.slug] = id;

        await sequelize.query(
          `INSERT INTO permissions (id, module_id, name, slug, action, active, created_at, updated_at)
           VALUES (:id, :moduleId, :name, :slug, :action, true, NOW(), NOW())`,
          {
            replacements: { id, ...perm },
            transaction,
          },
        );
      }
    }

    console.log(`✓ Created ${permissions.length} permissions`);

    await sequelize.query(
      `UPDATE permissions
       SET active = false,
           updated_at = NOW()
       WHERE module_id = ANY($1::uuid[])
         AND slug <> ALL($2::text[])`,
      {
        bind: [
          modules.map((module) => module.id),
          permissions.map((permission) => permission.slug),
        ],
        transaction,
      },
    );

    await sequelize.query(
      `DELETE FROM role_permissions
       WHERE permission_id IN (
         SELECT id
         FROM permissions
         WHERE module_id = ANY($1::uuid[])
           AND active = false
       )`,
      {
        bind: [modules.map((module) => module.id)],
        transaction,
      },
    );

    await sequelize.query(
      `UPDATE permissions
       SET active = false,
           updated_at = NOW()
       WHERE module_id IN (
         SELECT id
         FROM modules
         WHERE slug = ANY($1::text[])
       )`,
      {
        bind: [LEGACY_MODULE_SLUGS],
        transaction,
      },
    );

    await sequelize.query(
      `DELETE FROM role_permissions
       WHERE permission_id IN (
         SELECT p.id
         FROM permissions p
         INNER JOIN modules m ON m.id = p.module_id
         WHERE m.slug = ANY($1::text[])
       )`,
      {
        bind: [LEGACY_MODULE_SLUGS],
        transaction,
      },
    );

    await sequelize.query(
      `UPDATE modules
       SET active = false,
           updated_at = NOW()
       WHERE slug = ANY($1::text[])`,
      {
        bind: [LEGACY_MODULE_SLUGS],
        transaction,
      },
    );

    // Create default roles and assign permissions
    const allModuleSlugs = modules.map((module) => module.slug);
    const subAdminModules = [
      "products",
      "users",
      "orders",
      "sellers",
      "admin",
      "analytics",
    ];
    const moderatorModules = ["products", "users", "orders", "sellers", "admin"];

    const rolesToCreate = [
      {
        id: uuidv4(),
        name: "Super Admin",
        slug: "super-admin",
        description: "Super Administrator with full access",
        type: "system",
        isSuperAdmin: true,
        permissionSlugs: Object.keys(permissionIds), // All permissions
      },
      {
        id: uuidv4(),
        name: "Admin",
        slug: "admin",
        description: "Administrator with broad access",
        type: "system",
        isSuperAdmin: false,
        permissionSlugs: permissionSlugsForModules(allModuleSlugs),
      },
      {
        id: uuidv4(),
        name: "Sub Admin",
        slug: "sub-admin",
        description: "Scoped platform admin with module-based access",
        type: "system",
        isSuperAdmin: false,
        permissionSlugs: permissionSlugsForModules(subAdminModules, [
          "edit",
          "update",
          "view",
        ]),
      },
      {
        id: uuidv4(),
        name: "Moderator",
        slug: "moderator",
        description: "Content and user moderator",
        type: "system",
        isSuperAdmin: false,
        permissionSlugs: permissionSlugsForModules(moderatorModules, [
          "edit",
          "update",
          "view",
        ]),
      },
      {
        id: uuidv4(),
        name: "Product Manager",
        slug: "product-manager",
        description: "Manages product catalog",
        type: "custom",
        isSuperAdmin: false,
        permissionSlugs: permissionSlugsFor("products"),
      },
    ];

    for (const role of rolesToCreate) {
      const {
        id,
        name,
        slug,
        description,
        type,
        isSuperAdmin,
        permissionSlugs,
      } = role;

      let roleId = id;

      // Check if role already exists
      const [existingRoles] = await sequelize.query(
        `SELECT id
     FROM roles
     WHERE slug = :slug
     LIMIT 1`,
        {
          replacements: { slug },
          transaction,
        },
      );

      if (existingRoles.length === 0) {
        // Create new role
        await sequelize.query(
          `INSERT INTO roles (
          id,
          name,
          slug,
          description,
          type,
          is_super_admin,
          active,
          created_at,
          updated_at
       )
       VALUES (
          :id,
          :name,
          :slug,
          :description,
          :type,
          :isSuperAdmin,
          true,
          NOW(),
          NOW()
       )`,
          {
            replacements: {
              id,
              name,
              slug,
              description,
              type,
              isSuperAdmin,
            },
            transaction,
          },
        );
      } else {
        // Use existing role ID
        roleId = existingRoles[0].id;
        await sequelize.query(
          `UPDATE roles
           SET name = :name,
               description = :description,
               type = :type,
               is_super_admin = :isSuperAdmin,
               active = true,
               updated_at = NOW()
           WHERE id = :roleId`,
          {
            replacements: {
              roleId,
              name,
              description,
              type,
              isSuperAdmin,
            },
            transaction,
          },
        );
      }

      const desiredPermissionIds = permissionSlugs
        .map((permSlug) => permissionIds[permSlug])
        .filter(Boolean);

      if (desiredPermissionIds.length > 0) {
        await sequelize.query(
          `DELETE FROM role_permissions
           WHERE role_id = $1
             AND NOT (permission_id = ANY($2::uuid[]))`,
          {
            bind: [roleId, desiredPermissionIds],
            transaction,
          },
        );
      } else {
        await sequelize.query(
          `DELETE FROM role_permissions
           WHERE role_id = :roleId`,
          {
            replacements: { roleId },
            transaction,
          },
        );
      }

      // Assign permissions
      for (const permSlug of permissionSlugs) {
        const permId = permissionIds[permSlug];

        if (permId) {
          const [existingRolePermissions] = await sequelize.query(
            `SELECT id
         FROM role_permissions
         WHERE role_id = :roleId AND permission_id = :permissionId
         LIMIT 1`,
            {
              replacements: {
                roleId: roleId,
                permissionId: permId,
              },
              transaction,
            },
          );

          if (existingRolePermissions.length === 0) {
            await sequelize.query(
              `INSERT INTO role_permissions (
            id,
            role_id,
            permission_id,
            created_at
         )
         VALUES (
            :id,
            :roleId,
            :permissionId,
            NOW()
         )`,
              {
                replacements: {
                  id: uuidv4(),
                  roleId: roleId,
                  permissionId: permId,
                },
                transaction,
              },
            );
          }
        }
      }
    }

    console.log(`✓ Created ${rolesToCreate.length} default roles\n`);

    await transaction.commit();

    console.log("✅ RBAC seeding completed successfully!\n");
    console.log("Modules created:");
    modules.forEach((m) => console.log(`  - ${m.name} (${m.slug})`));
    console.log(
      `\nRoles created:\n  - Super Admin\n  - Admin\n  - Sub Admin\n  - Moderator\n  - Product Manager\n`,
    );

    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error("\n❌ Error seeding RBAC:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedRbac();
