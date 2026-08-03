/* eslint-disable camelcase */
const { ModifierVarient, sequelize, Sequelize } = require('../../js/database');

async function getModifierGroupList(item_id, store_id, menu_id) {
  const modifierGrp = [];
  try {
    const query = `SELECT g.* FROM mpos_modifiergrp_items_mapping as mgm left join mpos_modifier_groups as g
     ON mgm.group_id = g.id
     WHERE mgm.store_id=? and mgm.item_id=? AND mgm.menu_id=? AND g.status=?
     GROUP BY g.id 
     ORDER BY g.type, mgm.rank;`;

    const optionGroupList = await sequelize.query(query, {
      replacements: [store_id, item_id, menu_id, 1],
      type: Sequelize.QueryTypes.SELECT,
    });
    return optionGroupList;
  } catch (error) {
    console.error(error);
  }
  return modifierGrp;
}

async function getModifiergrpbyid(group_id) {
  let modifierGrps = [];
  try {
    const query = `SELECT g.* from mpos_modifier_groups as g
     WHERE g.id in (?) and g.status=? GROUP BY g.id ORDER BY g.type,g.rank;`;
    modifierGrps = await sequelize.query(query, {
      replacements: [group_id, 1],
      type: Sequelize.QueryTypes.SELECT,
    });
  } catch (error) {
    console.error(error);
  }
  return modifierGrps;
}

async function GetOptionList(store_id, group_id, menu_id) {
  const modifiers = [];
  try {
    const query = `SELECT m.*,
       Group_concat(mp.modifier_group_id) AS assigned_groups FROM mpos_modifiers AS m
       LEFT JOIN mpos_modifiers_group_mapping AS mp
       ON m.id = mp.modifier_id WHERE  m.store_id = ?
       AND m.group_id = ?
       AND m.status = 1
       AND m.menu_id = ? GROUP  BY m.id
       ORDER BY m.rank;`;

    const optionsList = await sequelize.query(query, {
      replacements: [store_id, group_id, menu_id],
      type: Sequelize.QueryTypes.SELECT,
    });

    if (optionsList && optionsList.length) {
      // eslint-disable-next-line no-plusplus
      for (let index = 0; index < optionsList.length; index++) {
        const option = optionsList[index];
        if (option && option.has_variants) {
          // eslint-disable-next-line no-await-in-loop
          const variants = await ModifierVarient.findAll({
            where: {
              modifier_id: option.id,
            },
          });
          if (variants && variants.length) {
            Object.assign(option, {
              variants,
            });
          }
        }
      }
    }

    return optionsList;
  } catch (error) {
    console.error(error);
  }
  return modifiers;
}

async function getNestedmodifiers(groupobj, priceField) {
  try {
    // check for nested option group for options
    if (groupobj.option_list && groupobj.option_list.length) {
      // eslint-disable-next-line no-plusplus
      for (let index = 0; index < groupobj.option_list.length; index++) {
        const op = groupobj.option_list[index];
        if (
          op.has_nested_mg &&
          op.assigned_groups &&
          String(op.assigned_groups).length > 0
        ) {
          const grpIds = String(op.assigned_groups).split(',').map(Number);
          // get options nested modifier groups
          // eslint-disable-next-line no-await-in-loop
          const assignedGroups = await getModifiergrpbyid(grpIds);
          // eslint-disable-next-line no-restricted-syntax
          for (const nestedgroupobj of assignedGroups) {
            // eslint-disable-next-line no-await-in-loop
            nestedgroupobj.option_list = await GetOptionList(
              groupobj.store_id,
              nestedgroupobj.id,
              groupobj.menu_id,
              priceField,
            );
          }
          // eslint-disable-next-line no-param-reassign
          op.optionGroups = assignedGroups;
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function getItemModifiers(data) {
  try {
    const { item_refid } = data;
    // Fet option group list
    const optionsGroup = await getModifierGroupList(
      item_refid,
      global.storeDetails.store_id,
      global.menu_id,
    );
    for (let index = 0; index < optionsGroup.length; index++) {
      const groupobj = optionsGroup[index];
      // eslint-disable-next-line no-await-in-loop
      groupobj.option_list = await GetOptionList(
        global.storeDetails.store_id,
        groupobj.id,
        global.menu_id,
      );

      // eslint-disable-next-line no-await-in-loop
      await getNestedmodifiers(groupobj);
    }

    return {
      optionGroups: optionsGroup,
    };
  } catch (error) {
    console.error(`Message="Error while getting item modifiers" Error=`, error);
  }
  return undefined;
}

module.exports = {
  getItemModifiers,
};
