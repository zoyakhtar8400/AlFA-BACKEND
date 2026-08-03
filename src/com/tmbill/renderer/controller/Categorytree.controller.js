const { generateTreeviewdata } = require('../../util/CategoryUtil');

/**
 * Init Menu tree
 */
async function initMenutree(
  categories,
  nodeClickHandlerCallback,
  categoryNodeclicklistenerCallback,
) {
  $('#tree').empty();
  generateTreeviewdata(categories).then((data) => {
    $('#tree').treeview({
      data,
      showBorder: true,
      expandIcon: 'fas fa-sort-down',
      collapseIcon: 'fas fa-sort-up',
      highlightSelected: false,
    });
    // onNodeUnselected
    $('#tree').on('nodeUnselected', (event, cData) => {
      nodeClickHandlerCallback(event, cData);
    });

    $('#tree').on('nodeSelected', (event, cData) => {
      event.preventDefault();
      categoryNodeclicklistenerCallback(cData);
      nodeClickHandlerCallback(event, cData);
    });
  });
}

module.exports = {
  initMenutree,
};
