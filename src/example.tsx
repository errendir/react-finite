import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { ReactFinite } from './index'

function sample<T>(array: T[]) { return array[Math.floor(array.length*Math.random())] }

const randomWord = () => {
  const words = ["here", "are", "the", "random", "words", "so", "many", "of", "them", "truly", "believe", "me", "about", "this"]
  return sample(words)
}

const createList = function(numberOfElement: number) {
  return Array.from(new Array(numberOfElement)).map((_, i) => {
    const allowedWordCounts = [2, 10, 30]
    const wordCount = sample(allowedWordCounts)
    return { key: i, index: i, text: Array.from(new Array(wordCount)).map(_ => randomWord()).join(' ') }
  })

}
const list = createList(1000)

class Row extends React.PureComponent<{ index: number, text: string }> {
  render() {
    return <div className={`listElement ${this.props.index % 2 === 0 ? "listEven" : "listOdd"}`}>
      {this.props.index}: {this.props.text}
    </div>
  }
}

// Example one: externally sized container
ReactDOM.render(
  <ReactFinite 
    initialNumberOfDisplayedChildren={20}
    safetyMarginInPixels={600}
    estimatedElementHeightInPixels={40}
    useWindowForVisibilityDetection={false}
    className="list"
    debug={false} // Don't set it to true in production

    elements={list}
    ElementComponent={Row}
  />,
  document.querySelector("#exampleOneRoot")
)

// Example two: window scrolling container
ReactDOM.render(
  <ReactFinite 
    initialNumberOfDisplayedChildren={20}
    safetyMarginInPixels={600}
    estimatedElementHeightInPixels={40}
    useWindowForVisibilityDetection={true}
    className="list"
    debug={false} // Don't set it to true in production
  >
    {
      list.map(listElement => <Row {...listElement} />)
    }
  </ReactFinite>,
  document.querySelector("#exampleTwoRoot")
)