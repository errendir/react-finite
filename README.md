## ReactFinite

React finite is a simple React component leveraging the power of the IntersectionObserver API to reduce the number of the DOM elements your React app renders.

Usage:
```
<ReactFinite 
  initialNumberOfDisplayedChildren={20}
  safetyMarginInPixels={600} // Optional
  useWindowForVisibilityDetection={false} // Optional
  className="list" // Optional
>
  {list.map((listElement, i) => 
    <div key={i} className={`listElement ${i % 2 === 0 ? "listEven" : "listOdd"}`}>
      {i}: {listElement.text}
    </div>
  )}
</ReactFinite>
```