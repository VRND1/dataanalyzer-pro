# Text Overlap Troubleshooting Guide

## 1. Common Causes of Text Overlapping

### CSS Positioning Issues
- Absolute positioning without proper containment
- Incorrect z-index stacking
- Floating elements interfering with text flow
- Flex/grid layout misconfigurations

### Responsive Design Challenges
- Viewport-based units (vw/vh) causing text scaling issues
- Media query breakpoints not handling text properly
- Font size not scaling appropriately
- Line height not adjusting for different screen sizes

### Container Issues
- Fixed width containers with dynamic content
- Missing overflow handling
- Insufficient padding/margins
- Flex/grid item sizing conflicts

### Font Rendering
- Web font loading delays
- Font size differences between system fonts
- Line height inconsistencies
- Character spacing issues

## 2. Troubleshooting Methods

### Step 1: Visual Inspection
```css
/* Add debug outline to identify container boundaries */
* {
  outline: 1px solid rgba(255, 0, 0, 0.2);
}

/* Highlight problematic text containers */
.text-container {
  background: rgba(255, 255, 0, 0.1);
}
```

### Step 2: Container Analysis
```css
/* Check for overflow issues */
.container {
  min-height: min-content;
  overflow: auto;
}

/* Ensure proper box sizing */
* {
  box-sizing: border-box;
}
```

### Step 3: Text Flow Inspection
```css
/* Add spacing for text elements */
p, h1, h2, h3, h4, h5, h6 {
  margin-bottom: 1em;
  line-height: 1.5;
}
```

## 3. Solutions and Best Practices

### Container Sizing
```css
/* Flexible container with minimum width */
.text-container {
  min-width: min-content;
  width: 100%;
  max-width: 100%;
  padding: 1rem;
}

/* Grid-based layout with text constraints */
.grid-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}
```

### Font Rendering
```css
/* Optimized font loading */
@font-face {
  font-family: 'CustomFont';
  font-display: swap;
  src: url('/fonts/custom-font.woff2') format('woff2');
}

/* Font fallback system */
.text-content {
  font-family: 'CustomFont', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
```

### Responsive Typography
```css
/* Fluid typography using clamp */
.responsive-text {
  font-size: clamp(1rem, 2vw + 0.5rem, 1.5rem);
  line-height: 1.5;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
}

/* Responsive headings */
h1 {
  font-size: clamp(1.5rem, 5vw, 3rem);
  line-height: 1.2;
}
```

### Data Visualization Text
```css
/* Chart label handling */
.chart-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

/* Tooltip text */
.chart-tooltip {
  max-width: 200px;
  word-wrap: break-word;
  padding: 0.5rem;
}
```

## 4. Testing Strategies

### Device Testing Matrix
| Device Type | Screen Size | Browser | Test Focus |
|-------------|-------------|---------|------------|
| Desktop     | 1920×1080   | Chrome  | Text scaling |
| Laptop      | 1366×768    | Firefox | Font loading |
| Tablet      | 768×1024    | Safari  | Orientation |
| Mobile      | 375×667     | Edge    | Breakpoints |

### Browser Testing
```javascript
// Font loading detection
document.fonts.ready.then(() => {
  // Recalculate text layout
  requestAnimationFrame(() => {
    // Update layout if needed
  });
});

// Viewport resize handling
const resizeObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    // Check for text overflow
    const hasOverflow = entry.target.scrollHeight > entry.target.clientHeight;
    if (hasOverflow) {
      // Apply fixes
    }
  }
});
```

## 5. Preventive Measures

### CSS Best Practices
```css
/* Use CSS Custom Properties for consistent spacing */
:root {
  --spacing-unit: 0.25rem;
  --text-spacing: calc(var(--spacing-unit) * 4);
}

/* Implement a type scale */
:root {
  --scale-ratio: 1.25;
  --text-base: 1rem;
  --text-lg: calc(var(--text-base) * var(--scale-ratio));
  --text-xl: calc(var(--text-lg) * var(--scale-ratio));
}

/* Safe text containers */
.text-safe {
  max-width: 65ch;
  margin-inline: auto;
  padding-inline: var(--text-spacing);
}
```

### React Component Example
```tsx
interface TextContainerProps {
  children: React.ReactNode;
  maxLines?: number;
}

function TextContainer({ children, maxLines = 3 }: TextContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = React.useState(false);

  React.useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const element = containerRef.current;
        setHasOverflow(
          element.scrollHeight > element.clientHeight ||
          element.scrollWidth > element.clientWidth
        );
      }
    };

    const resizeObserver = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`
        text-container
        ${maxLines ? `line-clamp-${maxLines}` : ''}
        ${hasOverflow ? 'has-overflow' : ''}
      `}
      style={{
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}
    >
      {children}
      {hasOverflow && (
        <button className="read-more">Read More</button>
      )}
    </div>
  );
}
```

### Monitoring and Maintenance
```typescript
// Text overflow monitoring
function monitorTextOverflow(element: HTMLElement) {
  const metrics = {
    containerWidth: element.clientWidth,
    containerHeight: element.clientHeight,
    contentWidth: element.scrollWidth,
    contentHeight: element.scrollHeight,
    hasOverflow: false,
    overflowType: ''
  };

  metrics.hasOverflow = 
    metrics.contentHeight > metrics.containerHeight ||
    metrics.contentWidth > metrics.containerWidth;

  metrics.overflowType = metrics.hasOverflow
    ? metrics.contentHeight > metrics.containerHeight
      ? 'vertical'
      : 'horizontal'
    : 'none';

  return metrics;
}

// Usage example
const textElements = document.querySelectorAll('.text-content');
textElements.forEach(element => {
  const metrics = monitorTextOverflow(element as HTMLElement);
  if (metrics.hasOverflow) {
    console.warn(`Text overflow detected in element:`, {
      element,
      metrics
    });
  }
});
```

## Common Pitfalls to Avoid

1. **Fixed Dimensions**
   - Avoid fixed height on text containers
   - Don't use fixed width for dynamic content

2. **Font Loading**
   - Always provide system font fallbacks
   - Use font-display: swap for web fonts

3. **Responsive Design**
   - Don't rely solely on viewport units
   - Avoid fixed font sizes

4. **Layout Issues**
   - Don't use absolute positioning without containment
   - Avoid negative margins for text positioning

## Quick Reference

### Text Container Checklist
- [ ] Flexible container width
- [ ] Proper overflow handling
- [ ] Line height adjustment
- [ ] Font fallbacks defined
- [ ] Responsive breakpoints
- [ ] Padding/margin spacing
- [ ] Word break rules

### Debug Tools
```css
/* Debug CSS */
.debug-layout {
  outline: 1px solid red;
  background: rgba(255, 0, 0, 0.1);
}

.debug-text {
  background: rgba(0, 255, 0, 0.1);
}
```

### Performance Monitoring
```typescript
// Performance monitoring
interface TextMetrics {
  element: HTMLElement;
  overflowDetected: boolean;
  renderTime: number;
  fontLoaded: boolean;
}

function measureTextPerformance(element: HTMLElement): TextMetrics {
  const start = performance.now();
  const metrics: TextMetrics = {
    element,
    overflowDetected: false,
    renderTime: 0,
    fontLoaded: document.fonts.check('12px CustomFont')
  };

  // Measure layout
  element.getBoundingClientRect();
  metrics.renderTime = performance.now() - start;
  metrics.overflowDetected = element.scrollHeight > element.clientHeight;

  return metrics;
}
```