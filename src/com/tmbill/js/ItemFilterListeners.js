/**
 * Filter the items according to the table department product groups clickd
 * @param {CLicked table} clicked_table
 */
const categoriesIdSet = new Set();
async function filterItemsByProductGroups(
  itemsbuttonList,
  rawProductGroupList,
  itemNameSuggestions,
) {
  categoriesIdSet.clear();
  if (
    itemsbuttonList &&
    Array.isArray(itemsbuttonList) &&
    rawProductGroupList
  ) {
    const productGroupList = String(rawProductGroupList).split(',');
    itemsbuttonList.forEach((item, index) => {
      const itemNameSuggestion = `${item.data.title}:${item.data['mpos_category.category_name']}`;
      if (
        productGroupList &&
        productGroupList.includes(String(item.data.product_group))
      ) {
        if (!itemNameSuggestions.includes(itemNameSuggestion)) {
          itemNameSuggestions.splice(index, 0, itemNameSuggestion);
        }
        const parentCat = window.categoriesList.find(
          (e) => String(e.category_refid) === item.data.category_ref_ids,
        );
        if (parentCat?.parent_ref_id) {
          categoriesIdSet.add(String(parentCat.parent_ref_id));
        }
        categoriesIdSet.add(item.data.category_ref_ids);
        $(`#${item.id}`).attr('isSectionWiseItem', 'true');
        $(`#${item.id}`).show();
      } else {
        if (itemNameSuggestions.includes(itemNameSuggestion)) {
          const indexOfSuggestion =
            itemNameSuggestions.indexOf(itemNameSuggestion);
          itemNameSuggestions.splice(indexOfSuggestion, 1);
        }
        $(`#${item.id}`).attr('isSectionWiseItem', 'false');
        $(`#${item.id}`).hide();
      }
    });

    const filteredCategories = window.categoriesList.filter((category) =>
      categoriesIdSet.has(category.category_refid.toString()),
    );
    return filteredCategories;
  }
  return window.categoriesList;
}

async function filterItemsByOrderType(
  itemsbuttonList,
  billingType,
  itemNameSuggestions,
) {
  categoriesIdSet.clear();
  if (itemsbuttonList && Array.isArray(itemsbuttonList)) {
    // const productGroupList = String(rawProductGroupList).split(',');
    itemsbuttonList.forEach((item, index) => {
      const itemNameSuggestion = `${item.data.title}:${item.data['mpos_category.category_name']}`;
      const productGroupList = String(item.data.excludePlaforms).split(',');
      if (productGroupList && !productGroupList.includes(String(billingType))) {
        if (!itemNameSuggestions.includes(itemNameSuggestion)) {
          itemNameSuggestions.splice(index, 0, itemNameSuggestion);
        }
        const parentCat = window.categoriesList.find(
          (e) => String(e.category_refid) === item.data.category_ref_ids,
        );
        if (parentCat?.parent_ref_id) {
          categoriesIdSet.add(String(parentCat.parent_ref_id));
        }
        categoriesIdSet.add(item.data.category_ref_ids);
        $(`#${item.id}`).attr('isSectionWiseItem', 'true');
        $(`#${item.id}`).show();
      } else {
        if (itemNameSuggestions.includes(itemNameSuggestion)) {
          const indexOfSuggestion =
            itemNameSuggestions.indexOf(itemNameSuggestion);
          itemNameSuggestions.splice(indexOfSuggestion, 1);
        }
        $(`#${item.id}`).attr('isSectionWiseItem', 'false');
        $(`#${item.id}`).hide();
      }
    });

    const filteredCategories = window.categoriesList.filter((category) =>
      categoriesIdSet.has(category.category_refid.toString()),
    );
    return filteredCategories;
  }
  return window.categoriesList;
}

async function filterItemNote(data) {
  const filter = data.toLowerCase();

  if (filter === 'all') {
    $('#kotnoteSuggestions li').show();
    return;
  }
  const myNode = document.getElementById('kotnoteSuggestions');
  const descendents = myNode.getElementsByTagName('li');

  let i, currentDescedent;

  //CHeck if quantity is provided

  for (i = 0; i < descendents.length; ++i) {
    currentDescedent = descendents[i];
    const groupId = $(currentDescedent).attr('groupId');
    if (currentDescedent != undefined) {
      if (filter !== groupId) {
        $(currentDescedent).hide();
        currentDescedent.style.display = 'none !important';
      } else {
        currentDescedent.style.display = 'inline-block';
      }
    }
  }
}
module.exports = {
  filterItemsByProductGroups,
  filterItemsByOrderType,
  filterItemNote,
};
