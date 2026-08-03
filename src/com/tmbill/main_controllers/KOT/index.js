/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */

const {
  KOTItem,
  KOT,
  sequelize,
  Sequelize,
  KotItemOption,
  KOTItemcharges,
} = require('../../js/database.js');
const { safeParseformain } = require('../Utils/index.js');

/**
 * Fetch KOT Items by table_id and kot_id (Optional)
 * @param {table_id} on which the KOT items to fetch
 * * @param {kot_id} on which the KOT items to fetch
 * @returns
 */
async function getRunningkotitemsdetails({ table_id, kot_id }) {
  let billItems = [];
  try {
    const kotWheredata = {
      table_id,
      is_active: 1,
    };
    if (kot_id) {
      Object.assign(kotWheredata, {
        kot_id,
      });
    }
    billItems = await KOTItem.findAll({
      include: [
        {
          model: KOT,
          attributes: [],
          where: kotWheredata,
        },
      ],
      attributes: [
        ['id', 'kot_items_id'],
        ['item_name', 'title'],
        'alternative_title',
        // [connection.Sequelize.fn('sum', connection.Sequelize.col('mpos_kot_item.amount')), 'amount'],
        'amount',
        // [
        //   connection.Sequelize.fn(
        //     'sum',
        //     connection.Sequelize.col('mpos_kot_item.quantity'),
        //   ),
        //   'quantity',
        // ],
        'quantity',
        'item_id',
        'item_price',
        'item_tax_per',
        'item_tax_value',
        'item_tax_method',
        'item_is_devidable',
        'item_tax_name',
        'short_code',
        'note',
        'has_options',
        'product_group_id',
        'product_group_name',
        'discount',
        'discounted_price',
        'discount_type',
        'discount_rate',
        'pricebeforeDiscount',
        'modified_discount',
        'kitchen_dept',
        'kot_id',
        'hsn_code',
        'is_open_item',
        'discounted_items',
        'discount_name',
        'category_name',
        'createdBy',
        'user_id',
        'extra_details',
        'discount_name',
      ],
      where: {
        status: {
          [Sequelize.Op.in]: [1, 5],
        },

        [Sequelize.Op.or]: [
          {
            comment: {
              [Sequelize.Op.notIn]: ['##DELETE_THIS_ITEM##'],
            },
          },
          {
            comment: null, // Include null values
          },
        ],
      },
      order: Sequelize.literal('mpos_kot_item.id'),
      raw: true,
    });
    // eslint-disable-next-line no-restricted-syntax
    for (const kotItem of billItems) {
      kotItem.quantity = Number(kotItem.quantity);
      kotItem.amount = Number(kotItem.amount);
      // if (kotItem.title.includes('option::')) {
      //   const result = kotItem.title
      //     .substring(0, kotItem.title.indexOf('option::'))
      //     .trim();
      //   kotItem.title = result;
      // }
      kotItem.extra_details = safeParseformain(kotItem.extra_details);
      if (kotItem.has_options == 1) {
        // if kot has item then do sum of qty of all placed kots
        const kot_Items = await KOTItem.findAll({
          include: [
            {
              model: KOT,
              attributes: [],
              where: kotWheredata,
            },
          ],
          where: {
            status: {
              [Sequelize.Op.in]: [1, 5],
            },
          },
          raw: true,
        });

        const kot_ids = kot_Items.map((item) => item.id);

        // if in same kot having same item two time with different options then for single item getting two option
        // so we have to match with title also

        const optionWhereData = {
          item_ref_id: kotItem.item_id,
          // kot_items_id: {
          //   [connection.Sequelize.Op.in]: kot_ids,
          // },
          // kot_items_id: {
          //   [connection.Sequelize.Op.in]: [item.kot_items_id],
          // },
          kot_items_id: kotItem.kot_items_id,
        };

        // if (kotItem.title) {
        //   let regex = /\(([^)]+)\)/;
        //   let match = kotItem.title.match(regex);
        //   if (match) {
        //     let input_string = match[1].replace(/and/g, ',');
        //     let option_items = input_string.r(',');
        //     // .map(function (item) {
        //     //   return item.trim(); // Remove leading and trailing whitespaces
        //     // });

        //     if (option_items && option_items.length) {
        //       Object.assign(optionWhereData, {
        //         option_name: {
        //           [connection.Sequelize.Op.in]: option_items,
        //         },
        //       });
        //     }
        //   }
        // }

        const addons = await KotItemOption.findAll({
          raw: true,
          attributes: [
            'id',
            'kot_items_id',
            'option_group_name',
            'option_group_ref_id',
            'option_ref_id',
            'option_name',
            'option_price',
            'option_tax_amount',
            'option_total',
            'option_total_with_tax',

            [
              sequelize.literal(
                `printf("%.${global.ROUNDOFF_UPTO}f",(sum(mpos_kotitem_option_addon_items.option_qty)))`,
              ),
              'option_qty',
            ],

            'option_type',
            'item_ref_id',
            'option_id',
            'extra_details',
            'alternative_title',
          ],
          group: ['option_name', 'option_price', 'item_ref_id', 'option_id'],
          order: [['id', 'ASC']],
          where: optionWhereData,
        });
        // let addons = await connection.KotItemOption.findAll({
        //   raw: true,
        //   where: {
        //     kot_items_id: kotItem.kot_items_id,
        //   },
        // });
        if (addons && addons.length) {
          addons.forEach((addon) => {
            addon.option_qty = Number(addon.option_qty);
          });
        }

        kotItem.addons = addons;
      }
      const itemlevelCharges = await KOTItemcharges.findAll({
        raw: true,
        where: {
          itemtitle: kotItem.title,
          table_id,
        },
        group: ['title'],
      });
      if (itemlevelCharges && itemlevelCharges.length > 0) {
        kotItem.itemlevelCharges = itemlevelCharges;
      }
    }
  } catch (error) {}
  return billItems;
}

async function fetchKOTItemsRequest(params) {
  try {
    const billItems = await getRunningkotitemsdetails({
      table_id: params.table_id,
    });
    return billItems;
  } catch (error) {
    console.log(`Message="Error while fetching data" Error=`, error);
  }
  return undefined;
}

module.exports = {
  fetchKOTItemsRequest,
};
