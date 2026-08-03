const { FastAverageColor } = require('fast-average-color');

const fac = new FastAverageColor();

function getRandomMaterialColor() {
  // Extended Material Design color palette with multiple shades
  const materialColors = [
    '#F44336',
    '#E57373',
    '#EF9A9A',
    '#FFCDD2',
    '#FFEBEE', // Red
    '#E91E63',
    '#F06292',
    '#F8BBD0',
    '#FCE4EC', // Pink
    '#9C27B0',
    '#BA68C8',
    '#CE93D8',
    '#E1BEE7',
    '#F3E5F5', // Purple
    '#673AB7',
    '#9575CD',
    '#D1C4E9',
    '#EDE7F6', // Deep Purple
    '#3F51B5',
    '#7986CB',
    '#C5CAE9',
    '#E8EAF6', // Indigo
    '#2196F3',
    '#64B5F6',
    '#BBDEFB',
    '#E3F2FD', // Blue
    '#03A9F4',
    '#4FC3F7',
    '#B3E5FC',
    '#E1F5FE', // Light Blue
    '#00BCD4',
    '#4DD0E1',
    '#B2EBF2',
    '#E0F7FA', // Cyan
    '#009688',
    '#4DB6AC',
    '#B2DFDB',
    '#E0F2F1', // Teal
    '#4CAF50',
    '#81C784',
    '#C8E6C9',
    '#E8F5E9', // Green
    '#8BC34A',
    '#AED581',
    '#DCEDC8',
    '#F1F8E9', // Light Green
    '#CDDC39',
    '#DCE775',
    '#F0F4C3',
    '#F9FBE7', // Lime
    '#FFEB3B',
    '#FFF176',
    '#FFF59D',
    '#FFFDE7', // Yellow
    '#FFC107',
    '#FFD54F',
    '#FFE082',
    '#FFECB3', // Amber
    '#FF9800',
    '#FFB74D',
    '#FFCC80',
    '#FFE0B2', // Orange
    '#FF5722',
    '#FF8A65',
    '#FFAB91',
    '#FFCCBC', // Deep Orange
    '#795548',
    '#A1887F',
    '#D7CCC8',
    '#EFEBE9', // Brown
    '#9E9E9E',
    '#E0E0E0',
    '#EEEEEE',
    '#F5F5F5', // Grey
    '#607D8B',
    '#90A4AE',
    '#CFD8DC',
    '#ECEFF1', // Blue Grey
  ];

  // Select a random color from the extended palette
  const randomIndex = Math.floor(Math.random() * materialColors.length);
  return materialColors[randomIndex];
}

function generateMaterialGradient() {
  const color1 = getRandomMaterialColor();
  const color2 = getRandomMaterialColor();
  const angle = Math.floor(Math.random() * 360); // Random angle between 0 and 360 degrees
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
}

/**
 * Works for images only
 * @param {*} image
 * @param {*} padding
 * @param {*} count
 * @returns
 */
// eslint-disable-next-line no-unused-vars
function getGradientwithStripes(image, padding = 30, count = 10) {
  if (!image) {
    return undefined;
  }
  const { naturalHeight } = image;
  const { height } = image;

  const naturalHeightPart = Math.floor(naturalHeight / count);
  const heightPart = Math.floor(height / count);

  const parts = [];

  const colors = [];
  let value = 'linear-gradient(to bottom, ';

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < count; i++) {
    const color = fac.getColor(image, {
      left: 0,
      top: i * naturalHeightPart,
      height: naturalHeightPart,
    });

    const top = i ? i * heightPart + padding : 0;
    const bottom = (i + 1) * heightPart - 1 + padding;

    parts.push(`${color.rgb} ${top}px, ${color.rgb} ${bottom}px`);
    colors.push(color);
  }

  value += parts.join(', ');
  value += ')';

  return {
    value,
    lastColor: colors[colors.length - 1],
  };
}

