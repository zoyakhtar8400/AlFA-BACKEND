const Sequelize = require('sequelize');
const TableModel = require('../model/Table');
const DepartmentModel = require('../model/Department');
const CategoryModel = require('../model/Category');
const ItemModel = require('../model/Item');
const CustomerModel = require('../model/Customer');
const KOTModel = require('../model/Kot');
const KOTChargesModel = require('../model/KOTCharges');
const KOTItemchargesModel = require('../model/KOTItemcharges');
const OrderchildchargesModel = require('../model/Orderchildcharges');
const KOTItemModel = require('../model/KotItem');
const BillModel = require('../model/Order');
const BillItemModel = require('../model/OrderChild');
const PaymentModel = require('../model/PaymentMode');
const BillPaymentModel = require('../model/OrderPayment');
const DiscountModel = require('../model/Discount');
const StoreModel = require('../model/Store');
const OptionGroupModel = require('../model/OptionGroup');
const OptionsModel = require('../model/Options');
const ChargesModel = require('../model/Charges');
const BillChargesModel = require('../model/OrderCharges');
const PrinterModel = require('../model/Printer');
const SettingsModel = require('../model/Settings');
const TempnumbersModel = require('../model/TempNumbers');
const DeliveryBoyModel = require('../model/DeliveryBoy');
const ShortcutsModel = require('../model/Shortcuts');
const BillItemOptionModel = require('../model/OrderchildOptions');
const KotItemOptionModel = require('../model/KotItemOptions');
const KitchenDepartmentModel = require('../model/KitchenDepartment');
const ItemnoteModel = require('../model/Itemnotes');
const StoreMapperModel = require('../model/StoreMapper');
const ExpensesModal = require('../model/Expense');
const ExpensesCategoryModal = require('../model/ExpensesCategory');
const ExpensesSubcategoryModal = require('../model/ExpensesSubcategory');
const CustomizedDiscountModal = require('../model/CustomizedDiscount');
const CoupondiscountHistoryModal = require('../model/CoupondiscountHistory');
const StartcloseDayModal = require('../model/StartdayCloseday');
const UserShiftModal = require('../model/UserShift');
const ProductGroupModal = require('../model/ProductGroup');
const NCTypeModel = require('../model/NCType');
const UserModal = require('../model/User');
const SectionwiseDiscounthistoryModal = require('../model/SectionwisediscountHistory');
const WalletModal = require('../model/Wallet');
const DuepaymentsModal = require('../model/Duepayments');
const WalletTransactionsModal = require('../model/WalletTransactions');
const WaiterModel = require('../model/Waiter');
const PreOrderModel = require('../model/PreOrder');
const PasscodeActivityModel = require('../model/PasscodeActivity');
const IRNHistoryModel = require('../model/IRNHistory');
const MultipricingSettingsModel = require('../model/MultipricingSettings');
const PlatformMappingModel = require('../model/PlatformMapping');
const OrderTipModel = require('../model/OrderTip');
const ItemDiscountModel = require('../model/ItemDiscount');
const WaiterNotificationModel = require('../model/WaiterNotifications');
const TableReservationModel = require('../model/TableReservation');
const FloorModel = require('../model/Floor');
const TaxModel = require('../model/Tax');
const ModifierGroupItemsMappingModel = require('../model/ModifierGroupItemsMapping');
const ModifierGroupsModel = require('../model/ModifierGroups');
const ModifiersModel = require('../model/Modifiers');
const ModifierGroupMappingModel = require('../model/ModifiersGroupMapping');
const ModifierVarientModel = require('../model/ModifierVarient');
const ItemPricesModel = require('../model/ItemPrices');
const ItemNoteGroupsModel = require('../model/ItemNoteGroups');
const UserLoginStatusModel = require('../model/UserLoginStatus');
const ZatcaStatusModel = require('../model/ZatcaStatus');
const OrderTypesModel = require('../model/OrderTypes');
const ItemStockOutboxModel = require('../model/ItemStockOutBox');
const InventoryItemModel = require('../model/InventoryItem');
const RecipeMasterModel = require('../model/RecipeMaster');
const RecipeItemsModel = require('../model/RecipeItems');
const StockLedgerModel = require('../model/StockLedger');
const SupplierModel = require('../model/Supplier');
const ItemGroupModel = require('../model/ItemGroup');
const UnitModel = require('../model/Unit');
const PurchaseOrderModel = require('../model/PurchaseOrder');
const PurchaseOrderItemModel = require('../model/PurchaseOrderItem');
const PurchaseGRNModel = require('../model/PurchaseGRN');
const PurchaseGRNItemModel = require('../model/PurchaseGRNItem');
const PurchaseBillModel = require('../model/PurchaseBill');
const PurchaseIndentModel = require('../model/PurchaseIndent');
const PurchaseIndentItemModel = require('../model/PurchaseIndentItem');
const PurchaseQuotationModel = require('../model/PurchaseQuotation');
const PurchaseReturnModel = require('../model/PurchaseReturn');
const DepartmentIssueModel = require('../model/DepartmentIssue');
const UserOutletModel = require('../model/UserOutlet');
const CompanyProfileModel = require('../model/CompanyProfile');

