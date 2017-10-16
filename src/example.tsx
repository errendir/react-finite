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
const list = createList(1000)

// Rendering with children
ReactDOM.render(
  <ReactFinite 
    initialNumberOfDisplayedChildren={20}
    safetyMarginInPixels={600} // Optional
    useWindowForVisibilityDetection={false} // Optional
    className="list" // Optional
    debug={false} // Don't set it to true in production
  >
    {list.map((listElement, i) => 
      <div key={i} className={`listElement ${i % 2 === 0 ? "listEven" : "listOdd"}`}>
        {i}: {listElement.text}
      </div>
    )}
  </ReactFinite>,
  document.querySelector("#exampleRoot")
)