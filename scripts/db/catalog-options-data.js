const slugify = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const productOptionMasters = [
  { name: "Size", displayType: "button", description: "Reusable apparel and package size values" },
  { name: "Color", displayType: "color_swatch", description: "Reusable product color values" },
  { name: "Material", displayType: "dropdown", description: "Reusable material values" },
  { name: "Storage", displayType: "button", description: "Device storage capacity values" },
  { name: "RAM", displayType: "button", description: "Device memory values" },
  { name: "Weight", displayType: "dropdown", description: "Product weight buckets" },
  { name: "Pack Size", displayType: "dropdown", description: "Pack quantity and bundle values" },
  { name: "Warranty", displayType: "dropdown", description: "Warranty period values" },
  { name: "Country", displayType: "dropdown", description: "Country of origin values" },
  { name: "State", displayType: "dropdown", description: "State or region values" },
  { name: "City", displayType: "dropdown", description: "City values" },
].map((option) => ({ ...option, slug: slugify(option.name), active: true }));

const productOptionValues = {
  Size: ["XS", "S", "M", "L", "XL", "XXL"],
  Color: [
    { name: "Black", colorHex: "#111111" },
    { name: "White", colorHex: "#ffffff" },
    { name: "Red", colorHex: "#ef4444" },
    { name: "Blue", colorHex: "#2563eb" },
    { name: "Green", colorHex: "#16a34a" },
  ],
  Material: ["Cotton", "Polyester", "Leather", "Metal", "Wood", "Plastic"],
  Storage: ["64GB", "128GB", "256GB", "512GB"],
  RAM: ["4GB", "6GB", "8GB", "12GB", "16GB"],
  Weight: ["250g", "500g", "1kg", "2kg", "5kg"],
  "Pack Size": ["Single", "Pack of 2", "Pack of 4", "Pack of 6", "Pack of 12"],
  Warranty: ["No Warranty", "6 Months", "1 Year", "2 Years", "3 Years"],
  Country: ["India", "United States", "China", "Vietnam", "Germany"],
  State: ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Gujarat"],
  City: ["Mumbai", "Bengaluru", "Delhi", "Chennai", "Ahmedabad"],
};

const basicCategories = [
  {
    categoryKey: "fashion",
    title: "Fashion",
    children: [
      {
        categoryKey: "fashion-apparel",
        title: "Apparel",
        attributes: ["Size", "Color", "Material"],
      },
    ],
  },
  {
    categoryKey: "electronics",
    title: "Electronics",
    children: [
      {
        categoryKey: "electronics-mobiles",
        title: "Mobiles",
        attributes: ["Color", "Storage", "RAM", "Warranty", "Country"],
      },
    ],
  },
  {
    categoryKey: "home",
    title: "Home",
    children: [
      {
        categoryKey: "home-furniture",
        title: "Furniture",
        attributes: ["Color", "Material", "Weight", "Warranty"],
      },
    ],
  },
];

module.exports = {
  slugify,
  productOptionMasters,
  productOptionValues,
  basicCategories,
};