const { Config } = require('../config/config');

const sequelize = new Sequelize(
  Config.DBConfig.DBName,
  Config.DBConfig.username,
  Config.DBConfig.password,
  {
    host: Config.DBConfig.host,
    port: Config.DBConfig.port,
    dialect: Config.DBConfig.dialect || 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 5,
    },
  },
);

sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL database connected successfully.');
  })
  .catch((err) => {
    console.error('❌ PostgreSQL Connection Error:', err.message);
    console.error('Please ensure your PostgreSQL server is running and database "alfa_restaurant" exists.');
  });

const Department = DepartmentModel.getModel(sequelize, Sequelize);
const Table = TableModel.getModel(sequelize, Sequelize);
const Category = CategoryModel.getModel(sequelize, Sequelize);
const Item = ItemModel.getModel(sequelize, Sequelize);
const Customer = CustomerModel.getModel(sequelize, Sequelize);
const KOT = KOTModel.getModel(sequelize, Sequelize);
const KOTCharges = KOTChargesModel.getModel(sequelize, Sequelize);
const KOTItemcharges = KOTItemchargesModel.getModel(sequelize, Sequelize);
const Orderchildcharges = OrderchildchargesModel.getModel(sequelize, Sequelize);
const KOTItem = KOTItemModel.getModel(sequelize, Sequelize);
const Bill = BillModel.getModel(sequelize, Sequelize);
const BillItem = BillItemModel.getModel(sequelize, Sequelize);
const Payment = PaymentModel.getModel(sequelize, Sequelize);
const BillPayment = BillPaymentModel.getModel(sequelize, Sequelize);
const BillCharges = BillChargesModel.getModel(sequelize, Sequelize);
const Charges = ChargesModel.getModel(sequelize, Sequelize);
const Discount = DiscountModel.getModel(sequelize, Sequelize);
const ItemDiscount = ItemDiscountModel.getModel(sequelize, Sequelize);
const Store = StoreModel.getModel(sequelize, Sequelize);
const OptionGroup = OptionGroupModel.getModel(sequelize, Sequelize);
const Options = OptionsModel.getModel(sequelize, Sequelize);
const Printer = PrinterModel.getModel(sequelize, Sequelize);
const Settings = SettingsModel.getModel(sequelize, Sequelize);
const Tempnumbers = TempnumbersModel.getModel(sequelize, Sequelize);
const DeliveryBoy = DeliveryBoyModel.getModel(sequelize, Sequelize);
const Shortcuts = ShortcutsModel.getModel(sequelize, Sequelize);
const BillItemOption = BillItemOptionModel.getModel(sequelize, Sequelize);
const KotItemOption = KotItemOptionModel.getModel(sequelize, Sequelize);
const KitchenDepartment = KitchenDepartmentModel.getModel(sequelize, Sequelize);
const Itemnote = ItemnoteModel.getModel(sequelize, Sequelize);
const StoreMapper = StoreMapperModel.getModel(sequelize, Sequelize);
const Expenses = ExpensesModal.getModel(sequelize, Sequelize);
const ExpensesCategory = ExpensesCategoryModal.getModel(sequelize, Sequelize);
const ExpensesSubcategory = ExpensesSubcategoryModal.getModel(
  sequelize,
  Sequelize,
);
const User = UserModal.getModel(sequelize, Sequelize);
const CustomizedDiscount = CustomizedDiscountModal.getModel(
  sequelize,
  Sequelize,
);
const CoupondiscountHistory = CoupondiscountHistoryModal.getModel(
  sequelize,
  Sequelize,
);
const StartcloseDay = StartcloseDayModal.getModel(sequelize, Sequelize);
const UserShift = UserShiftModal.getModel(sequelize, Sequelize);
const ProductGroup = ProductGroupModal.getModel(sequelize, Sequelize);
const SectionwiseDiscounthistory = SectionwiseDiscounthistoryModal.getModel(
  sequelize,
  Sequelize,
);
const Wallet = WalletModal.getModel(sequelize, Sequelize);
const Duepayments = DuepaymentsModal.getModel(sequelize, Sequelize);
const WalletTransactions = WalletTransactionsModal.getModel(
  sequelize,
  Sequelize,
);
const Waiter = WaiterModel.getModel(sequelize, Sequelize);
const PreOrder = PreOrderModel.getModel(sequelize, Sequelize);
const PasscodeActivity = PasscodeActivityModel.getModel(sequelize, Sequelize);
const IRNHistory = IRNHistoryModel.getModel(sequelize, Sequelize);
const MultipricingSettings = MultipricingSettingsModel.getModel(
  sequelize,
  Sequelize,
);
const PlatformMapping = PlatformMappingModel.getModel(sequelize, Sequelize);
const OrderTip = OrderTipModel.getModel(sequelize, Sequelize);
const WaiterNotification = WaiterNotificationModel.getModel(
  sequelize,
  Sequelize,
);

