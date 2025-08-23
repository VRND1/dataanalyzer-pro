interface TextMetrics {
  element: HTMLElement;
  overflowDetected: boolean;
  renderTime: number;
  fontLoaded: boolean;
}

export function monitorTextOverflow(element: HTMLElement) {
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

export function measureTextPerformance(element: HTMLElement): TextMetrics {
  const start = performance.now();
  const metrics: TextMetrics = {
    element,
    overflowDetected: false,
    renderTime: 0,
    fontLoaded: document.fonts.check('12px System')
  };

  // Measure layout
  element.getBoundingClientRect();
  metrics.renderTime = performance.now() - start;
  metrics.overflowDetected = element.scrollHeight > element.clientHeight;

  return metrics;
}

export function setupTextMonitoring() {
  // Monitor text elements for overflow
  const observer = new ResizeObserver(entries => {
    entries.forEach(entry => {
      const metrics = monitorTextOverflow(entry.target as HTMLElement);
      if (metrics.hasOverflow) {
        console.warn('Text overflow detected:', {
          element: entry.target,
          metrics
        });
      }
    });
  });

  // Observe text elements
  document.querySelectorAll('.text-content').forEach(element => {
    observer.observe(element);
  });

  // Monitor font loading
  document.fonts.ready.then(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.text-content').forEach(element => {
        const metrics = measureTextPerformance(element as HTMLElement);
        if (metrics.overflowDetected) {
          console.warn('Text performance issue:', metrics);
        }
      });
    });
  });

  return observer;
}