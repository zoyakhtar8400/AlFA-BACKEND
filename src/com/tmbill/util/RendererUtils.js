let stringConstructor = 'test'.constructor;

function addPadding(received, size) {
  let num = received;
  num = num.toString();
  while (num.length < size) num = '0' + num;
  return num;
}

function clickelementifVisible(elementSelected) {
  if ($(elementSelected).is(':visible')) {
    $(elementSelected).click();
  } else {
    setTimeout(() => {
      $(elementSelected).click();
    }, 350);
  }
}

function safeParse(params) {
  let parsed = params;
  try {
    if (parsed && parsed.constructor === stringConstructor) {
      parsed = JSON.parse(parsed);
    }
  } catch (error) {
    console.error(`Message="Error While Safe Parse"`, error);
  }
  return parsed;
}

module.exports = {
  clickelementifVisible,
  safeParse,
  addPadding,
};