const TableReservation = TableReservationModel.getModel(sequelize, Sequelize);
const Floor = FloorModel.getModel(sequelize, Sequelize);
const Tax = TaxModel.getModel(sequelize, Sequelize);
const NCType = NCTypeModel.getModel(sequelize, Sequelize);
const ModifierGroupItemsMapping = ModifierGroupItemsMappingModel.getModel(
  sequelize,
  Sequelize,
);
const ModifierGroups = ModifierGroupsModel.getModel(sequelize, Sequelize);
const Modifiers = ModifiersModel.getModel(sequelize, Sequelize);
const ModifierGroupMapping = ModifierGroupMappingModel.getModel(
  sequelize,
  Sequelize,
);
const ModifierVarient = ModifierVarientModel.getModel(sequelize, Sequelize);
const ItemPrices = ItemPricesModel.getModel(sequelize, Sequelize);
const ItemNoteGroups = ItemNoteGroupsModel.getModel(sequelize, Sequelize);
const UserLoginStatus = UserLoginStatusModel.getModel(sequelize, Sequelize);
const ZatcaStatus = ZatcaStatusModel.getModel(sequelize, Sequelize);
const OrderTypes = OrderTypesModel.getModel(sequelize, Sequelize);
const ItemStockOutbox = ItemStockOutboxModel.getModel(sequelize, Sequelize);
const InventoryItem = InventoryItemModel.getModel(sequelize, Sequelize);
const RecipeMaster = RecipeMasterModel.getModel(sequelize, Sequelize);
const RecipeItems = RecipeItemsModel.getModel(sequelize, Sequelize);
const StockLedger = StockLedgerModel.getModel(sequelize, Sequelize);
const Supplier = SupplierModel.getModel(sequelize, Sequelize);
const ItemGroup = ItemGroupModel.getModel(sequelize, Sequelize);
const Unit = UnitModel.getModel(sequelize, Sequelize);
const PurchaseOrder = PurchaseOrderModel.getModel(sequelize, Sequelize);
const PurchaseOrderItem = PurchaseOrderItemModel.getModel(sequelize, Sequelize);
const PurchaseGRN = PurchaseGRNModel.getModel(sequelize, Sequelize);
const PurchaseGRNItem = PurchaseGRNItemModel.getModel(sequelize, Sequelize);
const PurchaseBill = PurchaseBillModel.getModel(sequelize, Sequelize);
const PurchaseIndent = PurchaseIndentModel.getModel(sequelize, Sequelize);
const PurchaseIndentItem = PurchaseIndentItemModel.getModel(sequelize, Sequelize);
const PurchaseQuotation = PurchaseQuotationModel.getModel(sequelize, Sequelize);
const PurchaseReturn = PurchaseReturnModel.getModel(sequelize, Sequelize);
const DepartmentIssue = DepartmentIssueModel.getModel(sequelize, Sequelize);
const UserOutlet = UserOutletModel.getModel(sequelize, Sequelize);
const CompanyProfile = CompanyProfileModel.getModel(sequelize, Sequelize);

