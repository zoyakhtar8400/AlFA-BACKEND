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
const Tax = TaxModel.getModel(sequelize, Sequelize);
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
  Tax,
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
};
