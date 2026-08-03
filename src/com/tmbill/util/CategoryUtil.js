/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
async function generateTreeviewdata(categories) {
  const treeData = [];
  categories?.forEach((item, index) => {
    if (item.parent_ref_id != 0) {
      return;
    }

    const template = {};
    template.text =
      window.selectedLanguage !== 'en' && item.alternative_title
        ? item.alternative_title
        : item.category_name;
    template.title = item.category_name;
    template.id = item.category_refid;
    // template.color = item.color ? item.color : 'white';
    template.color = 'white';
    template.backColor = item.color ? `${item.color}` : '#007c45';
    template.tags = ['category', `${item.category_refid}`];
    const { subcats, subcatIds } = checkAndGetchildrens(
      item.category_refid,
      categories,
    );

    if (typeof subcats !== 'undefined' && subcats.length > 0) {
      const childNodes = [];
      if (subcatIds && Array.isArray(subcatIds)) {
        // check sub categories for items if don't have any item then remove this category no need to show
        subcats.forEach((subcat, index) => {
          const item = window.allItemsList.find(
            (o) => o.category_ref_ids == subcat.category_refid,
          );
          if (!item) {
            subcats.splice(index, 1);
          }
        });
        template.tags.push(subcatIds.join(','));
      }
      subcats.forEach((sub_item, index) => {
        childNodes.push(makeBranch(template, sub_item));
      });
      template.nodes = childNodes;
    }

    // in else part if category having subcategory and any sub category having items then show parent category also

    if (subcats.length == 0) {
      const is_item_present = window.allItemsList.find(
        (o) => o.category_ref_ids == item.category_refid,
      );
      if (is_item_present) {
        treeData.push(template);
      }
    } else {
      treeData.push(template);
    }
  });
  /**
   * This will be the root of all
   */
  const rootData = [];
  const root = new Object();
  root.text = 'All Items';
  root.color = 'white';
  root.backColor = '#007c45';
  if (selectedLanguage == 'ar') {
    root.text = 'القائمة';
  }
  root.tags = ['root'];
  root.nodes = treeData;
  rootData.push(root);

  // remove categories which don't have any item
  if (rootData[0].nodes.length) {
    rootData[0].nodes.forEach((category, index) => {
      // check for only categories which don't have child categories
      if (category.tags.length == 2) {
        const item = window.allItemsList.find(
          (o) => o.category_ref_ids == category.id,
        );
        if (!item) {
          rootData[0].nodes.splice(index, 1);
        }
      }
    });
  }

  return rootData;
}

async function generateTreeviewdataForItemManagement(categories) {
  const treeData = [];
  categories.forEach((item, index) => {
    if (item.parent_ref_id !== 0) {
      return;
    }

    const template = {};
    let text =
      window.selectedLanguage !== 'en' && item.alternative_title
        ? item.alternative_title
        : item.category_name;
    const button = `<label class="category-status-switch switch"><input type="checkbox" id=menuCategroy_${
      item.category_refid
    } class="checkbox"
    ${item.is_active == 1 ? 'checked' : ''}
    /><span class="slider round"></span></label>`;

    text += button;
    template.text = text;
    template.title = item.category_name;
    template.id = item.category_refid;
    template.tags = ['category', `${item.category_refid}`];
    const { subcats, subcatIds } = checkAndGetchildrens(
      item.category_refid,
      categories,
    );
    if (typeof subcats !== 'undefined' && subcats.length > 0) {
      const childNodes = [];
      if (subcatIds && Array.isArray(subcatIds)) {
        subcats.forEach((subcat, index) => {
          let item;

          if (window.outletAllItemsList && window.outletAllItemsList.length) {
            item = window.outletAllItemsList.find(
              (o) => o.category_ref_ids == subcat.category_refid,
            );
          } else {
            item = window.allItemsList.find(
              (o) => o.category_ref_ids == subcat.category_refid,
            );
          }
          if (!item) {
            subcats.splice(index, 1);
          }
        });
        template.tags.push(subcatIds.join(','));
      }
      subcats.forEach((sub_item, index) => {
        childNodes.push(
          makeBranchForMenuManaementCategories(template, sub_item),
        );
      });
      template.nodes = childNodes;
    }
    // treeData.push(template);
    if (subcats.length == 0) {
      let is_item_present;

      if (window.outletAllItemsList && window.outletAllItemsList.length) {
        is_item_present = window.outletAllItemsList.find(
          (o) => o.category_ref_ids == item.category_refid,
        );
      } else {
        is_item_present = window.allItemsList.find(
          (o) => o.category_ref_ids == item.category_refid,
        );
      }
      if (is_item_present) {
        treeData.push(template);
      }
    } else {
      treeData.push(template);
    }

    // treeData.push(template);
  });
  /**
   * This will be the root of all
   */
  const rootData = [];
  const root = new Object();
  root.text = 'All Items';
  // root.color =
  if (selectedLanguage == 'ar') {
    root.text = 'القائمة';
  }
  root.tags = ['root'];
  root.nodes = treeData;
  rootData.push(root);

  if (rootData[0].nodes.length) {
    rootData[0].nodes.forEach((category, index) => {
      // check for only categories which don't have child categories
      if (category.tags.length == 2) {
        let item;

        if (window.outletAllItemsList && window.outletAllItemsList.length) {
          item = window.outletAllItemsList.find(
            (o) => o.category_ref_ids == category.id,
          );
        } else {
          item = window.allItemsList.find(
            (o) => o.category_ref_ids == category.id,
          );
        }
        if (!item) {
          rootData[0].nodes.splice(index, 1);
        }
      }
    });
  }

  return rootData;
}

/**
 *
 * @param {Parent Category} parent
 * @param {List of categories} categories
 */
function checkAndGetchildrens(parent, categories) {
  const subcats = [];
  const subcatIds = [];
  categories.forEach((item, index) => {
    if (item.parent_ref_id == parent) {
      subcats.push(item);
      subcatIds.push(item.category_refid);
    }
  });
  return { subcats, subcatIds };
}

function makeBranch(template, item) {
  var template = new Object();
  template.text =
    window.selectedLanguage !== 'en' && item.alternative_title
      ? item.alternative_title
      : item.category_name;
  template.tags = ['sub-category', `${item.category_refid}`];
  // template.color = item.color ? item.color : 'white';
  template.color = 'white';
  template.backColor = item.color ? `${item.color}` : '#1e4936';
  return template;
}

function makeBranchForMenuManaementCategories(template, item) {
  var template = new Object();
  let text =
    window.selectedLanguage !== 'en' && item.alternative_title
      ? item.alternative_title
      : item.category_name;
  const button = `<label class="category-status-switch switch"><input type="checkbox" class="checkbox" id=menuCategroy_${
    item.category_refid
  } ${
    item.is_active == 1 ? 'checked' : ''
  }/><span class="slider round"></span></label>`;
  text += button;
  template.text = text;
  template.tags = ['sub-category', `${item.category_refid}`];
  return template;
}

module.exports = {
  generateTreeviewdata,
  generateTreeviewdataForItemManagement,
};
