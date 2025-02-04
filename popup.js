document.addEventListener('DOMContentLoaded', function() {
    let pageData = null;
  
    // Initialize the page analysis
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: analyzePage
      }, (results) => {
        if (results[0]?.result) {
          pageData = results[0].result;
          updateDisplay();
        }
      });
    });
  
    // Add event listeners for dropdowns
    document.getElementById('colorCount').addEventListener('change', updateDisplay);
    document.getElementById('fontCount').addEventListener('change', updateDisplay);
  
    function updateDisplay() {
      if (!pageData) return;
  
      const colorCount = document.getElementById('colorCount').value;
      const fontCount = document.getElementById('fontCount').value;
  
      displayResults(pageData, {
        colorLimit: colorCount === 'all' ? Infinity : parseInt(colorCount),
        fontLimit: fontCount === 'all' ? Infinity : parseInt(fontCount)
      });
    }
  });

  function rgbToHex(rgb) {
    // Handle rgb/rgba strings
    const values = rgb.match(/\d+/g);
    if (!values || values.length < 3) return rgb;
    
    const r = parseInt(values[0]);
    const g = parseInt(values[1]);
    const b = parseInt(values[2]);
    
    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  
  function showCopyFeedback() {
    const feedback = document.getElementById('copyFeedback');
    feedback.classList.add('show');
    setTimeout(() => feedback.classList.remove('show'), 1500);
  }
  
  function createCopyButton(text) {
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.innerHTML = `
      <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z"/>
        <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2"/>
      </svg>
    `;
    
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        showCopyFeedback();
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
    
    return button;
  }
  
  function analyzePage() {
  function getComputedStyles(element) {
    return window.getComputedStyle(element);
  }

  function extractColors() {
    const colorCount = new Map();
    const elements = document.querySelectorAll('*');
    
    elements.forEach(element => {
      const style = getComputedStyles(element);
      const backgroundColor = style.backgroundColor;
      const color = style.color;
      
      if (backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
        colorCount.set(backgroundColor, (colorCount.get(backgroundColor) || 0) + 1);
      }
      if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
        colorCount.set(color, (colorCount.get(color) || 0) + 1);
      }
    });

    // Return all colors sorted by frequency
    return Array.from(colorCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color);
  }

  function extractFonts() {
    const fontCount = new Map();
    const elements = document.querySelectorAll('*');
    
    elements.forEach(element => {
      const style = getComputedStyles(element);
      const fontFamily = style.fontFamily.split(',')[0].trim();
      
      if (fontFamily) {
        fontCount.set(fontFamily, (fontCount.get(fontFamily) || 0) + 1);
      }
    });

    // Return all fonts sorted by frequency
    return Array.from(fontCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([font]) => font);
  }

  return {
    colors: extractColors(),
    fonts: extractFonts()
  };
}

function displayResults(data, { colorLimit = 3, fontLimit = 3 } = {}) {
  const { colors, fonts } = data;
  
  // Display colors
  const colorsDiv = document.getElementById('colors');
  colorsDiv.innerHTML = ''; // Clear existing content
  
  colors.slice(0, colorLimit).forEach(color => {
    const hexColor = rgbToHex(color);
    
    const colorDiv = document.createElement('div');
    colorDiv.className = 'color-item';
    
    const sample = document.createElement('span');
    sample.className = 'color-sample';
    sample.style.backgroundColor = color;
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'color-info';
    
    const value = document.createElement('span');
    value.className = 'color-value';
    value.textContent = hexColor;
    
    infoDiv.appendChild(value);
    infoDiv.appendChild(createCopyButton(hexColor));
    
    colorDiv.appendChild(sample);
    colorDiv.appendChild(infoDiv);
    colorsDiv.appendChild(colorDiv);
  });

  // Display fonts
  const fontsDiv = document.getElementById('fonts');
  fontsDiv.innerHTML = ''; // Clear existing content
  
  fonts.slice(0, fontLimit).forEach(font => {
    const fontDiv = document.createElement('div');
    fontDiv.className = 'font-item';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'font-header';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'font-name';
    nameDiv.textContent = font;
    
    headerDiv.appendChild(nameDiv);
    headerDiv.appendChild(createCopyButton(font));
    
    const sampleDiv = document.createElement('div');
    sampleDiv.className = 'font-sample';
    sampleDiv.style.fontFamily = font;
    sampleDiv.textContent = 'The quick brown fox jumps over the lazy dog';
    
    fontDiv.appendChild(headerDiv);
    fontDiv.appendChild(sampleDiv);
    fontsDiv.appendChild(fontDiv);
  });
}