// Associations for Purchase & Inventory
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id' });
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'po_id', as: 'purchaseOrderItems' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'po_id' });

PurchaseGRN.belongsTo(Supplier, { foreignKey: 'supplier_id' });
PurchaseGRN.hasMany(PurchaseGRNItem, { foreignKey: 'grn_id', as: 'grnItems' });
PurchaseGRNItem.belongsTo(PurchaseGRN, { foreignKey: 'grn_id' });

PurchaseBill.belongsTo(Supplier, { foreignKey: 'supplier_id' });
PurchaseIndent.hasMany(PurchaseIndentItem, { foreignKey: 'indent_id', as: 'indentItems' });

// Associations for User & Outlet
User.hasMany(UserOutlet, { foreignKey: 'user_id', constraints: false });
UserOutlet.belongsTo(User, { foreignKey: 'user_id', constraints: false });

// Automatically ensure tables exist in PostgreSQL
(async () => {
  try {
    await UserOutlet.sync({ alter: true });
    await InventoryItem.sync({ alter: true });
    await RecipeMaster.sync({ alter: true });
    await RecipeItems.sync({ alter: true });
    await StockLedger.sync({ alter: true });
    await Item.sync({ alter: true });
    await Supplier.sync({ alter: true });
    await ItemGroup.sync({ alter: true });
    await Unit.sync({ alter: true });
    await PurchaseOrder.sync({ alter: true });
    await PurchaseOrderItem.sync({ alter: true });
    await PurchaseGRN.sync({ alter: true });
    await PurchaseGRNItem.sync({ alter: true });
    await PurchaseBill.sync({ alter: true });
    await PurchaseIndent.sync({ alter: true });
    await PurchaseIndentItem.sync({ alter: true });
    await PurchaseQuotation.sync({ alter: true });
    await PurchaseReturn.sync({ alter: true });
    await DepartmentIssue.sync({ alter: true });
    console.log('✅ Inventory, Recipe, Purchase, and Stock Ledger PostgreSQL tables synchronized successfully.');
  } catch (syncErr) {
    console.warn('⚠️ Table sync warning:', syncErr.message);
  }
})();

/**
 * Associations
 */
Department.hasMany(Table, { foreignKey: 'department', constraints: false });
Table.belongsTo(Department, { foreignKey: 'department', onDelete: 'CASCADE', constraints: false });
Category.hasMany(Item, { foreignKey: 'category_ref_ids', sourceKey: 'category_refid', constraints: false });
Item.belongsTo(Category, {
  targetKey: 'category_refid',
  foreignKey: 'category_ref_ids',
  onDelete: 'CASCADE',
  constraints: false,
});

ProductGroup.hasMany(Item, { foreignKey: 'product_group', sourceKey: 'product_group_id', constraints: false });
Item.belongsTo(ProductGroup, {
  targetKey: 'product_group_id',
  foreignKey: 'product_group',
  onDelete: 'CASCADE',
  constraints: false,
});

KOT.hasMany(KOTItem, { as: 'kotItems', foreignKey: 'kot_id' });
KOTItem.belongsTo(KOT, { foreignKey: 'kot_id', onDelete: 'CASCADE' });

// Recipe & Inventory Associations
RecipeMaster.hasMany(RecipeItems, { as: 'recipeItems', foreignKey: 'recipe_id' });
RecipeItems.belongsTo(RecipeMaster, { foreignKey: 'recipe_id', onDelete: 'CASCADE' });
RecipeItems.belongsTo(InventoryItem, { foreignKey: 'inventory_item_id' });
InventoryItem.hasMany(StockLedger, { as: 'ledgerEntries', foreignKey: 'inventory_item_id' });
StockLedger.belongsTo(InventoryItem, { foreignKey: 'inventory_item_id' });

