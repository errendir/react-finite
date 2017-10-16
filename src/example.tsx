import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { ReactFinite } from './index'

function sample<T>(array: T[]) { return array[Math.floor(array.length*Math.random())] }

const randomWord = () => {
  const words = ["here", "are", "the", "random", "words", "so", "many", "of", "them", "truly", "believe", "me", "about", "this"]
  return sample(words)
}

const createList = function(numberOfElement: number) {
  return Array.from(new Array(numberOfElement)).map(_ => {
    const allowedWordCounts = [2, 10, 30]
    const wordCount = sample(allowedWordCounts)
    return { text: Array.from(new Array(wordCount)).map(_ => randomWord()).join(' ') }
  })

}
const list1 = createList(1000)
const list2 = createList(1000)

// Example one: externally sized container
ReactDOM.render(
  <ReactFinite 
    initialNumberOfDisplayedChildren={20}
    safetyMarginInPixels={600} // Optional
    useWindowForVisibilityDetection={false} // Optional
    className="list" // Optional
    debug={false} // Don't set it to true in production
  >
    {list1.map((listElement, i) => 
      <div key={i} className={`listElement ${i % 2 === 0 ? "listEven" : "listOdd"}`}>
        {i}: {listElement.text}
      </div>
    )}
  </ReactFinite>,
  document.querySelector("#exampleOneRoot")
)

// Example two: window scrolling container
ReactDOM.render(
  <ReactFinite 
    initialNumberOfDisplayedChildren={20}
    safetyMarginInPixels={600} // Optional
    useWindowForVisibilityDetection={true} // Optional
    className="list" // Optional
    debug={false} // Don't set it to true in production
  >
    {list1.map((listElement, i) => 
      <div key={i} className={`listElement ${i % 2 === 0 ? "listEven" : "listOdd"}`}>
        {i}: {listElement.text}
      </div>
    )}
  </ReactFinite>,
  document.querySelector("#exampleTwoRoot")
)