// eslint-disable-next-line no-unused-vars
function getGradient(image) {
  try {
    if (!image) {
      return undefined;
    }
    // const gradient = item.querySelector('.item__gradient');
    const isBottom = true;

    const height = image.naturalHeight;
    const size = 50;

    const color = fac.getColor(
      image,
      isBottom ? { top: height - size, height: size } : { height: size },
    );
    const colorEnd = [...color.value.slice(0, 3), 0].join(',');

    // item.style.background = color.rgb;
    // item.style.color = color.isDark ? 'white' : 'black';

    if (isBottom) {
      return `linear-gradient(to bottom, rgba(${colorEnd}) 0%, ${color.rgba} 100%)`;
    }
    return `linear-gradient(to top, rgba(${colorEnd}) 0%, ${color.rgba} 100%)`;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

/**
 * Works for images only
 * @param {*} image
 * @returns
 */
// eslint-disable-next-line no-unused-vars
function getBordergradient(image) {
  try {
    if (!image) {
      return undefined;
    }

    if (image instanceof HTMLImageElement) {
      const size = 20;

      const width = image.naturalWidth;
      const height = image.naturalHeight;

      const colorTop = fac.getColor(image, { height: size });
      const colorRight = fac.getColor(image, {
        left: width - size,
        width: size,
      });
      const colorLeft = fac.getColor(image, { width: size });
      const colorBottom = fac.getColor(image, {
        top: height - size,
        height: size,
      });

      // Border Color
      return [
        colorTop.rgb,
        colorRight.rgb,
        colorBottom.rgb,
        colorLeft.rgb,
      ].join(' ');
    }
  } catch (error) {
    console.error();
  }
  return undefined;
}

// eslint-disable-next-line no-unused-vars
function getBoxshadow(image) {
  try {
    if (!image) {
      return undefined;
    }

    if (image instanceof HTMLElement) {
      const size = 50;

      const width = image.naturalWidth;
      const height = image.naturalHeight;

      const colorTop = fac.getColor(image, { height: size });
      const colorRight = fac.getColor(image, {
        left: width - size,
        width: size,
      });
      const colorLeft = fac.getColor(image, { width: size });
      const colorBottom = fac.getColor(image, {
        top: height - size,
        height: size,
      });
      const radius = ' 90px ';
      const delta = '70px';

      // boxShadow
      return [
        `0 -${delta} ${radius} ${colorTop.rgb}`,
        `${delta} 0 ${radius} ${colorRight.rgb}`,
        `0 ${delta} ${radius} ${colorBottom.rgb}`,
        `-${delta} 0 ${radius} ${colorLeft.rgb}`,
      ].join(', ');
    }
  } catch (error) {
    console.error();
  }
  return undefined;
}

/**
 * Works for Images and videos
 * @param {} childElement
 * @returns
 */
// eslint-disable-next-line no-unused-vars
function getAveragecolor(childElement) {
  try {
    const color = fac.getColor(childElement);
    if (color && !color.error && color.rgba) {
      return color.rgba;
    }
  } catch (error) {
    console.error(error);
  }
  return undefined;
}
function getColorsforactiveslide() {
  const elements = document.querySelectorAll(
    '#swiperContainerid .swiper-slide-active',
  );
  if (elements && elements.length > 0) {
    const childElement = elements[0].firstChild;

    if (childElement) {
      const fastcolorExists = $(childElement).attr('data-fastcolor');
      if (fastcolorExists) {
        $('#customerDisplaywrapperid').css({
          background: fastcolorExists,
        });
        return;
      }
      const background = getAveragecolor(childElement);
      $(childElement).attr('data-fastcolor', background);
      if (background) {
        $('#customerDisplaywrapperid').css({
          background,
        });
      }
    }
  }
}
// Apply the material gradient to a page element
// const element = document.querySelector('.gradient-background');
// element.style.background = generateMaterialGradient();

module.exports = {
  generateMaterialGradient,
  getColorsforactiveslide,
};