KOTItem.hasMany(KotItemOption, {
  targetKey: 'kot_items_id',
  as: 'addons',
  foreignKey: 'kot_items_id',
  constraints: false,
});
KotItemOption.belongsTo(KOTItem, {
  sourceKey: 'kot_items_id',
  foreignKey: 'id',
  onDelete: 'CASCADE',
  constraints: false,
});

Bill.hasMany(BillItem, {
  foreignKey: 'bill_id',
  constraints: false,
  as: 'tmpos_order_child',
});

BillItem.belongsTo(Bill, {
  sourceKey: 'order_id',
  foreignKey: 'orderMasterId',
  targetKey: 'order_id',
  constraints: false,
});

Bill.hasMany(BillItemOption, {
  foreignKey: 'order_id',
  constraints: false,
  as: 'mpos_orderchild_option_addon_items',
});

BillItemOption.belongsTo(Bill, {
  sourceKey: 'order_id',
  foreignKey: 'order_id',
  targetKey: 'order_id',
  constraints: false,
});

BillItem.hasMany(BillItemOption, {
  foreignKey: 'order_item_id',
  constraints: false,
  as: 'order_child_options',
});
BillItem.hasMany(Orderchildcharges, {
  foreignKey: 'order_item_id',
  constraints: false,
  as: 'order_child_charges',
});

Bill.hasMany(KOT, { sourceKey: 'order_id', foreignKey: 'bill_number', constraints: false });
KOT.belongsTo(Bill, { foreignKey: 'bill_number', targetKey: 'order_id', constraints: false });

Bill.hasMany(BillCharges, {
  targetKey: 'order_id',
  sourceKey: 'order_id',
  foreignKey: 'order_id',
  constraints: false,
  as: 'tmpos_order_charges',
});
BillCharges.hasOne(Bill, {
  sourceKey: 'order_id',
  foreignKey: 'order_id',
  constraints: false,
});

DeliveryBoy.hasMany(Bill, { foreignKey: 'deliveryboy_id', constraints: false });
Bill.hasOne(DeliveryBoy, {
  sourceKey: 'deliveryboy_id',
  foreignKey: 'id',
  constraints: false,
});

User.hasOne(UserLoginStatus, {
  sourceKey: 'id',
  foreignKey: 'id',
  constraints: false,
});

StoreMapper.hasMany(Store, { foreignKey: 'store_id', constraints: false });
Store.belongsTo(StoreMapper, {
  targetKey: 'tmpos_store_id',
  foreignKey: 'store_id',
  constraints: false,
});
// Expenses Associations
ExpensesCategory.hasMany(ExpensesSubcategory, {
  sourceKey: 'ref_id',
  foreignKey: 'category_id',
  constraints: false,
});
ExpensesSubcategory.belongsTo(ExpensesCategory, {
  targetKey: 'ref_id',
  foreignKey: 'category_id',
  constraints: false,
});
// Associations for reporting
BillItem.hasMany(Item, { foreignKey: 'item_id', constraints: false });
Item.belongsTo(BillItem, {
  targetKey: 'item_id',
  foreignKey: 'item_refid',
  constraints: false,
});

Bill.hasMany(BillPayment, {
  foreignKey: 'order_id',
  sourceKey: 'order_id',
  targetKey: 'order_id',
  constraints: false,
  as: 'tmpos_order_payment',
});
BillPayment.belongsTo(Bill, { foreignKey: 'order_id', constraints: false });

Bill.hasMany(SectionwiseDiscounthistory, {
  as: 'discountHistory',
  sourceKey: 'order_id',
  foreignKey: 'order_id',
  onDelete: 'CASCADE',
  constraints: false,
});
SectionwiseDiscounthistory.belongsTo(Bill, {
  targetKey: 'order_id',
  foreignKey: 'order_id',
  onDelete: 'CASCADE',
  constraints: false,
});

WalletTransactions.belongsTo(Wallet, {
  foreignKey: 'wallet_id',
  constraints: false,
});
Wallet.hasMany(WalletTransactions, {
  foreignKey: 'wallet_id',
  constraints: false,
});

