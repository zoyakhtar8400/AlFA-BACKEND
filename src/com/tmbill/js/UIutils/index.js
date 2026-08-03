async function addSuggestionstoelement(elementId, suggestionsList, appendTo) {
  $(elementId).autocomplete({
    source(req, response) {
      const sourceData = [];
      // const re = $.ui.autocomplete.escapeRegex(req.term);
      const re = req.term;
      response(
        $.grep(suggestionsList, (tableName) => {
          if (String(tableName).toLowerCase().includes(re.toLowerCase())) {
            sourceData.push({
              label: tableName,
              value: tableName,
            });
          }
        }),
      );
      return response(sourceData);
    },
    appendTo,
    classes: {
      'ui-autocomplete': 'autocomplete-to-front ',
    },
    select(_event, ui) {
      $(elementId).val(ui.item.value);
    },
  });
}

module.exports = {
  addSuggestionstoelement,
};