WalletTransactions.hasOne(Wallet, {
  sourceKey: 'wallet_id',
  foreignKey: 'wallet_id',
  constraints: false,
});

Bill.hasOne(PreOrder, {
  foreignKey: 'customer_mobile',
  sourceKey: 'phone',
  targetKey: 'phone',
  constraints: false,
  as: 'preOrder',
});

Bill.hasOne(Customer, {
  foreignKey: 'phone',
  sourceKey: 'phone',
  targetKey: 'phone',
  constraints: false,
  as: 'customerList',
});

PreOrder.belongsTo(Bill, { foreignKey: 'customer_mobile', constraints: false });

Bill.hasMany(IRNHistory, { sourceKey: 'order_id', foreignKey: 'ref_id' });
IRNHistory.belongsTo(Bill, { foreignKey: 'ref_id' });

// Bill.hasOne(OrderTip, { sourceKey: 'order_id', foreignKey: 'order_id', as: 'orderTips' });
Bill.hasOne(OrderTip, { sourceKey: 'order_id', foreignKey: 'order_id' });
OrderTip.belongsTo(Bill, { foreignKey: 'order_id' });

Bill.hasOne(ZatcaStatus, { sourceKey: 'order_id', foreignKey: 'order_id' });
ZatcaStatus.belongsTo(Bill, { foreignKey: 'order_id' });

ModifierGroups.hasMany(Modifiers, {
  sourceKey: 'id',
  foreignKey: 'id',
  as: 'option_list',
});
Modifiers.belongsTo(ModifierGroups, { foreignKey: 'group_id' });

async function runWalQueries() {
  if (Config.DBConfig && Config.DBConfig.dialect === 'sqlite') {
    try {
      await sequelize.query('PRAGMA journal_mode = WAL;');
      await sequelize.query('PRAGMA busy_timeout = 10000;'); // ← ADD THIS
      await sequelize.query('PRAGMA synchronous = NORMAL;');
      await sequelize.query('PRAGMA temp_store = memory;');
      await sequelize.query('PRAGMA mmap_size = 30000000000;');
      await sequelize.query('PRAGMA cache_size = -64000;');
    } catch (error) {
      console.error(error);
    }
  }
}
// Check the connection
sequelize
  .authenticate()
  .then(async () => {
    console.log('Connected to DB..');
    await runWalQueries();
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = {
  PasscodeActivity,
  sequelize,
  Table,
  Department,
  Category,
  Item,
  Customer,
  KOT,
  KOTCharges,
  KOTItem,
  Sequelize,
  Bill,
  BillItem,
  Payment,
  BillCharges,
  Charges,
  BillPayment,
  Discount,
  ItemDiscount,
  Store,
  OptionGroup,
  Options,
  Printer,
  Settings,
  Tempnumbers,
  DeliveryBoy,
  Shortcuts,
  BillItemOption,
  KotItemOption,
  KitchenDepartment,
  Itemnote,
  StoreMapper,
  Expenses,
  ExpensesCategory,
  ExpensesSubcategory,
  User,
  CustomizedDiscount,
  CoupondiscountHistory,
  StartcloseDay,
  UserShift,
  ProductGroup,
  SectionwiseDiscounthistory,
  Wallet,
  Duepayments,
  WalletTransactions,
  Orderchildcharges,
  KOTItemcharges,
  Waiter,
  PreOrder,
  IRNHistory,
  MultipricingSettings,
  PlatformMapping,
  OrderTip,
  WaiterNotification,
  TableReservation,
  Floor,
  Tax,
  NCType,
  ModifierGroupItemsMapping,
  ModifierGroups,
  Modifiers,
  ModifierGroupMapping,
  ModifierVarient,
  ItemPrices,
  ItemNoteGroups,
  UserLoginStatus,
  ZatcaStatus,
  OrderTypes,
  ItemStockOutbox,
  InventoryItem,
  RecipeMaster,
  RecipeItems,
  StockLedger,
  Supplier,
  ItemGroup,
  Unit,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseGRN,
  PurchaseGRNItem,
  PurchaseBill,
  PurchaseIndent,
  PurchaseIndentItem,
  PurchaseQuotation,
  PurchaseReturn,
  DepartmentIssue,
  UserOutlet,
  CompanyProfile,
};
